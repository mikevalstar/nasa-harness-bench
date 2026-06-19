// Three.js scene scaffolding: renderer, camera + controls, Sun, planets with
// orbit rings, a starfield, and the dynamic "selected orbit" line.

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  propagate,
  planetParams,
  sampleOrbit,
  type OrbitParams,
} from "./kepler";
import type { PlanetRow } from "./data";

export const AU = 10; // scene units per astronomical unit

const PLANET_COLORS: Record<string, number> = {
  Mercury: 0x9c8b7a,
  Venus: 0xe0c089,
  Earth: 0x3a7bd5,
  Mars: 0xc1440e,
  Jupiter: 0xd8a05a,
  Saturn: 0xe6cF8f,
  Uranus: 0x8fd9e0,
  Neptune: 0x4567d8,
};

export interface PlanetObj {
  row: PlanetRow;
  params: OrbitParams;
  mesh: THREE.Mesh;
  group: THREE.Group;
  pos: THREE.Vector3; // current scene position
}

export class Scene {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  sun: THREE.Mesh;
  planets: PlanetObj[] = [];
  private selectedOrbit: THREE.Line;
  private followTarget: THREE.Vector3 | null = null;
  private lastFollow = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05060a);

    this.camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.01,
      200000
    );
    this.camera.position.set(0, AU * 3.2, AU * 4.5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxDistance = AU * 400;
    this.controls.minDistance = 0.05;

    // Lighting: the Sun is a point light at the origin plus ambient fill.
    const sunLight = new THREE.PointLight(0xfff4e0, 4, 0, 0.0);
    this.scene.add(sunLight);
    this.scene.add(new THREE.AmbientLight(0x404a5a, 1.6));

    // Sun
    this.sun = new THREE.Mesh(
      new THREE.SphereGeometry(AU * 0.12, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd27a })
    );
    this.scene.add(this.sun);
    this.scene.add(this.makeGlow(AU * 0.12));

    this.starfield();

    this.selectedOrbit = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: 0xffe066,
        transparent: true,
        opacity: 0.85,
      })
    );
    this.selectedOrbit.visible = false;
    this.selectedOrbit.frustumCulled = false;
    this.scene.add(this.selectedOrbit);

    addEventListener("resize", () => this.onResize(container));
  }

  private makeGlow(r: number): THREE.Sprite {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,220,150,0.9)");
    grad.addColorStop(0.25, "rgba(255,190,90,0.5)");
    grad.addColorStop(1, "rgba(255,150,40,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    const spr = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      })
    );
    spr.scale.setScalar(r * 9);
    return spr;
  }

  private starfield() {
    const N = 2500;
    const pos = new Float32Array(N * 3);
    const R = 80000;
    for (let i = 0; i < N; i++) {
      // uniform on sphere
      const u = Math.random() * 2 - 1;
      const t = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = R * s * Math.cos(t);
      pos[i * 3 + 1] = R * u;
      pos[i * 3 + 2] = R * s * Math.sin(t);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(
      g,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 120,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
      })
    );
    stars.frustumCulled = false;
    this.scene.add(stars);
  }

  addPlanets(rows: PlanetRow[]) {
    for (const row of rows) {
      const params = planetParams(row);
      const group = new THREE.Group();

      // orbit ring
      const pts = sampleOrbit(params, 360).map((p) => p.multiplyScalar(AU));
      const og = new THREE.BufferGeometry().setFromPoints(pts);
      const ring = new THREE.Line(
        og,
        new THREE.LineBasicMaterial({
          color: PLANET_COLORS[row.name] ?? 0x6688aa,
          transparent: true,
          opacity: 0.35,
        })
      );
      ring.frustumCulled = false;
      group.add(ring);

      // planet body — exaggerated but ranked-correct visual radius
      const vr =
        AU * (0.012 + 0.02 * Math.log10(row.radius_km / 1000 + 1));
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(vr, 24, 24),
        new THREE.MeshStandardMaterial({
          color: PLANET_COLORS[row.name] ?? 0x8899aa,
          roughness: 0.85,
          metalness: 0.0,
          emissive: new THREE.Color(PLANET_COLORS[row.name] ?? 0x8899aa)
            .multiplyScalar(0.12),
        })
      );
      group.add(mesh);
      this.scene.add(group);

      this.planets.push({
        row,
        params,
        mesh,
        group,
        pos: new THREE.Vector3(),
      });
    }
  }

  /** Advance planet positions to Julian date `jd`. */
  updatePlanets(jd: number) {
    for (const p of this.planets) {
      propagate(p.params, jd, p.pos).multiplyScalar(AU);
      p.mesh.position.copy(p.pos);
    }
  }

  setSelectedOrbit(params: OrbitParams | null) {
    if (!params) {
      this.selectedOrbit.visible = false;
      return;
    }
    const pts = sampleOrbit(params, 384).map((p) => p.multiplyScalar(AU));
    this.selectedOrbit.geometry.setFromPoints(pts);
    this.selectedOrbit.geometry.computeBoundingSphere();
    this.selectedOrbit.visible = true;
  }

  /** Lock the camera target onto a moving scene position (or release). */
  setFollow(pos: THREE.Vector3 | null) {
    if (pos) {
      this.followTarget = pos;
      this.lastFollow.copy(pos);
    } else {
      this.followTarget = null;
    }
  }

  render() {
    if (this.followTarget) {
      // shift camera + target by the followed body's motion this frame
      const delta = this.followTarget.clone().sub(this.lastFollow);
      this.camera.position.add(delta);
      this.controls.target.add(delta);
      this.lastFollow.copy(this.followTarget);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /** Pixels-per-(unit/distance) factor for the body point shader. */
  pointScale(): number {
    const h = this.renderer.domElement.height;
    const fov = (this.camera.fov * Math.PI) / 180;
    return (h / (2 * Math.tan(fov / 2))) * 0.0016;
  }

  private onResize(container: HTMLElement) {
    const w = container.clientWidth,
      h = container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
