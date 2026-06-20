import * as THREE from "three";
import { prepareOrbit, propagate, sampleOrbit, deg2rad, type PreparedOrbit, type Vec3 } from "./kepler";
import type { PlanetRaw } from "./types";

const PLANET_COLORS: Record<string, number> = {
  Mercury: 0xb7a99a,
  Venus: 0xe8cda0,
  Earth: 0x6b93d6,
  Mars: 0xd06b4c,
  Jupiter: 0xd8b48c,
  Saturn: 0xe3d6a8,
  Uranus: 0x9fd6e0,
  Neptune: 0x5b7ce0,
};

export interface PlanetBody {
  name: string;
  orbit: PreparedOrbit;
  mesh: THREE.Mesh;
  color: number;
  radiusScene: number;
  pos: Vec3;
}

// Exaggerated but monotonic visual radius (true radii are sub-pixel at AU scale).
function visualRadius(radiusKm: number): number {
  return THREE.MathUtils.clamp(Math.cbrt(radiusKm) * 0.0009, 0.006, 0.05);
}

export class PlanetSystem {
  readonly group = new THREE.Group();
  readonly orbitsGroup = new THREE.Group();
  readonly bodies: PlanetBody[] = [];
  readonly sun: THREE.Mesh;
  readonly sunGlow: THREE.Sprite;

  constructor(planets: PlanetRaw[]) {
    // Sun
    const sunRadius = 0.025;
    this.sun = new THREE.Mesh(
      new THREE.SphereGeometry(sunRadius, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd860 }),
    );
    this.sun.name = "Sun";
    this.group.add(this.sun);
    this.sunGlow = makeGlowSprite(0xffd24a, 0.42);
    this.group.add(this.sunGlow);

    for (const p of planets) {
      const orbit = prepareOrbit({
        a: p.a,
        e: p.e,
        i: deg2rad(p.i),
        om: deg2rad(p.om),
        w: deg2rad(p.w),
        q: p.a * (1 - p.e),
        ma: deg2rad(p.ma),
        epoch: p.epoch,
        n: deg2rad(p.n),
      });
      const color = PLANET_COLORS[p.name] ?? 0xaaaaaa;
      const radiusScene = visualRadius(p.radius_km);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radiusScene, 24, 24),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.85,
          metalness: 0.0,
          emissive: new THREE.Color(color).multiplyScalar(0.12),
        }),
      );
      mesh.name = p.name;
      this.group.add(mesh);

      const pts = sampleOrbit(orbit, 256);
      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute("position", new THREE.BufferAttribute(pts, 3));
      const line = new THREE.Line(
        lineGeom,
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.32,
        }),
      );
      this.orbitsGroup.add(line);

      this.bodies.push({
        name: p.name,
        orbit,
        mesh,
        color,
        radiusScene,
        pos: { x: 0, y: 0, z: 0 },
      });
    }
  }

  update(jd: number): void {
    for (const b of this.bodies) {
      propagate(b.orbit, jd, b.pos);
      b.mesh.position.set(b.pos.x, b.pos.y, b.pos.z);
    }
  }

  getBody(name: string): PlanetBody | undefined {
    return this.bodies.find((b) => b.name.toLowerCase() === name.toLowerCase());
  }

  setOrbitsVisible(v: boolean): void {
    this.orbitsGroup.visible = v;
  }
}

function makeGlowSprite(color: number, size: number): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  const col = new THREE.Color(color);
  const rgb = `${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0}`;
  g.addColorStop(0, `rgba(${rgb},0.9)`);
  g.addColorStop(0.25, `rgba(${rgb},0.5)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(size, size, 1);
  return s;
}
