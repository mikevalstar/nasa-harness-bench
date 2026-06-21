import * as THREE from 'three';
import { J2000, type Elements } from './kepler';

// Build Keplerian Elements for asteroid index i from the packed orbit buffer.
export function asteroidElements(orbits: Float32Array, i: number): Elements {
  const b = i * 8;
  return {
    a: orbits[b + 0],
    e: orbits[b + 1],
    i: orbits[b + 2],
    om: orbits[b + 3],
    w: orbits[b + 4],
    ma: orbits[b + 5],
    n: orbits[b + 6],
    epoch: orbits[b + 7] + J2000,
  };
}

const PI = Math.PI;
const TWO_PI = 2 * Math.PI;

// Inline elliptical propagation straight from the packed buffer (no allocation),
// used by the picker which evaluates all 42k positions on click.
function propagateInto(orbits: Float32Array, i: number, daysSinceJ2000: number, out: THREE.Vector3) {
  const b = i * 8;
  const a = orbits[b], e = orbits[b + 1], inc = orbits[b + 2], om = orbits[b + 3];
  const w = orbits[b + 4], ma = orbits[b + 5], n = orbits[b + 6], epochOff = orbits[b + 7];

  let M = ma + n * (daysSinceJ2000 - epochOff);
  M = ((M + PI) % TWO_PI + TWO_PI) % TWO_PI - PI;
  let E = M;
  for (let it = 0; it < 8; it++) {
    E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  const xo = a * (Math.cos(E) - e);
  const yo = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w);
  const co = Math.cos(om), so = Math.sin(om);
  const ci = Math.cos(inc), si = Math.sin(inc);
  const x1 = cw * xo - sw * yo;
  const y1 = sw * xo + cw * yo;
  const y2 = ci * y1;
  const z2 = si * y1;
  out.set(co * x1 - so * y2, so * x1 + co * y2, z2);
}

// Find the asteroid whose projected screen position is nearest to ndc, among
// visible objects within a pixel threshold. Returns index or -1.
export function pickAsteroid(
  orbits: Float32Array,
  count: number,
  visible: Uint8Array,
  daysSinceJ2000: number,
  camera: THREE.Camera,
  ndc: THREE.Vector2,
  thresholdPx: number,
  viewport: { w: number; h: number }
): number {
  const p = new THREE.Vector3();
  let best = -1;
  let bestScore = Infinity;
  const thrNdcX = (thresholdPx * 2) / viewport.w;
  const thrNdcY = (thresholdPx * 2) / viewport.h;
  for (let i = 0; i < count; i++) {
    if (!visible[i]) continue;
    propagateInto(orbits, i, daysSinceJ2000, p);
    p.project(camera);
    if (p.z < -1 || p.z > 1) continue;
    const dx = (p.x - ndc.x) / thrNdcX;
    const dy = (p.y - ndc.y) / thrNdcY;
    const d2 = dx * dx + dy * dy;
    if (d2 > 1) continue;
    // Prefer nearer objects (smaller depth) when within threshold.
    const score = d2 + p.z * 0.05;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}
