/**
 * The 3D stage: renderer, camera rig, Sun, planets, reference rings and the two small-body clouds.
 * World units are au in the J2000 ecliptic frame, with +z as ecliptic north.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { BodyRef, Ephemeris } from "../bodies.ts";
import { AU_KM, sampleOrbit, SUN_RADIUS_KM, type Vec3 } from "../orbit.ts";
import type { Layer } from "../state.ts";
import { AsteroidCloud } from "./asteroids.ts";
import { CometCloud } from "./comets.ts";

const PLANET_COLORS: Record<string, string> = {
  Mercury: "#a39a8e",
  Venus: "#dcbc82",
  Earth: "#4f8fe0",
  Mars: "#cf6a41",
  Jupiter: "#d6ac7e",
  Saturn: "#dfc890",
  Uranus: "#93d6de",
  Neptune: "#5578e6",
};

/** Radii of the faint distance rings in the ecliptic plane, in au. */
export const GRID_RINGS = [2, 3, 4, 5, 10, 20, 30, 40];

const FOV = 45;
/** Orbit curves are cut off beyond this distance from the Sun, in au. */
const ORBIT_DRAW_LIMIT = 120;

export interface ScreenPoint {
  x: number;
  y: number;
  /** False when the point is behind the camera or outside the depth range. */
  visible: boolean;
}

export interface CameraPose {
  /** Camera position relative to the point it orbits. */
  offset: Vec3;
  target: Vec3;
}

export class Stage {
  readonly asteroids: AsteroidCloud;
  readonly comets: CometCloud;
  /** Current heliocentric position per planet, refreshed every frame. */
  readonly planetPositions: Vec3[];
  /** Combined view-projection matrix of the last rendered frame. */
  readonly viewProjection = new THREE.Matrix4();
  width = 1;
  height = 1;

  private readonly eph: Ephemeris;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly sun: THREE.Mesh;
  private readonly glow: THREE.Sprite;
  private readonly planetMeshes: THREE.Mesh[];
  private readonly planetOrbits = new THREE.Group();
  private readonly grid = new THREE.Group();
  private selectedOrbit: THREE.Line | null = null;
  private flyTime = 0;
  private zoomGoal: number | null = null;
  private readonly scratch: Vec3 = [0, 0, 0];
  private readonly v = new THREE.Vector3();

  constructor(container: HTMLElement, eph: Ephemeris) {
    this.eph = eph;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor("#04060c");
    container.append(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 500);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(0.6, -3.4, 2.3);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.minDistance = 5e-5;
    this.controls.maxDistance = 150;
    this.controls.addEventListener("start", () => {
      this.flyTime = 0;
      this.zoomGoal = null;
    });

    this.scene.add(new THREE.AmbientLight("#ffffff", 0.35), new THREE.PointLight("#ffffff", 3, 0, 0));

    this.sun = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color: "#ffe9b0" }));
    this.glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        transparent: true,
      }),
    );
    this.scene.add(this.sun, this.glow);

    const sphere = new THREE.SphereGeometry(1, 32, 16);
    const planets = eph.catalog.planets;
    this.planetPositions = planets.map(() => [0, 0, 0]);
    this.planetMeshes = planets.map((planet, index) => {
      const color = PLANET_COLORS[planet.name] ?? "#cccccc";
      const mesh = new THREE.Mesh(sphere, new THREE.MeshStandardMaterial({ color, roughness: 1 }));
      if (planet.name === "Saturn") mesh.add(saturnRings());
      this.scene.add(mesh);

      const conic = eph.conic({ kind: "planet", index });
      if (conic) {
        const { points } = sampleOrbit(conic.q, conic.e, conic.basis, 720, ORBIT_DRAW_LIMIT);
        const geometry = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(points, 3));
        const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false });
        this.planetOrbits.add(new THREE.LineLoop(geometry, material));
      }
      return mesh;
    });

    const ringMaterial = new THREE.LineBasicMaterial({ color: "#9fb4d8", transparent: true, opacity: 0.1, depthWrite: false });
    for (const radius of GRID_RINGS) {
      const points = new THREE.Path().absarc(0, 0, radius, 0, Math.PI * 2).getSpacedPoints(256);
      this.grid.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), ringMaterial));
    }
    this.scene.add(this.planetOrbits, this.grid);

    this.asteroids = new AsteroidCloud(eph);
    this.comets = new CometCloud(eph);
    this.scene.add(this.asteroids.points, this.comets.group);

    new ResizeObserver(() => this.resize(container)).observe(container);
    this.resize(container);
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  private resize(container: HTMLElement): void {
    this.width = Math.max(container.clientWidth, 1);
    this.height = Math.max(container.clientHeight, 1);
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  setLayers(layers: Record<Layer, boolean>): void {
    this.comets.group.visible = layers.comets;
    this.planetOrbits.visible = layers.orbits;
    this.grid.visible = layers.grid;
  }

  /** Draw the orbit of one body, replacing any previous one. */
  showOrbit(ref: BodyRef | null): void {
    if (this.selectedOrbit) {
      this.scene.remove(this.selectedOrbit);
      this.selectedOrbit.geometry.dispose();
      this.selectedOrbit = null;
    }
    const conic = ref && this.eph.conic(ref);
    if (!conic) return;
    const { points, closed } = sampleOrbit(conic.q, conic.e, conic.basis, 1440, ORBIT_DRAW_LIMIT);
    const geometry = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(points, 3));
    const material = new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.85, depthWrite: false });
    this.selectedOrbit = closed ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material);
    this.selectedOrbit.frustumCulled = false;
    this.selectedOrbit.renderOrder = 1;
    this.scene.add(this.selectedOrbit);
  }

  /** Glide the orbit centre onto the selected body over the next moments. */
  flyToSelection(): void {
    this.flyTime = 1.2;
  }

  /** Glide the camera in or out until it sits `distance` au from the orbit centre. */
  zoomTo(distance: number): void {
    this.zoomGoal = distance;
  }

  get pose(): CameraPose {
    const t = this.controls.target;
    const c = this.camera.position;
    return { offset: [c.x - t.x, c.y - t.y, c.z - t.z], target: [t.x, t.y, t.z] };
  }

  set pose(pose: CameraPose) {
    this.flyTime = 0;
    this.zoomGoal = null;
    this.controls.target.set(...pose.target);
    this.camera.position.set(
      pose.target[0] + pose.offset[0],
      pose.target[1] + pose.offset[1],
      pose.target[2] + pose.offset[2],
    );
  }

  /** Distance from the camera to the point it orbits, in au. */
  get viewDistance(): number {
    return this.camera.position.distanceTo(this.controls.target);
  }

  /** World length of one CSS pixel at the orbit centre, in au. */
  get auPerPixel(): number {
    return (2 * this.viewDistance * Math.tan((FOV * Math.PI) / 360)) / this.height;
  }

  toScreen(p: Vec3, out: ScreenPoint): ScreenPoint {
    this.v.set(p[0], p[1], p[2]).applyMatrix4(this.viewProjection);
    out.x = (this.v.x * 0.5 + 0.5) * this.width;
    out.y = (0.5 - this.v.y * 0.5) * this.height;
    out.visible = this.v.z > -1 && this.v.z < 1;
    return out;
  }

  /** On-screen radius of a planet's or the Sun's disc in CSS pixels, for hit testing. */
  discRadiusPx(ref: BodyRef): number {
    const mesh = ref.kind === "sun" ? this.sun : this.planetMeshes[ref.index];
    const distance = this.camera.position.distanceTo(mesh.position);
    return mesh.scale.x / distance / (2 * Math.tan((FOV * Math.PI) / 360)) * this.height;
  }

  render(jd: number, dtSeconds: number, selected: BodyRef | null, follow: boolean): void {
    const { camera, controls } = this;

    if (selected && (follow || this.flyTime > 0 || this.zoomGoal !== null)) {
      const p = this.eph.position(selected, jd, this.scratch);
      // Ease toward the body while a glide is running, then land on it exactly.
      this.flyTime -= dtSeconds;
      const gain = this.flyTime > 0 ? 1 - Math.exp(-dtSeconds * 8) : 1;
      this.v.set(p[0], p[1], p[2]).sub(controls.target).multiplyScalar(gain);
      controls.target.add(this.v);
      camera.position.add(this.v);
    }
    if (this.zoomGoal !== null) {
      const offset = this.v.copy(camera.position).sub(controls.target);
      const distance = offset.length();
      const next = distance * Math.pow(this.zoomGoal / distance, 1 - Math.exp(-dtSeconds * 5));
      camera.position.copy(controls.target).addScaledVector(offset, next / distance);
      if (Math.abs(next / this.zoomGoal - 1) < 0.01) this.zoomGoal = null;
    }
    controls.enablePan = !follow;
    controls.update();

    const distance = camera.position.distanceTo(controls.target);
    camera.near = distance * 0.01;
    camera.far = distance * 100 + 200;
    camera.updateProjectionMatrix();

    const sunDistance = camera.position.length();
    this.sun.scale.setScalar(Math.max(SUN_RADIUS_KM / AU_KM, sunDistance * 0.006));
    this.glow.scale.setScalar(Math.max((SUN_RADIUS_KM / AU_KM) * 10, sunDistance * 0.09));

    const planets = this.eph.catalog.planets;
    for (let i = 0; i < planets.length; i++) {
      const p = this.eph.position({ kind: "planet", index: i }, jd, this.planetPositions[i]);
      const mesh = this.planetMeshes[i];
      mesh.position.set(p[0], p[1], p[2]);
      // Planets never shrink below a few pixels, bigger worlds slightly larger; zoom in far enough and true size takes over.
      const minimum = 0.0026 + 0.001 * Math.log10(planets[i].radius_km / 1000);
      mesh.scale.setScalar(Math.max(planets[i].radius_km / AU_KM, camera.position.distanceTo(mesh.position) * minimum));
    }

    // Dots grow a little as the camera closes in, so a zoomed view is not a field of specks.
    const pointScale = this.renderer.getPixelRatio() * Math.min(Math.max(Math.pow(4 / distance, 0.22), 0.75), 2.2);
    this.asteroids.update(jd, pointScale);
    if (this.comets.group.visible) this.comets.update(jd, pointScale, distance);

    this.renderer.render(this.scene, camera);
    this.viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  }
}

function glowTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255, 244, 214, 1)");
    gradient.addColorStop(0.12, "rgba(255, 214, 140, 0.75)");
    gradient.addColorStop(0.4, "rgba(255, 160, 70, 0.16)");
    gradient.addColorStop(1, "rgba(255, 140, 50, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
}

function saturnRings(): THREE.Mesh {
  const rings = new THREE.Mesh(
    new THREE.RingGeometry(1.25, 2.25, 64),
    new THREE.MeshBasicMaterial({ color: "#cdb98a", side: THREE.DoubleSide, transparent: true, opacity: 0.55 }),
  );
  rings.rotation.x = (26.7 * Math.PI) / 180;
  return rings;
}
