import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  AU_KM,
  AU_SCALE,
  propagate,
  sampleOrbit,
  SUN_RADIUS_KM,
  vec3ToScene,
  type OrbitalElements,
  type Vec3,
} from './orbit';
import type { AppState, Asteroid, BodyRef, Comet, LoadedData, Planet } from './types';

const PLANET_COLORS: Record<string, number> = {
  Mercury: 0xb1b1b1,
  Venus: 0xe8cda0,
  Earth: 0x4f8fd4,
  Mars: 0xc1440e,
  Jupiter: 0xd4a574,
  Saturn: 0xe8d5a3,
  Uranus: 0x93b8c4,
  Neptune: 0x5b7fd4,
};

const PLANET_DISPLAY_RADII: Record<string, number> = {
  Mercury: 0.35,
  Venus: 0.55,
  Earth: 0.6,
  Mars: 0.45,
  Jupiter: 1.8,
  Saturn: 1.5,
  Uranus: 1.0,
  Neptune: 1.0,
};

function kmToSceneRadius(km: number): number {
  return (km / AU_KM) * AU_SCALE * 800;
}

export class SolarSystemScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly scene = new THREE.Scene();
  readonly raycaster = new THREE.Raycaster();
  readonly pointer = new THREE.Vector2();

  private data!: LoadedData;
  private planetMeshes: THREE.Mesh[] = [];
  private planetOrbits: THREE.Line[] = [];
  private sunMesh!: THREE.Mesh;
  private asteroidPoints!: THREE.Points;
  private asteroidPositions!: Float32Array;
  private asteroidColors!: Float32Array;
  private asteroidSizes!: Float32Array;
  private asteroidVisible!: Uint8Array;
  private cometPoints!: THREE.Points;
  private cometPositions!: Float32Array;
  private cometCount = 0;
  private selectedMarker!: THREE.Mesh;
  private labelSprites = new Map<string, THREE.Sprite>();

  private filteredIndices: number[] = [];
  private onSelect?: (ref: BodyRef | null) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x050810);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.01, 5000);
    this.camera.position.set(0, 80, 120);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 800;

    this.selectedMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.0, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }),
    );
    this.selectedMarker.rotation.x = Math.PI / 2;
    this.selectedMarker.visible = false;
    this.scene.add(this.selectedMarker);

    this.setupLights();
    this.setupStarfield();
  }

  setSelectCallback(cb: (ref: BodyRef | null) => void): void {
    this.onSelect = cb;
  }

  init(data: LoadedData): void {
    this.data = data;
    this.buildSun();
    this.buildPlanets();
    this.buildAsteroids();
    this.buildComets();
    this.applyFilters({ search: '', phaOnly: false, sentryOnly: false, orbitClass: '', moidMax: null, showComets: false, showOrbits: true });
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x334466, 0.6);
    this.scene.add(ambient);
    const sunLight = new THREE.PointLight(0xfff5e0, 3, 0, 0.5);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);
  }

  private setupStarfield(): void {
    const count = 4000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 800 + Math.random() * 1200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x8899bb, size: 0.8, sizeAttenuation: true });
    this.scene.add(new THREE.Points(geo, mat));
  }

  private buildSun(): void {
    const r = kmToSceneRadius(SUN_RADIUS_KM);
    const geo = new THREE.SphereGeometry(Math.max(r, 2.5), 32, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffdd55 });
    this.sunMesh = new THREE.Mesh(geo, mat);
    this.sunMesh.userData = { bodyRef: { kind: 'sun', id: 'sun' } as BodyRef };
    this.scene.add(this.sunMesh);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(r, 2.5) * 1.4, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.15 }),
    );
    this.scene.add(glow);
  }

  private buildPlanets(): void {
    for (const planet of this.data.planets) {
      const displayR = PLANET_DISPLAY_RADII[planet.name] ?? 0.5;
      const geo = new THREE.SphereGeometry(displayR, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: PLANET_COLORS[planet.name] ?? 0xaaaaaa,
        roughness: 0.8,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { bodyRef: { kind: 'planet', id: planet.name } as BodyRef, planet };
      this.planetMeshes.push(mesh);
      this.scene.add(mesh);

      const orbitPts = sampleOrbit(planet, 256);
      if (orbitPts.length > 1) {
        const verts: number[] = [];
        for (const p of orbitPts) {
          const s = vec3ToScene(p);
          verts.push(s.x, s.y, s.z);
        }
        const geoLine = new THREE.BufferGeometry();
        geoLine.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        const line = new THREE.Line(
          geoLine,
          new THREE.LineBasicMaterial({ color: PLANET_COLORS[planet.name] ?? 0x666666, transparent: true, opacity: 0.35 }),
        );
        this.planetOrbits.push(line);
        this.scene.add(line);
      }
    }
  }

  private buildAsteroids(): void {
    const n = this.data.asteroids.length;
    this.asteroidPositions = new Float32Array(n * 3);
    this.asteroidColors = new Float32Array(n * 3);
    this.asteroidSizes = new Float32Array(n);
    this.asteroidVisible = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
      const a = this.data.asteroids[i];
      const sentry = this.data.sentryByDes.get(a.pdes);
      let r = 0.35;
      let g = 0.55;
      let b = 0.85;

      if (a.pha) {
        r = 1; g = 0.45; b = 0.15;
      } else if (sentry) {
        r = 1; g = 0.2; b = 0.35;
      }

      this.asteroidColors[i * 3] = r;
      this.asteroidColors[i * 3 + 1] = g;
      this.asteroidColors[i * 3 + 2] = b;

      const diam = a.diameter ?? (a.H != null ? Math.pow(10, 3.1236 - 0.5 * a.H) : 0.1);
      this.asteroidSizes[i] = Math.min(2.5, Math.max(0.15, Math.log10(diam + 0.01) * 0.5 + 0.3));
      this.asteroidVisible[i] = 1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.asteroidPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.asteroidColors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.asteroidSizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          if (dot(c,c) > 0.25) discard;
          gl_FragColor = vec4(vColor, 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    this.asteroidPoints = new THREE.Points(geo, mat);
    this.asteroidPoints.frustumCulled = false;
    this.asteroidPoints.userData = { isAsteroids: true };
    this.scene.add(this.asteroidPoints);

    this.filteredIndices = Array.from({ length: n }, (_, i) => i);
  }

  private buildComets(): void {
    const elliptic = this.data.comets.filter((c) => c.e < 1 || (c.tp != null && c.q != null));
    this.cometCount = elliptic.length;
    this.cometPositions = new Float32Array(this.cometCount * 3);

    const colors = new Float32Array(this.cometCount * 3);
    for (let i = 0; i < this.cometCount; i++) {
      colors[i * 3] = 0.6;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.cometPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 1.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      depthWrite: false,
    });

    this.cometPoints = new THREE.Points(geo, mat);
    this.cometPoints.visible = false;
    this.cometPoints.userData = { isComets: true, ellipticIndices: elliptic.map((_, i) => i) };
    (this.cometPoints.userData as { comets: Comet[] }).comets = elliptic;
    this.scene.add(this.cometPoints);
  }

  applyFilters(filters: AppState['filters']): void {
    const n = this.data.asteroids.length;
    this.filteredIndices = [];
    const search = filters.search.trim().toLowerCase();

    for (let i = 0; i < n; i++) {
      const a = this.data.asteroids[i];
      let visible = true;

      if (filters.phaOnly && !a.pha) visible = false;
      if (filters.sentryOnly && !this.data.sentryByDes.has(a.pdes)) visible = false;
      if (filters.orbitClass && a.class !== filters.orbitClass) visible = false;
      if (filters.moidMax != null && (a.moid == null || a.moid > filters.moidMax)) visible = false;

      if (search) {
        const hay = `${a.full_name} ${a.pdes} ${a.name ?? ''}`.toLowerCase();
        if (!hay.includes(search)) visible = false;
      }

      this.asteroidVisible[i] = visible ? 1 : 0;
      if (visible) this.filteredIndices.push(i);

      if (!visible) {
        this.asteroidPositions[i * 3] = 0;
        this.asteroidPositions[i * 3 + 1] = -99999;
        this.asteroidPositions[i * 3 + 2] = 0;
        this.asteroidSizes[i] = 0;
      } else if (!search) {
        const diam = a.diameter ?? (a.H != null ? Math.pow(10, 3.1236 - 0.5 * a.H) : 0.1);
        this.asteroidSizes[i] = Math.min(2.5, Math.max(0.15, Math.log10(diam + 0.01) * 0.5 + 0.3));
      } else {
        this.asteroidSizes[i] = Math.min(3, this.asteroidSizes[i] * 1.5);
      }
    }

    this.cometPoints.visible = filters.showComets;
    for (const line of this.planetOrbits) {
      line.visible = filters.showOrbits;
    }

    this.asteroidPoints.geometry.attributes.position.needsUpdate = true;
    this.asteroidPoints.geometry.attributes.size.needsUpdate = true;
  }

  updatePositions(jd: number): void {
    for (let pi = 0; pi < this.data.planets.length; pi++) {
      const planet = this.data.planets[pi];
      const pos = propagate(planet, jd);
      if (pos) {
        const s = vec3ToScene(pos);
        this.planetMeshes[pi].position.set(s.x, s.y, s.z);
      }
    }

    const asteroids = this.data.asteroids;
    for (const i of this.filteredIndices) {
      const pos = propagate(asteroids[i], jd);
      if (pos) {
        const s = vec3ToScene(pos);
        this.asteroidPositions[i * 3] = s.x;
        this.asteroidPositions[i * 3 + 1] = s.y;
        this.asteroidPositions[i * 3 + 2] = s.z;
      }
    }
    this.asteroidPoints.geometry.attributes.position.needsUpdate = true;

    if (this.cometPoints.visible) {
      const comets = (this.cometPoints.userData as { comets: Comet[] }).comets;
      for (let i = 0; i < comets.length; i++) {
        const pos = propagate(comets[i], jd);
        if (pos) {
          const s = vec3ToScene(pos);
          this.cometPositions[i * 3] = s.x;
          this.cometPositions[i * 3 + 1] = s.y;
          this.cometPositions[i * 3 + 2] = s.z;
        }
      }
      this.cometPoints.geometry.attributes.position.needsUpdate = true;
    }
  }

  updateSelectedMarker(ref: BodyRef | null, jd: number): THREE.Vector3 | null {
    if (!ref) {
      this.selectedMarker.visible = false;
      return null;
    }

    let pos: Vec3 | null = null;
    if (ref.kind === 'sun') {
      pos = { x: 0, y: 0, z: 0 };
    } else if (ref.kind === 'planet') {
      const p = this.data.planets.find((pl) => pl.name === ref.id);
      if (p) pos = propagate(p, jd);
    } else if (ref.kind === 'asteroid' && ref.index != null) {
      pos = propagate(this.data.asteroids[ref.index], jd);
    } else if (ref.kind === 'comet' && ref.index != null) {
      const comets = (this.cometPoints.userData as { comets: Comet[] }).comets;
      pos = propagate(comets[ref.index], jd);
    }

    if (!pos) {
      this.selectedMarker.visible = false;
      return null;
    }

    const s = vec3ToScene(pos);
    this.selectedMarker.position.set(s.x, s.y, s.z);
    this.selectedMarker.visible = true;
    const scale = ref.kind === 'planet' ? 3 : ref.kind === 'sun' ? 5 : 2;
    this.selectedMarker.scale.setScalar(scale);
    return new THREE.Vector3(s.x, s.y, s.z);
  }

  handleClick(clientX: number, clientY: number, width: number, height: number): void {
    this.pointer.x = (clientX / width) * 2 - 1;
    this.pointer.y = -(clientY / height) * 2 + 1;
    this.raycaster.params.Points!.threshold = 1.5;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const planetHits = this.raycaster.intersectObjects(this.planetMeshes);
    if (planetHits.length > 0) {
      this.onSelect?.(planetHits[0].object.userData.bodyRef as BodyRef);
      return;
    }

    if (this.sunMesh) {
      const sunHits = this.raycaster.intersectObject(this.sunMesh);
      if (sunHits.length > 0) {
        this.onSelect?.({ kind: 'sun', id: 'sun' });
        return;
      }
    }

    const pointHits = this.raycaster.intersectObject(this.asteroidPoints);
    if (pointHits.length > 0 && pointHits[0].index != null) {
      const idx = this.findNearestAsteroidIndex(pointHits[0].point);
      if (idx >= 0) {
        this.onSelect?.({ kind: 'asteroid', id: this.data.asteroids[idx].pdes, index: idx });
        return;
      }
    }

    if (this.cometPoints.visible) {
      const cometHits = this.raycaster.intersectObject(this.cometPoints);
      if (cometHits.length > 0 && cometHits[0].index != null) {
        const comets = (this.cometPoints.userData as { comets: Comet[] }).comets;
        const ci = cometHits[0].index;
        if (ci < comets.length) {
          this.onSelect?.({ kind: 'comet', id: comets[ci].pdes, index: ci });
          return;
        }
      }
    }
  }

  private findNearestAsteroidIndex(point: THREE.Vector3): number {
    let best = -1;
    let bestDist = Infinity;
    const tmp = new THREE.Vector3();
    for (const i of this.filteredIndices.slice(0, 5000)) {
      tmp.set(
        this.asteroidPositions[i * 3],
        this.asteroidPositions[i * 3 + 1],
        this.asteroidPositions[i * 3 + 2],
      );
      const d = tmp.distanceToSquared(point);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    if (bestDist > 25) return -1;
    return best;
  }

  searchAndSelect(query: string): BodyRef | null {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    for (const p of this.data.planets) {
      if (p.name.toLowerCase().includes(q)) {
        return { kind: 'planet', id: p.name };
      }
    }

    for (let i = 0; i < this.data.asteroids.length; i++) {
      const a = this.data.asteroids[i];
      const hay = `${a.full_name} ${a.pdes} ${a.name ?? ''}`.toLowerCase();
      if (hay.includes(q)) {
        return { kind: 'asteroid', id: a.pdes, index: i };
      }
    }

    const comets = (this.cometPoints.userData as { comets?: Comet[] }).comets;
    if (comets) {
      for (let i = 0; i < comets.length; i++) {
        if (comets[i].full_name.toLowerCase().includes(q) || comets[i].pdes.toLowerCase().includes(q)) {
          return { kind: 'comet', id: comets[i].pdes, index: i };
        }
      }
    }

    return null;
  }

  resetCamera(): void {
    this.camera.position.set(0, 80, 120);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  getCameraState(): { px: number; py: number; pz: number; tx: number; ty: number; tz: number } {
    return {
      px: this.camera.position.x,
      py: this.camera.position.y,
      pz: this.camera.position.z,
      tx: this.controls.target.x,
      ty: this.controls.target.y,
      tz: this.controls.target.z,
    };
  }

  setCameraState(s: { px: number; py: number; pz: number; tx: number; ty: number; tz: number }): void {
    this.camera.position.set(s.px, s.py, s.pz);
    this.controls.target.set(s.tx, s.ty, s.tz);
    this.controls.update();
  }

  getStats(): { visible: number; total: number; comets: number } {
    return {
      visible: this.filteredIndices.length,
      total: this.data.asteroids.length,
      comets: this.cometCount,
    };
  }
}

export type { Planet, OrbitalElements, Vec3 };
