/**
 * The asteroid cloud: one draw call, with Kepler's equation solved per vertex on the GPU.
 * The solver mirrors `eccentricAnomaly` in `orbit.ts`; picking uses the CPU copy.
 */
import * as THREE from "three";
import { REFERENCE_JD, type Ephemeris } from "../bodies.ts";
import { dotSize, type Encoding } from "../encoding.ts";
import { KEPLER_ITERATIONS, TAU } from "../orbit.ts";

/** Re-anchor mean anomalies when the clock drifts this far, so float32 `n * dt` stays precise. */
const REBASE_DAYS = 2000;

const VERTEX = /* glsl */ `
  uniform float uDays;
  uniform float uPointScale;
  attribute vec3 aQ;
  attribute vec2 aEN;
  attribute float aMean;
  attribute float aSize;
  attribute vec4 aColor;
  varying vec4 vColor;
  const float PI = 3.141592653589793;

  void main() {
    float e = aEN.x;
    float mean = aMean + aEN.y * uDays;
    mean -= 2.0 * PI * floor(mean / (2.0 * PI) + 0.5);
    float m = abs(mean);
    float E;
    if (e < 0.6) {
      E = m + e * sin(m);
    } else {
      float p = 2.0 * (1.0 - e) / e;
      float h = 3.0 * m / e;
      float d = sqrt(h * h + p * p * p);
      E = pow(h + d, 1.0 / 3.0) - pow(max(d - h, 0.0), 1.0 / 3.0);
    }
    E = min(E, PI);
    for (int k = 0; k < ${KEPLER_ITERATIONS}; k++) {
      E = clamp(E - (E - e * sin(E) - m) / (1.0 - e * cos(E)), 0.0, PI);
    }
    if (mean < 0.0) E = -E;
    vec3 pos = position * (cos(E) - e) + aQ * sin(E);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uPointScale;
    if (aSize == 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vColor = aColor;
  }
`;

export const POINT_FRAGMENT = /* glsl */ `
  varying vec4 vColor;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = 1.0 - smoothstep(0.55, 1.0, r);
    if (alpha <= 0.0) discard;
    gl_FragColor = vec4(vColor.rgb, vColor.a * alpha);
  }
`;

export class AsteroidCloud {
  readonly points: THREE.Points;
  private readonly eph: Ephemeris;
  private readonly count: number;
  private readonly material: THREE.ShaderMaterial;
  private readonly mean: THREE.BufferAttribute;
  private readonly size: THREE.BufferAttribute;
  private readonly color: THREE.BufferAttribute;
  private readonly baseSize: Float32Array;
  private anchorJd = Number.NaN;

  constructor(eph: Ephemeris) {
    this.eph = eph;
    const { asteroids, diameterKm } = eph.catalog;
    const count = (this.count = asteroids.count);

    const en = new Float32Array(count * 2);
    this.baseSize = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      en[i * 2] = asteroids.e[i];
      en[i * 2 + 1] = eph.astN[i];
      this.baseSize[i] = dotSize(diameterKm[i]);
    }

    this.mean = new THREE.BufferAttribute(new Float32Array(count), 1);
    this.size = new THREE.BufferAttribute(this.baseSize.slice(), 1);
    this.color = new THREE.BufferAttribute(new Uint8Array(count * 4), 4, true);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(eph.astP), 3));
    geometry.setAttribute("aQ", new THREE.BufferAttribute(new Float32Array(eph.astQ), 3));
    geometry.setAttribute("aEN", new THREE.BufferAttribute(en, 2));
    geometry.setAttribute("aMean", this.mean);
    geometry.setAttribute("aSize", this.size);
    geometry.setAttribute("aColor", this.color);

    this.material = new THREE.ShaderMaterial({
      uniforms: { uDays: { value: 0 }, uPointScale: { value: 1 } },
      vertexShader: VERTEX,
      fragmentShader: POINT_FRAGMENT,
      transparent: true,
      depthWrite: false,
    });
    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
  }

  setEncoding(encoding: Encoding): void {
    (this.color.array as Uint8Array).set(encoding.rgba);
    this.color.needsUpdate = true;
    const order = Uint32Array.from({ length: this.count }, (_, i) => i);
    order.sort((x, y) => encoding.priority[x] - encoding.priority[y]);
    this.points.geometry.setIndex(new THREE.BufferAttribute(order, 1));
  }

  /** Hide asteroids that fail the filters. `keep` is one index to show regardless, or -1. */
  setVisible(visible: Uint8Array, keep: number): void {
    const sizes = this.size.array as Float32Array;
    for (let i = 0; i < this.count; i++) sizes[i] = visible[i] || i === keep ? this.baseSize[i] : 0;
    this.size.needsUpdate = true;
  }

  update(jd: number, pointScale: number): void {
    if (!(Math.abs(jd - this.anchorJd) < REBASE_DAYS)) {
      this.anchorJd = jd;
      const means = this.mean.array as Float32Array;
      const shift = jd - REFERENCE_JD;
      for (let i = 0; i < this.count; i++) {
        const m = this.eph.astM[i] + this.eph.astN[i] * shift;
        means[i] = m - TAU * Math.floor(m / TAU + 0.5);
      }
      this.mean.needsUpdate = true;
    }
    this.material.uniforms.uDays.value = jd - this.anchorJd;
    this.material.uniforms.uPointScale.value = pointScale;
  }
}
