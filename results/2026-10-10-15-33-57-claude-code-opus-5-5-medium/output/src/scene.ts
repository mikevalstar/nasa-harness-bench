// The 3D view: Sun, planets, asteroid and comet point clouds, orbit lines, labels,
// screen-space picking and the camera (orbit controls, fly-to and follow).
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { orbitsOf, type BodyRef, type Catalog } from "./data.ts";
import { KM_PER_AU, type OrbitSet } from "./orbit.ts";

export const PLANET_COLORS: Record<string, string> = {
  Mercury: "#b8aa9c",
  Venus: "#e9cf8f",
  Earth: "#4f9dff",
  Mars: "#e2653f",
  Jupiter: "#d9b38c",
  Saturn: "#e6d49a",
  Uranus: "#9fe3e8",
  Neptune: "#6b88ff",
};
const SUN_RADIUS_AU = 696_000 / KM_PER_AU;
const COMET_COLOR = new THREE.Color("#9ff7ff");
const EARTH = 2;

const pointVertex = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  uniform float uPixelRatio;
  varying vec3 vColor;
  void main() {
    if (size <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uPixelRatio;
    vColor = color;
  }
`;

// Soft disc; `uHalo` adds a glow around the core (used for the Sun and planets).
const pointFragment = /* glsl */ `
  uniform float uOpacity;
  uniform float uHalo;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float core = smoothstep(1.0 - uHalo, 0.75 - uHalo * 0.8, d);
    float glow = uHalo * pow(1.0 - d, 2.0) * 0.6;
    gl_FragColor = vec4(vColor, (core + glow) * uOpacity);
  }
`;

const ringFragment = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(0.78, 0.86, d) * smoothstep(1.0, 0.92, d);
    if (a <= 0.0) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

function pointMaterial(opts: { halo?: number; opacity?: number; fragment?: string } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: pointVertex,
    fragmentShader: opts.fragment ?? pointFragment,
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uOpacity: { value: opts.opacity ?? 1 },
      uHalo: { value: opts.halo ?? 0 },
    },
    transparent: true,
    depthWrite: false,
  });
}

/** A point cloud whose position/colour/size buffers are filled from outside. */
class PointCloud {
  readonly positions: Float32Array;
  readonly colors: Float32Array;
  readonly sizes: Float32Array;
  readonly object: THREE.Points;
  private readonly geometry = new THREE.BufferGeometry();

  constructor(count: number, material: THREE.ShaderMaterial) {
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute("size", new THREE.BufferAttribute(this.sizes, 1));
    this.object = new THREE.Points(this.geometry, material);
    this.object.frustumCulled = false;
  }

  touch(...attrs: ("position" | "color" | "size")[]) {
    for (const a of attrs) this.geometry.getAttribute(a).needsUpdate = true;
  }
}

type Label = {
  el: HTMLDivElement;
  position: () => THREE.Vector3 | null;
};

export type CameraState = { target: [number, number, number]; dist: number; az: number; el: number };

export class SceneView {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly asteroids: PointCloud;
  readonly comets: PointCloud;
  private readonly scene = new THREE.Scene();
  private readonly planets: PointCloud;
  private readonly planetSpheres: THREE.Mesh[] = [];
  private readonly sun: PointCloud;
  private readonly marker: PointCloud;
  private readonly selectedOrbit = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.9 }),
  );
  private readonly hoverOrbit = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.35 }),
  );
  private readonly earthLink = new THREE.Line(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3)),
    new THREE.LineDashedMaterial({ color: "#ff6a6a", transparent: true, opacity: 0.7, dashSize: 0.01, gapSize: 0.01 }),
  );
  private readonly filteredOrbits = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.16, depthWrite: false }),
  );
  private readonly planetOrbits = new THREE.Group();
  private readonly grid = new THREE.Group();
  private readonly labelLayer: HTMLDivElement;
  private labels: Label[] = [];
  private readonly dynamicLabels = new Map<string, Label>();

  private jd = 0;
  private selected: BodyRef | null = null;
  private hovered: BodyRef | null = null;
  private follow: BodyRef | null = null;
  /** `follow` is also set during a plain fly-to; this says whether to keep tracking afterwards. */
  private followLocked = false;
  private fly: { from: THREE.Vector3; fromDist: number; toDist: number; start: number; ms: number } | null = null;
  private readonly tmp = new THREE.Vector3();
  private readonly viewProj = new THREE.Matrix4();

  private readonly container: HTMLElement;
  private readonly cat: Catalog;
  private readonly onLabelClick: (ref: BodyRef) => void;

  constructor(container: HTMLElement, cat: Catalog, onLabelClick: (ref: BodyRef) => void) {
    this.container = container;
    this.cat = cat;
    this.onLabelClick = onLabelClick;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor("#03050b");
    container.appendChild(this.renderer.domElement);

    this.labelLayer = document.createElement("div");
    this.labelLayer.className = "labels";
    container.appendChild(this.labelLayer);

    this.camera = new THREE.PerspectiveCamera(45, 1, 1e-6, 1e4);
    this.camera.position.set(0, 2.5, 3);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.minDistance = 2e-5;
    this.controls.maxDistance = 400;
    this.controls.zoomSpeed = 1.4;

    this.scene.add(this.starfield(), this.grid, this.planetOrbits, this.filteredOrbits);
    this.buildGrid();

    // Sun: a true-scale sphere for close-ups plus a glow point that stays visible from afar.
    const sunSphere = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS_AU, 48, 24),
      new THREE.MeshBasicMaterial({ color: "#ffe9a8" }),
    );
    this.sun = new PointCloud(1, pointMaterial({ halo: 0.7 }));
    this.sun.colors.set([1, 0.85, 0.5]);
    this.sun.sizes[0] = 26;
    this.scene.add(sunSphere, this.sun.object);
    this.addLabel("Sun", "label sun", () => new THREE.Vector3(0, 0, 0));

    // Planets: true-scale spheres (visible when zoomed in) plus fixed-size glow points.
    this.planets = new PointCloud(cat.planets.length, pointMaterial({ halo: 0.45 }));
    cat.planets.forEach((p, j) => {
      const color = new THREE.Color(PLANET_COLORS[p.name] ?? "#ffffff");
      this.planets.colors.set([color.r, color.g, color.b], j * 3);
      this.planets.sizes[j] = j === EARTH ? 11 : 9;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(p.radius_km / KM_PER_AU, 32, 16),
        new THREE.MeshBasicMaterial({ color }),
      );
      this.planetSpheres.push(sphere);
      this.scene.add(sphere);

      const path = cat.planetOrbits.path(j, 360);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(path, 3)),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 }),
      );
      this.planetOrbits.add(line);
      const label = this.addLabel(p.name, "label planet", () =>
        this.tmp.fromArray(this.planets.positions, j * 3).clone(),
      );
      label.el.style.setProperty("--c", PLANET_COLORS[p.name] ?? "#fff");
      label.el.addEventListener("click", () => this.onLabelClick({ kind: "planet", idx: j }));
    });
    this.scene.add(this.planets.object);

    this.asteroids = new PointCloud(cat.asteroids.count, pointMaterial({ opacity: 0.9 }));
    this.comets = new PointCloud(cat.comets.count, pointMaterial({ opacity: 0.95 }));
    for (let j = 0; j < cat.comets.count; j++) this.comets.colors.set([COMET_COLOR.r, COMET_COLOR.g, COMET_COLOR.b], j * 3);
    this.scene.add(this.asteroids.object, this.comets.object);

    this.marker = new PointCloud(1, pointMaterial({ fragment: ringFragment }));
    this.marker.colors.set([1, 1, 1]);
    this.scene.add(this.selectedOrbit, this.hoverOrbit, this.earthLink, this.marker.object);
    this.selectedOrbit.visible = this.hoverOrbit.visible = this.earthLink.visible = false;

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
  }

  // ------------------------------------------------------------ time & data

  /** Propagates every visible body to `jd`. Hidden asteroids/comets are skipped. */
  setTime(jd: number) {
    this.jd = jd;
    propagateVisible(this.cat.asteroidOrbits, jd, this.asteroids.positions, this.asteroids.sizes);
    propagateVisible(this.cat.cometOrbits, jd, this.comets.positions, this.comets.sizes);
    this.cat.planetOrbits.propagate(jd, this.planets.positions);
    this.planetSpheres.forEach((s, j) => s.position.fromArray(this.planets.positions, j * 3));
    this.asteroids.touch("position");
    this.comets.touch("position");
    this.planets.touch("position");
  }

  /** Call after changing asteroid/comet colours or sizes. */
  encodingChanged() {
    this.asteroids.touch("color", "size");
    this.comets.touch("color", "size");
    this.setTime(this.jd);
  }

  positionOf(ref: BodyRef, jd = this.jd): THREE.Vector3 {
    const [x, y, z] = orbitsOf(this.cat, ref.kind).position(ref.idx, jd);
    return new THREE.Vector3(x, y, z);
  }

  setLayers(opts: { planetOrbits: boolean; grid: boolean; labels: boolean }) {
    this.planetOrbits.visible = opts.planetOrbits;
    this.grid.visible = opts.grid;
    this.labelLayer.style.display = opts.labels ? "" : "none";
  }

  /** Draws faint orbits for up to `max` visible asteroids (highest priority first). */
  showFilteredOrbits(max: number) {
    const geo = this.filteredOrbits.geometry;
    if (max === 0) {
      this.filteredOrbits.visible = false;
      return;
    }
    const SEG = 96;
    const picks: number[] = [];
    for (let j = this.cat.asteroids.count - 1; j >= 0 && picks.length < max; j--) {
      if (this.asteroids.sizes[j]! > 0) picks.push(j);
    }
    const pos = new Float32Array(picks.length * SEG * 6);
    const col = new Float32Array(picks.length * SEG * 6);
    picks.forEach((j, k) => {
      const path = this.cat.asteroidOrbits.path(j, SEG);
      const c = this.asteroids.colors.subarray(j * 3, j * 3 + 3);
      for (let s = 0; s < SEG; s++) {
        const o = (k * SEG + s) * 6;
        pos.set(path.subarray(s * 3, s * 3 + 6), o);
        col.set(c, o);
        col.set(c, o + 3);
      }
    });
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    this.filteredOrbits.visible = true;
  }

  // ------------------------------------------------------------ selection

  setSelected(ref: BodyRef | null) {
    this.selected = ref;
    this.setOrbitLine(this.selectedOrbit, ref);
    if (ref) {
      const color = new THREE.Color(this.colorOf(ref));
      (this.selectedOrbit.material as THREE.LineBasicMaterial).color = color.clone().lerp(new THREE.Color("#fff"), 0.4);
    }
    if (this.follow && !ref) this.follow = null;
  }

  setHovered(ref: BodyRef | null) {
    if (sameRef(ref, this.hovered)) return;
    this.hovered = ref;
    this.setOrbitLine(this.hoverOrbit, ref && !sameRef(ref, this.selected) ? ref : null);
  }

  private setOrbitLine(line: THREE.Line, ref: BodyRef | null) {
    line.visible = ref !== null && ref.kind !== "planet";
    if (!ref || ref.kind === "planet") return;
    const path = orbitsOf(this.cat, ref.kind).path(ref.idx, 512);
    line.geometry.setAttribute("position", new THREE.BufferAttribute(path, 3));
    line.geometry.computeBoundingSphere();
  }

  private colorOf(ref: BodyRef): string {
    const c = ref.kind === "asteroid" ? this.asteroids.colors : ref.kind === "comet" ? this.comets.colors : this.planets.colors;
    return "#" + new THREE.Color(c[ref.idx * 3]!, c[ref.idx * 3 + 1]!, c[ref.idx * 3 + 2]!).getHexString();
  }

  // ------------------------------------------------------------ camera

  /** Smoothly moves the camera to `ref`; when `follow` is set it stays locked on as time moves. */
  focus(ref: BodyRef | null, follow: boolean, dist?: number) {
    const from = this.controls.target.clone();
    const fromDist = this.camera.position.distanceTo(this.controls.target);
    this.follow = ref;
    this.fly = {
      from,
      fromDist,
      toDist: dist ?? (ref ? defaultFocusDistance(this.cat, ref) : 3.4),
      start: performance.now(),
      ms: 900,
    };
    this.followLocked = follow;
  }

  get following(): BodyRef | null {
    return this.followLocked ? this.follow : null;
  }

  stopFollow() {
    this.followLocked = false;
    this.fly = null;
    this.follow = null;
  }

  getCameraState(): CameraState {
    const t = this.controls.target;
    const off = this.camera.position.clone().sub(t);
    const s = new THREE.Spherical().setFromVector3(off);
    return { target: [t.x, t.y, t.z], dist: s.radius, az: s.theta, el: s.phi };
  }

  setCameraState(c: CameraState) {
    this.controls.target.set(...c.target);
    const off = new THREE.Vector3().setFromSpherical(new THREE.Spherical(c.dist, c.el, c.az));
    this.camera.position.copy(this.controls.target).add(off);
    this.controls.update();
  }

  /** World units (au) per CSS pixel at the orbit target's distance. */
  auPerPixel(): number {
    const d = this.camera.position.distanceTo(this.controls.target);
    const h = this.container.clientHeight || 1;
    return (2 * d * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) / h;
  }

  // ------------------------------------------------------------ picking

  /** Nearest visible body to a screen point (CSS px), within a small radius. */
  pick(x: number, y: number): BodyRef | null {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.viewProj.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    const m = this.viewProj.elements;
    let best: BodyRef | null = null;
    let bestD = 12 * 12;

    const scan = (kind: BodyRef["kind"], cloud: PointCloud, bonus: number) => {
      const p = cloud.positions;
      const s = cloud.sizes;
      for (let j = 0; j < s.length; j++) {
        if (s[j]! <= 0) continue;
        const px = p[j * 3]!, py = p[j * 3 + 1]!, pz = p[j * 3 + 2]!;
        const cw = m[3]! * px + m[7]! * py + m[11]! * pz + m[15]!;
        if (cw <= 0) continue;
        const sx = ((m[0]! * px + m[4]! * py + m[8]! * pz + m[12]!) / cw + 1) * 0.5 * w;
        const sy = (1 - (m[1]! * px + m[5]! * py + m[9]! * pz + m[13]!) / cw) * 0.5 * h;
        const d = (sx - x) ** 2 + (sy - y) ** 2 - bonus;
        if (d < bestD) {
          bestD = d;
          best = { kind, idx: j };
        }
      }
    };
    scan("asteroid", this.asteroids, 0);
    if (this.comets.object.visible) scan("comet", this.comets, 0);
    scan("planet", this.planets, 40);
    return best;
  }

  // ------------------------------------------------------------ frame

  render() {
    this.updateCamera();
    const d = this.camera.position.distanceTo(this.controls.target);
    this.camera.near = Math.max(1e-7, d * 1e-3);
    this.camera.far = Math.max(5e3, d * 100);
    this.camera.updateProjectionMatrix();

    this.updateMarker();
    this.renderer.render(this.scene, this.camera);
    this.updateLabels();
  }

  private updateCamera() {
    const target = this.follow ? this.positionOf(this.follow) : null;
    if (this.fly) {
      const u = Math.min(1, (performance.now() - this.fly.start) / this.fly.ms);
      const k = u * u * (3 - 2 * u);
      const dest = target ?? new THREE.Vector3();
      const dir = this.camera.position.clone().sub(this.controls.target).normalize();
      const dist = Math.exp(THREE.MathUtils.lerp(Math.log(this.fly.fromDist), Math.log(this.fly.toDist), k));
      this.controls.target.copy(this.fly.from).lerp(dest, k);
      this.camera.position.copy(this.controls.target).addScaledVector(dir, dist);
      if (u >= 1) {
        this.fly = null;
        if (!this.followLocked) this.follow = null;
      }
    } else if (target && this.followLocked) {
      const delta = target.sub(this.controls.target);
      this.controls.target.add(delta);
      this.camera.position.add(delta);
    }
    this.controls.update();
  }

  private updateMarker() {
    const sel = this.selected;
    const link = this.earthLink;
    if (!sel) {
      this.marker.sizes[0] = 0;
      link.visible = false;
    } else {
      const p = this.positionOf(sel);
      this.marker.positions.set([p.x, p.y, p.z]);
      this.marker.sizes[0] = sel.kind === "planet" ? 24 : 20;
      link.visible = sel.kind !== "planet" || sel.idx !== EARTH;
      if (link.visible) {
        const earth = this.positionOf({ kind: "planet", idx: EARTH });
        const attr = link.geometry.getAttribute("position") as THREE.BufferAttribute;
        attr.setXYZ(0, earth.x, earth.y, earth.z);
        attr.setXYZ(1, p.x, p.y, p.z);
        attr.needsUpdate = true;
        link.geometry.computeBoundingSphere();
        link.computeLineDistances();
        const mat = link.material as THREE.LineDashedMaterial;
        mat.dashSize = mat.gapSize = this.auPerPixel() * 6;
      }
    }
    this.marker.touch("position", "size");
  }

  // ------------------------------------------------------------ labels

  private addLabel(text: string, className: string, position: () => THREE.Vector3 | null): Label {
    const el = document.createElement("div");
    el.className = className;
    el.textContent = text;
    this.labelLayer.appendChild(el);
    const label = { el, position };
    this.labels.push(label);
    return label;
  }

  /** Labels for the selected / hovered body, keyed by slot. */
  setDynamicLabel(slot: "selected" | "hovered", ref: BodyRef | null, text = "") {
    const existing = this.dynamicLabels.get(slot);
    if (existing) {
      existing.el.remove();
      this.labels = this.labels.filter((l) => l !== existing);
      this.dynamicLabels.delete(slot);
    }
    if (!ref || ref.kind === "planet") return;
    const label = this.addLabel(text, `label ${slot}`, () => this.positionOf(ref));
    this.dynamicLabels.set(slot, label);
  }

  private updateLabels() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    for (const l of this.labels) {
      const p = l.position();
      if (!p) continue;
      p.project(this.camera);
      const visible = p.z > -1 && p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1;
      l.el.style.display = visible ? "" : "none";
      if (visible) l.el.style.transform = `translate(${((p.x + 1) / 2) * w}px, ${((1 - p.y) / 2) * h}px)`;
    }
  }

  // ------------------------------------------------------------ static scenery

  private buildGrid() {
    const mat = new THREE.LineBasicMaterial({ color: "#8aa4c8", transparent: true, opacity: 0.1 });
    for (const r of [1, 2, 3, 5, 10, 20, 30, 50]) {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 256; k++) {
        const t = (k / 256) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * r, 0, Math.sin(t) * r));
      }
      this.grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
      const label = this.addLabel(`${r} au`, "label grid", () => (this.grid.visible ? new THREE.Vector3(r, 0, 0) : null));
      label.el.title = "Distance from the Sun on the ecliptic plane";
    }
    // Direction of the vernal equinox (ecliptic +x), the zero point of the longitudes.
    const axis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(60, 0, 0)]),
      new THREE.LineBasicMaterial({ color: "#8aa4c8", transparent: true, opacity: 0.18 }),
    );
    this.grid.add(axis);
    this.addLabel("♈︎ vernal equinox", "label grid", () => (this.grid.visible ? new THREE.Vector3(0.55, 0, 0) : null));
  }

  private starfield(): THREE.Points {
    // Procedural background stars on a large sphere (not real stars, just depth cues).
    const N = 4000;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const size = new Float32Array(N);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < N; k++) {
      const u = rnd() * 2 - 1;
      const t = rnd() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u) * 2000;
      pos.set([r * Math.cos(t), u * 2000, r * Math.sin(t)], k * 3);
      const b = 0.25 + rnd() * 0.45;
      col.set([b * 0.9, b * 0.95, b], k * 3);
      size[k] = 0.6 + rnd() * rnd() * 2.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(size, 1));
    const stars = new THREE.Points(geo, pointMaterial({ opacity: 0.8 }));
    stars.frustumCulled = false;
    // Keep the stars centred on the camera so they never get closer.
    stars.onBeforeRender = (_r, _s, cam) => stars.position.copy(cam.position);
    return stars;
  }

  private resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }
}

function propagateVisible(orbits: OrbitSet, jd: number, out: Float32Array, sizes: Float32Array) {
  for (let j = 0; j < orbits.count; j++) {
    if (sizes[j]! > 0) orbits.positionInto(j, jd, out, j * 3);
  }
}

export const sameRef = (a: BodyRef | null, b: BodyRef | null) =>
  a === b || (a !== null && b !== null && a.kind === b.kind && a.idx === b.idx);

/** A camera distance that frames the body and its neighbourhood. */
function defaultFocusDistance(cat: Catalog, ref: BodyRef): number {
  if (ref.kind === "planet") return Math.max(0.05, cat.planets[ref.idx]!.radius_km / KM_PER_AU * 400);
  return 0.25;
}
