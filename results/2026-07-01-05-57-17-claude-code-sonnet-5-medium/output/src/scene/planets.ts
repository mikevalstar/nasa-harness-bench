import * as THREE from 'three';
import { AU_SCENE_UNITS, KM_TO_SCENE, PLANET_RADIUS_EXAGGERATION } from '../constants';
import type { PlanetElements } from '../data/types';
import { eclipticToThree, positionFromMeanElements } from '../orbit';
import { buildEllipticalOrbitLine } from './orbitLine';

const DEG2RAD = Math.PI / 180;

const PLANET_COLORS: Record<string, number> = {
  Mercury: 0x9c9c9c,
  Venus: 0xe0c27a,
  Earth: 0x4d8fdb,
  Mars: 0xc1613c,
  Jupiter: 0xd8b98a,
  Saturn: 0xe4d2a1,
  Uranus: 0x9fd6e0,
  Neptune: 0x5b7fe0,
};

export interface PlanetBody {
  name: string;
  elements: PlanetElements;
  mesh: THREE.Mesh;
  labelAnchor: THREE.Object3D;
}

export interface PlanetSystem {
  group: THREE.Object3D;
  bodies: PlanetBody[];
  update: (jd: number) => void;
}

export function createPlanetSystem(planets: PlanetElements[]): PlanetSystem {
  const group = new THREE.Group();
  const bodies: PlanetBody[] = [];

  for (const p of planets) {
    const orbitLine = buildEllipticalOrbitLine(
      p.a,
      p.e,
      p.i * DEG2RAD,
      p.om * DEG2RAD,
      p.w * DEG2RAD,
      PLANET_COLORS[p.name] ?? 0x888888,
      0.28
    );
    group.add(orbitLine);

    const radius = Math.max(p.radius_km * KM_TO_SCENE * PLANET_RADIUS_EXAGGERATION, 0.06);
    const geo = new THREE.SphereGeometry(radius, 24, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: PLANET_COLORS[p.name] ?? 0xaaaaaa,
      roughness: 0.8,
      metalness: 0.0,
      emissive: new THREE.Color(PLANET_COLORS[p.name] ?? 0xaaaaaa).multiplyScalar(0.08),
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.planetName = p.name;
    group.add(mesh);

    bodies.push({ name: p.name, elements: p, mesh, labelAnchor: mesh });
  }

  function update(jd: number): void {
    for (const body of bodies) {
      const e = body.elements;
      const posEcl = positionFromMeanElements(
        e.a,
        e.e,
        e.i * DEG2RAD,
        e.om * DEG2RAD,
        e.w * DEG2RAD,
        e.ma * DEG2RAD,
        e.n * DEG2RAD,
        e.epoch,
        jd
      );
      const scenePos = eclipticToThree(posEcl);
      body.mesh.position.set(scenePos.x * AU_SCENE_UNITS, scenePos.y * AU_SCENE_UNITS, scenePos.z * AU_SCENE_UNITS);
    }
  }

  return { group, bodies, update };
}
