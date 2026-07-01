import * as THREE from 'three';
import type { AsteroidField } from './asteroidField';
import type { CometField } from './cometField';
import type { PlanetSystem } from './planets';

export interface PickResult {
  kind: 'planet' | 'asteroid' | 'comet';
  index: number;
}

const PICK_PIXEL_RADIUS = 10;

/**
 * Finds the body nearest the mouse in screen space at the given click. Point
 * positions are computed on the GPU, so we recompute candidate positions on
 * the CPU here (cheap relative to a UI click) rather than reading back GPU
 * buffers.
 */
export function pickBody(
  ndcX: number,
  ndcY: number,
  camera: THREE.PerspectiveCamera,
  viewportWidth: number,
  viewportHeight: number,
  jd: number,
  planets: PlanetSystem,
  asteroids: AsteroidField,
  comets: CometField | null,
  asteroidVisible: Float32Array,
  cometVisible: Float32Array | null
): PickResult | null {
  const projected = new THREE.Vector3();
  let best: PickResult | null = null;
  let bestDist = PICK_PIXEL_RADIUS;

  const toPixels = (world: THREE.Vector3): { x: number; y: number; behind: boolean } => {
    projected.copy(world).project(camera);
    return {
      x: ((projected.x + 1) / 2) * viewportWidth,
      y: ((1 - projected.y) / 2) * viewportHeight,
      behind: projected.z > 1,
    };
  };
  const mousePx = { x: ((ndcX + 1) / 2) * viewportWidth, y: ((1 - ndcY) / 2) * viewportHeight };

  for (const body of planets.bodies) {
    const p = toPixels(body.mesh.position);
    if (p.behind) continue;
    const d = Math.hypot(p.x - mousePx.x, p.y - mousePx.y);
    if (d < bestDist) {
      bestDist = d;
      best = { kind: 'planet', index: planets.bodies.indexOf(body) };
    }
  }

  const n = asteroidVisible.length;
  for (let idx = 0; idx < n; idx++) {
    if (asteroidVisible[idx] < 0.5) continue;
    const world = asteroids.positionScene(idx, jd);
    const p = toPixels(world);
    if (p.behind) continue;
    const d = Math.hypot(p.x - mousePx.x, p.y - mousePx.y);
    if (d < bestDist) {
      bestDist = d;
      best = { kind: 'asteroid', index: idx };
    }
  }

  if (comets && cometVisible) {
    for (let idx = 0; idx < cometVisible.length; idx++) {
      if (cometVisible[idx] < 0.5) continue;
      const world = comets.positionScene(idx, jd);
      const p = toPixels(world);
      if (p.behind) continue;
      const d = Math.hypot(p.x - mousePx.x, p.y - mousePx.y);
      if (d < bestDist) {
        bestDist = d;
        best = { kind: 'comet', index: idx };
      }
    }
  }

  return best;
}
