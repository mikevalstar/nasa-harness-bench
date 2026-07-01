import * as THREE from 'three';
import { AU_SCENE_UNITS } from '../constants';
import type { CometDataset } from '../data/types';
import { eclipticToThree, positionFromPerihelionElements, type Vec3 } from '../orbit';
import { KEPLER_GLSL } from '../shaders/keplerGLSL';

const STRIDE = 7; // q, e, i, om, w, tp, sizeKm

const VERTEX_SHADER = /* glsl */ `
attribute vec4 aElemsA; // q, e, i, om
attribute vec3 aElemsB; // w, tp, sizeKm
attribute float aVisible;

uniform float uJD;
uniform float uAuScale;
uniform float uSelectedIndex;
uniform float uPixelRatio;
uniform vec3 uColorNormal;
uniform vec3 uColorSelected;

varying vec3 vColor;
varying float vSelected;

${KEPLER_GLSL}

void main() {
  if (aVisible < 0.5) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vColor = vec3(0.0);
    vSelected = 0.0;
    return;
  }

  float q = aElemsA.x;
  float e = aElemsA.y;
  float i = aElemsA.z;
  float om = aElemsA.w;
  float w = aElemsB.x;
  float tp = aElemsB.y;
  float sizeKm = aElemsB.z;

  vec3 pos = positionFromPerihelionElements(q, e, i, om, w, tp, uJD) * uAuScale;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  bool selected = (uSelectedIndex >= 0.0 && abs(float(gl_VertexID) - uSelectedIndex) < 0.5);
  vSelected = selected ? 1.0 : 0.0;
  vColor = selected ? uColorSelected : uColorNormal;

  float sizePx = 2.0 + clamp(log2(sizeKm + 1.0), 0.0, 5.0) * 1.2;
  if (selected) sizePx += 6.0;
  gl_PointSize = sizePx * uPixelRatio * (300.0 / max(-mvPosition.z, 1.0));
  gl_PointSize = clamp(gl_PointSize, 1.0, 40.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
varying vec3 vColor;
varying float vSelected;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.15, d);
  if (vSelected > 0.5) {
    float ring = smoothstep(0.5, 0.38, d) - smoothstep(0.32, 0.2, d);
    alpha = max(alpha, ring);
  }
  gl_FragColor = vec4(vColor, alpha);
}
`;

export class CometField {
  readonly points: THREE.Points;
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.ShaderMaterial;
  readonly visible: Float32Array;

  constructor(private dataset: CometDataset) {
    const interleaved = new THREE.InterleavedBuffer(dataset.buffer, STRIDE);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('aElemsA', new THREE.InterleavedBufferAttribute(interleaved, 4, 0));
    geo.setAttribute('aElemsB', new THREE.InterleavedBufferAttribute(interleaved, 3, 4));

    this.visible = new Float32Array(dataset.count).fill(1);
    geo.setAttribute('aVisible', new THREE.BufferAttribute(this.visible, 1));
    geo.setDrawRange(0, dataset.count);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), AU_SCENE_UNITS * 400);

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uJD: { value: 2451545.0 },
        uAuScale: { value: AU_SCENE_UNITS },
        uSelectedIndex: { value: -1 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColorNormal: { value: new THREE.Color(0xa0ffe8) },
        uColorSelected: { value: new THREE.Color(0x2bff88) },
      },
    });

    this.geometry = geo;
    this.material = material;
    this.points = new THREE.Points(geo, material);
    this.points.frustumCulled = false;
  }

  setJulianDate(jd: number): void {
    this.material.uniforms.uJD.value = jd;
  }

  setSelectedIndex(index: number | null): void {
    this.material.uniforms.uSelectedIndex.value = index ?? -1;
  }

  markVisibilityDirty(): void {
    (this.geometry.getAttribute('aVisible') as THREE.BufferAttribute).needsUpdate = true;
  }

  positionEcliptic(index: number, jd: number): Vec3 {
    const off = index * STRIDE;
    const b = this.dataset.buffer;
    return positionFromPerihelionElements(b[off + 0], b[off + 1], b[off + 2], b[off + 3], b[off + 4], b[off + 5], jd);
  }

  positionScene(index: number, jd: number): THREE.Vector3 {
    const t = eclipticToThree(this.positionEcliptic(index, jd));
    return new THREE.Vector3(t.x * AU_SCENE_UNITS, t.y * AU_SCENE_UNITS, t.z * AU_SCENE_UNITS);
  }

  elements(index: number) {
    const off = index * STRIDE;
    const b = this.dataset.buffer;
    return {
      q: b[off + 0],
      e: b[off + 1],
      i: b[off + 2],
      om: b[off + 3],
      w: b[off + 4],
      tp: b[off + 5],
      sizeKm: b[off + 6],
    };
  }
}
