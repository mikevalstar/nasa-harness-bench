import * as THREE from 'three';
import { propagate, sampleOrbit, DEG2RAD, type Elements } from './kepler';
import type { Planet } from './data';

const PLANET_COLORS: Record<string, number> = {
  Mercury: 0x9c9c9c,
  Venus: 0xe6c27a,
  Earth: 0x4a90d9,
  Mars: 0xd1603f,
  Jupiter: 0xd8b08c,
  Saturn: 0xe3d6a3,
  Uranus: 0x9fe0e0,
  Neptune: 0x4f6fe0,
};

export interface PlanetBody {
  name: string;
  mesh: THREE.Mesh;
  el: Elements;
  position: THREE.Vector3;
  radiusKm: number;
  visualRadius: number;
}

export interface SolarSystem {
  group: THREE.Group;
  sun: THREE.Mesh;
  bodies: PlanetBody[];
  update(jd: number): void;
  setOrbitsVisible(v: boolean): void;
  setBodyScale(scale: number): void;
}

// Visual radius: cube-root compression of the true mean radius so relative
// sizes stay recognizable while remaining visible at solar-system scale.
function visualRadiusFor(radiusKm: number): number {
  return 0.011 * Math.cbrt(radiusKm / 6371);
}

export function createSolarSystem(planets: Planet[]): SolarSystem {
  const group = new THREE.Group();

  // Sun.
  const sunR = 0.06;
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(sunR, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff2c4 })
  );
  group.add(sun);

  // Sun glow sprite.
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      color: 0xffd27f,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.set(0.6, 0.6, 0.6);
  group.add(glow);

  const sunLight = new THREE.PointLight(0xfff4e0, 2.2, 0, 0.0);
  group.add(sunLight);
  group.add(new THREE.AmbientLight(0x404a5a, 1.4));

  const bodies: PlanetBody[] = [];
  const orbitLines: THREE.Line[] = [];

  for (const p of planets) {
    const el: Elements = {
      a: p.a,
      e: p.e,
      i: p.i * DEG2RAD,
      om: p.om * DEG2RAD,
      w: p.w * DEG2RAD,
      ma: p.ma * DEG2RAD,
      n: p.n * DEG2RAD,
      epoch: p.epoch,
    };
    const vr = visualRadiusFor(p.radius_km);
    const color = PLANET_COLORS[p.name] ?? 0xcccccc;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 24),
      new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0, emissive: new THREE.Color(color).multiplyScalar(0.12) })
    );
    mesh.scale.setScalar(vr);
    group.add(mesh);

    // Orbit line.
    const pts = sampleOrbit(el, 256);
    const og = new THREE.BufferGeometry();
    og.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const line = new THREE.Line(
      og,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.28 })
    );
    line.frustumCulled = false;
    orbitLines.push(line);
    group.add(line);

    bodies.push({ name: p.name, mesh, el, position: new THREE.Vector3(), radiusKm: p.radius_km, visualRadius: vr });
  }

  const tmp: [number, number, number] = [0, 0, 0];
  let bodyScale = 1;

  function update(jd: number) {
    for (const b of bodies) {
      propagate(b.el, jd, tmp);
      b.position.set(tmp[0], tmp[1], tmp[2]);
      b.mesh.position.copy(b.position);
    }
  }

  return {
    group,
    sun,
    bodies,
    update,
    setOrbitsVisible(v: boolean) {
      for (const l of orbitLines) l.visible = v;
    },
    setBodyScale(scale: number) {
      bodyScale = scale;
      for (const b of bodies) b.mesh.scale.setScalar(b.visualRadius * scale);
      sun.scale.setScalar(scale);
      glow.scale.setScalar(0.6 * scale);
    },
  };
}

function makeGlowTexture(): THREE.Texture {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,240,200,1)');
  g.addColorStop(0.2, 'rgba(255,210,140,0.7)');
  g.addColorStop(0.5, 'rgba(255,170,90,0.25)');
  g.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}
