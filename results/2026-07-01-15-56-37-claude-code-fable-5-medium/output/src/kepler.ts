// Orbit propagation: heliocentric J2000 ecliptic frame, AU / days / radians.
export const J2000 = 2451545.0;
export const DEG = Math.PI / 180;
export const GAUSS_K = 0.01720209894846; // rad/day at 1 au (sqrt(GM_sun))
export const TWO_PI = Math.PI * 2;

// Solve E - e sin E = M (elliptic). Returns eccentric anomaly.
export function solveKepler(M: number, e: number, E0?: number): number {
  // normalize M to [-pi, pi]
  M = M % TWO_PI;
  if (M > Math.PI) M -= TWO_PI;
  else if (M < -Math.PI) M += TWO_PI;
  let E = E0 !== undefined && isFinite(E0) ? E0 : e < 0.8 ? M : Math.PI * Math.sign(M || 1);
  for (let k = 0; k < 20; k++) {
    const f = E - e * Math.sin(E) - M;
    const dE = f / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

// Solve e sinh H - H = M (hyperbolic).
export function solveKeplerH(M: number, e: number): number {
  let H = Math.asinh(M / e);
  for (let k = 0; k < 40; k++) {
    const f = e * Math.sinh(H) - H - M;
    const dH = f / (e * Math.cosh(H) - 1);
    H -= dH;
    if (Math.abs(dH) < 1e-10) break;
  }
  return H;
}

// P,Q basis vectors (orbital plane x/y axes in ecliptic frame) from angles in degrees.
export function pqBasis(iDeg: number, omDeg: number, wDeg: number): Float64Array {
  const w = wDeg * DEG, om = omDeg * DEG, inc = iDeg * DEG;
  const cw = Math.cos(w), sw = Math.sin(w);
  const co = Math.cos(om), so = Math.sin(om);
  const ci = Math.cos(inc), si = Math.sin(inc);
  return new Float64Array([
    cw * co - sw * so * ci, cw * so + sw * co * ci, sw * si,
    -sw * co - cw * so * ci, -sw * so + cw * co * ci, cw * si,
  ]);
}

export interface CometElements {
  e: number; a: number | null; q: number;
  ma: number | null; tp: number; per: number | null; n: number | null; epoch: number;
}

// In-plane coordinates (xp, yp) at time t (JD) for any conic. Writes into out[0..1].
// Returns heliocentric distance r (au), or -1 if position is undefined/too far.
export function conicPlanePos(el: CometElements, t: number, out: number[]): number {
  const e = el.e;
  if (e < 0.9999) {
    // elliptic — propagate from ma@epoch when present, else from perihelion time
    const a = el.a ?? el.q / (1 - e);
    const n = el.n != null ? el.n * DEG : GAUSS_K / Math.pow(a, 1.5);
    const M = el.ma != null ? el.ma * DEG + n * (t - el.epoch) : n * (t - el.tp);
    const E = solveKepler(M, e);
    out[0] = a * (Math.cos(E) - e);
    out[1] = a * Math.sqrt(1 - e * e) * Math.sin(E);
    return a * (1 - e * Math.cos(E));
  } else if (e > 1.0001) {
    // hyperbolic — propagate from tp
    const a = el.a ?? el.q / (1 - e); // negative
    const n = GAUSS_K / Math.pow(-a, 1.5);
    const M = n * (t - el.tp);
    if (Math.abs(M) > 2000) return -1; // far beyond the region of interest
    const H = solveKeplerH(M, e);
    out[0] = a * (Math.cosh(H) - e);
    out[1] = -a * Math.sqrt(e * e - 1) * Math.sinh(H);
    return a * (1 - e * Math.cosh(H));
  } else {
    // (near-)parabolic — Barker's equation
    const q = el.q;
    const Mp = (GAUSS_K / Math.sqrt(2 * q * q * q)) * (t - el.tp);
    const A = 1.5 * Mp;
    const B = Math.cbrt(A + Math.sqrt(A * A + 1));
    const D = B - 1 / B; // tan(nu/2)
    out[0] = q * (1 - D * D);
    out[1] = 2 * q * D;
    return q * (1 + D * D);
  }
}

// Julian date <-> JS Date (UTC; TDB offset of ~69s is negligible at this scale)
export function dateToJd(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}
export function jdToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtJd(jd: number, withTime = true): string {
  const d = jdToDate(jd);
  if (isNaN(d.getTime())) return '—';
  const s = `${d.getUTCFullYear()} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')}`;
  if (!withTime) return s;
  return `${s} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
}
