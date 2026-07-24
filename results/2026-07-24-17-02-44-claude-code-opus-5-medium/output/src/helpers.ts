import type { Vec3 } from './astro';

export { AU_KM } from './astro';

/** Scratch vector reused by the per-frame planet propagation (no allocation). */
export const planetPositionsHelper: Vec3 = { x: 0, y: 0, z: 0 };

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Map a slider position 0..1 onto a logarithmic range. */
export function logScale(t: number, lo: number, hi: number): number {
  return lo * Math.pow(hi / lo, t);
}

export function invLogScale(v: number, lo: number, hi: number): number {
  return Math.log(v / lo) / Math.log(hi / lo);
}
