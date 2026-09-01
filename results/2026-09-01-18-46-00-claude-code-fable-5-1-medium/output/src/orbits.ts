/**
 * Two-body orbital mechanics on the CPU. All positions are heliocentric,
 * J2000 ecliptic, in au. Time is a Julian date. The GPU path for the
 * asteroid cloud (shaders.ts) implements the same elliptic solver.
 */
import type { Vec3 } from './types';

export const J2000 = 2451545.0;
export const DEG = Math.PI / 180;
/** Gaussian gravitational constant (rad/day for a = 1 au). */
export const K = 0.01720209895;
export const AU_KM = 149597870.7;
export const LD_AU = 0.002569; // one lunar distance in au
export const TWO_PI = Math.PI * 2;

export interface Perifocal {
  P: Vec3;
  Q: Vec3;
}

/** Perifocal basis vectors from angles in degrees. */
export function perifocal(iDeg: number, omDeg: number, wDeg: number): Perifocal {
  const i = iDeg * DEG, om = omDeg * DEG, w = wDeg * DEG;
  const ci = Math.cos(i), si = Math.sin(i);
  const co = Math.cos(om), so = Math.sin(om);
  const cw = Math.cos(w), sw = Math.sin(w);
  return {
    P: [co * cw - so * sw * ci, so * cw + co * sw * ci, sw * si],
    Q: [-co * sw - so * cw * ci, -so * sw + co * cw * ci, cw * si],
  };
}

/** Solve Kepler's equation M = E - e sin E. */
export function eccentricAnomaly(M: number, e: number): number {
  M = ((M % TWO_PI) + TWO_PI) % TWO_PI;
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 30; k++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

/** Solve the hyperbolic Kepler equation M = e sinh H - H. */
export function hyperbolicAnomaly(M: number, e: number): number {
  let H = Math.asinh(M / e);
  for (let k = 0; k < 40; k++) {
    const d = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1);
    H -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return H;
}

/** Elliptic orbit: in-plane (x, y) from mean anomaly. */
function ellipticXY(a: number, e: number, M: number): [number, number] {
  const E = eccentricAnomaly(M, e);
  return [a * (Math.cos(E) - e), a * Math.sqrt(1 - e * e) * Math.sin(E)];
}

/** Hyperbolic orbit: in-plane (x, y) from mean anomaly (a is negative). */
function hyperbolicXY(a: number, e: number, M: number): [number, number] {
  const H = hyperbolicAnomaly(M, e);
  return [a * (e - Math.cosh(H)), -a * Math.sqrt(e * e - 1) * Math.sinh(H)];
}

/** Parabolic orbit (Barker's equation): in-plane (x, y) from days since perihelion. */
function parabolicXY(q: number, dt: number): [number, number] {
  const A = (3 / 2) * K * dt / Math.sqrt(2 * q * q * q);
  const B = Math.cbrt(A + Math.sqrt(A * A + 1));
  const tanHalf = B - 1 / B;
  const r = q * (1 + tanHalf * tanHalf);
  const nu = 2 * Math.atan(tanHalf);
  return [r * Math.cos(nu), r * Math.sin(nu)];
}

export function fromPlane(x: number, y: number, pf: Perifocal, out: Float32Array | number[], o = 0): void {
  out[o] = x * pf.P[0] + y * pf.Q[0];
  out[o + 1] = x * pf.P[1] + y * pf.Q[1];
  out[o + 2] = x * pf.P[2] + y * pf.Q[2];
}

/** A closed orbit propagated from mean anomaly at epoch. */
export interface EllipticOrbit {
  a: number;
  e: number;
  ma: number; // rad
  n: number; // rad/day
  epoch: number; // JD
  pf: Perifocal;
}

export function ellipticPosition(orb: EllipticOrbit, jd: number, out: Float32Array | number[], o = 0): void {
  const [x, y] = ellipticXY(orb.a, orb.e, orb.ma + orb.n * (jd - orb.epoch));
  fromPlane(x, y, orb.pf, out, o);
}

/** Any conic propagated from time of perihelion passage (used for comets). */
export interface ConicOrbit {
  e: number;
  q: number;
  tp: number; // JD
  pf: Perifocal;
}

const PARABOLIC_BAND = 1e-4;

export function conicPosition(orb: ConicOrbit, jd: number, out: Float32Array | number[], o = 0): void {
  const dt = jd - orb.tp;
  const { e, q } = orb;
  let x: number, y: number;
  if (Math.abs(e - 1) < PARABOLIC_BAND) {
    [x, y] = parabolicXY(q, dt);
  } else if (e < 1) {
    const a = q / (1 - e);
    [x, y] = ellipticXY(a, e, K / Math.sqrt(a * a * a) * dt);
  } else {
    const a = q / (1 - e); // negative
    [x, y] = hyperbolicXY(a, e, K / Math.sqrt(-a * a * a) * dt);
  }
  fromPlane(x, y, orb.pf, out, o);
}

/** Heliocentric distance of a conic at time jd (au). */
export function conicRadius(orb: ConicOrbit, jd: number): number {
  const p = [0, 0, 0];
  conicPosition(orb, jd, p);
  return Math.hypot(p[0]!, p[1]!, p[2]!);
}

/** Sample points along a closed orbit (E from 0..2π). Returns flat xyz array. */
export function sampleEllipse(a: number, e: number, pf: Perifocal, segments: number): Float32Array {
  const out = new Float32Array((segments + 1) * 3);
  const b = a * Math.sqrt(1 - e * e);
  for (let k = 0; k <= segments; k++) {
    const E = (k / segments) * TWO_PI;
    fromPlane(a * (Math.cos(E) - e), b * Math.sin(E), pf, out, k * 3);
  }
  return out;
}

/**
 * Sample any conic by true anomaly, clipped at rMax au so open orbits stay
 * finite. Closed orbits get a full loop.
 */
export function sampleConic(e: number, q: number, pf: Perifocal, segments: number, rMax: number): Float32Array {
  const p = q * (1 + e);
  let nuMax = Math.PI;
  if (e >= 1 || q * (1 + e) / (1 - e) > rMax) {
    // r = p / (1 + e cos nu) = rMax  =>  cos nu = (p / rMax - 1) / e
    nuMax = Math.acos(Math.max(-1, Math.min(1, (p / rMax - 1) / e)));
  }
  const out = new Float32Array((segments + 1) * 3);
  for (let k = 0; k <= segments; k++) {
    const nu = -nuMax + (2 * nuMax * k) / segments;
    const r = p / (1 + e * Math.cos(nu));
    fromPlane(r * Math.cos(nu), r * Math.sin(nu), pf, out, k * 3);
  }
  return out;
}

// ------------------------------------------------------------------ time

export function jdToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

export function dateToJd(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

export function nowJd(): number {
  return dateToJd(new Date());
}

export function formatJd(jd: number, withTime = true): string {
  const d = jdToDate(jd);
  if (Number.isNaN(d.getTime())) return '—';
  const iso = d.toISOString();
  return withTime ? iso.slice(0, 16).replace('T', ' ') + ' UTC' : iso.slice(0, 10);
}

/** Rough diameter in km from absolute magnitude, assuming albedo 0.14. */
export function diameterFromH(H: number, albedo = 0.14): number {
  return (1329 / Math.sqrt(albedo)) * Math.pow(10, -H / 5);
}
