import * as THREE from 'three';
import { AU_SCENE_UNITS } from '../constants';
import type { AsteroidDataset } from '../data/types';
import { eclipticToThree, positionFromMeanElements, type Vec3 } from '../orbit';
import { KEPLER_GLSL } from '../shaders/keplerGLSL';

const STRIDE = 10; // a, e, i, om, w, ma, n, epoch, sizeKm, flags

const VERTEX_SHADER = /* glsl */ `
attribute vec4 aElemsA; // a, e, i, om
attribute vec4 aElemsB; // w, ma, n, epoch
attribute vec2 aElemsC; // sizeKm, flags
attribute float aVisible;

uniform float uJD;
uniform float uAuScale;
uniform float uSelectedIndex;
uniform float uPixelRatio;
uniform vec3 uColorNormal;
uniform vec3 uColorPha;
uniform vec3 uColorSelected;

varying vec3 vColor;
varying float vSelected;

${KEPLER_GLSL}

void main() {
  if (aVisible < 0.5) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vColor = vec3(0.0);
    vSelected = 0.0;
    gl_PointSize = 0.0;
    return;
  }

  float a = aElemsA.x;
  float e = aElemsA.y;
  float i = aElemsA.z;
  float om = aElemsA.w;
  float w = aElemsB.x;
  float ma = aElemsB.y;
  float n = aElemsB.z;
  float epoch = aElemsB.w;
  float sizeKm = aElemsC.x;
  float flags = aElemsC.y;
  float pha = mod(floor(flags / 8.0), 2.0);

  vec3 pos = positionFromMeanElements(a, e, i, om, w, ma, n, epoch, uJD) * uAuScale;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  bool selected = (uSelectedIndex >= 0.0 && abs(float(gl_VertexID) - uSelectedIndex) < 0.5);
  vSelected = selected ? 1.0 : 0.0;
  vColor = selected ? uColorSelected : (pha > 0.5 ? uColorPha : uColorNormal);

  float sizePx = 1.6 + clamp(log2(sizeKm + 1.0), 0.0, 5.0) * 1.1;
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

export interface FieldPickCandidate {
  index: number;
  position: THREE.Vector3;
}

export class AsteroidField {
  readonly points: THREE.Points;
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.ShaderMaterial;
  readonly visible: Float32Array;
  private readonly interleaved: THREE.InterleavedBuffer;

  constructor(private dataset: AsteroidDataset) {
    const interleaved = new THREE.InterleavedBuffer(dataset.buffer, STRIDE);
    this.interleaved = interleaved;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('aElemsA', new THREE.InterleavedBufferAttribute(interleaved, 4, 0));
    geo.setAttribute('aElemsB', new THREE.InterleavedBufferAttribute(interleaved, 4, 4));
    geo.setAttribute('aElemsC', new THREE.InterleavedBufferAttribute(interleaved, 2, 8));

    this.visible = new Float32Array(dataset.count).fill(1);
    geo.setAttribute('aVisible', new THREE.BufferAttribute(this.visible, 1));
    geo.setDrawRange(0, dataset.count);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), AU_SCENE_UNITS * 6);

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
        uColorNormal: { value: new THREE.Color(0x8fb4ff) },
        uColorPha: { value: new THREE.Color(0xff5a5a) },
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

  /** CPU-side position for picking/detail/orbit-line rendering (radians already baked in). */
  positionEcliptic(index: number, jd: number): Vec3 {
    const off = index * STRIDE;
    const b = this.dataset.buffer;
    return positionFromMeanElements(
      b[off + 0],
      b[off + 1],
      b[off + 2],
      b[off + 3],
      b[off + 4],
      b[off + 5],
      b[off + 6],
      b[off + 7],
      jd
    );
  }

  positionScene(index: number, jd: number): THREE.Vector3 {
    const t = eclipticToThree(this.positionEcliptic(index, jd));
    return new THREE.Vector3(t.x * AU_SCENE_UNITS, t.y * AU_SCENE_UNITS, t.z * AU_SCENE_UNITS);
  }

  elements(index: number) {
    const off = index * STRIDE;
    const b = this.dataset.buffer;
    return {
      a: b[off + 0],
      e: b[off + 1],
      i: b[off + 2],
      om: b[off + 3],
      w: b[off + 4],
      ma: b[off + 5],
      n: b[off + 6],
      epoch: b[off + 7],
      sizeKm: b[off + 8],
      flags: b[off + 9],
    };
  }
}
