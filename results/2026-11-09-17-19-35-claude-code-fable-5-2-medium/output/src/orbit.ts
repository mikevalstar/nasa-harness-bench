/**
 * Two-body orbit propagation in the heliocentric J2000 ecliptic frame.
 * Distances in au, time in days, angles in radians unless a name says `Deg`.
 */

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
/** Gaussian gravitational constant: sqrt(GM_sun) in au^1.5 / day. */
export const GAUSS_K = 0.01720209895;
export const AU_KM = 149_597_870.7;
/** Mean Earth-Moon distance in au. */
export const LD_AU = 384_400 / AU_KM;
export const SUN_RADIUS_KM = 696_000;

export type Vec3 = [x: number, y: number, z: number];

/**
 * Unit vectors of the orbital plane expressed in the ecliptic frame:
 * P points at perihelion, Q is 90 degrees ahead of it in the direction of motion.
 */
export interface Basis {
  px: number;
  py: number;
  pz: number;
  qx: number;
  qy: number;
  qz: number;
}

export function perifocalBasis(iDeg: number, omDeg: number, wDeg: number): Basis {
  const ci = Math.cos(iDeg * DEG);
  const si = Math.sin(iDeg * DEG);
  const co = Math.cos(omDeg * DEG);
  const so = Math.sin(omDeg * DEG);
  const cw = Math.cos(wDeg * DEG);
  const sw = Math.sin(wDeg * DEG);
  return {
    px: co * cw - so * sw * ci,
    py: so * cw + co * sw * ci,
    pz: sw * si,
    qx: -co * sw - so * cw * ci,
    qy: -so * sw + co * cw * ci,
    qz: cw * si,
  };
}

/** Iterations of the fixed-count Kepler solver. The asteroid vertex shader uses the same count. */
export const KEPLER_ITERATIONS = 6;

/**
 * Solve Kepler's equation E - e sin E = M for an ellipse.
 *
 * Fixed iteration count and branch-light so the asteroid vertex shader in
 * `scene/asteroids.ts` can run the identical algorithm. On [0, pi] the function
 * is convex and increasing, so Newton steps clamped to that interval cannot diverge.
 */
export function eccentricAnomaly(meanAnomaly: number, e: number): number {
  const wrapped = meanAnomaly - TAU * Math.floor(meanAnomaly / TAU + 0.5);
  const m = Math.abs(wrapped);
  let E: number;
  if (e < 0.6) {
    E = m + e * Math.sin(m);
  } else {
    // Root of the cubic you get from sin E ~ E - E^3/6. Exact as e -> 1 near perihelion,
    // which is where plain Newton starts crawl.
    const p = (2 * (1 - e)) / e;
    const h = (3 * m) / e;
    const d = Math.sqrt(h * h + p * p * p);
    E = Math.cbrt(h + d) - Math.cbrt(Math.max(d - h, 0));
  }
  E = Math.min(E, Math.PI);
  for (let k = 0; k < KEPLER_ITERATIONS; k++) {
    const next = E - (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E = Math.min(Math.max(next, 0), Math.PI);
  }
  return wrapped < 0 ? -E : E;
}

/** Position on an ellipse from semi-major axis, eccentricity and mean anomaly. */
export function ellipsePosition(a: number, e: number, meanAnomaly: number, b: Basis, out: Vec3): Vec3 {
  const E = eccentricAnomaly(meanAnomaly, e);
  const x = a * (Math.cos(E) - e);
  const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  out[0] = x * b.px + y * b.qx;
  out[1] = x * b.py + y * b.qy;
  out[2] = x * b.pz + y * b.qz;
  return out;
}

function stumpffC(z: number): number {
  if (z > 1e-4) return (1 - Math.cos(Math.sqrt(z))) / z;
  if (z < -1e-4) return (Math.cosh(Math.sqrt(-z)) - 1) / -z;
  return 0.5 - z / 24 + (z * z) / 720;
}

function stumpffS(z: number): number {
  if (z > 1e-4) {
    const s = Math.sqrt(z);
    return (s - Math.sin(s)) / (s * s * s);
  }
  if (z < -1e-4) {
    const s = Math.sqrt(-z);
    return (Math.sinh(s) - s) / (s * s * s);
  }
  return 1 / 6 - z / 120 + (z * z) / 5040;
}

/**
 * Position on any conic (ellipse, parabola, hyperbola) from perihelion distance,
 * eccentricity and time since perihelion passage.
 *
 * Uses the universal-variable form of Kepler's equation, which has no singularity
 * at e = 1. That matters for comets: half the catalogue is parabolic or hyperbolic
 * and has no mean anomaly or mean motion to advance.
 */
export function conicPosition(q: number, e: number, daysSincePerihelion: number, b: Basis, out: Vec3): Vec3 {
  const alpha = (1 - e) / q; // 1 / a, negative for hyperbolas
  let dt = daysSincePerihelion;
  if (e < 1) {
    const period = TAU / (GAUSS_K * Math.pow(alpha, 1.5));
    dt -= period * Math.floor(dt / period + 0.5);
  }
  const target = GAUSS_K * Math.abs(dt);

  // Start from the exact parabolic solution, then run Newton inside a bracket.
  // The function is monotonic in chi, so the bracket always holds the root.
  const p = (2 * q) / e;
  const h = (3 * target) / e;
  const d = Math.sqrt(h * h + p * p * p);
  let chi = Math.cbrt(h + d) - Math.cbrt(Math.max(d - h, 0));
  let lo = 0;
  let hi = Infinity;
  for (let k = 0; k < 60; k++) {
    const z = alpha * chi * chi;
    const f = e * chi * chi * chi * stumpffS(z) + q * chi - target;
    if (f > 0) hi = chi;
    else lo = chi;
    const slope = e * chi * chi * stumpffC(z) + q;
    let next = chi - f / slope;
    if (!(next > lo && next < hi)) next = hi === Infinity ? chi * 2 + 1e-6 : (lo + hi) / 2;
    const done = Math.abs(next - chi) <= 1e-13 * Math.max(1, chi);
    chi = next;
    if (done) break;
  }
  if (dt < 0) chi = -chi;

  const z = alpha * chi * chi;
  const x = q - chi * chi * stumpffC(z);
  const y = (q * chi - (1 - e) * chi * chi * chi * stumpffS(z)) * Math.sqrt((1 + e) / q);
  out[0] = x * b.px + y * b.qx;
  out[1] = x * b.py + y * b.qy;
  out[2] = x * b.pz + y * b.qz;
  return out;
}

/** Heliocentric speed in km/s from the vis-viva equation; valid for every conic. */
export function orbitalSpeedKmS(r: number, q: number, e: number): number {
  const auPerDay = GAUSS_K * Math.sqrt(Math.max(2 / r - (1 - e) / q, 0));
  return (auPerDay * AU_KM) / 86_400;
}

/**
 * Sample the orbit curve as xyz triples, evenly in true anomaly.
 * Open orbits, and ellipses reaching past `rMax`, are cut off at that distance,
 * in which case the curve should be drawn open rather than as a loop.
 */
export function sampleOrbit(
  q: number,
  e: number,
  b: Basis,
  segments: number,
  rMax: number,
): { points: Float32Array; closed: boolean } {
  const semiLatus = q * (1 + e);
  const closed = e < 1 && semiLatus / (1 - e) <= rMax;
  const limit = closed ? Math.PI : Math.acos(Math.min(Math.max((semiLatus / rMax - 1) / e, -1), 1));
  const count = closed ? segments : segments + 1;
  const points = new Float32Array(count * 3);
  for (let k = 0; k < count; k++) {
    const nu = -limit + (2 * limit * k) / segments;
    const r = semiLatus / (1 + e * Math.cos(nu));
    const x = r * Math.cos(nu);
    const y = r * Math.sin(nu);
    points[k * 3] = x * b.px + y * b.qx;
    points[k * 3 + 1] = x * b.py + y * b.qy;
    points[k * 3 + 2] = x * b.pz + y * b.qz;
  }
  return { points, closed };
}
