// Orbital mechanics: propagate Keplerian elements to a heliocentric position
// in the J2000 ecliptic frame. Distances in AU, angles in radians, time in days.
// This mirrors the GLSL implementation used for the GPU asteroid layer.

export const J2000 = 2451545; // base Julian date (epoch offsets stored relative to this)
export const DEG2RAD = Math.PI / 180;

// Convert a JavaScript Date (UTC) to Julian Date.
export function dateToJD(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

// Convert Julian Date back to a JavaScript Date (UTC).
export function jdToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

export function jdToISO(jd: number): string {
  return jdToDate(jd).toISOString().slice(0, 10);
}

export function jdToDateTimeString(jd: number): string {
  return jdToDate(jd).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

// Solve the elliptical Kepler equation M = E - e*sin(E) for eccentric anomaly E.
function solveKeplerElliptic(M: number, e: number): number {
  // Normalize M to [-pi, pi] for fast convergence.
  M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (M > Math.PI) M -= 2 * Math.PI;
  let E = e < 0.8 ? M : Math.PI;
  for (let it = 0; it < 30; it++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const dE = f / fp;
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

// Solve the hyperbolic Kepler equation M = e*sinh(H) - H for H.
function solveKeplerHyperbolic(M: number, e: number): number {
  let H = Math.asinh(M / e) || M; // initial guess
  if (!isFinite(H)) H = Math.sign(M) * Math.log((2 * Math.abs(M)) / e + 1.8);
  for (let it = 0; it < 50; it++) {
    const f = e * Math.sinh(H) - H - M;
    const fp = e * Math.cosh(H) - 1;
    const dH = f / fp;
    H -= dH;
    if (Math.abs(dH) < 1e-10) break;
  }
  return H;
}

export interface Elements {
  a: number; // semi-major axis (au); negative for hyperbolic
  e: number;
  i: number; // rad
  om: number; // rad (Ω)
  w: number; // rad (ω)
  ma?: number; // mean anomaly at epoch (rad) — elliptical
  n?: number; // mean motion (rad/day)
  epoch?: number; // JD of ma
  tp?: number; // JD time of perihelion passage (used for hyperbolic / parabolic)
  q?: number; // perihelion distance (au) — used for parabolic/hyperbolic
}

const GAUSS = 0.01720209895; // Gaussian gravitational constant (rad/day, AU)

// Compute heliocentric ecliptic position [x, y, z] in AU at Julian date jd.
export function propagate(el: Elements, jd: number, out: [number, number, number]): void {
  const e = el.e;
  let xo: number, yo: number; // position in the orbital plane (perifocal-ish, x toward perihelion)

  if (e < 1.0) {
    // Elliptical orbit.
    let n = el.n;
    if (n == null) n = GAUSS / Math.pow(el.a, 1.5);
    const M = (el.ma ?? 0) + n * (jd - (el.epoch ?? J2000));
    const E = solveKeplerElliptic(M, e);
    const a = el.a;
    xo = a * (Math.cos(E) - e);
    yo = a * Math.sqrt(1 - e * e) * Math.sin(E);
  } else if (e > 1.0) {
    // Hyperbolic orbit: propagate from time of perihelion passage.
    const aAbs = Math.abs(el.a > 0 ? el.a : el.q! / (1 - e)); // a < 0; |a| = q/(e-1)
    const a = -aAbs;
    const nH = GAUSS / Math.pow(aAbs, 1.5);
    const M = nH * (jd - (el.tp ?? J2000));
    const H = solveKeplerHyperbolic(M, e);
    xo = a * (e - Math.cosh(H));
    yo = -a * Math.sqrt(e * e - 1) * Math.sinh(H);
  } else {
    // Near-parabolic (e ≈ 1): Barker's equation via perihelion distance q.
    const q = el.q ?? el.a * (1 - e);
    const nP = GAUSS * Math.sqrt(1 / (2 * q * q * q));
    const M = nP * (jd - (el.tp ?? J2000));
    // Solve cubic for tan(true/2): s^3/3 + s - M = 0 via Cardano.
    const w = (3 * M) / 2;
    const y = Math.cbrt(w + Math.sqrt(w * w + 1));
    const s = y - 1 / y;
    const trueAnom = 2 * Math.atan(s);
    const r = q * (1 + s * s);
    xo = r * Math.cos(trueAnom);
    yo = r * Math.sin(trueAnom);
  }

  // Rotate from the orbital plane into the ecliptic frame.
  const cw = Math.cos(el.w);
  const sw = Math.sin(el.w);
  const co = Math.cos(el.om);
  const so = Math.sin(el.om);
  const ci = Math.cos(el.i);
  const si = Math.sin(el.i);

  // R = Rz(om) * Rx(i) * Rz(w)
  const x1 = cw * xo - sw * yo;
  const y1 = sw * xo + cw * yo;
  const z1 = 0;

  const x2 = x1;
  const y2 = ci * y1 - si * z1;
  const z2 = si * y1 + ci * z1;

  out[0] = co * x2 - so * y2;
  out[1] = so * x2 + co * y2;
  out[2] = z2;
}

// Sample N points along a closed orbit for drawing an orbit line (ecliptic frame).
export function sampleOrbit(el: Elements, segments: number): Float32Array {
  const pts = new Float32Array((segments + 1) * 3);
  const a = el.a;
  const e = el.e;
  const cw = Math.cos(el.w);
  const sw = Math.sin(el.w);
  const co = Math.cos(el.om);
  const so = Math.sin(el.om);
  const ci = Math.cos(el.i);
  const si = Math.sin(el.i);
  for (let k = 0; k <= segments; k++) {
    const E = (k / segments) * 2 * Math.PI;
    const xo = a * (Math.cos(E) - e);
    const yo = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const x1 = cw * xo - sw * yo;
    const y1 = sw * xo + cw * yo;
    const y2 = ci * y1;
    const z2 = si * y1;
    pts[k * 3 + 0] = co * x1 - so * y2;
    pts[k * 3 + 1] = so * x1 + co * y2;
    pts[k * 3 + 2] = z2;
  }
  return pts;
}
