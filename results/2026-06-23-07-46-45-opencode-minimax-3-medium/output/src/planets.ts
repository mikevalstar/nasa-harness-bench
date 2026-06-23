// Renders the Sun, planets, and orbital lines for the planets.

import * as THREE from 'three';
import type { Planet } from './types';
import { propagateElliptic, buildEllipticProp, SUN_RADIUS_KM, EARTH_RADIUS_KM, AU_KM } from './orbit';

const SUN_RADIUS_AU = SUN_RADIUS_KM / AU_KM; // ≈ 0.00465 au

// We visually exaggerate planet radii so they're visible in the scene.
// Real Earth (4.3e-5 au) would be ~0.2 px on a 1080p screen with Earth at 100 px.
// We choose an exaggerated "display radius" based on log-scaling.

function displayRadius(planet: Planet): number {
  // Log-scaled between a visible minimum and a fraction of an AU.
  const rAU = planet.radius_km / AU_KM;
  const log = Math.log10(Math.max(rAU, 1e-8));
  // log10(Earth radius) ≈ -8.36; Saturn ≈ -7.41; Jupiter ≈ -7.33; Mercury ≈ -8.79.
  // Map to display: 0.005 (smallest) to 0.06 (largest) au.
  const lo = -9.0;
  const hi = -7.3;
  const t = (log - lo) / (hi - lo);
  return THREE.MathUtils.lerp(0.006, 0.07, THREE.MathUtils.clamp(t, 0, 1));
}

const PLANET_COLORS: Record<string, number> = {
  Mercury: 0xb0a89a,
  Venus: 0xe6cf8d,
  Earth: 0x4ea1ff,
  Mars: 0xd86a3a,
  Jupiter: 0xd6b48a,
  Saturn: 0xe6cf90,
  Uranus: 0x9ed7e7,
  Neptune: 0x4a78d8,
};

const PLANET_LABEL_COLOR: Record<string, string> = {
  Sun: '#ffcc55',
  Mercury: '#cdc3b3',
  Venus: '#f0dca0',
  Earth: '#7cc1ff',
  Mars: '#ff8a55',
  Jupiter: '#e9c8a0',
  Saturn: '#efd9a3',
  Uranus: '#bce4ee',
  Neptune: '#7da0e8',
};

export interface PlanetObjects {
  group: THREE.Group;
  meshes: Map<string, THREE.Mesh>;
  orbits: Map<string, THREE.Line>;
  labels: Map<string, { el: HTMLDivElement; world: THREE.Vector3 }>;
  update: (t: number) => void;
}

export function buildPlanets(planets: Planet[], labelLayer: HTMLDivElement): PlanetObjects {
  const group = new THREE.Group();
  const meshes = new Map<string, THREE.Mesh>();
  const orbits = new Map<string, THREE.Line>();
  const labels = new Map<string, { el: HTMLDivElement; world: THREE.Vector3 }>();
  const props = new Map<string, ReturnType<typeof buildEllipticProp>>();

  // Sun.
  const sunGeom = new THREE.SphereGeometry(displaySunRadius(), 48, 48);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc55 });
  const sunMesh = new THREE.Mesh(sunGeom, sunMat);
  sunMesh.position.set(0, 0, 0);
  group.add(sunMesh);
  meshes.set('Sun', sunMesh);

  // Sun glow.
  const glowGeom = new THREE.SphereGeometry(displaySunRadius() * 1.6, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffb444,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(glowGeom, glowMat));

  // Sun label.
  const sunLabel = makeLabel('Sun', PLANET_LABEL_COLOR.Sun);
  labelLayer.appendChild(sunLabel.el);
  labels.set('Sun', sunLabel);

  // Planets.
  for (const p of planets) {
    const radius = displayRadius(p);
    const geom = new THREE.SphereGeometry(radius, 32, 32);
    const color = PLANET_COLORS[p.name] ?? 0xb0b8c8;
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0.0,
      emissive: color,
      emissiveIntensity: 0.08,
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);
    meshes.set(p.name, mesh);

    props.set(p.name, buildEllipticProp(p));
    orbits.set(p.name, makeOrbitLine(p, 192));
    group.add(orbits.get(p.name)!);

    const lbl = makeLabel(p.name, PLANET_LABEL_COLOR[p.name] ?? '#ddd');
    labelLayer.appendChild(lbl.el);
    labels.set(p.name, lbl);
  }

  const tmp = new Float32Array(3);
  const update = (t: number) => {
    for (const p of planets) {
      const prop = props.get(p.name)!;
      propagateElliptic(prop, t, tmp);
      const m = meshes.get(p.name)!;
      m.position.set(tmp[0], tmp[1], tmp[2]);
      const lbl = labels.get(p.name)!;
      lbl.world.set(tmp[0], tmp[1], tmp[2]);
    }
  };

  return { group, meshes, orbits, labels, update };
}

function displaySunRadius(): number {
  // The real Sun radius in AU ≈ 0.00465 — already visible, but we want a bit more
  // glow for impact. Boost ~3x so it reads as "the big bright thing".
  return SUN_RADIUS_AU * 3.5;
}

function makeOrbitLine(p: Planet, segments: number): THREE.Line {
  const prop = buildEllipticProp(p);
  const pts: number[] = [];
  const tmp = new Float32Array(3);
  // Sample one full orbit: parameterize by mean anomaly M ∈ [0, 2π).
  // Convert M back to time via M = ma0 + n*(t - epoch).
  for (let s = 0; s <= segments; s++) {
    const M = (s / segments) * Math.PI * 2;
    const dt = (M - prop.ma0) / prop.n;
    propagateElliptic(prop, prop.epoch + dt, tmp);
    pts.push(tmp[0], tmp[1], tmp[2]);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0x4a78b4,
    transparent: true,
    opacity: 0.45,
  });
  return new THREE.Line(geom, mat);
}

interface LabelEntry {
  el: HTMLDivElement;
  world: THREE.Vector3;
}

function makeLabel(text: string, color: string): LabelEntry {
  const el = document.createElement('div');
  el.className = 'label3d';
  el.style.color = color;
  el.style.borderColor = color;
  el.textContent = text;
  return { el, world: new THREE.Vector3() };
}
