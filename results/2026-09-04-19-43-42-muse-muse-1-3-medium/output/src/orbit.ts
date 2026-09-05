// Orbital mechanics: Keplerian propagation in the J2000 heliocentric ecliptic frame.
// Units in: degrees, AU, days (Julian dates). Units out: AU (ecliptic xyz).
// Three.js mapping is done by the scene layer: (x, y, z)_three = (x, z, -y)_ecl.

export const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;
// Gaussian gravitational constant (AU^1.5 / day); mu = k^2 for the Sun.
export const GAUSS_K = 0.01720209895;

export interface Elements {
  a: number; // semi-major axis, AU (NaN if unknown, e.g. some comets)
  e: number;
  i: number; // deg
  om: number; // longitude of ascending node, deg
  w: number; // argument of perihelion, deg
  ma: number; // mean anomaly at epoch, deg
  epoch: number; // Julian date of elements
  n: number; // mean motion deg/day (NaN if unknown)
  tp: number; // time of perihelion passage, JD (NaN if unknown)
  q: number; // perihelion distance, AU (NaN if unknown)
}

/** Mean motion in deg/day, falling back to a via the Gaussian constant. */
export function meanMotion(el: Elements): number {
  if (Number.isFinite(el.n) && el.n !== 0) return el.n;
  if (Number.isFinite(el.a) && el.a > 0) {
    return (360 / 365.256898004) / Math.pow(el.a, 1.5);
  }
  return NaN;
}

/** Solve Kepler's equation M = E - e*sin(E) (radians). Returns E. */
export function solveKepler(M: number, e: number): number {
  M = M % TWO_PI;
  if (M > Math.PI) M -= TWO_PI;
  if (M < -Math.PI) M += TWO_PI;
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 12; k++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const d = f / fp;
    E -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

/** Solve hyperbolic Kepler M = e*sinh(F) - F. Returns F. */
export function solveKeplerHyperbolic(M: number, e: number): number {
  let F = Math.asinh(M / e);
  for (let k = 0; k < 20; k++) {
    const f = e * Math.sinh(F) - F - M;
    const fp = e * Math.cosh(F) - 1;
    const d = f / fp;
    F -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return F;
}

/**
 * Position from orbital elements at Julian date `jd`, written into `out`
 * (ecliptic xyz, AU). Handles closed (e<1), parabolic (e≈1) and hyperbolic
 * (e>1) orbits. Returns false when the elements are insufficient.
 */
export function elementsToPos(el: Elements, jd: number, out: Float64Array | number[], o = 0): boolean {
  const e = el.e;
  if (!Number.isFinite(e)) return false;
  const om = el.om * DEG;
  const w = el.w * DEG;
  const ci = Math.cos(el.i * DEG);
  const si = Math.sin(el.i * DEG);
  const cOm = Math.cos(om);
  const sOm = Math.sin(om);

  let nu: number; // true anomaly
  let r: number; // heliocentric distance

  if (e < 1) {
    const n = meanMotion(el);
    if (!Number.isFinite(n)) return false;
    const M = (el.ma + n * (jd - el.epoch)) * DEG;
    const E = solveKepler(M, e);
    nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    r = el.a * (1 - e * Math.cos(E));
  } else {
    // Open orbit: propagate from perihelion passage tp.
    if (!Number.isFinite(el.tp)) return false;
    const dt = jd - el.tp;
    if (Math.abs(e - 1) < 1e-6) {
      // Parabolic (Barker's equation), needs q.
      if (!Number.isFinite(el.q)) return false;
      const n2 = 2 * GAUSS_K * dt / Math.pow(2 * el.q, 1.5);
      // Solve D + D^3/3 = n2 via one Newton pass from cubic approx.
      let D = Math.cbrt(3 * n2);
      for (let k = 0; k < 10; k++) {
        const f = D + (D * D * D) / 3 - n2;
        D -= f / (1 + D * D);
      }
      nu = 2 * Math.atan(D);
      r = 2 * el.q / (1 + Math.cos(nu));
    } else {
      const aAbs = Number.isFinite(el.a) && el.a < 0 ? -el.a
        : Number.isFinite(el.q) ? el.q / (e - 1)
        : NaN;
      if (!Number.isFinite(aAbs)) return false;
      const nh = ((360 / 365.256898004) / Math.pow(aAbs, 1.5)) * DEG; // rad/day
      const Mh = nh * dt;
      const F = solveKeplerHyperbolic(Mh, e);
      nu = 2 * Math.atan2(Math.sqrt(e + 1) * Math.sinh(F / 2), Math.sqrt(e - 1) * Math.cosh(F / 2));
      r = aAbs * (e * Math.cosh(F) - 1);
    }
  }
  if (!Number.isFinite(r) || !Number.isFinite(nu)) return false;

  const cw = Math.cos(w + nu);
  const sw = Math.sin(w + nu);
  out[o] = r * (cOm * cw - sOm * sw * ci);
  out[o + 1] = r * (sOm * cw + cOm * sw * ci);
  out[o + 2] = r * (sw * si);
  return true;
}

/** Sample a full orbit path (ecliptic xyz, AU) for drawing. */
export function orbitPath(el: Elements, segments: number, maxR = 60): Float32Array | null {
  const e = el.e;
  if (!Number.isFinite(e)) return null;
  if (e < 1) {
    const pts = new Float32Array((segments + 1) * 3);
    const tmp = [0, 0, 0];
    const n = meanMotion(el);
    if (!Number.isFinite(n) || n === 0) return null;
    const period = 360 / n;
    for (let s = 0; s <= segments; s++) {
      const jd = el.epoch + (s / segments) * period;
      elementsToPos(el, jd, tmp);
      pts[s * 3] = tmp[0];
      pts[s * 3 + 1] = tmp[1];
      pts[s * 3 + 2] = tmp[2];
    }
    return pts;
  }
  // Open orbit: sample true anomaly symmetrically about perihelion.
  if (!Number.isFinite(el.tp)) return null;
  const nuMax = Math.acos(Math.min(1, Math.max(-1, -1 / e))) * 0.92; // stay bound
  const pts = new Float32Array((segments + 1) * 3);
  const om = el.om * DEG;
  const w = el.w * DEG;
  const ci = Math.cos(el.i * DEG);
  const si = Math.sin(el.i * DEG);
  const cOm = Math.cos(om);
  const sOm = Math.sin(om);
  const p = Number.isFinite(el.q)
    ? (e < 1 + 1e-6 && Math.abs(e - 1) < 1e-6 ? 2 * el.q : el.q * (1 + e))
    : NaN;
  if (!Number.isFinite(p)) return null;
  for (let s = 0; s <= segments; s++) {
    const nu = -nuMax + (2 * nuMax * s) / segments;
    const r = Math.min(p / (1 + e * Math.cos(nu)), maxR);
    const cw = Math.cos(w + nu);
    const sw = Math.sin(w + nu);
    pts[s * 3] = r * (cOm * cw - sOm * sw * ci);
    pts[s * 3 + 1] = r * (sOm * cw + cOm * sw * ci);
    pts[s * 3 + 2] = r * (sw * si);
  }
  return pts;
}
