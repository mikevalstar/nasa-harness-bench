/**
 * Two-body orbital mechanics, CPU side.
 *
 * Everything is heliocentric, J2000 ecliptic, distances in au, angles in
 * radians internally (the data files store degrees), time in days measured
 * from J2000 (JD 2451545.0).
 *
 * The GPU does the same maths for the bulk point clouds — see shaders.ts.
 * These CPU versions are used for orbit polylines, picking, camera follow and
 * anything that needs an exact position for one body.
 */

export const J2000 = 2451545.0;
export const DEG = Math.PI / 180;
/** Gaussian gravitational constant, au^(3/2) / day. */
export const GAUSS_K = 0.01720209895;
export const AU_KM = 149597870.7;

export interface Elements {
  a: number; // semi-major axis, au (negative for hyperbolic, NaN for parabolic)
  e: number;
  i: number; // deg
  om: number; // deg
  w: number; // deg
  ma: number; // deg, mean anomaly at epoch
  n: number; // deg/day
  epoch0: number; // days from J2000
  q?: number; // perihelion distance, au (needed for e >= 1)
  tp0?: number; // time of perihelion passage, days from J2000
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Solve M = E - e sin E for the eccentric anomaly (radians). */
export function solveKeplerElliptic(M: number, e: number): number {
  let m = M % (2 * Math.PI);
  if (m < 0) m += 2 * Math.PI;
  // Starting guess that stays well-behaved up to e ~ 0.99
  let E = m + e * Math.sin(m) * (1 + e * Math.cos(m));
  for (let k = 0; k < 12; k++) {
    const f = E - e * Math.sin(E) - m;
    const fp = 1 - e * Math.cos(E);
    const d = f / fp;
    E -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

/** Solve M = e sinh H - H for the hyperbolic anomaly. */
export function solveKeplerHyperbolic(M: number, e: number): number {
  const s = M >= 0 ? 1 : -1;
  const am = Math.abs(M);
  let H = s * Math.log((2 * am) / e + 1.8);
  if (!Number.isFinite(H)) H = s * 0.1;
  for (let k = 0; k < 40; k++) {
    const f = e * Math.sinh(H) - H - M;
    const fp = e * Math.cosh(H) - 1;
    const d = f / fp;
    H -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return H;
}

/** Barker's equation for parabolic orbits — returns true anomaly. */
export function parabolicTrueAnomaly(dtDays: number, q: number): number {
  // Mp = sqrt(mu / (2 q^3)) * (t - tp);  Mp = D + D^3/3
  const Mp = (GAUSS_K / Math.sqrt(2 * q * q * q)) * dtDays;
  const W = 1.5 * Mp;
  const y = Math.cbrt(W + Math.sqrt(W * W + 1));
  const D = y - 1 / y;
  return 2 * Math.atan(D);
}

/**
 * Heliocentric position at time `t` (days from J2000).
 * Handles elliptic, parabolic (e == 1) and hyperbolic (e > 1) orbits.
 */
export function positionAt(el: Elements, t: number, out?: Vec3): Vec3 {
  const o = out ?? { x: 0, y: 0, z: 0 };
  const e = el.e;
  let r: number;
  let nu: number;

  if (e < 1) {
    const M = (el.ma + el.n * (t - el.epoch0)) * DEG;
    const E = solveKeplerElliptic(M, e);
    const a = el.a;
    r = a * (1 - e * Math.cos(E));
    nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  } else if (e > 1) {
    const a = el.a; // negative
    const dt = t - (el.tp0 ?? el.epoch0);
    // mean motion for a hyperbola; use the published n when present
    const nRad = Number.isFinite(el.n) && el.n !== 0 ? el.n * DEG : GAUSS_K / Math.sqrt(-a * -a * -a);
    const M = nRad * dt;
    const H = solveKeplerHyperbolic(M, e);
    r = a * (1 - e * Math.cosh(H));
    nu = 2 * Math.atan2(Math.sqrt(e + 1) * Math.tanh(H / 2), Math.sqrt(e - 1));
  } else {
    const q = el.q ?? 1;
    nu = parabolicTrueAnomaly(t - (el.tp0 ?? el.epoch0), q);
    const D = Math.tan(nu / 2);
    r = q * (1 + D * D);
  }

  return rotateToEcliptic(r, nu, el, o);
}

function rotateToEcliptic(r: number, nu: number, el: Elements, o: Vec3): Vec3 {
  const u = nu + el.w * DEG;
  const cu = Math.cos(u);
  const su = Math.sin(u);
  const ci = Math.cos(el.i * DEG);
  const si = Math.sin(el.i * DEG);
  const co = Math.cos(el.om * DEG);
  const so = Math.sin(el.om * DEG);
  o.x = r * (co * cu - so * su * ci);
  o.y = r * (so * cu + co * su * ci);
  o.z = r * (su * si);
  return o;
}

/**
 * Sample a full orbit as a polyline. Closed orbits are sampled uniformly in
 * eccentric anomaly (which spaces points sensibly near perihelion); open orbits
 * are sampled in true anomaly out to a distance cap.
 */
export function sampleOrbit(el: Elements, segments = 512, maxR = 60): Float32Array {
  const pts: number[] = [];
  const tmp: Vec3 = { x: 0, y: 0, z: 0 };
  if (el.e < 1) {
    const a = el.a;
    const e = el.e;
    for (let k = 0; k <= segments; k++) {
      const E = (k / segments) * 2 * Math.PI;
      const r = a * (1 - e * Math.cos(E));
      const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
      rotateToEcliptic(r, nu, el, tmp);
      pts.push(tmp.x, tmp.y, tmp.z);
    }
  } else {
    const e = el.e;
    // true anomaly is bounded by the asymptote for e > 1
    const nuMax = e > 1 ? Math.acos(-1 / e) * 0.995 : Math.PI * 0.995;
    const q = el.q ?? (Number.isFinite(el.a) ? el.a * (1 - e) : 1);
    for (let k = 0; k <= segments; k++) {
      const nu = -nuMax + (2 * nuMax * k) / segments;
      const r = (q * (1 + e)) / (1 + e * Math.cos(nu));
      if (!(r > 0) || r > maxR) continue;
      rotateToEcliptic(r, nu, el, tmp);
      pts.push(tmp.x, tmp.y, tmp.z);
    }
  }
  return new Float32Array(pts);
}

/* --------------------------------------------------------------- time ---- */

const MS_PER_DAY = 86400000;
const JD_UNIX_EPOCH = 2440587.5;

/** Days from J2000 for a JS Date (UTC). */
export function tFromDate(d: Date): number {
  return d.getTime() / MS_PER_DAY + JD_UNIX_EPOCH - J2000;
}

export function dateFromT(t: number): Date {
  return new Date((t + J2000 - JD_UNIX_EPOCH) * MS_PER_DAY);
}

export function jdFromT(t: number): number {
  return t + J2000;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(t: number, withTime = false): string {
  const d = dateFromT(t);
  const s = `${d.getUTCDate().toString().padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  if (!withTime) return s;
  return `${s} ${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')} UTC`;
}

export function isoDate(t: number): string {
  return dateFromT(t).toISOString().slice(0, 10);
}
