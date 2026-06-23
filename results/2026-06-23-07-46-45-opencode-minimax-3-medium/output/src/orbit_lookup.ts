// Precomputed orbit path: for each asteroid, sample positions at 128 evenly
// spaced mean anomalies M = 0, 2π/128, 4π/128, ... and store the (x,y,z) in
// AU. At runtime we compute the current M for each body and interpolate
// between the two adjacent samples.
//
// This trades a one-time ~80MB Float32Array for eliminating the per-frame
// Kepler solve, which is the main FPS bottleneck with ~42k asteroids.

import type { PackedAsteroid } from './data';

const TAU = Math.PI * 2;
export const ORBIT_SAMPLES = 96; // per asteroid

export interface PrecomputedOrbits {
  // 3 × ORBIT_SAMPLES × N positions, in AU. Indexed as [body * 3 * ORBIT_SAMPLES + sample * 3 + axis]
  positions: Float32Array;
  // Mean motion in rad/day per body, used to compute current M.
  n: Float32Array;
  // ma0 (rad) per body.
  ma0: Float32Array;
  // epoch (JD) per body.
  epoch: Float32Array;
  // precomputed sqrt(1-e^2) per body.
  sqrt1me2: Float32Array;
  // a (au) per body.
  a: Float32Array;
  // P/Q rotation per body (6 floats).
  PQ: Float32Array;
  count: number;
}

export function precomputeOrbits(packed: PackedAsteroid): PrecomputedOrbits {
  const N = packed.count;
  const ORBIT_FLOATS = 14;
  const positions = new Float32Array(N * ORBIT_SAMPLES * 3);
  const n = new Float32Array(N);
  const ma0 = new Float32Array(N);
  const epoch = new Float32Array(N);
  const sqrt1me2 = new Float32Array(N);
  const a = new Float32Array(N);
  const PQ = new Float32Array(N * 6);

  for (let i = 0; i < N; i++) {
    const o = i * ORBIT_FLOATS;
    const ai = packed.orbit[o + 0];
    const e = packed.orbit[o + 1];
    const ni = packed.orbit[o + 2];
    const ma0i = packed.orbit[o + 3];
    const epochi = packed.orbit[o + 4];
    const Px = packed.orbit[o + 5];
    const Py = packed.orbit[o + 6];
    const Pz = packed.orbit[o + 7];
    const Qx = packed.orbit[o + 8];
    const Qy = packed.orbit[o + 9];
    const Qz = packed.orbit[o + 10];

    a[i] = ai;
    n[i] = ni;
    ma0[i] = ma0i;
    epoch[i] = epochi;
    const s1me2 = Math.sqrt(Math.max(0, 1 - e * e));
    sqrt1me2[i] = s1me2;
    PQ[i * 6 + 0] = Px;
    PQ[i * 6 + 1] = Py;
    PQ[i * 6 + 2] = Pz;
    PQ[i * 6 + 3] = Qx;
    PQ[i * 6 + 4] = Qy;
    PQ[i * 6 + 5] = Qz;

    for (let s = 0; s < ORBIT_SAMPLES; s++) {
      // M = s * 2π / ORBIT_SAMPLES
      const M = (s / ORBIT_SAMPLES) * TAU;
      // Solve Kepler for this M.
      let mm = M;
      if (mm > Math.PI) mm -= TAU;
      if (mm < -Math.PI) mm += TAU;
      let E = mm + e * Math.sin(mm);
      for (let k = 0; k < 3; k++) {
        const sinE = Math.sin(E);
        const cosE = Math.cos(E);
        const dE = (E - e * sinE - mm) / (1 - e * cosE);
        E -= dE;
      }
      const cosE = Math.cos(E);
      const sinE = Math.sin(E);
      const x = ai * (cosE - e);
      const y = ai * s1me2 * sinE;
      const idx = (i * ORBIT_SAMPLES + s) * 3;
      positions[idx + 0] = x * Px + y * Qx;
      positions[idx + 1] = x * Py + y * Qy;
      positions[idx + 2] = x * Pz + y * Qz;
    }
  }

  return { positions, n, ma0, epoch, sqrt1me2, a, PQ, count: N };
}

// Look up a body's current position by interpolating the precomputed path.
// Writes to out[0..2]. The interpolation is linear in mean anomaly M.
export function lookupOrbit(
  pre: PrecomputedOrbits,
  i: number,
  t: number,
  out: Float32Array | number[],
): void {
  const n = pre.n[i];
  const ma0 = pre.ma0[i];
  const epoch = pre.epoch[i];
  let M = ma0 + n * (t - epoch);
  // Wrap to [0, 2π).
  M = M - TAU * Math.floor(M / TAU);
  const fIdx = (M / TAU) * ORBIT_SAMPLES;
  const i0 = Math.floor(fIdx) % ORBIT_SAMPLES;
  const i1 = (i0 + 1) % ORBIT_SAMPLES;
  const frac = fIdx - Math.floor(fIdx);
  const base0 = (i * ORBIT_SAMPLES + i0) * 3;
  const base1 = (i * ORBIT_SAMPLES + i1) * 3;
  const x0 = pre.positions[base0 + 0];
  const y0 = pre.positions[base0 + 1];
  const z0 = pre.positions[base0 + 2];
  const x1 = pre.positions[base1 + 0];
  const y1 = pre.positions[base1 + 1];
  const z1 = pre.positions[base1 + 2];
  out[0] = x0 + (x1 - x0) * frac;
  out[1] = y0 + (y1 - y0) * frac;
  out[2] = z0 + (z1 - z0) * frac;
}
