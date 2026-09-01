import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Dataset } from './data';
import type { BodyRef, CometRow, PlanetRow } from './types';
import { F, STRIDE, sameBody } from './types';
import {
  J2000, DEG, TWO_PI, conicPosition, ellipticPosition, perifocal, sampleConic, sampleEllipse,
  type ConicOrbit, type EllipticOrbit, type Perifocal,
} from './orbits';
import { asteroidFragment, asteroidVertex, cometFragment, cometVertex } from './shaders';
import type { AppState, ColorMode } from './state';

/** ecliptic (x, y, z) -> scene (x, z, -y) so the ecliptic is the horizontal plane. */
function toScene(v: THREE.Vector3, x: number, y: number, z: number): THREE.Vector3 {
  return v.set(x, z, -y);
}

const CLASS_COLORS: Record<string, string> = {
  APO: '#ff7a59', ATE: '#ffd166', AMO: '#5dade2', IEO: '#c39bd3',
  HTC: '#48c9b0', ETc: '#f1948a', JFc: '#82e0aa', JFC: '#f7dc6f',
  CTc: '#aab7b8', COM: '#85c1e9', PAR: '#76d7c4', HYP: '#bb8fce',
};
export const classColor = (c: string): string => CLASS_COLORS[c] ?? '#cccccc';

const PLANET_STYLE: Record<string, { color: string; ring?: boolean }> = {
  Mercury: { color: '#a8a29e' }, Venus: { color: '#e8d5a3' }, Earth: { color: '#4f8fe6' },
  Mars: { color: '#d9613f' }, Jupiter: { color: '#d4b48c' }, Saturn: { color: '#e5cf98', ring: true },
  Uranus: { color: '#8fd3e8' }, Neptune: { color: '#4b70dd' },
};

/** Visual radius (au) for a planet: compressed so every planet is visible. Not to scale. */
export function planetVisualRadius(radiusKm: number): number {
  return 0.006 * Math.pow(radiusKm / 6371, 0.35);
}
export const SUN_VISUAL_RADIUS = 0.03;

const GRID_RINGS = [0.5, 1, 2, 3, 5, 10, 20, 30];
const MAX_FILTERED_ORBITS = 400;
const MAX_APPROACH_LINES = 300;
const ORBIT_RMAX = 60;

export interface PickResult {
  ref: BodyRef;
  screenX: number;
  screenY: number;
}

interface LabelEntry {
  el: HTMLDivElement;
  ref: BodyRef | null;
  fixed?: THREE.Vector3;
}

export class SolarScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;

  private planetOrbits: EllipticOrbit[];
  private planetMeshes: THREE.Mesh[] = [];
  private planetOrbitLines: THREE.Line[] = [];
  private cometOrbits: ConicOrbit[];
  private cometPositions: Float32Array;
  private cometPoints: THREE.Points;
  private cometTails: THREE.LineSegments;
  private asteroidMaterial: THREE.ShaderMaterial;
  
  private visAttr: THREE.BufferAttribute;
  private selectedOrbit: THREE.Line | null = null;
  private hoverOrbit: THREE.Line | null = null;
  private filteredOrbits: THREE.LineSegments | null = null;
  private approachLines: THREE.LineSegments;
  private selectMarker: THREE.Sprite;
  private hoverMarker: THREE.Sprite;
  private gridGroup = new THREE.Group();
  private labelLayer: HTMLDivElement;
  private labels: LabelEntry[] = [];
  private selectedLabel: LabelEntry;
  private hoverLabel: LabelEntry;

  /** CPU positions of every asteroid for `cachedJd` (scene coords), used for picking. */
  private cachedPositions: Float32Array;
  private cachedJd = NaN;
  private visibility: Uint8Array;

  private flyFrom: THREE.Vector3 | null = null;
  private flyDest = new THREE.Vector3();
  private flyTargetFrom = new THREE.Vector3();
  private flyTargetTo = new THREE.Vector3();
  private flyT = 1;

  constructor(private container: HTMLElement, private data: Dataset) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x03050c);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.0005, 2000);
    this.camera.position.set(0, 2.4, 4.2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.02;
    this.controls.maxDistance = 400;
    this.controls.zoomSpeed = 1.2;

    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'labels';
    container.appendChild(this.labelLayer);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const sunLight = new THREE.PointLight(0xfff2d6, 2.2, 0, 0);
    this.scene.add(sunLight);

    this.buildStars();
    this.buildSun();
    this.planetOrbits = data.planets.map(planetOrbit);
    this.buildPlanets(data.planets);
    this.buildGrid();

    const ast = this.buildAsteroids();
    this.asteroidMaterial = ast.material;
    
    this.visAttr = ast.vis;
    this.visibility = new Uint8Array(data.count).fill(1);
    this.cachedPositions = new Float32Array(data.count * 3);

    this.cometOrbits = data.comets.map(cometOrbit);
    this.cometPositions = new Float32Array(data.comets.length * 3);
    const com = this.buildComets(data.comets);
    this.cometPoints = com.points;
    this.cometTails = com.tails;

    this.approachLines = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xff8a65, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    this.approachLines.frustumCulled = false;
    this.scene.add(this.approachLines);

    this.selectMarker = makeRingSprite('#ffffff', 0.05);
    this.hoverMarker = makeRingSprite('#9ad0ff', 0.038);
    this.scene.add(this.selectMarker, this.hoverMarker);

    this.selectedLabel = this.addLabel('selected', null);
    this.hoverLabel = this.addLabel('hover', null);

    this.resize();
  }

  // ---------------------------------------------------------------- build

  private buildStars(): void {
    const n = 2500;
    const pos = new Float32Array(n * 3);
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1, phi = rnd() * TWO_PI, r = 900;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(phi);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0x9aa4b8, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.6 });
    this.scene.add(new THREE.Points(g, m));
  }

  private buildSun(): void {
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_VISUAL_RADIUS, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff1b8 }),
    );
    this.scene.add(sun);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTexture('#ffe8a3'), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    glow.scale.setScalar(SUN_VISUAL_RADIUS * 9);
    this.scene.add(glow);
    this.addLabel('planet sun', { kind: 'sun' }).el.textContent = 'Sun';
  }

  private buildPlanets(planets: PlanetRow[]): void {
    planets.forEach((p, index) => {
      const style = PLANET_STYLE[p.name] ?? { color: '#cccccc' };
      const r = planetVisualRadius(p.radius_km);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 24),
        new THREE.MeshStandardMaterial({ color: style.color, roughness: 0.8, metalness: 0, emissive: style.color, emissiveIntensity: 0.18 }),
      );
      if (style.ring) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(r * 1.4, r * 2.3, 48),
          new THREE.MeshBasicMaterial({ color: 0xd8c8a0, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }),
        );
        ring.rotation.x = Math.PI / 2 - 0.45;
        mesh.add(ring);
      }
      this.scene.add(mesh);
      this.planetMeshes.push(mesh);

      const orb = this.planetOrbits[index]!;
      const line = new THREE.Line(
        lineGeometry(sampleEllipse(orb.a, orb.e, orb.pf, 360)),
        new THREE.LineBasicMaterial({ color: style.color, transparent: true, opacity: 0.4 }),
      );
      this.scene.add(line);
      this.planetOrbitLines.push(line);

      this.addLabel('planet', { kind: 'planet', index }).el.textContent = p.name;
    });
  }

  private buildGrid(): void {
    const mat = new THREE.LineBasicMaterial({ color: 0x334, transparent: true, opacity: 0.45 });
    for (const r of GRID_RINGS) {
      const pts = new Float32Array(181 * 3);
      for (let k = 0; k <= 180; k++) {
        const t = (k / 180) * TWO_PI;
        pts[k * 3] = r * Math.cos(t);
        pts[k * 3 + 2] = r * Math.sin(t);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      this.gridGroup.add(new THREE.Line(g, mat));
      const label = this.addLabel('grid', null, new THREE.Vector3(r * 0.7071, 0, -r * 0.7071));
      label.el.textContent = `${r} au`;
    }
    // faint radial spokes
    const spokes = new Float32Array(12 * 2 * 3);
    for (let k = 0; k < 12; k++) {
      const t = (k / 12) * TWO_PI;
      spokes[k * 6 + 3] = 30 * Math.cos(t);
      spokes[k * 6 + 5] = 30 * Math.sin(t);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(spokes, 3));
    this.gridGroup.add(new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: 0x223, transparent: true, opacity: 0.35 })));
    this.scene.add(this.gridGroup);
  }

  private buildAsteroids(): { points: THREE.Points; material: THREE.ShaderMaterial; vis: THREE.BufferAttribute } {
    const { elements, count } = this.data;
    const orb0 = new Float32Array(count * 4), orb1 = new Float32Array(count * 4);
    const pvec = new Float32Array(count * 3), qvec = new Float32Array(count * 3);
    const cls = new Float32Array(count), visArr = new Float32Array(count).fill(1);
    const position = new Float32Array(count * 3); // unused by the shader, required by three
    for (let k = 0; k < count; k++) {
      const b = k * STRIDE;
      orb0.set(elements.subarray(b + F.a, b + F.a + 4), k * 4);
      orb1[k * 4] = elements[b + F.epoch]!;
      orb1[k * 4 + 1] = elements[b + F.H]!;
      orb1[k * 4 + 2] = elements[b + F.moid]!;
      orb1[k * 4 + 3] = elements[b + F.flags]!;
      pvec.set(elements.subarray(b + F.P, b + F.P + 3), k * 3);
      qvec.set(elements.subarray(b + F.Q, b + F.Q + 3), k * 3);
      cls[k] = elements[b + F.cls]!;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(position, 3));
    g.setAttribute('orb0', new THREE.BufferAttribute(orb0, 4));
    g.setAttribute('orb1', new THREE.BufferAttribute(orb1, 4));
    g.setAttribute('pvec', new THREE.BufferAttribute(pvec, 3));
    g.setAttribute('qvec', new THREE.BufferAttribute(qvec, 3));
    g.setAttribute('cls', new THREE.BufferAttribute(cls, 1));
    const vis = new THREE.BufferAttribute(visArr, 1);
    vis.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('vis', vis);

    const classes = this.data.meta.classes.slice(0, 8);
    const material = new THREE.ShaderMaterial({
      vertexShader: asteroidVertex,
      fragmentShader: asteroidFragment,
      uniforms: {
        uT: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uColorMode: { value: 0 },
        uClassColors: { value: classes.map((c) => new THREE.Color(classColor(c))) },
        uDim: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(g, material);
    points.frustumCulled = false;
    this.scene.add(points);
    return { points, material, vis };
  }

  private buildComets(comets: CometRow[]): { points: THREE.Points; tails: THREE.LineSegments } {
    const g = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(this.cometPositions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', posAttr);
    const bright = new Float32Array(comets.map((c) => (c.M1 === null ? 0.2 : THREE.MathUtils.clamp((16 - c.M1) / 10, 0, 1))));
    g.setAttribute('bright', new THREE.BufferAttribute(bright, 1));
    const points = new THREE.Points(g, new THREE.ShaderMaterial({
      vertexShader: cometVertex, fragmentShader: cometFragment,
      uniforms: { uPixelRatio: { value: this.renderer.getPixelRatio() } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    points.frustumCulled = false;
    this.scene.add(points);

    const tg = new THREE.BufferGeometry();
    const tailPos = new THREE.BufferAttribute(new Float32Array(comets.length * 6), 3);
    tailPos.setUsage(THREE.DynamicDrawUsage);
    tg.setAttribute('position', tailPos);
    const tails = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({
      color: 0x8fe9ff, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    tails.frustumCulled = false;
    this.scene.add(tails);
    return { points, tails };
  }

  private addLabel(cls: string, ref: BodyRef | null, fixed?: THREE.Vector3): LabelEntry {
    const el = document.createElement('div');
    el.className = `label ${cls}`;
    this.labelLayer.appendChild(el);
    const entry: LabelEntry = fixed ? { el, ref, fixed } : { el, ref };
    this.labels.push(entry);
    return entry;
  }

  // ---------------------------------------------------------------- positions

  /** Heliocentric position of any body in scene coordinates. */
  positionOf(ref: BodyRef, jd: number, out: THREE.Vector3): THREE.Vector3 {
    const p = tmp3;
    switch (ref.kind) {
      case 'sun':
        return out.set(0, 0, 0);
      case 'planet':
        ellipticPosition(this.planetOrbits[ref.index]!, jd, p);
        break;
      case 'asteroid':
        asteroidPosition(this.data.elements, ref.index, jd, p, 0);
        break;
      case 'comet':
        conicPosition(this.cometOrbits[ref.index]!, jd, p);
        break;
    }
    return toScene(out, p[0]!, p[1]!, p[2]!);
  }

  /** Distance (au) between two bodies at time jd. */
  distanceBetween(a: BodyRef, b: BodyRef, jd: number): number {
    this.positionOf(a, jd, tmpA);
    this.positionOf(b, jd, tmpB);
    return tmpA.distanceTo(tmpB);
  }

  private ensureCachedPositions(jd: number): void {
    if (this.cachedJd === jd) return;
    const { elements, count } = this.data;
    const out = this.cachedPositions;
    const p = tmp3;
    for (let k = 0; k < count; k++) {
      if (this.visibility[k] === 0) continue;
      asteroidPosition(elements, k, jd, p, 0);
      out[k * 3] = p[0]!;
      out[k * 3 + 1] = p[2]!;
      out[k * 3 + 2] = -p[1]!;
    }
    this.cachedJd = jd;
  }

  // ---------------------------------------------------------------- filters / visuals

  setVisibility(mask: Uint8Array): void {
    this.visibility = mask;
    const arr = this.visAttr.array as Float32Array;
    for (let k = 0; k < mask.length; k++) arr[k] = mask[k]!;
    this.visAttr.needsUpdate = true;
    this.cachedJd = NaN;
  }

  setColorMode(mode: ColorMode): void {
    this.asteroidMaterial.uniforms.uColorMode!.value = mode === 'hazard' ? 0 : mode === 'class' ? 1 : 2;
  }

  /** Rebuild the merged orbit lines for the currently visible asteroids (capped). */
  setFilteredOrbits(show: boolean): void {
    if (this.filteredOrbits) {
      this.scene.remove(this.filteredOrbits);
      this.filteredOrbits.geometry.dispose();
      this.filteredOrbits = null;
    }
    if (!show) return;
    const idx: number[] = [];
    for (let k = 0; k < this.visibility.length && idx.length < MAX_FILTERED_ORBITS; k++) if (this.visibility[k]) idx.push(k);
    const seg = 96;
    const pos = new Float32Array(idx.length * seg * 6);
    let o = 0;
    for (const k of idx) {
      const pts = sampleEllipse(elementsA(this.data.elements, k), elementsE(this.data.elements, k), elementsPf(this.data.elements, k), seg);
      for (let s = 0; s < seg; s++) {
        pos[o++] = pts[s * 3]!; pos[o++] = pts[s * 3 + 2]!; pos[o++] = -pts[s * 3 + 1]!;
        pos[o++] = pts[s * 3 + 3]!; pos[o++] = pts[s * 3 + 5]!; pos[o++] = -pts[s * 3 + 4]!;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.filteredOrbits = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      color: 0x6f8fc9, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.filteredOrbits.frustumCulled = false;
    this.scene.add(this.filteredOrbits);
  }

  private orbitLineFor(ref: BodyRef, color: number, opacity: number): THREE.Line | null {
    let pts: Float32Array;
    if (ref.kind === 'asteroid') {
      const el = this.data.elements;
      pts = sampleEllipse(elementsA(el, ref.index), elementsE(el, ref.index), elementsPf(el, ref.index), 256);
    } else if (ref.kind === 'comet') {
      const c = this.cometOrbits[ref.index]!;
      pts = sampleConic(c.e, c.q, c.pf, 512, ORBIT_RMAX);
    } else return null;
    const line = new THREE.Line(lineGeometry(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
    line.frustumCulled = false;
    return line;
  }

  setSelected(ref: BodyRef | null): void {
    if (this.selectedOrbit) { this.scene.remove(this.selectedOrbit); this.selectedOrbit.geometry.dispose(); this.selectedOrbit = null; }
    this.selectedOrbit = ref ? this.orbitLineFor(ref, 0xffffff, 0.8) : null;
    if (this.selectedOrbit) this.scene.add(this.selectedOrbit);
    this.selectedLabel.ref = ref;
    this.selectedLabel.el.textContent = ref ? this.nameOf(ref) : '';
    this.selectMarker.visible = ref !== null && ref.kind !== 'sun';
  }

  setHovered(ref: BodyRef | null): void {
    if (this.hoverOrbit) { this.scene.remove(this.hoverOrbit); this.hoverOrbit.geometry.dispose(); this.hoverOrbit = null; }
    this.hoverOrbit = ref ? this.orbitLineFor(ref, 0x9ad0ff, 0.45) : null;
    if (this.hoverOrbit) this.scene.add(this.hoverOrbit);
    this.hoverLabel.ref = ref;
    this.hoverLabel.el.textContent = ref ? this.nameOf(ref) : '';
    this.hoverMarker.visible = ref !== null && ref.kind !== 'sun';
  }

  nameOf(ref: BodyRef): string {
    switch (ref.kind) {
      case 'sun': return 'Sun';
      case 'planet': return this.data.planets[ref.index]!.name;
      case 'asteroid': return this.data.meta.full_name[ref.index]!;
      case 'comet': return this.data.comets[ref.index]!.full_name;
    }
  }

  // ---------------------------------------------------------------- camera

  /** Fly the camera to look at a body from a sensible distance. */
  flyTo(ref: BodyRef, jd: number): void {
    const target = this.positionOf(ref, jd, new THREE.Vector3());
    const dist = ref.kind === 'sun' ? 3 : ref.kind === 'planet' ? planetVisualRadius(this.data.planets[ref.index]!.radius_km) * 14 : 0.25;
    const dir = this.camera.position.clone().sub(this.controls.target);
    if (dir.lengthSq() < 1e-9) dir.set(0, 0.5, 1);
    dir.normalize();
    // keep a bit of elevation so we look down onto the ecliptic
    dir.y = Math.max(dir.y, 0.35);
    dir.normalize();
    this.flyFrom = this.camera.position.clone();
    this.flyDest.copy(target).addScaledVector(dir, dist);
    this.flyTargetFrom.copy(this.controls.target);
    this.flyTargetTo.copy(target);
    this.flyT = 0;
  }

  /** Reset to the default overview of the inner solar system. */
  resetView(): void {
    this.flyFrom = this.camera.position.clone();
    this.flyDest.set(0, 2.4, 4.2);
    this.flyTargetFrom.copy(this.controls.target);
    this.flyTargetTo.set(0, 0, 0);
    this.flyT = 0;
  }

  setCamera(pos: THREE.Vector3, target: THREE.Vector3): void {
    this.flyFrom = null;
    this.flyT = 1;
    this.camera.position.copy(pos);
    this.controls.target.copy(target);
    this.controls.update();
  }

  resize(): void {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- picking

  /** Find the body under a screen point (CSS px within the container). */
  pick(x: number, y: number, jd: number, includeComets: boolean): PickResult | null {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.camera.updateMatrixWorld();
    const view = tmpM.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    const radius = 14;
    let best: PickResult | null = null;
    let bestD = radius * radius;
    const test = (ref: BodyRef, px: number, py: number, pz: number, bonus = 0) => {
      const v = tmpA.set(px, py, pz).applyMatrix4(view);
      if (v.z > 1 || v.z < -1) return;
      const sx = (v.x * 0.5 + 0.5) * w, sy = (0.5 - v.y * 0.5) * h;
      const d = (sx - x) ** 2 + (sy - y) ** 2 - bonus;
      if (d < bestD) { bestD = d; best = { ref, screenX: sx, screenY: sy }; }
    };
    // planets first (larger targets)
    this.planetMeshes.forEach((m, index) => test({ kind: 'planet', index }, m.position.x, m.position.y, m.position.z, 60));
    test({ kind: 'sun' }, 0, 0, 0, 80);
    this.ensureCachedPositions(jd);
    const cp = this.cachedPositions;
    // cheap frustum reject: skip points behind the camera by checking NDC in test()
    for (let k = 0; k < this.data.count; k++) {
      if (this.visibility[k] === 0) continue;
      test({ kind: 'asteroid', index: k }, cp[k * 3]!, cp[k * 3 + 1]!, cp[k * 3 + 2]!);
    }
    if (includeComets) {
      const c = this.cometPositions;
      for (let k = 0; k < this.data.comets.length; k++) test({ kind: 'comet', index: k }, c[k * 3]!, c[k * 3 + 1]!, c[k * 3 + 2]!);
    }
    return best;
  }

  // ---------------------------------------------------------------- per-frame

  update(state: AppState, dtSeconds: number): void {
    const jd = state.jd;
    this.asteroidMaterial.uniforms.uT!.value = jd - J2000;

    // planets
    this.planetMeshes.forEach((m, i) => this.positionOf({ kind: 'planet', index: i }, jd, m.position));
    this.planetOrbitLines.forEach((l) => (l.visible = state.showPlanetOrbits));
    this.gridGroup.visible = state.showGrid;

    // comets (CPU)
    this.cometPoints.visible = state.showComets;
    this.cometTails.visible = state.showComets && state.showCometTails;
    if (state.showComets) this.updateComets(jd, state.showCometTails);

    // markers
    if (state.selected && state.selected.kind !== 'sun') this.positionOf(state.selected, jd, this.selectMarker.position);
    const hoverIsSelected = sameBody(state.hovered, state.selected);
    this.hoverMarker.visible = state.hovered !== null && state.hovered.kind !== 'sun' && !hoverIsSelected;
    if (this.hoverOrbit) this.hoverOrbit.visible = !hoverIsSelected;
    if (state.hovered && state.hovered.kind !== 'sun') this.positionOf(state.hovered, jd, this.hoverMarker.position);

    // follow: move camera with the selected body
    if (state.follow && state.selected && this.flyT >= 1) {
      const p = this.positionOf(state.selected, jd, tmpA);
      const delta = tmpB.subVectors(p, this.controls.target);
      this.camera.position.add(delta);
      this.controls.target.copy(p);
    }

    // camera fly animation
    if (this.flyT < 1 && this.flyFrom) {
      this.flyT = Math.min(1, this.flyT + dtSeconds / 0.9);
      const e = 1 - Math.pow(1 - this.flyT, 3);
      if (state.follow && state.selected) this.positionOf(state.selected, jd, this.flyTargetTo);
      this.camera.position.lerpVectors(this.flyFrom, this.flyDest, e);
      this.controls.target.lerpVectors(this.flyTargetFrom, this.flyTargetTo, e);
    }
    this.controls.update();

    this.approachLines.visible = state.showApproachLines;
    if (state.showApproachLines) this.updateApproachLines(jd);

    this.renderer.render(this.scene, this.camera);
    this.updateLabels(state);
  }

  private updateComets(jd: number, tails: boolean): void {
    const pos = this.cometPositions;
    const tail = this.cometTails.geometry.getAttribute('position') as THREE.BufferAttribute;
    const tarr = tail.array as Float32Array;
    const p = tmp3;
    for (let k = 0; k < this.cometOrbits.length; k++) {
      conicPosition(this.cometOrbits[k]!, jd, p);
      const x = p[0]!, y = p[2]!, z = -p[1]!;
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
      if (tails) {
        const r = Math.hypot(x, y, z);
        const len = Math.min(0.6, 0.12 / (r * r + 0.02)); // tails grow near the Sun, point away from it
        const s = r > 1e-6 ? 1 + len / r : 1;
        tarr[k * 6] = x; tarr[k * 6 + 1] = y; tarr[k * 6 + 2] = z;
        tarr[k * 6 + 3] = x * s; tarr[k * 6 + 4] = y * s; tarr[k * 6 + 5] = z * s;
      }
    }
    (this.cometPoints.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    if (tails) tail.needsUpdate = true;
  }

  private approachWindowDays = 5;
  private updateApproachLines(jd: number): void {
    const { approaches } = this.data;
    const lo = lowerBound(approaches.jd, jd - this.approachWindowDays);
    const hi = lowerBound(approaches.jd, jd + this.approachWindowDays);
    const earth = this.planetMeshes[2]!.position;
    const seg: number[] = [];
    for (let r = lo; r < hi && seg.length < MAX_APPROACH_LINES * 6; r++) {
      const ai = approaches.idx[r]!;
      if (this.visibility[ai] === 0) continue;
      this.positionOf({ kind: 'asteroid', index: ai }, jd, tmpA);
      seg.push(earth.x, earth.y, earth.z, tmpA.x, tmpA.y, tmpA.z);
    }
    const g = this.approachLines.geometry;
    const existing = g.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!existing || existing.count < seg.length / 3) {
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(Math.max(seg.length, 6 * 32)), 3));
    }
    const attr = g.getAttribute('position') as THREE.BufferAttribute;
    (attr.array as Float32Array).set(seg);
    attr.needsUpdate = true;
    g.setDrawRange(0, seg.length / 3);
  }

  private updateLabels(state: AppState): void {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    const view = tmpM.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    for (const l of this.labels) {
      if (!state.showLabels && !l.el.classList.contains('selected') && !l.el.classList.contains('hover')) { l.el.style.display = 'none'; continue; }
      let p: THREE.Vector3;
      if (l.fixed) {
        if (!state.showGrid) { l.el.style.display = 'none'; continue; }
        p = tmpA.copy(l.fixed);
      } else if (l.ref) {
        const isPlanetOrHover = l.el.classList.contains('planet') || l.el.classList.contains('hover');
        if (isPlanetOrHover && sameBody(l.ref, state.selected)) { l.el.style.display = 'none'; continue; }
        p = this.positionOf(l.ref, state.jd, tmpA);
      } else { l.el.style.display = 'none'; continue; }
      p.applyMatrix4(view);
      if (p.z < -1 || p.z > 1) { l.el.style.display = 'none'; continue; }
      l.el.style.display = '';
      l.el.style.transform = `translate(${((p.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((0.5 - p.y * 0.5) * h).toFixed(1)}px)`;
    }
  }
}

// ------------------------------------------------------------------ helpers

const tmp3 = new Float32Array(3);
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpM = new THREE.Matrix4();

function planetOrbit(p: PlanetRow): EllipticOrbit {
  return { a: p.a, e: p.e, ma: p.ma * DEG, n: p.n * DEG, epoch: p.epoch, pf: perifocal(p.i, p.om, p.w) };
}

function cometOrbit(c: CometRow): ConicOrbit {
  return { e: c.e, q: c.q, tp: c.tp, pf: { P: c.P, Q: c.Q } };
}

const elementsA = (el: Float32Array, k: number): number => el[k * STRIDE + F.a]!;
const elementsE = (el: Float32Array, k: number): number => el[k * STRIDE + F.e]!;
function elementsPf(el: Float32Array, k: number): Perifocal {
  const b = k * STRIDE;
  return { P: [el[b + F.P]!, el[b + F.P + 1]!, el[b + F.P + 2]!], Q: [el[b + F.Q]!, el[b + F.Q + 1]!, el[b + F.Q + 2]!] };
}

/** Ecliptic position of asteroid k at jd, written to out[o..o+2]. Mirrors the vertex shader. */
export function asteroidPosition(el: Float32Array, k: number, jd: number, out: Float32Array | number[], o: number): void {
  const b = k * STRIDE;
  const a = el[b + F.a]!, e = el[b + F.e]!;
  let M = el[b + F.ma]! + el[b + F.n]! * (jd - J2000 - el[b + F.epoch]!);
  M = ((M % TWO_PI) + TWO_PI) % TWO_PI;
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 12; i++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  const x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  out[o] = x * el[b + F.P]! + y * el[b + F.Q]!;
  out[o + 1] = x * el[b + F.P + 1]! + y * el[b + F.Q + 1]!;
  out[o + 2] = x * el[b + F.P + 2]! + y * el[b + F.Q + 2]!;
}

/** Orbit sample points (ecliptic) -> scene-space line geometry. */
function lineGeometry(pts: Float32Array): THREE.BufferGeometry {
  const pos = new Float32Array(pts.length);
  for (let k = 0; k < pts.length; k += 3) {
    pos[k] = pts[k]!; pos[k + 1] = pts[k + 2]!; pos[k + 2] = -pts[k + 1]!;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return g;
}

function radialTexture(color: string): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, color);
  grad.addColorStop(0.25, color + 'aa');
  grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeRingSprite(color: string, scale: number): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(32, 32, 24, 0, TWO_PI);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, sizeAttenuation: false }));
  s.scale.setScalar(scale);
  s.renderOrder = 10;
  s.visible = false;
  return s;
}

/** First index in sorted `arr` with arr[i] >= v. */
export function lowerBound(arr: number[], v: number): number {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid]! < v) lo = mid + 1; else hi = mid;
  }
  return lo;
}

