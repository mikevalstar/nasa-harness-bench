/**
 * Kepler equation solvers — one for elliptic (e < 1) and one for hyperbolic
 * (e >= 1) orbits. Inputs/outputs in radians unless stated.
 *
 * We work in degrees for input angles (matches the data) but keep
 * Kepler/trig internally in radians to keep trig fast.
 */

const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const RAD = 180 / Math.PI;

/** Wrap an angle in radians to [-PI, PI]. */
export function wrapPi(a: number): number {
  let x = a % TWO_PI;
  if (x > Math.PI) x -= TWO_PI;
  else if (x < -Math.PI) x += TWO_PI;
  return x;
}

/** Wrap an angle in radians to [0, 2*PI). */
export function wrapTwoPi(a: number): number {
  let x = a % TWO_PI;
  if (x < 0) x += TWO_PI;
  return x;
}

/**
 * Solve elliptic Kepler:  M = E - e*sin(E)  for E, given mean anomaly M (rad)
 * and eccentricity e in [0, 1). Newton-Raphson starting from E0 = M + e*sin(M).
 * Converges in 3–6 iterations for any reasonable e.
 */
export function solveKeplerElliptic(M: number, e: number): number {
  const Mwrap = wrapPi(M);
  let E = Mwrap + e * Math.sin(Mwrap);
  for (let i = 0; i < 8; i++) {
    const f = E - e * Math.sin(E) - Mwrap;
    const fp = 1 - e * Math.cos(E);
    const dE = f / fp;
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

/**
 * Solve hyperbolic Kepler:  M = e*sinh(H) - H  for H, given M (rad) and e >= 1.
 * For parabolic (e=1), use the series form — but in practice we treat e ≈ 1 as
 * the limit and a slightly elliptic orbit. The dataset's hyperbolic entries
 * have e clearly > 1.
 */
export function solveKeplerHyperbolic(M: number, e: number): number {
  // Initial guess (e >> 1): H ≈ M/e; for e near 1, H ≈ M.
  let H = M / Math.max(1.0001, e - 1);
  if (!isFinite(H) || Math.abs(H) < 1e-6) H = M;
  for (let i = 0; i < 30; i++) {
    const sinhH = Math.sinh(H);
    const coshH = Math.cosh(H);
    const f = e * sinhH - H - M;
    const fp = e * coshH - 1;
    if (Math.abs(fp) < 1e-12) break;
    const dH = f / fp;
    H -= dH;
    if (Math.abs(dH) < 1e-10) break;
  }
  return H;
}

/**
 * Compute heliocentric position (in the perifocal frame's host — but we
 * return a 3-vector in the heliocentric ecliptic J2000 frame, given the
 * precomputed basis vectors.
 *
 * Inputs are in the same units as the data:
 *   basis (ex, ey, ez) — 3 unit vectors in heliocentric ecliptic
 *   a — au, e — dimensionless, maDeg/nDeg — degrees/day, epoch — JD, jd — JD
 *
 * Returns a 3-vector in au in the heliocentric ecliptic J2000 frame.
 */
export interface KeplerResult {
  r: number;
  cosNu: number;
  sinNu: number;
}

export function computePosition(
  exX: number,
  exY: number,
  exZ: number,
  eyX: number,
  eyY: number,
  eyZ: number,
  a: number,
  e: number,
  maDeg: number,
  nDeg: number,
  epoch: number,
  jd: number,
  hyperbolic = false,
): KeplerResult {
  // Mean anomaly at jd (in radians).
  const Mdeg = maDeg + nDeg * (jd - epoch);
  const M = Mdeg * DEG;

  if (hyperbolic || e >= 1) {
    // Hyperbolic: solve M = e*sinh(H) - H.
    const H = solveKeplerHyperbolic(M, e);
    // Position: r*cos(nu) = a*(e - cosh(H)), r*sin(nu) = a*sqrt(e^2-1)*sinh(H)
    // Note: a is negative for hyperbolas in our convention; data uses positive |a|.
    const aSigned = -Math.abs(a);
    const sqrtE2_1 = Math.sqrt(Math.max(0, e * e - 1));
    const coshH = Math.cosh(H);
    const sinhH = Math.sinh(H);
    const xPF = aSigned * (e - coshH);
    const yPF = aSigned * sqrtE2_1 * sinhH;
    // Combine with basis vectors.
    const px = exX * xPF + eyX * yPF;
    const py = exY * xPF + eyY * yPF;
    const pz = exZ * xPF + eyZ * yPF;
    // r = sqrt(px^2+py^2+pz^2)
    const r = Math.sqrt(px * px + py * py + pz * pz);
    return { r, cosNu: px / r, sinNu: py / r };
  }

  // Elliptic: solve Kepler.
  const E = solveKeplerElliptic(M, e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  // Position in perifocal frame: r * (cos(nu), sin(nu))
  // = a*(cos(E) - e, sqrt(1-e^2)*sin(E))
  const xPF = a * (cosE - e);
  const yPF = a * Math.sqrt(Math.max(0, 1 - e * e)) * sinE;
  const r = Math.sqrt(xPF * xPF + yPF * yPF);
  // Combine with basis vectors.
  const px = exX * xPF + eyX * yPF;
  const py = exY * xPF + eyY * yPF;
  const pz = exZ * xPF + eyZ * yPF;
  // For shader use, we return cos(nu), sin(nu) — but here we also want the
  // position itself for CPU use.
  const cosNu = px / r;
  const sinNu = py / r;
  return { r, cosNu, sinNu };
}

/** Sample an orbit polyline at fixed true-anomaly intervals. Returns positions
 * in heliocentric ecliptic J2000 in au. Used for drawing orbit lines. */
export function sampleOrbit(
  ex: [number, number, number],
  ey: [number, number, number],
  a: number,
  e: number,
  segments = 128,
  hyperbolic = false,
): Float32Array {
  const out = new Float32Array(segments * 3);
  if (!hyperbolic && e < 1) {
    // Sample in eccentric anomaly.
    for (let i = 0; i < segments; i++) {
      const E = (i / segments) * TWO_PI;
      const cosE = Math.cos(E);
      const sinE = Math.sin(E);
      const xPF = a * (cosE - e);
      const yPF = a * Math.sqrt(Math.max(0, 1 - e * e)) * sinE;
      out[i * 3 + 0] = ex[0] * xPF + ey[0] * yPF;
      out[i * 3 + 1] = ex[1] * xPF + ey[1] * yPF;
      out[i * 3 + 2] = ex[2] * xPF + ey[2] * yPF;
    }
  } else {
    // Hyperbolic: sample over true anomaly in (-nu_max, +nu_max).
    const nuMax = Math.acos(-1 / e) - 0.05;
    for (let i = 0; i < segments; i++) {
      const nu = -nuMax + (2 * nuMax * i) / (segments - 1);
      const p = a * (e * e - 1); // semi-latus rectum (a is negative)
      const r = p / (1 + e * Math.cos(nu));
      const xPF = r * Math.cos(nu);
      const yPF = r * Math.sin(nu);
      out[i * 3 + 0] = ex[0] * xPF + ey[0] * yPF;
      out[i * 3 + 1] = ex[1] * xPF + ey[1] * yPF;
      out[i * 3 + 2] = ex[2] * xPF + ey[2] * yPF;
    }
  }
  return out;
}

/** Convert Julian date to calendar Date (UTC). */
export function jdToDate(jd: number): Date {
  // Standard conversion (Meeus).
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  const wholeDay = Math.floor(day);
  const frac = day - wholeDay;
  const hours = Math.floor(frac * 24);
  const mins = Math.floor((frac * 24 - hours) * 60);
  const secs = Math.round((((frac * 24 - hours) * 60 - mins) * 60) * 1000) / 1000;
  return new Date(Date.UTC(year, month - 1, wholeDay, hours, mins, secs));
}

/** Convert calendar Date to Julian date. */
export function dateToJd(d: Date): number {
  const Y = d.getUTCFullYear();
  const M = d.getUTCMonth() + 1;
  const D =
    d.getUTCDate() +
    (d.getUTCHours() + (d.getUTCMinutes() + d.getUTCSeconds() / 60) / 60) / 24;
  let yy = Y,
    mm = M;
  if (mm <= 2) {
    yy -= 1;
    mm += 12;
  }
  const A = Math.floor(yy / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (yy + 4716)) +
    Math.floor(30.6001 * (mm + 1)) +
    D +
    B -
    1524.5
  );
}

/** Format JD as ISO-style date string "YYYY-MM-DD HH:MM". */
export function formatJd(jd: number): string {
  const d = jdToDate(jd);
  const Y = d.getUTCFullYear().toString().padStart(4, "0");
  const M = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const D = d.getUTCDate().toString().padStart(2, "0");
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${Y}-${M}-${D} ${h}:${m}`;
}

/** Parse a user date string like "2024-12-25" or "2024-12-25 12:30" to JD. */
export function parseDateInput(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const m = trimmed.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2}))?$/,
  );
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  const hh = parseInt(m[4] ?? "0", 10);
  const mm = parseInt(m[5] ?? "0", 10);
  return dateToJd(new Date(Date.UTC(y, mo - 1, d, hh, mm, 0)));
}
