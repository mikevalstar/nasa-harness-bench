// Orbit polyline for a single asteroid, sampled around its full orbit.

import * as THREE from 'three';
import type { PackedAsteroid } from './data';
import { TAU, DEG } from './orbit_const';

const ORBIT_FLOATS_PER_BODY = 14;
const SEGMENTS = 240;

export function buildOrbitPath(
  packed: PackedAsteroid,
  pdes: string,
): THREE.Line | null {
  const i = packed.indexByPdes.get(pdes);
  if (i == null) return null;
  const o = i * ORBIT_FLOATS_PER_BODY;
  const a = packed.orbit[o + 0];
  const e = packed.orbit[o + 1];
  const n = packed.orbit[o + 2];
  const epoch = packed.orbit[o + 4];
  const Px = packed.orbit[o + 5];
  const Py = packed.orbit[o + 6];
  const Pz = packed.orbit[o + 7];
  const Qx = packed.orbit[o + 8];
  const Qy = packed.orbit[o + 9];
  const Qz = packed.orbit[o + 10];
  // Period from n: T = 2π/n (days).
  const period = TAU / n;
  const pts = new Float32Array((SEGMENTS + 1) * 3);
  const sqrt1me2 = Math.sqrt(Math.max(0, 1 - e * e));
  for (let s = 0; s <= SEGMENTS; s++) {
    const t = epoch + (s / SEGMENTS) * period;
    // M = ma0 + n*(t-epoch) = (s/SEGMENTS)*TAU
    const M = (s / SEGMENTS) * TAU;
    // Solve Kepler for this M.
    let mm = M;
    if (mm > Math.PI) mm -= TAU;
    if (mm < -Math.PI) mm += TAU;
    let E = mm + e * Math.sin(mm);
    for (let k = 0; k < 6; k++) {
      const f = E - e * Math.sin(E) - mm;
      const fp = 1 - e * Math.cos(E);
      const dE = f / fp;
      E -= dE;
      if (Math.abs(dE) < 1e-9) break;
    }
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const x = a * (cosE - e);
    const y = a * sqrt1me2 * sinE;
    pts[s * 3 + 0] = x * Px + y * Qx;
    pts[s * 3 + 1] = x * Py + y * Qy;
    pts[s * 3 + 2] = x * Pz + y * Qz;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0x5fb4ff,
    transparent: true,
    opacity: 0.85,
  });
  return new THREE.Line(geom, mat);
}
