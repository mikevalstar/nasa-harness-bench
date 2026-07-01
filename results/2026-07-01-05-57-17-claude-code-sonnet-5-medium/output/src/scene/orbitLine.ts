import * as THREE from 'three';
import { AU_SCENE_UNITS } from '../constants';
import { eclipticToThree, sampleEllipticalOrbit, type Vec3 } from '../orbit';

export function buildEllipticalOrbitLine(
  a: number,
  e: number,
  i: number,
  om: number,
  w: number,
  color: number,
  opacity = 0.35
): THREE.Line {
  const pts = sampleEllipticalOrbit(a, e, i, om, w).map((p) => toScene(p));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.Line(geo, mat);
}

export function buildOrbitLineFromPoints(points: Vec3[], color: number, opacity = 0.6): THREE.Line {
  const pts = points.map((p) => toScene(p));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.Line(geo, mat);
}

function toScene(p: Vec3): THREE.Vector3 {
  const t = eclipticToThree(p);
  return new THREE.Vector3(t.x * AU_SCENE_UNITS, t.y * AU_SCENE_UNITS, t.z * AU_SCENE_UNITS);
}
