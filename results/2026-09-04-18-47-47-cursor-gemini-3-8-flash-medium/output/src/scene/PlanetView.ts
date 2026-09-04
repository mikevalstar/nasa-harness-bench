import * as THREE from 'three';
import { PlanetData } from '../types/solar';
import {
  computeOrbitalBasis,
  generateOrbitPoints,
  OrbitalBasis,
  perifocalToThree,
  propagatePerifocal,
} from '../math/kepler';

interface PlanetVisualConfig {
  color: number;
  orbitColor: number;
  renderRadius: number;
  hasRings?: boolean;
}

const PLANET_CONFIGS: Record<string, PlanetVisualConfig> = {
  Mercury: { color: 0x9ca3af, orbitColor: 0x64748b, renderRadius: 0.014 },
  Venus: { color: 0xfcd34d, orbitColor: 0xd97706, renderRadius: 0.019 },
  Earth: { color: 0x38bdf8, orbitColor: 0x0284c7, renderRadius: 0.021 },
  Mars: { color: 0xf87171, orbitColor: 0xdc2626, renderRadius: 0.016 },
  Jupiter: { color: 0xfbbf24, orbitColor: 0xb45309, renderRadius: 0.040 },
  Saturn: { color: 0xfde047, orbitColor: 0xca8a04, renderRadius: 0.034, hasRings: true },
  Uranus: { color: 0x67e8f9, orbitColor: 0x0891b2, renderRadius: 0.026 },
  Neptune: { color: 0x818cf8, orbitColor: 0x4338ca, renderRadius: 0.025 },
};

export class PlanetView {
  public group: THREE.Group;
  public planets: PlanetData[];
  private planetMeshes: Map<string, THREE.Mesh> = new Map();
  private orbitLines: Map<string, THREE.Line> = new Map();
  private planetBases: Map<string, OrbitalBasis> = new Map();
  public currentPositions: Map<string, THREE.Vector3> = new Map();

  constructor(planets: PlanetData[]) {
    this.group = new THREE.Group();
    this.planets = planets;
    this.initPlanets();
  }

  private initPlanets() {
    for (const planet of this.planets) {
      const cfg = PLANET_CONFIGS[planet.name] || {
        color: 0xcccccc,
        orbitColor: 0x555555,
        renderRadius: 0.02,
      };

      const basis = computeOrbitalBasis(planet.i, planet.om, planet.w);
      this.planetBases.set(planet.name, basis);

      // Planet Mesh
      const geom = new THREE.SphereGeometry(cfg.renderRadius, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.6,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = planet.name;
      mesh.userData = { type: 'planet', id: planet.name, name: planet.name, data: planet };

      // Optional rings for Saturn
      if (cfg.hasRings) {
        const ringGeom = new THREE.RingGeometry(cfg.renderRadius * 1.4, cfg.renderRadius * 2.3, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xd4af37,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2.3;
        mesh.add(ringMesh);
      }

      this.group.add(mesh);
      this.planetMeshes.set(planet.name, mesh);
      this.currentPositions.set(planet.name, new THREE.Vector3());

      // Orbit Line
      const orbitPoints = generateOrbitPoints(planet.a, planet.e, planet.a * (1 - planet.e), basis, 180);
      const linePositions = new Float32Array(orbitPoints.length * 3);
      for (let i = 0; i < orbitPoints.length; i++) {
        linePositions[i * 3 + 0] = orbitPoints[i].x;
        linePositions[i * 3 + 1] = orbitPoints[i].y;
        linePositions[i * 3 + 2] = orbitPoints[i].z;
      }
      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: cfg.orbitColor,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      const line = new THREE.Line(lineGeom, lineMat);
      this.group.add(line);
      this.orbitLines.set(planet.name, line);
    }
  }

  public updatePositions(jd: number) {
    for (const planet of this.planets) {
      const basis = this.planetBases.get(planet.name)!;
      const { xp, yp } = propagatePerifocal(
        planet.a,
        planet.e,
        planet.a * (1 - planet.e),
        jd,
        planet.epoch,
        planet.ma,
        planet.n,
        null
      );
      const pos3 = perifocalToThree(xp, yp, basis);
      const mesh = this.planetMeshes.get(planet.name);
      if (mesh) {
        mesh.position.set(pos3.x, pos3.y, pos3.z);
        const stored = this.currentPositions.get(planet.name)!;
        stored.set(pos3.x, pos3.y, pos3.z);
      }
    }
  }

  public getPlanetPosition(name: string): THREE.Vector3 | undefined {
    return this.currentPositions.get(name);
  }

  public getPlanetMesh(name: string): THREE.Mesh | undefined {
    return this.planetMeshes.get(name);
  }

  public setOrbitsVisible(visible: boolean) {
    for (const line of this.orbitLines.values()) {
      line.visible = visible;
    }
  }
}
