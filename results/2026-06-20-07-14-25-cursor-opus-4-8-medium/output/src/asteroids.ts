import * as THREE from "three";
import type { AsteroidMeta } from "./types";

// GPU-propagated asteroid field. Each point carries its orbital elements as
// vertex attributes; the vertex shader solves Kepler's equation for the current
// time, so all ~42k bodies move with zero per-frame CPU cost. A parallel
// "picking" material reuses the exact same propagation but writes an id color.

export type ColorMode = "class" | "pha" | "size" | "sentry";

const TWO_PI = Math.PI * 2;

// Shared GLSL: compute scene-space position from orbital elements at uTime.
const PROPAGATE_GLSL = /* glsl */ `
  uniform float uTime; // JD relative to J2000
  attribute vec4 aElem1; // a, e, i, om
  attribute vec4 aElem2; // w, ma, n, epochRel

  vec3 computePosition() {
    float a = aElem1.x;
    float e = aElem1.y;
    float inc = aElem1.z;
    float om = aElem1.w;
    float w = aElem2.x;
    float ma = aElem2.y;
    float n = aElem2.z;
    float epoch = aElem2.w;

    float M = ma + n * (uTime - epoch);
    const float PI = 3.141592653589793;
    const float TWO_PI = 6.283185307179586;
    M = mod(M + PI, TWO_PI) - PI;

    float E = M + e * sin(M);
    for (int i = 0; i < 6; i++) {
      float dE = (E - e * sin(E) - M) / (1.0 - e * cos(E));
      E -= dE;
    }

    float xi = a * (cos(E) - e);
    float eta = a * sqrt(max(0.0, 1.0 - e * e)) * sin(E);

    float cosO = cos(om), sinO = sin(om);
    float cosi = cos(inc), sini = sin(inc);
    float cosw = cos(w), sinw = sin(w);
    vec3 P = vec3(cosO * cosw - sinO * sinw * cosi,
                  sinO * cosw + cosO * sinw * cosi,
                  sinw * sini);
    vec3 Q = vec3(-cosO * sinw - sinO * cosw * cosi,
                  -sinO * sinw + cosO * cosw * cosi,
                  cosw * sini);
    vec3 ecl = P * xi + Q * eta;
    // ecliptic (X,Y,Z) -> scene (x, z, -y)
    return vec3(ecl.x, ecl.z, -ecl.y);
  }
`;

const VERT = /* glsl */ `
  ${PROPAGATE_GLSL}
  uniform float uSizeScale;
  uniform float uPixelRatio;
  uniform float uSelected;
  uniform float uDim;       // 0 = hide filtered, 1 = dim filtered
  uniform float uMinPx;

  attribute vec3 aColor;
  attribute float aSize;
  attribute float aFilter; // 1 pass, 0 filtered out
  attribute float aId;

  varying vec3 vColor;
  varying float vSelected;
  varying float vAlpha;

  void main() {
    vec3 pos = computePosition();
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    float selected = abs(aId - uSelected) < 0.5 ? 1.0 : 0.0;
    vSelected = selected;

    bool hidden = aFilter < 0.5 && uDim < 0.5 && selected < 0.5;
    vColor = aColor;
    vAlpha = (aFilter < 0.5 && selected < 0.5) ? 0.12 : 1.0;

    float dist = max(0.001, -mv.z);
    float px = aSize * uSizeScale / dist;
    px = clamp(px, uMinPx, 22.0);
    if (selected > 0.5) px = max(px * 1.6, 9.0);

    gl_PointSize = px * uPixelRatio;
    gl_Position = projectionMatrix * mv;
    if (hidden) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // clip out
      gl_PointSize = 0.0;
    }
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vSelected;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    float edge = smoothstep(0.5, 0.32, r);
    vec3 col = vColor;
    float alpha = edge * vAlpha;
    if (vSelected > 0.5) {
      // bright core + ring
      float ring = smoothstep(0.5, 0.42, r) - smoothstep(0.34, 0.26, r);
      col = mix(col, vec3(1.0), 0.5) + ring * vec3(1.0);
      alpha = max(alpha, edge);
    }
    gl_FragColor = vec4(col, alpha);
  }
`;

const PICK_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vPickColor;
  varying float vPickable;
  void main() {
    if (vPickable < 0.5) discard;
    vec2 uv = gl_PointCoord - 0.5;
    if (length(uv) > 0.5) discard;
    gl_FragColor = vec4(vPickColor, 1.0);
  }
`;

const PICK_VERT = /* glsl */ `
  ${PROPAGATE_GLSL}
  uniform float uSizeScale;
  uniform float uPixelRatio;
  uniform float uMinPx;
  attribute float aSize;
  attribute float aFilter;
  attribute float aId;
  varying vec3 vPickColor;
  varying float vPickable;

  void main() {
    vec3 pos = computePosition();
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float id = aId;
    vPickColor = vec3(
      mod(id, 256.0),
      mod(floor(id / 256.0), 256.0),
      mod(floor(id / 65536.0), 256.0)
    ) / 255.0;
    vPickable = aFilter;
    float dist = max(0.001, -mv.z);
    float px = clamp(aSize * uSizeScale / dist, uMinPx, 22.0);
    gl_PointSize = max(px, 6.0) * uPixelRatio; // generous hit target
    gl_Position = projectionMatrix * mv;
  }
`;

function classColor(cls: string): [number, number, number] {
  // Orbit-class palette (Atira/Aten/Apollo/Amor + others).
  switch (cls) {
    case "IEO": // Atira
      return [0.62, 0.40, 0.95];
    case "ATE": // Aten
      return [0.30, 0.78, 1.0];
    case "APO": // Apollo
      return [0.45, 0.95, 0.65];
    case "AMO": // Amor
      return [1.0, 0.82, 0.35];
    default:
      return [0.7, 0.72, 0.78];
  }
}

function sizeFromMeta(meta: AsteroidMeta, idx: number): number {
  // Visual base size factor (attenuated by distance in the shader). Use diameter
  // if known, else fall back to absolute magnitude H (smaller H = bigger body).
  const d = meta.diameter[idx];
  if (d != null) return THREE.MathUtils.clamp(1.2 + Math.log2(d + 1) * 1.1, 1.2, 7);
  const h = meta.H[idx];
  if (h != null) return THREE.MathUtils.clamp(6 - (h - 14) * 0.25, 1.2, 6);
  return 1.2;
}

function lerp3(a: number[], b: number[], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export class AsteroidLayer {
  readonly points: THREE.Points;
  readonly count: number;
  private readonly geom: THREE.BufferGeometry;
  private readonly material: THREE.ShaderMaterial;
  private readonly pickMaterial: THREE.ShaderMaterial;
  private readonly colorAttr: THREE.BufferAttribute;
  private readonly sizeAttr: THREE.BufferAttribute;
  private readonly filterAttr: THREE.BufferAttribute;
  private readonly meta: AsteroidMeta;
  private readonly baseSize: Float32Array;
  private readonly sentry: Set<string>;

  constructor(
    elements: Float32Array,
    meta: AsteroidMeta,
    sentryDes: Set<string>,
    pixelRatio: number,
  ) {
    this.count = meta.count;
    this.meta = meta;
    this.sentry = sentryDes;
    const n = this.count;

    const elem1 = new Float32Array(n * 4);
    const elem2 = new Float32Array(n * 4);
    const color = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const filter = new Float32Array(n).fill(1);
    const id = new Float32Array(n);
    this.baseSize = new Float32Array(n);

    for (let k = 0; k < n; k++) {
      const b = k * 8;
      elem1[k * 4 + 0] = elements[b + 0];
      elem1[k * 4 + 1] = elements[b + 1];
      elem1[k * 4 + 2] = elements[b + 2];
      elem1[k * 4 + 3] = elements[b + 3];
      elem2[k * 4 + 0] = elements[b + 4];
      elem2[k * 4 + 1] = elements[b + 5];
      elem2[k * 4 + 2] = elements[b + 6];
      elem2[k * 4 + 3] = elements[b + 7];
      const s = sizeFromMeta(meta, k);
      this.baseSize[k] = s;
      size[k] = s;
      id[k] = k;
    }

    const geom = new THREE.BufferGeometry();
    // Placeholder position attribute: Three.js uses it for the vertex count, but
    // the real position is computed in the vertex shader from the elements.
    geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geom.setAttribute("aElem1", new THREE.BufferAttribute(elem1, 4));
    geom.setAttribute("aElem2", new THREE.BufferAttribute(elem2, 4));
    this.colorAttr = new THREE.BufferAttribute(color, 3);
    this.sizeAttr = new THREE.BufferAttribute(size, 1);
    this.filterAttr = new THREE.BufferAttribute(filter, 1);
    geom.setAttribute("aColor", this.colorAttr);
    geom.setAttribute("aSize", this.sizeAttr);
    geom.setAttribute("aFilter", this.filterAttr);
    geom.setAttribute("aId", new THREE.BufferAttribute(id, 1));
    // Large bounding sphere so the field is never frustum-culled (positions are
    // computed in the shader and unknown to Three.js).
    geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e6);
    this.geom = geom;

    const uniforms = {
      uTime: { value: 0 },
      uSizeScale: { value: 10 },
      uPixelRatio: { value: pixelRatio },
      uSelected: { value: -1 },
      uDim: { value: 1 },
      uMinPx: { value: 1.4 },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.pickMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: uniforms.uTime,
        uSizeScale: uniforms.uSizeScale,
        uPixelRatio: uniforms.uPixelRatio,
        uMinPx: uniforms.uMinPx,
      },
      vertexShader: PICK_VERT,
      fragmentShader: PICK_FRAG,
      transparent: false,
      depthWrite: true,
    });

    this.points = new THREE.Points(geom, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 1;

    this.setColorMode("class");
  }

  setTime(jdRelJ2000: number): void {
    this.material.uniforms.uTime.value = jdRelJ2000;
  }

  setPixelRatio(pr: number): void {
    this.material.uniforms.uPixelRatio.value = pr;
  }

  setSizeScale(scale: number): void {
    this.material.uniforms.uSizeScale.value = scale;
  }

  setSelected(id: number): void {
    this.material.uniforms.uSelected.value = id;
  }

  setDimMode(dim: boolean): void {
    this.material.uniforms.uDim.value = dim ? 1 : 0;
  }

  setColorMode(mode: ColorMode): void {
    const arr = this.colorAttr.array as Float32Array;
    const sz = this.sizeAttr.array as Float32Array;
    const m = this.meta;
    const phaCol = [1.0, 0.27, 0.27];
    const safeCol = [0.45, 0.5, 0.6];
    for (let k = 0; k < this.count; k++) {
      let c: [number, number, number];
      if (mode === "pha") {
        c = m.pha[k] ? (phaCol as [number, number, number]) : (safeCol as [number, number, number]);
      } else if (mode === "size") {
        const d = m.diameter[k];
        const t = d != null ? THREE.MathUtils.clamp(Math.log10(d + 0.01) / 1.5 + 0.6, 0, 1) : 0.0;
        c = lerp3([0.2, 0.45, 0.8], [1.0, 0.85, 0.2], t);
      } else if (mode === "sentry") {
        const des = m.pdes[k];
        c = des && this.sentry.has(des) ? ([1.0, 0.3, 0.5] as [number, number, number]) : ([0.4, 0.42, 0.5] as [number, number, number]);
      } else {
        c = classColor(m.cls[k]);
      }
      arr[k * 3 + 0] = c[0];
      arr[k * 3 + 1] = c[1];
      arr[k * 3 + 2] = c[2];
      // emphasize PHAs / sentry slightly in their modes
      let s = this.baseSize[k];
      if (mode === "pha" && m.pha[k]) s *= 1.5;
      if (mode === "sentry" && m.pdes[k] && this.sentry.has(m.pdes[k]!)) s *= 1.6;
      sz[k] = s;
    }
    this.colorAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
  }

  // filterFn returns true if the asteroid index passes the current filter.
  applyFilter(passes: Uint8Array): number {
    const arr = this.filterAttr.array as Float32Array;
    let count = 0;
    for (let k = 0; k < this.count; k++) {
      const p = passes[k];
      arr[k] = p;
      if (p) count++;
    }
    this.filterAttr.needsUpdate = true;
    return count;
  }

  get pickingMaterial(): THREE.ShaderMaterial {
    return this.pickMaterial;
  }

  swapToPicking(): void {
    this.points.material = this.pickMaterial;
  }
  swapToNormal(): void {
    this.points.material = this.material;
  }

  dispose(): void {
    this.geom.dispose();
    this.material.dispose();
    this.pickMaterial.dispose();
  }
}

export { TWO_PI };
