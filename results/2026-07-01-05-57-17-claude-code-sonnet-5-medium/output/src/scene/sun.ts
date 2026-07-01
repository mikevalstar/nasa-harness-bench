import * as THREE from 'three';
import { KM_TO_SCENE, SUN_RADIUS_EXAGGERATION, SUN_RADIUS_KM } from '../constants';

export function createSun(): THREE.Object3D {
  const group = new THREE.Group();
  const radius = SUN_RADIUS_KM * KM_TO_SCENE * SUN_RADIUS_EXAGGERATION;

  const geo = new THREE.SphereGeometry(radius, 48, 32);
  const mat = new THREE.MeshBasicMaterial({ color: 0xfff2d0 });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const glow = new THREE.PointLight(0xfff2d0, 3, 0, 0);
  group.add(glow);

  const ambient = new THREE.AmbientLight(0x223344, 1.2);
  group.add(ambient);

  return group;
}
