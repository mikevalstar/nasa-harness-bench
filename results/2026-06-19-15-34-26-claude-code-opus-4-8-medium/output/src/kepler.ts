// CPU-side Kepler propagation. Used for the eight planets (cheap, 8 bodies)
// and for click picking of asteroids/comets (a one-off pass over all bodies at
// the current instant). The GPU vertex shader implements the same math for the
// per-frame rendering of the full population.

import * as THREE from "three";

export const K = 0.01720209895; // Gaussian gravitational constant (rad/day, au)
export const REF_EPOCH = 2451545.0; // J2000
const DEG = Math.PI / 180;

/** Solve elliptic Kepler's equation E - e sinE = M for E (radians). */
function solveElliptic(M: number, e: number): number {
  M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  let E = e < 0.8 ? M : Math.PI;
  for (let it = 0; it < 30; it++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const d = f / fp;
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return E;
}

/** Solve hyperbolic Kepler's equation e sinhH - H = M for H. */
function solveHyperbolic(M: number, e: number): number {
  let H = Math.asinh(M / e) || (M >= 0 ? 1 : -1);
  for (let it = 0; it < 60; it++) {
    const f = e * Math.sinh(H) - H - M;
    const fp = e * Math.cosh(H) - 1;
    const d = f / fp;
    H -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return H;
}

export interface OrbitParams {
  a: number; // semi-major axis (negative for hyperbolic); 0 for parabolic
  e: number;
  i: number; // radians
  om: number; // radians
  w: number; // radians
  n: number; // mean motion (rad/day); 0 for parabolic
  q: number; // perihelion distance (au)
  tp: number; // time of perihelion passage (JD)
}

/**
 * Heliocentric ecliptic position (au) at Julian date `jd`.
 * Writes into `out` and returns it.
 */
export function propagate(
  p: OrbitParams,
  jd: number,
  out: THREE.Vector3
): THREE.Vector3 {
  const e = p.e;
  let xp: number, yp: number; // position in orbital plane (perifocal)

  if (e < 1) {
    const M = p.n * (jd - p.tp);
    const E = solveElliptic(M, e);
    const a = p.a;
    xp = a * (Math.cos(E) - e);
    yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  } else if (e > 1) {
    const M = p.n * (jd - p.tp);
    const H = solveHyperbolic(M, e);
    const a = p.a; // negative
    xp = a * (e - Math.cosh(H));
    yp = -a * Math.sqrt(e * e - 1) * Math.sinh(H);
  } else {
    // Parabolic — Barker's equation.
    const W = (3 * K * (jd - p.tp)) / Math.sqrt(2 * p.q * p.q * p.q);
    const half = W / 2;
    const tmp = Math.cbrt(half + Math.sqrt(half * half + 1));
    const D = tmp - 1 / tmp; // tan(nu/2)
    xp = p.q * (1 - D * D);
    yp = p.q * 2 * D;
  }

  // Rotate perifocal -> ecliptic: Rz(om) Rx(i) Rz(w)
  const cw = Math.cos(p.w),
    sw = Math.sin(p.w);
  const co = Math.cos(p.om),
    so = Math.sin(p.om);
  const ci = Math.cos(p.i),
    si = Math.sin(p.i);

  // apply Rz(w)
  const x1 = xp * cw - yp * sw;
  const y1 = xp * sw + yp * cw;
  // apply Rx(i)
  const x2 = x1;
  const y2 = y1 * ci;
  const z2 = y1 * si;
  // apply Rz(om)
  const x = x2 * co - y2 * so;
  const y = x2 * so + y2 * co;
  const z = z2;

  // Map ecliptic (x,y,z) -> three.js (x, z, -y) so the ecliptic plane is the
  // XZ ground plane and +Y is ecliptic north.
  out.set(x, z, -y);
  return out;
}

/** Build OrbitParams for a planet from its dataset row. */
export function planetParams(pl: {
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  n: number;
  epoch: number;
}): OrbitParams {
  const e = pl.e;
  const nRad = (pl.n * Math.PI) / 180; // deg/day -> rad/day
  // derive tp from mean anomaly at epoch: M = n*(epoch - tp)
  const M0 = pl.ma * DEG;
  const tp = pl.epoch - M0 / nRad;
  return {
    a: pl.a,
    e,
    i: pl.i * DEG,
    om: pl.om * DEG,
    w: pl.w * DEG,
    n: nRad,
    q: pl.a * (1 - e),
    tp,
  };
}

/** Sample an orbit into a closed/open polyline of ecliptic positions (au). */
export function sampleOrbit(p: OrbitParams, segments = 256): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  if (p.e < 1) {
    // sweep eccentric anomaly for an even, exact ellipse
    const a = p.a;
    const b = a * Math.sqrt(1 - p.e * p.e);
    const cw = Math.cos(p.w),
      sw = Math.sin(p.w);
    const co = Math.cos(p.om),
      so = Math.sin(p.om);
    const ci = Math.cos(p.i),
      si = Math.sin(p.i);
    for (let s = 0; s <= segments; s++) {
      const E = (s / segments) * 2 * Math.PI;
      const xp = a * (Math.cos(E) - p.e);
      const yp = b * Math.sin(E);
      const x1 = xp * cw - yp * sw;
      const y1 = xp * sw + yp * cw;
      const y2 = y1 * ci;
      const z2 = y1 * si;
      const x = x1 * co - y2 * so;
      const y = x1 * so + y2 * co;
      pts.push(new THREE.Vector3(x, z2, -y));
    }
  } else {
    // open orbit: sample around perihelion in true anomaly
    const lim = Math.acos(-1 / p.e) * 0.98; // asymptote for hyperbola
    const out = new THREE.Vector3();
    for (let s = 0; s <= segments; s++) {
      const nu = -lim + (s / segments) * 2 * lim;
      const r =
        p.e === 1
          ? (2 * p.q) / (1 + Math.cos(nu))
          : (p.a * (1 - p.e * p.e)) / (1 + p.e * Math.cos(nu));
      const xp = r * Math.cos(nu);
      const yp = r * Math.sin(nu);
      const cw = Math.cos(p.w),
        sw = Math.sin(p.w);
      const co = Math.cos(p.om),
        so = Math.sin(p.om);
      const ci = Math.cos(p.i),
        si = Math.sin(p.i);
      const x1 = xp * cw - yp * sw;
      const y1 = xp * sw + yp * cw;
      const y2 = y1 * ci;
      const z2 = y1 * si;
      const x = x1 * co - y2 * so;
      const y = x1 * so + y2 * co;
      out.set(x, z2, -y);
      pts.push(out.clone());
    }
  }
  return pts;
}

/** Julian date for a JS Date (UTC). */
export function dateToJD(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

/** JS Date (UTC) for a Julian date. */
export function jdToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}
