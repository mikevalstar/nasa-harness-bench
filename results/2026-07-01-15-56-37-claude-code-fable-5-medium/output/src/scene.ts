import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  AppData, AST_FLOATS, F_A, F_E, F_MA, F_N, F_EPOCH, F_PX, F_H,
  FLAG_PHA, FLAG_SENTRY, Comet, Planet,
} from './data';
import { solveKepler, conicPlanePos, pqBasis, J2000, DEG, TWO_PI } from './kepler';

// Scene units: 1 unit = 1 au. Ecliptic plane is the XZ plane
// (ecliptic x -> three x, ecliptic z -> three y, ecliptic y -> three -z... we
// use the mapping (x, z, -y) which preserves handedness).
const AU_KM = 149597870.7;

export type Selection =
  | { type: 'ast'; index: number }
  | { type: 'planet'; index: number }
  | { type: 'comet'; index: number };

const PLANET_COLORS: Record<string, number> = {
  Mercury: 0xb8a89a, Venus: 0xe8c88a, Earth: 0x5aa7e8, Mars: 0xe07850,
  Jupiter: 0xd8b48a, Saturn: 0xe8d8a8, Uranus: 0x9ad8e0, Neptune: 0x6a8ae8,
};

function sizeFromH(H: number): number {
  return Math.min(6.5, Math.max(1.1, 1.1 + (24 - H) * 0.33));
}

function makeCircleTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  return t;
}

function makeRingTexture(color: string): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.strokeStyle = color;
  g.lineWidth = 6;
  g.beginPath();
  g.arc(64, 64, 52, 0, Math.PI * 2);
  g.stroke();
  return new THREE.CanvasTexture(c);
}

function makeLabelSprite(text: string, color = '#cfd8ea', px = 26): THREE.Sprite {
  const pad = 8;
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  const font = `500 ${px}px system-ui, -apple-system, sans-serif`;
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + pad * 2;
  const h = px + pad * 2;
  c.width = w * 2; c.height = h * 2;
  const g2 = c.getContext('2d')!;
  g2.scale(2, 2);
  g2.font = font;
  g2.fillStyle = color;
  g2.shadowColor = 'rgba(0,0,0,0.9)';
  g2.shadowBlur = 4;
  g2.textBaseline = 'middle';
  g2.fillText(text, pad, h / 2);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
  const s = new THREE.Sprite(mat);
  s.userData.aspect = w / h;
  s.userData.baseH = h;
  return s;
}

const pointVert = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    if (aAlpha < 0.01) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float d = max(0.0001, -mv.z);
    gl_PointSize = aSize * uPixelRatio * clamp(3.0 / d, 0.7, 2.6);
    gl_Position = projectionMatrix * mv;
  }
`;
const pointFrag = /* glsl */ `
  uniform sampler2D uTex;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 t = texture2D(uTex, gl_PointCoord);
    if (t.a * vAlpha < 0.02) discard;
    gl_FragColor = vec4(vColor, t.a * vAlpha);
  }
`;

export class SceneManager {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  data: AppData;

  // asteroids
  astPositions: Float32Array;
  astAlpha: Float32Array;
  astColor: Float32Array;
  astSize: Float32Array;
  astEcache: Float32Array;
  astGeo: THREE.BufferGeometry;
  filterMask: Uint8Array;

  // comets
  cometPositions: Float32Array;
  cometAlpha: Float32Array;
  cometGeo: THREE.BufferGeometry;
  cometTailPos: Float32Array;
  cometTailGeo: THREE.BufferGeometry;
  cometsVisible = true;

  planetMeshes: THREE.Mesh[] = [];
  planetLabels: THREE.Sprite[] = [];
  planetPQ: Float64Array[] = [];
  planetPos: Float64Array; // ecliptic xyz per planet

  selMarker: THREE.Sprite;
  hoverMarker: THREE.Sprite;
  orbitLine: THREE.Line | null = null;
  earthLine: THREE.Line;
  approachGeo: THREE.BufferGeometry;
  approachIndices: number[] = [];
  approachMarkers: THREE.Points;

  lastT = NaN;
  selection: Selection | null = null;
  private tmpV = new THREE.Vector3();

  constructor(container: HTMLElement, data: AppData) {
    this.data = data;
    const n = data.meta.count;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(0x04060c);

    this.camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.001, 3000);
    this.camera.position.set(1.6, 2.4, 2.6);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.02;
    this.controls.maxDistance = 120;

    // ---- starfield ----
    {
      const sn = 2600;
      const pos = new Float32Array(sn * 3);
      for (let i = 0; i < sn; i++) {
        const u = Math.random() * 2 - 1, ph = Math.random() * TWO_PI;
        const s = Math.sqrt(1 - u * u), R = 900;
        pos[i * 3] = R * s * Math.cos(ph);
        pos[i * 3 + 1] = R * u;
        pos[i * 3 + 2] = R * s * Math.sin(ph);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({
        color: 0x8890a8, size: 1.4, sizeAttenuation: false,
        transparent: true, opacity: 0.7, depthWrite: false,
      });
      this.scene.add(new THREE.Points(g, m));
    }

    // ---- ecliptic scale rings ----
    {
      const grid = new THREE.Group();
      for (const rad of [0.5, 1, 1.5, 2, 3, 4, 5]) {
        const pts: THREE.Vector3[] = [];
        for (let k = 0; k <= 180; k++) {
          const a = (k / 180) * TWO_PI;
          pts.push(new THREE.Vector3(Math.cos(a) * rad, 0, Math.sin(a) * rad));
        }
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        const major = Number.isInteger(rad);
        const m = new THREE.LineBasicMaterial({
          color: 0x2a3450, transparent: true, opacity: major ? 0.5 : 0.25, depthWrite: false,
        });
        grid.add(new THREE.Line(g, m));
        if (major) {
          const lbl = makeLabelSprite(`${rad} au`, '#4a5878', 20);
          lbl.position.set(rad * Math.SQRT1_2, 0.002, rad * Math.SQRT1_2);
          lbl.userData.fixedScale = 0.05;
          grid.add(lbl);
          this.planetLabels.push(lbl); // reuse distance-scaling list
        }
      }
      this.scene.add(grid);
    }

    // ---- sun ----
    {
      const sunR = 0.0232; // 5x real radius, matches planet exaggeration
      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(sunR, 32, 16),
        new THREE.MeshBasicMaterial({ color: 0xfff2c8 })
      );
      this.scene.add(sun);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeCircleTexture(), color: 0xffd889, transparent: true,
        opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      glow.scale.setScalar(0.28);
      this.scene.add(glow);
    }

    // ---- planets ----
    this.planetPos = new Float64Array(data.planets.length * 3);
    data.planets.forEach((p, pi) => {
      this.planetPQ.push(pqBasis(p.i, p.om, p.w));
      const color = PLANET_COLORS[p.name] ?? 0xaaaaaa;
      // 500x exaggeration, clamped — real sizes would be invisible at au scale
      const rad = Math.min(0.045, Math.max(0.006, (p.radius_km / AU_KM) * 500));
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(rad, 24, 12),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.userData.planetIndex = pi;
      this.scene.add(mesh);
      this.planetMeshes.push(mesh);
      const lbl = makeLabelSprite(p.name, '#dde6f4', 24);
      lbl.userData.fixedScale = 0.055;
      lbl.userData.trackPlanet = pi;
      lbl.userData.trackOffset = rad;
      this.scene.add(lbl);
      this.planetLabels.push(lbl);
      // orbit line
      const pts: THREE.Vector3[] = [];
      const PQ = this.planetPQ[pi];
      for (let k = 0; k <= 256; k++) {
        const E = (k / 256) * TWO_PI;
        const xp = p.a * (Math.cos(E) - p.e);
        const yp = p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(E);
        const ex = xp * PQ[0] + yp * PQ[3];
        const ey = xp * PQ[1] + yp * PQ[4];
        const ez = xp * PQ[2] + yp * PQ[5];
        pts.push(new THREE.Vector3(ex, ez, -ey));
      }
      const og = new THREE.BufferGeometry().setFromPoints(pts);
      const om = new THREE.LineBasicMaterial({
        color, transparent: true, opacity: p.name === 'Earth' ? 0.55 : 0.3, depthWrite: false,
      });
      this.scene.add(new THREE.Line(og, om));
    });

    // ---- asteroid point cloud ----
    this.astPositions = new Float32Array(n * 3);
    this.astAlpha = new Float32Array(n).fill(1);
    this.astColor = new Float32Array(n * 3);
    this.astSize = new Float32Array(n);
    this.astEcache = new Float32Array(n).fill(NaN);
    this.filterMask = new Uint8Array(n).fill(1);
    const ast = data.ast;
    for (let i = 0; i < n; i++) {
      const fl = data.flags[i];
      let r = 0.55, g = 0.62, b = 0.78; // ordinary NEO: cool gray-blue
      if (fl & FLAG_SENTRY) { r = 1.0; g = 0.25; b = 0.22; }
      else if (fl & FLAG_PHA) { r = 1.0; g = 0.58; b = 0.2; }
      this.astColor[i * 3] = r; this.astColor[i * 3 + 1] = g; this.astColor[i * 3 + 2] = b;
      this.astSize[i] = sizeFromH(ast[i * AST_FLOATS + F_H]) * ((fl & 3) ? 1.25 : 1);
    }
    this.astGeo = new THREE.BufferGeometry();
    this.astGeo.setAttribute('position', new THREE.BufferAttribute(this.astPositions, 3));
    this.astGeo.setAttribute('aColor', new THREE.BufferAttribute(this.astColor, 3));
    this.astGeo.setAttribute('aSize', new THREE.BufferAttribute(this.astSize, 1));
    this.astGeo.setAttribute('aAlpha', new THREE.BufferAttribute(this.astAlpha, 1));
    const astMat = new THREE.ShaderMaterial({
      vertexShader: pointVert, fragmentShader: pointFrag,
      uniforms: {
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uTex: { value: makeCircleTexture() },
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const astPoints = new THREE.Points(this.astGeo, astMat);
    astPoints.frustumCulled = false;
    this.scene.add(astPoints);

    // ---- comets ----
    const cn = data.comets.length;
    this.cometPositions = new Float32Array(cn * 3);
    this.cometAlpha = new Float32Array(cn).fill(1);
    const cometColor = new Float32Array(cn * 3);
    const cometSize = new Float32Array(cn);
    for (let i = 0; i < cn; i++) {
      cometColor[i * 3] = 0.36; cometColor[i * 3 + 1] = 0.85; cometColor[i * 3 + 2] = 0.9;
      const M1 = data.comets[i].M1;
      cometSize[i] = Math.min(6, Math.max(1.6, M1 == null ? 2.2 : 2.2 + (10 - M1) * 0.35));
    }
    this.cometGeo = new THREE.BufferGeometry();
    this.cometGeo.setAttribute('position', new THREE.BufferAttribute(this.cometPositions, 3));
    this.cometGeo.setAttribute('aColor', new THREE.BufferAttribute(cometColor, 3));
    this.cometGeo.setAttribute('aSize', new THREE.BufferAttribute(cometSize, 1));
    this.cometGeo.setAttribute('aAlpha', new THREE.BufferAttribute(this.cometAlpha, 1));
    const cometPoints = new THREE.Points(this.cometGeo, astMat.clone());
    (cometPoints.material as THREE.ShaderMaterial).uniforms.uTex.value = makeCircleTexture();
    (cometPoints.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
    cometPoints.frustumCulled = false;
    this.scene.add(cometPoints);
    this.cometPoints = cometPoints;

    // comet tails (anti-sunward line segments, stronger near the Sun)
    this.cometTailPos = new Float32Array(cn * 6);
    this.cometTailGeo = new THREE.BufferGeometry();
    this.cometTailGeo.setAttribute('position', new THREE.BufferAttribute(this.cometTailPos, 3));
    const tails = new THREE.LineSegments(this.cometTailGeo, new THREE.LineBasicMaterial({
      color: 0x53d8e8, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    tails.frustumCulled = false;
    this.scene.add(tails);
    this.cometTails = tails;

    // ---- selection / hover markers ----
    this.selMarker = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeRingTexture('#ffe066'), transparent: true, depthTest: false, depthWrite: false,
    }));
    this.selMarker.visible = false;
    this.selMarker.renderOrder = 10;
    this.scene.add(this.selMarker);

    this.hoverMarker = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeRingTexture('#9ab8ff'), transparent: true, opacity: 0.7, depthTest: false, depthWrite: false,
    }));
    this.hoverMarker.visible = false;
    this.hoverMarker.renderOrder = 10;
    this.scene.add(this.hoverMarker);

    // line from selected object to Earth
    const elg = new THREE.BufferGeometry();
    elg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    this.earthLine = new THREE.Line(elg, new THREE.LineDashedMaterial({
      color: 0x7fd0ff, transparent: true, opacity: 0.5, dashSize: 0.02, gapSize: 0.015, depthWrite: false,
    }));
    this.earthLine.visible = false;
    this.scene.add(this.earthLine);

    // ---- close-approach highlight markers ----
    this.approachGeo = new THREE.BufferGeometry();
    const apPos = new Float32Array(256 * 3);
    this.approachGeo.setAttribute('position', new THREE.BufferAttribute(apPos, 3));
    this.approachGeo.setDrawRange(0, 0);
    this.approachMarkers = new THREE.Points(this.approachGeo, new THREE.PointsMaterial({
      map: makeRingTexture('#ffe066'), color: 0xffe066, size: 22, sizeAttenuation: false,
      transparent: true, opacity: 0.9, depthWrite: false, depthTest: false,
    }));
    this.approachMarkers.frustumCulled = false;
    this.approachMarkers.renderOrder = 9;
    this.scene.add(this.approachMarkers);

    window.addEventListener('resize', () => this.resize(container));
  }

  cometPoints!: THREE.Points;
  cometTails!: THREE.LineSegments;

  resize(container: HTMLElement) {
    const w = container.clientWidth, h = container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ---------- propagation ----------

  planetEcliptic(pi: number, t: number, out: number[]): void {
    const p = this.data.planets[pi];
    const M = (p.ma + p.n * (t - p.epoch)) * DEG;
    const E = solveKepler(M, p.e);
    const xp = p.a * (Math.cos(E) - p.e);
    const yp = p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(E);
    const PQ = this.planetPQ[pi];
    out[0] = xp * PQ[0] + yp * PQ[3];
    out[1] = xp * PQ[1] + yp * PQ[4];
    out[2] = xp * PQ[2] + yp * PQ[5];
  }

  astEcliptic(i: number, t: number, out: number[]): void {
    const a = this.data.ast, o = i * AST_FLOATS;
    const M = a[o + F_MA] + a[o + F_N] * (t - J2000 - a[o + F_EPOCH]);
    const e = a[o + F_E];
    const E = solveKepler(M, e);
    const xp = a[o + F_A] * (Math.cos(E) - e);
    const yp = a[o + F_A] * Math.sqrt(1 - e * e) * Math.sin(E);
    out[0] = xp * a[o + F_PX] + yp * a[o + F_PX + 3];
    out[1] = xp * a[o + F_PX + 1] + yp * a[o + F_PX + 4];
    out[2] = xp * a[o + F_PX + 2] + yp * a[o + F_PX + 5];
  }

  cometEcliptic(ci: number, t: number, out: number[]): number {
    const c = this.data.comets[ci];
    const plane: number[] = [0, 0];
    const r = conicPlanePos(c, t, plane);
    if (r < 0) { out[0] = out[1] = out[2] = 0; return -1; }
    const PQ = this.cometPQ[ci];
    out[0] = plane[0] * PQ[0] + plane[1] * PQ[3];
    out[1] = plane[0] * PQ[1] + plane[1] * PQ[4];
    out[2] = plane[0] * PQ[2] + plane[1] * PQ[5];
    return r;
  }

  private _cometPQ: Float64Array[] | null = null;
  get cometPQ(): Float64Array[] {
    if (!this._cometPQ) {
      this._cometPQ = this.data.comets.map((c) => pqBasis(c.i, c.om, c.w));
    }
    return this._cometPQ;
  }

  /** Position of any selection in scene (three.js) coords. */
  getPosition(sel: Selection, t: number, out: THREE.Vector3): boolean {
    const e: number[] = [0, 0, 0];
    if (sel.type === 'planet') this.planetEcliptic(sel.index, t, e);
    else if (sel.type === 'ast') this.astEcliptic(sel.index, t, e);
    else if (this.cometEcliptic(sel.index, t, e) < 0) return false;
    out.set(e[0], e[2], -e[1]);
    return true;
  }

  /** Recompute all body positions for time t (JD). */
  update(t: number) {
    const data = this.data;
    const n = data.meta.count;
    const ast = data.ast, pos = this.astPositions, Ec = this.astEcache;
    const dt = t - this.lastT;
    const warm = isFinite(dt) && Math.abs(dt) < 30;
    const tOff = t - J2000;

    for (let i = 0; i < n; i++) {
      const o = i * AST_FLOATS;
      const e = ast[o + F_E];
      const nRad = ast[o + F_N];
      const M = ast[o + F_MA] + nRad * (tOff - ast[o + F_EPOCH]);
      const E = solveKepler(M, e, warm ? Ec[i] + nRad * dt : undefined);
      Ec[i] = E;
      const A = ast[o + F_A];
      const xp = A * (Math.cos(E) - e);
      const yp = A * Math.sqrt(1 - e * e) * Math.sin(E);
      const ex = xp * ast[o + F_PX] + yp * ast[o + F_PX + 3];
      const ey = xp * ast[o + F_PX + 1] + yp * ast[o + F_PX + 4];
      const ez = xp * ast[o + F_PX + 2] + yp * ast[o + F_PX + 5];
      pos[i * 3] = ex; pos[i * 3 + 1] = ez; pos[i * 3 + 2] = -ey;
    }
    this.astGeo.attributes.position.needsUpdate = true;

    // planets
    const e3: number[] = [0, 0, 0];
    for (let pi = 0; pi < data.planets.length; pi++) {
      this.planetEcliptic(pi, t, e3);
      this.planetPos[pi * 3] = e3[0]; this.planetPos[pi * 3 + 1] = e3[1]; this.planetPos[pi * 3 + 2] = e3[2];
      this.planetMeshes[pi].position.set(e3[0], e3[2], -e3[1]);
    }

    // comets
    if (this.cometsVisible) {
      const cn = data.comets.length;
      const cp = this.cometPositions, tp = this.cometTailPos, ca = this.cometAlpha;
      for (let i = 0; i < cn; i++) {
        const r = this.cometEcliptic(i, t, e3);
        const x = e3[0], y = e3[2], z = -e3[1];
        cp[i * 3] = x; cp[i * 3 + 1] = y; cp[i * 3 + 2] = z;
        const vis = r > 0 && r < 8;
        ca[i] = vis ? (this.cometFilterMask ? this.cometFilterMask[i] : 1) : 0;
        if (vis && r < 3) {
          const len = Math.min(0.35, 0.06 / (r * r));
          const inv = len / r;
          tp[i * 6] = x; tp[i * 6 + 1] = y; tp[i * 6 + 2] = z;
          tp[i * 6 + 3] = x + x * inv; tp[i * 6 + 4] = y + y * inv; tp[i * 6 + 5] = z + z * inv;
        } else {
          tp[i * 6] = tp[i * 6 + 3] = 0; tp[i * 6 + 1] = tp[i * 6 + 4] = 0; tp[i * 6 + 2] = tp[i * 6 + 5] = 0;
        }
      }
      this.cometGeo.attributes.position.needsUpdate = true;
      this.cometGeo.attributes.aAlpha.needsUpdate = true;
      this.cometTailGeo.attributes.position.needsUpdate = true;
    }

    // approach markers follow their asteroids
    if (this.approachIndices.length) {
      const apPos = this.approachGeo.attributes.position.array as Float32Array;
      for (let k = 0; k < this.approachIndices.length; k++) {
        const ai = this.approachIndices[k];
        apPos[k * 3] = pos[ai * 3]; apPos[k * 3 + 1] = pos[ai * 3 + 1]; apPos[k * 3 + 2] = pos[ai * 3 + 2];
      }
      this.approachGeo.attributes.position.needsUpdate = true;
    }

    this.lastT = t;
  }

  cometFilterMask: Uint8Array | null = null;

  setCometsVisible(v: boolean) {
    this.cometsVisible = v;
    this.cometPoints.visible = v;
    this.cometTails.visible = v;
  }

  /** Apply a visibility mask (1 byte per asteroid). */
  applyFilter(mask: Uint8Array): number {
    this.filterMask = mask;
    let count = 0;
    for (let i = 0; i < mask.length; i++) {
      this.astAlpha[i] = mask[i];
      count += mask[i];
    }
    this.astGeo.attributes.aAlpha.needsUpdate = true;
    return count;
  }

  setApproachHighlights(astIndices: number[]) {
    this.approachIndices = astIndices.slice(0, 256);
    this.approachGeo.setDrawRange(0, this.approachIndices.length);
    this.lastT = NaN; // force marker refresh on next update
  }

  /** Screen-space pick nearest visible body. x,y in css pixels. */
  pick(x: number, y: number): Selection | null {
    const w = this.renderer.domElement.clientWidth;
    const h = this.renderer.domElement.clientHeight;
    const ndcX = (x / w) * 2 - 1, ndcY = -(y / h) * 2 + 1;
    this.camera.updateMatrixWorld();
    const vp = new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    const m = vp.elements;
    const thresholdPx = 12;
    let best: Selection | null = null;
    let bestD = thresholdPx * thresholdPx;
    let bestDepth = Infinity;

    const test = (px: number, py: number, pz: number, sel: Selection, prio = 0) => {
      const cw = m[3] * px + m[7] * py + m[11] * pz + m[15];
      if (cw <= 0) return;
      const cx = (m[0] * px + m[4] * py + m[8] * pz + m[12]) / cw;
      const cy = (m[1] * px + m[5] * py + m[9] * pz + m[13]) / cw;
      if (cx < -1.1 || cx > 1.1 || cy < -1.1 || cy > 1.1) return;
      const dx = ((cx - ndcX) * w) / 2, dy = ((cy - ndcY) * h) / 2;
      const d2 = dx * dx + dy * dy - prio * 40;
      if (d2 < bestD || (d2 < thresholdPx * thresholdPx && cw < bestDepth && d2 < bestD + 30)) {
        bestD = Math.min(d2, bestD);
        bestDepth = cw;
        best = sel;
      }
    };

    for (let pi = 0; pi < this.planetMeshes.length; pi++) {
      const p = this.planetMeshes[pi].position;
      test(p.x, p.y, p.z, { type: 'planet', index: pi }, 2);
    }
    const pos = this.astPositions, alpha = this.astAlpha;
    for (let i = 0; i < this.data.meta.count; i++) {
      if (alpha[i] < 0.5) continue;
      test(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], { type: 'ast', index: i });
    }
    if (this.cometsVisible) {
      const cp = this.cometPositions, cAl = this.cometAlpha;
      for (let i = 0; i < this.data.comets.length; i++) {
        if (cAl[i] < 0.5) continue;
        test(cp[i * 3], cp[i * 3 + 1], cp[i * 3 + 2], { type: 'comet', index: i });
      }
    }
    return best;
  }

  // ---------- selection visuals ----------

  showOrbitFor(sel: Selection | null) {
    if (this.orbitLine) {
      this.scene.remove(this.orbitLine);
      this.orbitLine.geometry.dispose();
      (this.orbitLine.material as THREE.Material).dispose();
      this.orbitLine = null;
    }
    if (!sel || sel.type === 'planet') return;
    const pts: THREE.Vector3[] = [];
    if (sel.type === 'ast') {
      const a = this.data.ast, o = sel.index * AST_FLOATS;
      const A = a[o + F_A], e = a[o + F_E];
      for (let k = 0; k <= 360; k++) {
        const E = (k / 360) * TWO_PI;
        const xp = A * (Math.cos(E) - e);
        const yp = A * Math.sqrt(1 - e * e) * Math.sin(E);
        const ex = xp * a[o + F_PX] + yp * a[o + F_PX + 3];
        const ey = xp * a[o + F_PX + 1] + yp * a[o + F_PX + 4];
        const ez = xp * a[o + F_PX + 2] + yp * a[o + F_PX + 5];
        pts.push(new THREE.Vector3(ex, ez, -ey));
      }
    } else {
      const c = this.data.comets[sel.index];
      const PQ = this.cometPQ[sel.index];
      const push = (xp: number, yp: number) => {
        const ex = xp * PQ[0] + yp * PQ[3];
        const ey = xp * PQ[1] + yp * PQ[4];
        const ez = xp * PQ[2] + yp * PQ[5];
        pts.push(new THREE.Vector3(ex, ez, -ey));
      };
      if (c.e < 0.9999) {
        const A = c.a ?? c.q / (1 - c.e);
        for (let k = 0; k <= 512; k++) {
          const E = (k / 512) * TWO_PI;
          push(A * (Math.cos(E) - c.e), A * Math.sqrt(1 - c.e * c.e) * Math.sin(E));
        }
      } else if (c.e > 1.0001) {
        const A = c.a ?? c.q / (1 - c.e);
        const Hmax = Math.acosh((1 + 12 / -A) / c.e + 1e-9) || 3;
        for (let k = 0; k <= 256; k++) {
          const H = -Hmax + (k / 256) * 2 * Hmax;
          push(A * (Math.cosh(H) - c.e), -A * Math.sqrt(c.e * c.e - 1) * Math.sinh(H));
        }
      } else {
        for (let k = 0; k <= 256; k++) {
          const D = -6 + (k / 256) * 12;
          push(c.q * (1 - D * D), 2 * c.q * D);
        }
      }
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: sel.type === 'comet' ? 0x53d8e8 : 0xffe066,
      transparent: true, opacity: 0.75, depthWrite: false,
    });
    this.orbitLine = new THREE.Line(g, mat);
    this.scene.add(this.orbitLine);
  }

  setSelection(sel: Selection | null) {
    this.selection = sel;
    this.selMarker.visible = !!sel;
    this.earthLine.visible = !!sel && sel.type !== 'planet';
    this.showOrbitFor(sel);
  }

  /** Per-frame marker/label maintenance. Returns selected pos in scene coords or null. */
  updateOverlays(t: number): THREE.Vector3 | null {
    // distance-scaled sprites
    for (const lbl of this.planetLabels) {
      const tp = lbl.userData.trackPlanet;
      if (tp !== undefined) {
        const m = this.planetMeshes[tp];
        lbl.position.copy(m.position);
        lbl.position.y += lbl.userData.trackOffset * 2.2;
      }
      const d = lbl.position.distanceTo(this.camera.position);
      const s = (lbl.userData.fixedScale ?? 0.05) * d;
      lbl.scale.set(s * lbl.userData.aspect * 0.5, s * 0.5, 1);
    }
    let selPos: THREE.Vector3 | null = null;
    if (this.selection) {
      if (this.getPosition(this.selection, t, this.tmpV)) {
        selPos = this.tmpV;
        this.selMarker.position.copy(selPos);
        const d = selPos.distanceTo(this.camera.position);
        this.selMarker.scale.setScalar(Math.max(0.028 * d, 0.001));
        if (this.earthLine.visible) {
          const earthIdx = this.data.planets.findIndex((p) => p.name === 'Earth');
          const lp = this.earthLine.geometry.attributes.position.array as Float32Array;
          lp[0] = selPos.x; lp[1] = selPos.y; lp[2] = selPos.z;
          const em = this.planetMeshes[earthIdx].position;
          lp[3] = em.x; lp[4] = em.y; lp[5] = em.z;
          this.earthLine.geometry.attributes.position.needsUpdate = true;
          this.earthLine.computeLineDistances();
        }
      } else {
        this.selMarker.visible = false;
      }
    }
    return selPos;
  }

  setHover(sel: Selection | null, t: number) {
    if (sel && this.getPosition(sel, t, this.tmpV)) {
      this.hoverMarker.visible = true;
      this.hoverMarker.position.copy(this.tmpV);
      const d = this.tmpV.distanceTo(this.camera.position);
      this.hoverMarker.scale.setScalar(Math.max(0.02 * d, 0.001));
    } else {
      this.hoverMarker.visible = false;
    }
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
