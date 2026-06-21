import * as THREE from 'three';
import { propagate, DEG2RAD, type Elements } from './kepler';
import type { Comet } from './data';

export interface CometLayer {
  points: THREE.Points;
  elements: Elements[];
  comets: Comet[];
  update(jd: number): void;
  setVisible(v: boolean): void;
  visible: boolean;
}

// Comets are CPU-propagated each frame because many are hyperbolic/parabolic
// (e >= 1) and need different propagation than the bulk asteroid GPU layer.
export function createCometLayer(comets: Comet[]): CometLayer {
  const N = comets.length;
  const elements: Elements[] = new Array(N);
  for (let k = 0; k < N; k++) {
    const c = comets[k];
    elements[k] = {
      a: c.a,
      e: c.e,
      i: c.i * DEG2RAD,
      om: c.om * DEG2RAD,
      w: c.w * DEG2RAD,
      ma: c.ma != null ? c.ma * DEG2RAD : undefined,
      n: c.n != null ? c.n * DEG2RAD : undefined,
      epoch: c.epoch,
      tp: c.tp,
      q: c.q,
    };
  }

  const positions = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e6);

  const material = new THREE.PointsMaterial({
    color: 0x86f0ff,
    size: 2.2,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.visible = false;

  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
  const tmp: [number, number, number] = [0, 0, 0];
  const layer: CometLayer = {
    points,
    elements,
    comets,
    visible: false,
    update(jd: number) {
      if (!layer.visible) return;
      const arr = posAttr.array as Float32Array;
      for (let k = 0; k < N; k++) {
        propagate(elements[k], jd, tmp);
        // Clamp absurd distances (open orbits far from perihelion) to keep the
        // scene bounded and avoid NaN points.
        let x = tmp[0], y = tmp[1], z = tmp[2];
        if (!isFinite(x) || !isFinite(y) || !isFinite(z) || x * x + y * y + z * z > 4e6) {
          x = y = z = 0; // park offscreen-ish at origin (hidden behind sun)
        }
        arr[k * 3] = x;
        arr[k * 3 + 1] = y;
        arr[k * 3 + 2] = z;
      }
      posAttr.needsUpdate = true;
    },
    setVisible(v: boolean) {
      layer.visible = v;
      points.visible = v;
    },
  };

  return layer;
}
