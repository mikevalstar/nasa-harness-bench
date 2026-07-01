// Orbital mechanics: Kepler-equation solvers and heliocentric position
// computation from classical orbital elements, in the J2000 ecliptic frame.
// Used on the CPU for the planets (8 bodies, orbit-line sampling, camera
// targeting). The asteroid/comet point clouds use an equivalent GLSL
// implementation (see shaders/*.glsl.ts) so 42k+ bodies propagate on the GPU.

export const JD_J2000 = 2451545.0;
// Gaussian gravitational constant, in au^1.5 / day, used to derive mean
// motion for comets (whose `a`/`n` are null for open orbits).
const K_GAUSS = 0.01720209895;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Convert heliocentric ecliptic coordinates (x,y in the ecliptic plane, z
 * toward the north ecliptic pole) into the renderer's Y-up space. Must match
 * the mapping baked into `orbitalPlaneToEcliptic` in shaders/keplerGLSL.ts so
 * CPU-computed (planets, orbit lines) and GPU-computed (asteroids, comets)
 * positions agree.
 */
export function eclipticToThree(v: Vec3): Vec3 {
  return { x: v.x, y: v.z, z: -v.y };
}

function solveEllipticalKepler(M: number, e: number): number {
  // Normalize to [-pi, pi] for fast convergence.
  let m = ((M + Math.PI) % (2 * Math.PI)) - Math.PI;
  let E = e < 0.8 ? m : Math.PI * Math.sign(m || 1);
  for (let iter = 0; iter < 12; iter++) {
    const f = E - e * Math.sin(E) - m;
    const fp = 1 - e * Math.cos(E);
    const d = f / fp;
    E -= d;
    if (Math.abs(d) < 1e-9) break;
  }
  return E;
}

function solveHyperbolicKepler(M: number, e: number): number {
  let H = Math.log((2 * Math.abs(M)) / e + 1.8) * Math.sign(M || 1);
  for (let iter = 0; iter < 30; iter++) {
    const f = e * Math.sinh(H) - H - M;
    const fp = e * Math.cosh(H) - 1;
    const d = f / fp;
    H -= d;
    if (Math.abs(d) < 1e-9) break;
  }
  return H;
}

function solveParabolic(M: number): number {
  // Barker's equation via Newton's method on D: M = D + D^3/3.
  let D = M;
  for (let iter = 0; iter < 30; iter++) {
    const f = D + (D * D * D) / 3 - M;
    const fp = 1 + D * D;
    const d = f / fp;
    D -= d;
    if (Math.abs(d) < 1e-9) break;
  }
  return D;
}

function orbitalPlaneToEcliptic(r: number, nu: number, i: number, om: number, w: number): Vec3 {
  const u = w + nu;
  const cosOm = Math.cos(om);
  const sinOm = Math.sin(om);
  const cosU = Math.cos(u);
  const sinU = Math.sin(u);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  return {
    x: r * (cosOm * cosU - sinOm * sinU * cosI),
    y: r * (sinOm * cosU + cosOm * sinU * cosI),
    z: r * (sinI * sinU),
  };
}

/** Elliptical orbit (e < 1) from mean-anomaly-at-epoch elements (planets, asteroids). */
export function positionFromMeanElements(
  a: number,
  e: number,
  i: number,
  om: number,
  w: number,
  ma: number,
  n: number,
  epoch: number,
  jd: number
): Vec3 {
  const M = ma + n * (jd - epoch);
  const E = solveEllipticalKepler(M, e);
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  const r = a * (1 - e * Math.cos(E));
  return orbitalPlaneToEcliptic(r, nu, i, om, w);
}

/**
 * Any orbit (elliptical, parabolic, or hyperbolic) from perihelion-based
 * elements (q, e, tp) — the representation that stays valid for comets
 * regardless of eccentricity.
 */
export function positionFromPerihelionElements(
  q: number,
  e: number,
  i: number,
  om: number,
  w: number,
  tp: number,
  jd: number
): Vec3 {
  const dt = jd - tp;
  let nu: number;
  let r: number;

  if (Math.abs(e - 1) < 1e-6) {
    const M = (K_GAUSS * dt) / (q * Math.sqrt(q)) * Math.SQRT1_2;
    const D = solveParabolic(M);
    nu = 2 * Math.atan(D);
    r = q * (1 + D * D);
  } else if (e < 1) {
    const a = q / (1 - e);
    const n = K_GAUSS / Math.pow(a, 1.5);
    const M = n * dt;
    const E = solveEllipticalKepler(M, e);
    nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    r = a * (1 - e * Math.cos(E));
  } else {
    const a = q / (1 - e); // negative
    const n = K_GAUSS / Math.pow(-a, 1.5);
    const M = n * dt;
    const H = solveHyperbolicKepler(M, e);
    nu = 2 * Math.atan2(Math.sqrt(e + 1) * Math.sinh(H / 2), Math.sqrt(e - 1) * Math.cosh(H / 2));
    r = a * (1 - e * Math.cosh(H));
  }

  return orbitalPlaneToEcliptic(r, nu, i, om, w);
}

/** Sample an elliptical orbit's static shape as a closed loop (for orbit-line rendering). */
export function sampleEllipticalOrbit(
  a: number,
  e: number,
  i: number,
  om: number,
  w: number,
  segments = 256
): Vec3[] {
  const pts: Vec3[] = [];
  for (let s = 0; s <= segments; s++) {
    const nu = (s / segments) * Math.PI * 2;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
    pts.push(orbitalPlaneToEcliptic(r, nu, i, om, w));
  }
  return pts;
}

/**
 * Sample an orbit's static shape from perihelion-based elements, valid for
 * any eccentricity. Elliptical orbits are drawn as a closed loop; parabolic
 * and hyperbolic orbits are open, so we draw a bounded arc around perihelion
 * instead (approaching, but not reaching, the asymptotes).
 */
export function sampleOrbitPathFromPerihelion(
  q: number,
  e: number,
  i: number,
  om: number,
  w: number,
  segments = 256
): Vec3[] {
  if (e < 1) {
    const a = q / (1 - e);
    return sampleEllipticalOrbit(a, e, i, om, w, segments);
  }

  const numaxAsymptote = e > 1 ? Math.acos(-1 / e) : Math.PI;
  const numax = numaxAsymptote * 0.985; // stay short of the asymptote
  const pts: Vec3[] = [];
  for (let s = 0; s <= segments; s++) {
    const nu = -numax + (s / segments) * 2 * numax;
    const r = (q * (1 + e)) / (1 + e * Math.cos(nu));
    pts.push(orbitalPlaneToEcliptic(r, nu, i, om, w));
  }
  return pts;
}
