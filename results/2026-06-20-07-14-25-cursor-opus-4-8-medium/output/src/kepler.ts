// CPU Kepler propagation, used for the 8 planets and ~4k comets (the 42k
// asteroids are propagated on the GPU — see asteroids.ts). Supports elliptic,
// hyperbolic and parabolic orbits.
//
// All angles internally in radians, distances in AU, time in days (JD).
// Output positions are in *scene* coordinates: we map the heliocentric ecliptic
// frame (X, Y, Z with Z = ecliptic north) to Three.js (x = X, y = Z, z = -Y) so
// the ecliptic lies roughly in the horizontal plane with north up.

export const GAUSS_K = 0.01720209895; // sqrt(GM_sun), AU^1.5 / day
export const MU_SUN = GAUSS_K * GAUSS_K;
const DEG2RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;

export interface OrbitElements {
  a: number | null; // semi-major axis (au); null for parabolic/hyperbolic without a
  e: number; // eccentricity
  i: number; // inclination (rad)
  om: number; // longitude of ascending node (rad)
  w: number; // argument of perihelion (rad)
  q: number; // perihelion distance (au)
  // Closed orbits: mean anomaly at epoch + epoch. Open orbits: use tp.
  ma?: number; // mean anomaly at epoch (rad)
  epoch?: number; // JD of ma
  tp?: number; // JD of perihelion passage
  n?: number; // mean motion (rad/day), optional
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// Precomputed perifocal -> ecliptic rotation columns (P points to perihelion,
// Q is 90° ahead in the orbit plane), plus derived mean motion / a.
export interface PreparedOrbit {
  mode: 0 | 1 | 2; // 0 elliptic, 1 hyperbolic, 2 parabolic
  e: number;
  a: number; // signed semi-major axis (negative for hyperbola; unused for parabola)
  q: number;
  n: number; // mean motion (rad/day) for elliptic/hyperbolic
  ma: number;
  epoch: number;
  tp: number;
  Px: number; Py: number; Pz: number;
  Qx: number; Qy: number; Qz: number;
}

export function deg2rad(d: number): number {
  return d * DEG2RAD;
}

export function prepareOrbit(el: OrbitElements): PreparedOrbit {
  const { e, i, om, w } = el;
  const cosO = Math.cos(om), sinO = Math.sin(om);
  const cosi = Math.cos(i), sini = Math.sin(i);
  const cosw = Math.cos(w), sinw = Math.sin(w);

  // Perifocal -> ecliptic, then ecliptic -> scene (x=X, y=Z, z=-Y).
  const Px = cosO * cosw - sinO * sinw * cosi;
  const Py = sinO * cosw + cosO * sinw * cosi;
  const Pz = sinw * sini;
  const Qx = -cosO * sinw - sinO * cosw * cosi;
  const Qy = -sinO * sinw + cosO * cosw * cosi;
  const Qz = cosw * sini;

  let mode: 0 | 1 | 2;
  let a = el.a ?? NaN;
  let q = el.q;
  let n = el.n ?? NaN;

  if (e < 1) {
    mode = 0;
    if (!isFinite(a)) a = q / (1 - e);
    if (!isFinite(n)) n = GAUSS_K / (a * Math.sqrt(a));
    if (!isFinite(q)) q = a * (1 - e);
  } else if (e > 1) {
    mode = 1;
    if (!isFinite(a)) a = q / (1 - e); // negative
    if (!isFinite(n)) n = GAUSS_K / Math.pow(-a, 1.5);
    if (!isFinite(q)) q = a * (1 - e);
  } else {
    mode = 2; // parabolic
    n = NaN;
  }

  return {
    mode,
    e,
    a,
    q,
    n,
    ma: el.ma ?? 0,
    epoch: el.epoch ?? el.tp ?? 0,
    tp: el.tp ?? el.epoch ?? 0,
    Px, Py, Pz, Qx, Qy, Qz,
  };
}

function solveElliptic(M: number, e: number): number {
  // Normalize to [-pi, pi] for fast convergence.
  let m = M % TWO_PI;
  if (m > Math.PI) m -= TWO_PI;
  if (m < -Math.PI) m += TWO_PI;
  let E = e < 0.8 ? m : Math.PI * Math.sign(m || 1);
  for (let it = 0; it < 8; it++) {
    const f = E - e * Math.sin(E) - m;
    const fp = 1 - e * Math.cos(E);
    const d = f / fp;
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return E;
}

function solveHyperbolic(M: number, e: number): number {
  // Solve M = e*sinh(H) - H.
  let H = Math.asinh(M / e || 0);
  if (!isFinite(H)) H = Math.sign(M) * Math.log(2 * Math.abs(M) / e + 1.8);
  for (let it = 0; it < 30; it++) {
    const f = e * Math.sinh(H) - H - M;
    const fp = e * Math.cosh(H) - 1;
    const d = f / fp;
    H -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return H;
}

// Returns perifocal coordinates (xi along perihelion, eta 90° ahead).
function perifocal(o: PreparedOrbit, jd: number): { xi: number; eta: number } {
  if (o.mode === 0) {
    const M = o.ma + o.n * (jd - o.epoch);
    const E = solveElliptic(M, o.e);
    const xi = o.a * (Math.cos(E) - o.e);
    const eta = o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(E);
    return { xi, eta };
  }
  if (o.mode === 1) {
    const M = o.n * (jd - o.tp);
    const H = solveHyperbolic(M, o.e);
    const xi = o.a * (Math.cosh(H) - o.e); // a<0 -> xi>0 near perihelion
    const eta = -o.a * Math.sqrt(o.e * o.e - 1) * Math.sinh(H);
    return { xi, eta };
  }
  // Parabolic: Barker's equation via the cubic root form.
  const A = 1.5 * Math.sqrt(MU_SUN / (2 * o.q * o.q * o.q)) * (jd - o.tp);
  const B = Math.cbrt(A + Math.sqrt(A * A + 1));
  const tanV2 = B - 1 / B;
  const r = o.q * (1 + tanV2 * tanV2);
  const cosV = (1 - tanV2 * tanV2) / (1 + tanV2 * tanV2);
  const sinV = (2 * tanV2) / (1 + tanV2 * tanV2);
  return { xi: r * cosV, eta: r * sinV };
}

export function propagate(o: PreparedOrbit, jd: number, out: Vec3): Vec3 {
  const { xi, eta } = perifocal(o, jd);
  const X = o.Px * xi + o.Qx * eta;
  const Y = o.Py * xi + o.Qy * eta;
  const Z = o.Pz * xi + o.Qz * eta;
  // ecliptic (X,Y,Z) -> scene (x, z, -y)
  out.x = X;
  out.y = Z;
  out.z = -Y;
  return out;
}

// Sample a full orbit path (scene coords) for drawing an orbit line.
// For open orbits we sample a true-anomaly span around perihelion.
export function sampleOrbit(o: PreparedOrbit, segments: number): Float32Array {
  const pts = new Float32Array((segments + 1) * 3);
  for (let s = 0; s <= segments; s++) {
    let xi: number, eta: number;
    if (o.mode === 0) {
      const E = (s / segments) * TWO_PI;
      xi = o.a * (Math.cos(E) - o.e);
      eta = o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(E);
    } else {
      // Open orbit: sweep true anomaly within asymptote limits.
      const vMax =
        o.mode === 1 ? Math.acos(-1 / o.e) * 0.98 : Math.PI * 0.98;
      const v = -vMax + (s / segments) * 2 * vMax;
      const p = o.q * (1 + o.e); // semi-latus rectum
      const r = p / (1 + o.e * Math.cos(v));
      xi = r * Math.cos(v);
      eta = r * Math.sin(v);
    }
    const X = o.Px * xi + o.Qx * eta;
    const Y = o.Py * xi + o.Qy * eta;
    const Z = o.Pz * xi + o.Qz * eta;
    pts[s * 3 + 0] = X;
    pts[s * 3 + 1] = Z;
    pts[s * 3 + 2] = -Y;
  }
  return pts;
}
