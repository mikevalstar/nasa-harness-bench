/**
 * The two big instanced point clouds — asteroids and comets.
 *
 * Positions are never stored on the CPU: each vertex carries its orbital
 * elements and the vertex shader solves Kepler's equation for the current
 * time. Filtering and colouring are per-vertex attributes updated in place.
 */
import * as THREE from 'three';
import { ASTEROID_VERT, COMET_VERT, POINT_FRAG } from './shaders';
import { CO, CORB_COLS, O, ORB_COLS, P, PHYS_COLS, type Dataset } from './data';
import { DEG } from './astro';
import { clamp } from './helpers';

export type ColorMode = 'hazard' | 'class' | 'size' | 'moid';

export const CLASS_COLORS: Record<string, number> = {
  APO: 0xff6b6b,
  ATE: 0xffc857,
  AMO: 0x4dd4ac,
  IEO: 0xc77dff,
  HTC: 0x7ec8ff,
  JFc: 0x9aa5b1,
  JFC: 0x9aa5b1,
  ETc: 0xb0e0a8,
  CTc: 0x8fd6df,
  COM: 0x7ec8ff,
  PAR: 0xa78bfa,
  HYP: 0xf472b6,
  UNK: 0x8892a4,
};

export const CLASS_LABEL: Record<string, string> = {
  APO: 'Apollo — Earth-crossing, a > 1 au',
  ATE: 'Aten — Earth-crossing, a < 1 au',
  AMO: 'Amor — approaches but does not cross',
  IEO: 'Atira — orbit interior to Earth',
  HTC: 'Halley-type comet',
  JFc: 'Jupiter-family comet',
  JFC: 'Jupiter-family comet',
  ETc: 'Encke-type comet',
  CTc: 'Chiron-type comet',
  COM: 'Long-period comet',
  PAR: 'Parabolic comet',
  HYP: 'Hyperbolic comet',
  UNK: 'Unclassified',
};

const tmpColor = new THREE.Color();

function lerpColor(a: number, b: number, t: number, out: Float32Array, at: number) {
  const c1 = tmpColor.setHex(a);
  const r1 = c1.r,
    g1 = c1.g,
    b1 = c1.b;
  const c2 = tmpColor.setHex(b);
  out[at] = r1 + (c2.r - r1) * t;
  out[at + 1] = g1 + (c2.g - g1) * t;
  out[at + 2] = b1 + (c2.b - b1) * t;
}

function setHex(hex: number, out: Float32Array, at: number) {
  tmpColor.setHex(hex);
  out[at] = tmpColor.r;
  out[at + 1] = tmpColor.g;
  out[at + 2] = tmpColor.b;
}

/** Point-size factor from an estimated diameter in km. */
function sizeFor(diamKm: number): number {
  if (!Number.isFinite(diamKm) || diamKm <= 0) return 0.75;
  return clamp(Math.pow(diamKm, 0.3) * 1.15, 0.6, 4.0);
}

export class AsteroidCloud {
  readonly points: THREE.Points;
  readonly material: THREE.ShaderMaterial;
  readonly count: number;
  readonly visible: Float32Array;
  private colors: Float32Array;
  private geom: THREE.BufferGeometry;
  private d: Dataset;

  constructor(d: Dataset) {
    this.d = d;
    const n = d.ast.count;
    this.count = n;

    const elemA = new Float32Array(n * 4);
    const elemB = new Float32Array(n * 4);
    const index = new Float32Array(n);
    const size = new Float32Array(n);
    this.visible = new Float32Array(n).fill(1);
    this.colors = new Float32Array(n * 3);

    const orb = d.ast.orb;
    const phys = d.ast.phys;
    for (let k = 0; k < n; k++) {
      const b = k * ORB_COLS;
      elemA[k * 4 + 0] = orb[b + O.a];
      elemA[k * 4 + 1] = orb[b + O.e];
      elemA[k * 4 + 2] = orb[b + O.i] * DEG;
      elemA[k * 4 + 3] = orb[b + O.om] * DEG;
      elemB[k * 4 + 0] = orb[b + O.w] * DEG;
      elemB[k * 4 + 1] = orb[b + O.ma] * DEG;
      elemB[k * 4 + 2] = orb[b + O.n] * DEG;
      elemB[k * 4 + 3] = orb[b + O.epoch0];
      index[k] = k;
      size[k] = sizeFor(phys[k * PHYS_COLS + P.diameter]);
    }

    const g = new THREE.BufferGeometry();
    // `position` is unused by the shader but three needs it to size the draw call
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aElemA', new THREE.BufferAttribute(elemA, 4));
    g.setAttribute('aElemB', new THREE.BufferAttribute(elemB, 4));
    g.setAttribute('aIndex', new THREE.BufferAttribute(index, 1));
    g.setAttribute('aVis', new THREE.BufferAttribute(this.visible, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    this.geom = g;

    this.material = new THREE.ShaderMaterial({
      vertexShader: ASTEROID_VERT,
      fragmentShader: POINT_FRAG,
      uniforms: {
        uT: { value: 0 },
        uSize: { value: 4.5 },
        uDim: { value: 1 },
        uSelected: { value: -1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
    this.setColorMode('hazard');
  }

  setTime(t: number) {
    this.material.uniforms.uT.value = t;
  }

  setPointScale(s: number) {
    this.material.uniforms.uSize.value = s;
  }

  setSelected(k: number) {
    this.material.uniforms.uSelected.value = k;
  }

  markVisibleDirty() {
    this.geom.attributes.aVis.needsUpdate = true;
  }

  setColorMode(mode: ColorMode) {
    const d = this.d;
    const n = this.count;
    const c = this.colors;
    const phys = d.ast.phys;
    const flags = d.ast.flags;
    for (let k = 0; k < n; k++) {
      const at = k * 3;
      if (mode === 'class') {
        setHex(CLASS_COLORS[d.ast.meta.classes[flags[k * 3 + 1]]] ?? 0x8892a4, c, at);
      } else if (mode === 'size') {
        const dm = phys[k * PHYS_COLS + P.diameter];
        const t = clamp((Math.log10(Number.isFinite(dm) && dm > 0 ? dm : 0.02) + 2) / 3.3, 0, 1);
        lerpColor(0x2b4a7a, 0xffe08a, t, c, at);
      } else if (mode === 'moid') {
        const m = phys[k * PHYS_COLS + P.moid];
        const t = clamp(Number.isFinite(m) ? m / 0.25 : 1, 0, 1);
        lerpColor(0xff3b5c, 0x39527a, Math.sqrt(t), c, at);
      } else {
        const isPha = flags[k * 3] === 1;
        const isSentry = (flags[k * 3 + 2] & 2) !== 0;
        if (isSentry) setHex(0xff9f43, c, at);
        else if (isPha) setHex(0xff5470, c, at);
        else setHex(0x6f86ad, c, at);
      }
    }
    this.geom.attributes.aColor.needsUpdate = true;
  }

  static legendFor(mode: ColorMode): { color: string; label: string }[] {
    switch (mode) {
      case 'hazard':
        return [
          { color: '#ff9f43', label: 'Sentry risk list' },
          { color: '#ff5470', label: 'Potentially hazardous' },
          { color: '#6f86ad', label: 'Other NEO' },
        ];
      case 'class':
        return [
          { color: '#ff6b6b', label: 'Apollo' },
          { color: '#ffc857', label: 'Aten' },
          { color: '#4dd4ac', label: 'Amor' },
          { color: '#c77dff', label: 'Atira' },
        ];
      case 'size':
        return [
          { color: '#2b4a7a', label: '< 10 m' },
          { color: '#7f96b0', label: '~100 m' },
          { color: '#ffe08a', label: '> 1 km' },
        ];
      case 'moid':
        return [
          { color: '#ff3b5c', label: 'MOID ≈ 0' },
          { color: '#9a7f8f', label: '0.1 au' },
          { color: '#39527a', label: '> 0.25 au' },
        ];
    }
  }
}

export class CometCloud {
  readonly points: THREE.Points;
  readonly material: THREE.ShaderMaterial;
  readonly count: number;
  readonly visible: Float32Array;
  private geom: THREE.BufferGeometry;

  constructor(d: Dataset) {
    const n = d.comets.count;
    this.count = n;
    const A = new Float32Array(n * 4);
    const B = new Float32Array(n * 4);
    const C = new Float32Array(n * 2);
    const index = new Float32Array(n);
    const size = new Float32Array(n);
    const colors = new Float32Array(n * 3);
    this.visible = new Float32Array(n).fill(1);

    const orb = d.comets.orb;
    for (let k = 0; k < n; k++) {
      const b = k * CORB_COLS;
      const e = orb[b + CO.e];
      let a = orb[b + CO.a];
      const q = orb[b + CO.q];
      let nDeg = orb[b + CO.n];
      if (!Number.isFinite(a)) a = e === 1 ? 0 : q / (1 - e);
      if (!Number.isFinite(nDeg)) nDeg = 0;
      A[k * 4 + 0] = e;
      A[k * 4 + 1] = a;
      A[k * 4 + 2] = q;
      A[k * 4 + 3] = orb[b + CO.i] * DEG;
      B[k * 4 + 0] = orb[b + CO.om] * DEG;
      B[k * 4 + 1] = orb[b + CO.w] * DEG;
      B[k * 4 + 2] = orb[b + CO.ma] * DEG;
      B[k * 4 + 3] = nDeg * DEG;
      C[k * 2 + 0] = orb[b + CO.epoch0];
      C[k * 2 + 1] = orb[b + CO.tp0];
      index[k] = k;
      const dm = d.comets.mag[k * 2 + 1];
      size[k] = Number.isFinite(dm) && dm > 0 ? clamp(Math.pow(dm, 0.3) * 1.2, 0.9, 3.4) : 1.1;
      setHex(CLASS_COLORS[d.comets.meta.classes[d.comets.flags[k]]] ?? 0x7ec8ff, colors, k * 3);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('cElemA', new THREE.BufferAttribute(A, 4));
    g.setAttribute('cElemB', new THREE.BufferAttribute(B, 4));
    g.setAttribute('cElemC', new THREE.BufferAttribute(C, 2));
    g.setAttribute('aIndex', new THREE.BufferAttribute(index, 1));
    g.setAttribute('aVis', new THREE.BufferAttribute(this.visible, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this.geom = g;

    this.material = new THREE.ShaderMaterial({
      vertexShader: COMET_VERT,
      fragmentShader: POINT_FRAG,
      uniforms: {
        uT: { value: 0 },
        uSize: { value: 5 },
        uMaxR: { value: 42 },
        uSelected: { value: -1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
    this.points.visible = false;
  }

  setTime(t: number) {
    this.material.uniforms.uT.value = t;
  }

  setPointScale(s: number) {
    this.material.uniforms.uSize.value = s;
  }

  setSelected(k: number) {
    this.material.uniforms.uSelected.value = k;
  }

  markVisibleDirty() {
    this.geom.attributes.aVis.needsUpdate = true;
  }
}
