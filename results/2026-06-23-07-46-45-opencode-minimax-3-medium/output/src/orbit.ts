// Orbital mechanics: Keplerian orbit propagation in the J2000 ecliptic frame.
// All angles in radians internally. Output positions in AU, heliocentric, J2000.

import type { AsteroidOrbit, Planet, Comet } from './types';

// Gaussian gravitational constant squared (GM_sun) in AU^3 / day^2.
export const GM_SUN = 0.01720209895 * 0.01720209895;

// Mean radius of the Sun, in km.
export const SUN_RADIUS_KM = 696000;

// Earth radius for scaling reference (km).
export const EARTH_RADIUS_KM = 6371;

// Astronomical unit in km.
export const AU_KM = 149597870.7;

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const TAU = Math.PI * 2;

// Solve Kepler's equation  M = E - e * sin(E)  for the eccentric anomaly E.
// M is in radians, in (-π, π]. Converges in 4–6 Newton iterations for e < 0.99.
function solveKeplerElliptic(M: number, e: number): number {
  // Normalize M into [-π, π].
  let m = M % TAU;
  if (m > Math.PI) m -= TAU;
  if (m < -Math.PI) m += TAU;

  // Good initial guess: E0 = M + e*sin(M).
  let E = m + e * Math.sin(m);
  for (let i = 0; i < 8; i++) {
    const f = E - e * Math.sin(E) - m;
    const fp = 1 - e * Math.cos(E);
    const dE = f / fp;
    E -= dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

// Solve hyperbolic Kepler  M = e * sinh(H) - H  for hyperbolic anomaly H.
function solveKeplerHyperbolic(M: number, e: number): number {
  // Initial guess for H scales with M / (e - 1).
  let H =
    Math.sign(M) * Math.log(2 * Math.abs(M) / e + 1.8) - Math.sign(M) * 0.01;
  for (let i = 0; i < 30; i++) {
    const sH = Math.sinh(H);
    const cH = Math.cosh(H);
    const f = e * sH - H - M;
    const fp = e * cH - 1;
    const dH = f / fp;
    H -= dH;
    if (Math.abs(dH) < 1e-9) break;
  }
  return H;
}

// Precomputed coefficients per body so the per-frame inner loop is fast.
// Stores the constants that don't depend on time.
export interface PropCoeffs {
  // Per-orbit constants (rad):
  cosOm: number;
  sinOm: number;
  cosW: number;
  sinW: number;
  cosI: number;
  sinI: number;
  // P, Q rotation vectors into J2000 ecliptic.
  // X = x*P + y*Q, Y = x*P + y*Q, Z = x*P + y*Q (3 components each).
  Px: number;
  Py: number;
  Pz: number;
  Qx: number;
  Qy: number;
  Qz: number;
}

export function buildEllipticCoeffs(
  om_deg: number,
  w_deg: number,
  i_deg: number,
): PropCoeffs {
  const om = om_deg * DEG;
  const w = w_deg * DEG;
  const i = i_deg * DEG;
  const cosOm = Math.cos(om);
  const sinOm = Math.sin(om);
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  return {
    cosOm,
    sinOm,
    cosW,
    sinW,
    cosI,
    sinI,
    // P = (cosΩ·cosω − sinΩ·sinω·cos i,  sinΩ·cosω + cosΩ·sinω·cos i,  sinω·sin i)
    Px: cosOm * cosW - sinOm * sinW * cosI,
    Py: sinOm * cosW + cosOm * sinW * cosI,
    Pz: sinW * sinI,
    // Q = (−cosΩ·sinω − sinΩ·cosω·cos i,  −sinΩ·sinω + cosΩ·cosω·cos i,  cosω·sin i)
    Qx: -cosOm * sinW - sinOm * cosW * cosI,
    Qy: -sinOm * sinW + cosOm * cosW * cosI,
    Qz: cosW * sinI,
  };
}

// Build a per-orbit prop-state for an asteroid, planet, or bound comet.
export interface EllipticProp {
  a: number; // au
  e: number;
  n: number; // rad / day
  ma0: number; // rad at epoch
  epoch: number; // JD
  coeffs: PropCoeffs;
}

export function buildEllipticProp(
  o: AsteroidOrbit | Planet | { a: number; e: number; i: number; om: number; w: number; ma: number; epoch: number; n: number },
): EllipticProp {
  // Convert n deg/day → rad/day.
  const nRad = o.n * DEG;
  return {
    a: o.a,
    e: o.e,
    n: nRad,
    ma0: o.ma * DEG,
    epoch: o.epoch,
    coeffs: buildEllipticCoeffs(o.om, o.w, o.i),
  };
}

// Propagate an elliptic orbit to time t (JD) and write the position to outXYZ[0..2] (AU).
export function propagateElliptic(p: EllipticProp, t: number, outXYZ: number[] | Float32Array): void {
  const dt = t - p.epoch;
  let M = p.ma0 + p.n * dt;
  // Wrap to (-π, π]
  M = ((M + Math.PI) % TAU + TAU) % TAU - Math.PI;

  const E = solveKeplerElliptic(M, p.e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const a = p.a;
  const e = p.e;
  const sqrt1me2 = Math.sqrt(Math.max(0, 1 - e * e));
  // Position in the orbital plane, in AU.
  const x = a * (cosE - e);
  const y = a * sqrt1me2 * sinE;
  const c = p.coeffs;
  outXYZ[0] = x * c.Px + y * c.Qx;
  outXYZ[1] = x * c.Py + y * c.Qy;
  outXYZ[2] = x * c.Pz + y * c.Qz;
}

// Hyperbolic comet prop. For e >= 1 and (a may be meaningless / NaN).
// We propagate from tp using the mean motion n_h = sqrt(GM/|a|^3), but if
// |a| is missing we use the supplied n.
export interface HyperbolicProp {
  q: number;
  e: number;
  // n_h in rad/day
  n_h: number;
  tp: number;
  coeffs: PropCoeffs;
}

export function buildHyperbolicProp(
  c: Comet,
): HyperbolicProp | null {
  if (c.e < 1) return null;
  let n_h: number;
  if (c.n && isFinite(c.n) && c.n > 0) {
    n_h = c.n * DEG;
  } else if (c.a && isFinite(c.a) && Math.abs(c.a) > 0) {
    // For e>=1, "a" is often given as a positive convention = q/(e-1).
    // Use |a| from that, or fall back to q/(e-1).
    const aAbs = Math.abs(c.a) > 0 ? Math.abs(c.a) : c.q / (c.e - 1);
    n_h = Math.sqrt(GM_SUN / (aAbs * aAbs * aAbs));
  } else {
    n_h = Math.sqrt(GM_SUN / Math.pow(c.q / (c.e - 1), 3));
  }
  return {
    q: c.q,
    e: c.e,
    n_h,
    tp: c.tp,
    coeffs: buildEllipticCoeffs(c.om, c.w, c.i),
  };
}

// Propagate hyperbolic orbit at time t. Returns null if the body is "far"
// (more than farMax AU from the Sun) so the caller can skip rendering.
export function propagateHyperbolic(
  p: HyperbolicProp,
  t: number,
  outXYZ: number[] | Float32Array,
  farMax = 100,
): boolean {
  const M = p.n_h * (t - p.tp);
  const H = solveKeplerHyperbolic(M, p.e);
  const sH = Math.sinh(H);
  const cH = Math.cosh(H);
  const e = p.e;
  // Position in orbital plane (AU):
  const x = p.q * (e - cH) / (1 + e * cH - (e * e - 1)) * (1 + e * cH);
  // Use the proper formulation:  r = q*(1+e) / (1 + e*cosh H)
  const r = (p.q * (1 + e)) / (1 + e * cH);
  // cosh H - e  … actually let's derive cleanly:
  //   x_orb = a*(cosh H - e),  y_orb = a*sqrt(e^2-1)*sinh H,  a = q/(e-1) (positive)
  const aAbs = p.q / (e - 1);
  const sqe2m1 = Math.sqrt(e * e - 1);
  const xo = aAbs * (cH - e);
  const yo = aAbs * sqe2m1 * sH;
  // Sanity check: |xo|^2 + |yo|^2 ≈ r^2
  const rCheck = Math.hypot(xo, yo);
  if (!isFinite(rCheck) || rCheck > farMax) return false;
  const c = p.coeffs;
  outXYZ[0] = xo * c.Px + yo * c.Qx;
  outXYZ[1] = xo * c.Py + yo * c.Qy;
  outXYZ[2] = xo * c.Pz + yo * c.Qz;
  return true;
}
