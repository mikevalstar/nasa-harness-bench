/**
 * Keplerian orbit propagation in the J2000 ecliptic frame.
 * Positions in AU. Angles in radians unless noted.
 */

const TWO_PI = Math.PI * 2;
const GM = 0.0002959122082855911; // au³/day²

export type OrbitElements = {
  a: number; // au (|a| for hyperbola)
  e: number;
  i: number; // rad
  om: number; // Ω rad
  w: number; // ω rad
  ma: number; // mean anomaly at epoch, rad (elliptic)
  epoch: number; // JD
  n: number; // rad/day (elliptic) or sqrt(μ/|a|³) for hyperbola
  q?: number; // perihelion au
  tp?: number; // perihelion JD
  kind?: 0 | 1 | 2; // 0 elliptic, 1 parabolic, 2 hyperbolic
};

export type Vec3 = { x: number; y: number; z: number };

function wrapAngle(a: number): number {
  let x = a % TWO_PI;
  if (x > Math.PI) x -= TWO_PI;
  if (x < -Math.PI) x += TWO_PI;
  return x;
}

/** Solve Kepler's equation M = E - e sin E (elliptic) */
export function solveKeplerElliptic(M: number, e: number): number {
  const m = wrapAngle(M);
  let E = e < 0.8 ? m : Math.PI;
  for (let i = 0; i < 12; i++) {
    const f = E - e * Math.sin(E) - m;
    const fp = 1 - e * Math.cos(E);
    const d = f / fp;
    E -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

/** Solve Kepler's equation for hyperbola: M = e sinh H - H */
export function solveKeplerHyperbolic(M: number, e: number): number {
  let H = Math.log((2 * Math.abs(M)) / e + 1.8);
  if (M < 0) H = -H;
  for (let i = 0; i < 20; i++) {
    const s = Math.sinh(H);
    const c = Math.cosh(H);
    const f = e * s - H - M;
    const fp = e * c - 1;
    const d = f / fp;
    H -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return H;
}

/** Barker's equation for parabolic orbits (from perihelion) */
export function solveParabolic(dt: number, q: number): number {
  // D³/3 + D = sqrt(μ/(2q³)) * dt   where tan(ν/2) = D
  const s = Math.sqrt(GM / (2 * q * q * q)) * dt;
  // Solve cubic: D³ + 3D - 3s = 0
  const w = Math.cbrt(s + Math.sqrt(s * s + 1));
  const D = w - 1 / w;
  return D; // tan(ν/2)
}

function rotateOrbitalToEcliptic(
  xOrb: number,
  yOrb: number,
  i: number,
  om: number,
  w: number,
): Vec3 {
  const cosO = Math.cos(om);
  const sinO = Math.sin(om);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);

  // Perifocal → ecliptic
  const px = cosW * xOrb - sinW * yOrb;
  const py = sinW * xOrb + cosW * yOrb;

  const x = (cosO * px - sinO * cosI * py);
  const y = (sinO * px + cosO * cosI * py);
  const z = sinI * py;
  return { x, y, z };
}

export function positionAt(el: OrbitElements, jd: number): Vec3 | null {
  const kind = el.kind ?? (el.e < 1 ? 0 : Math.abs(el.e - 1) < 1e-6 ? 1 : 2);

  if (kind === 0) {
    // Elliptic
    if (!(el.a > 0) || !(el.e < 1)) return null;
    const n = el.n > 0 ? el.n : Math.sqrt(GM / (el.a * el.a * el.a));
    const M = el.ma + n * (jd - el.epoch);
    const E = solveKeplerElliptic(M, el.e);
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const r = el.a * (1 - el.e * cosE);
    const xOrb = el.a * (cosE - el.e);
    const yOrb = el.a * Math.sqrt(1 - el.e * el.e) * sinE;
    // normalize to true r (already correct for ellipse)
    void r;
    return rotateOrbitalToEcliptic(xOrb, yOrb, el.i, el.om, el.w);
  }

  if (kind === 1) {
    // Parabolic — propagate from tp
    const q = el.q ?? 0;
    const tp = el.tp ?? el.epoch;
    if (!(q > 0)) return null;
    const D = solveParabolic(jd - tp, q);
    const nu = 2 * Math.atan(D);
    const r = q * (1 + D * D);
    const xOrb = r * Math.cos(nu);
    const yOrb = r * Math.sin(nu);
    return rotateOrbitalToEcliptic(xOrb, yOrb, el.i, el.om, el.w);
  }

  // Hyperbolic
  const a = Math.abs(el.a);
  const e = el.e;
  if (!(a > 0) || !(e > 1)) return null;
  const n = el.n > 0 ? el.n : Math.sqrt(GM / (a * a * a));
  const tp = el.tp ?? el.epoch;
  const M = n * (jd - tp);
  const H = solveKeplerHyperbolic(M, e);
  const coshH = Math.cosh(H);
  const sinhH = Math.sinh(H);
  const xOrb = a * (e - coshH); // note: a is |a|
  const yOrb = a * Math.sqrt(e * e - 1) * sinhH;
  return rotateOrbitalToEcliptic(xOrb, yOrb, el.i, el.om, el.w);
}

/** Sample an elliptic orbit path (closed) into N points */
export function sampleEllipticOrbit(el: OrbitElements, samples = 128): Float32Array {
  const pts = new Float32Array(samples * 3);
  if (!(el.a > 0) || el.e >= 1) return pts;
  for (let i = 0; i < samples; i++) {
    const M = (i / samples) * TWO_PI;
    const E = solveKeplerElliptic(M, el.e);
    const xOrb = el.a * (Math.cos(E) - el.e);
    const yOrb = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
    const p = rotateOrbitalToEcliptic(xOrb, yOrb, el.i, el.om, el.w);
    pts[i * 3] = p.x;
    pts[i * 3 + 1] = p.y;
    pts[i * 3 + 2] = p.z;
  }
  return pts;
}

/** Sample open orbit (parabolic/hyperbolic) around perihelion */
export function sampleOpenOrbit(el: OrbitElements, samples = 128): Float32Array {
  const pts = new Float32Array(samples * 3);
  const kind = el.kind ?? (el.e < 1 ? 0 : Math.abs(el.e - 1) < 1e-6 ? 1 : 2);
  const tp = el.tp ?? el.epoch;
  // Span ~± few years around perihelion, or until r grows large
  const span = kind === 1 ? 2000 : 1500; // days
  let written = 0;
  for (let i = 0; i < samples; i++) {
    const jd = tp - span + (2 * span * i) / (samples - 1);
    const p = positionAt({ ...el, kind }, jd);
    if (!p) continue;
    const r2 = p.x * p.x + p.y * p.y + p.z * p.z;
    if (r2 > 80 * 80) continue; // clip far points
    pts[written * 3] = p.x;
    pts[written * 3 + 1] = p.y;
    pts[written * 3 + 2] = p.z;
    written++;
  }
  return pts.subarray(0, written * 3);
}

/** Julian date from JS Date (UTC ≈ TDB for viz) */
export function dateToJD(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

export function jdToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

export function formatJD(jd: number): string {
  const d = jdToDate(jd);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min} UTC`;
}

export function parseDateInput(s: string): number | null {
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  return t / 86400000 + 2440587.5;
}
