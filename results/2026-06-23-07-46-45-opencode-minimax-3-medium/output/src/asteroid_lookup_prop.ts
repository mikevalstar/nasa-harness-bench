// Batched asteroid propagator using a precomputed orbit table.
// Trade: ~48MB of orbit samples for O(1) per-body cost (no Kepler solve).

import type { PackedAsteroid } from './data';
import type { PrecomputedOrbits } from './orbit_lookup';
import { precomputeOrbits, ORBIT_SAMPLES } from './orbit_lookup';

const TAU = Math.PI * 2;

export function buildPrecomputedOrbits(packed: PackedAsteroid): PrecomputedOrbits {
  return precomputeOrbits(packed);
}

// Per-frame: for each body, look up the current position.
export function propagateAsteroidsDirect(
  pre: PrecomputedOrbits,
  t: number,
  out: Float32Array,
): void {
  const N = pre.count;
  const positions = pre.positions;
  const nArr = pre.n;
  const ma0Arr = pre.ma0;
  const epochArr = pre.epoch;
  const SAMPLES = ORBIT_SAMPLES;
  const invTauSamples = SAMPLES / TAU;
  for (let i = 0; i < N; i++) {
    let M = ma0Arr[i] + nArr[i] * (t - epochArr[i]);
    M = M - TAU * Math.floor(M / TAU);
    const fIdx = M * invTauSamples;
    const i0 = Math.floor(fIdx) % SAMPLES;
    const i1 = (i0 + 1) % SAMPLES;
    const frac = fIdx - Math.floor(fIdx);
    const base0 = (i * SAMPLES + i0) * 3;
    const base1 = (i * SAMPLES + i1) * 3;
    const x0 = positions[base0];
    const y0 = positions[base0 + 1];
    const z0 = positions[base0 + 2];
    const x1 = positions[base1];
    const y1 = positions[base1 + 1];
    const z1 = positions[base1 + 2];
    const oi = i * 3;
    out[oi] = x0 + (x1 - x0) * frac;
    out[oi + 1] = y0 + (y1 - y0) * frac;
    out[oi + 2] = z0 + (z1 - z0) * frac;
  }
}
