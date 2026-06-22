export const DEG = Math.PI / 180;
export const SUN_RADIUS_KM = 696_000;
export const AU_KM = 149_597_870.7;
/** Display scale: 1 AU in scene units */
export const AU_SCALE = 40;

export interface OrbitalElements {
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  epoch: number;
  n?: number | null;
  per?: number | null;
  tp?: number | null;
  q?: number | null;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function deg2rad(d: number): number {
  return d * DEG;
}

function normalizeAngle(deg: number): number {
  let a = deg % 360;
  if (a < 0) a += 360;
  return a;
}

/** Solve Kepler's equation M = E - e sin E for elliptical orbits */
function solveKeplerElliptic(Mdeg: number, e: number): number {
  const M = deg2rad(normalizeAngle(Mdeg));
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 30; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

/** Solve hyperbolic Kepler: M = e sinh H - H */
function solveKeplerHyperbolic(Mdeg: number, e: number): number {
  const M = deg2rad(Mdeg);
  let H = M > 0 ? Math.log(2 * M / e + 1.84) : -Math.log(2 * Math.abs(M) / e + 1.84);
  for (let i = 0; i < 30; i++) {
    const dH = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1);
    H -= dH;
    if (Math.abs(dH) < 1e-10) break;
  }
  return H;
}

function meanMotion(el: OrbitalElements): number {
  if (el.n != null && el.n > 0) return el.n;
  if (el.per != null && el.per > 0) return 360 / el.per;
  if (el.a > 0 && el.e < 1) {
    return 0.9856076686 / Math.pow(el.a, 1.5);
  }
  return 0;
}

function propagateHyperbolic(el: OrbitalElements, jd: number, a: number, e: number): Vec3 {
  const absA = Math.abs(a);
  const n = el.n != null && el.n > 0 ? el.n : 0.9856076686 / Math.pow(absA, 1.5);
  const dt = jd - el.tp!;
  const M = n * dt;
  const H = solveKeplerHyperbolic(M, e);
  const nu = 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(H / 2));
  const r = absA * (e * Math.cosh(H) - 1);
  return positionFromTrueAnomaly(a, e, el.i, el.om, el.w, nu, r);
}

function positionFromTrueAnomaly(
  a: number,
  e: number,
  i: number,
  om: number,
  w: number,
  nuRad: number,
  rOverride?: number,
): Vec3 {
  const r =
    rOverride ??
    (e >= 1
      ? (a * (e * e - 1)) / (1 + e * Math.cos(nuRad))
      : (a * (1 - e * e)) / (1 + e * Math.cos(nuRad)));

  const xOrb = r * Math.cos(nuRad);
  const yOrb = r * Math.sin(nuRad);

  const cosOm = Math.cos(deg2rad(om));
  const sinOm = Math.sin(deg2rad(om));
  const cosW = Math.cos(deg2rad(w));
  const sinW = Math.sin(deg2rad(w));
  const cosI = Math.cos(deg2rad(i));
  const sinI = Math.sin(deg2rad(i));

  return {
    x: (cosOm * cosW - sinOm * sinW * cosI) * xOrb + (-cosOm * sinW - sinOm * cosW * cosI) * yOrb,
    y: (sinOm * cosW + cosOm * sinW * cosI) * xOrb + (-sinOm * sinW + cosOm * cosW * cosI) * yOrb,
    z: sinW * sinI * xOrb + cosW * sinI * yOrb,
  };
}

/** Heliocentric ecliptic position (au) at Julian date jd */
export function propagate(el: OrbitalElements, jd: number): Vec3 | null {
  const e = el.e;

  // Parabolic: e ≈ 1, use tp-based propagation
  if (Math.abs(e - 1) < 1e-4 && el.tp != null && el.q != null) {
    const dt = jd - el.tp;
    const q = el.q;
    // Barker's equation: tan(nu/2) = sqrt(2/q) * t (in days, scaled)
    const k = Math.sqrt(2 / q);
    const tDays = dt;
    const nu = 2 * Math.atan(k * tDays);
    const r = q * (1 + Math.cos(nu));
    return positionFromTrueAnomaly(q * 2, 1, el.i, el.om, el.w, nu, r);
  }

  if (e >= 1) {
    // Hyperbolic: propagate from tp
    if (el.tp == null || el.q == null) return null;
    const a = el.a != null ? el.a : el.q / (1 - e);
    if (a >= 0 && e > 1) {
      // derive negative semi-major axis from q
      const aHyp = el.q / (1 - e);
      return propagateHyperbolic(el, jd, aHyp, e);
    }
    if (a < 0) return propagateHyperbolic(el, jd, a, e);
    // e === 1 parabolic handled above
    return null;
  }

  // Elliptical
  const n = meanMotion(el);
  const dt = jd - el.epoch;
  const M = el.ma + n * dt;
  const E = solveKeplerElliptic(M, e);
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  return positionFromTrueAnomaly(el.a, e, el.i, el.om, el.w, nu);
}

/** Sample points along a closed orbit for path rendering */
export function sampleOrbit(el: OrbitalElements, segments = 128): Vec3[] {
  if (el.e >= 1) return [];
  const pts: Vec3[] = [];
  for (let s = 0; s <= segments; s++) {
    const ma = (360 * s) / segments;
    const p = propagate({ ...el, ma }, el.epoch);
    if (p) pts.push(p);
  }
  return pts;
}

export function vec3ToScene(v: Vec3): { x: number; y: number; z: number } {
  return { x: v.x * AU_SCALE, y: v.z * AU_SCALE, z: -v.y * AU_SCALE };
}
