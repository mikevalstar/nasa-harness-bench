/**
 * Comet overlay. Half the comets are on open orbits, so positions come from the
 * universal-variable solver on the CPU each frame; at ~4,000 objects that is cheap.
 * Each comet gets an anti-sunward tail that grows as it nears the Sun.
 */
import * as THREE from "three";
import type { Ephemeris } from "../bodies.ts";
import { COMET_COLOR } from "../encoding.ts";
import type { Vec3 } from "../orbit.ts";
import { POINT_FRAGMENT } from "./asteroids.ts";

/** Comets fade out between these depths, measured in multiples of the camera's distance to its orbit centre. */
const FADE_START = 2;
export const FADE_END = 6;

const VERTEX = /* glsl */ `
  uniform float uPointScale;
  uniform float uViewDistance;
  uniform vec3 uColor;
  varying vec4 vColor;
  void main() {
    vec4 eye = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * eye;
    gl_PointSize = 3.2 * uPointScale;
    // Many comets are tens of au out. Fade the ones far behind the area in view,
    // or they read as a clump sitting next to the Sun. Zoom out to bring them back.
    float depth = -eye.z / uViewDistance;
    vColor = vec4(uColor, 0.9 * (1.0 - smoothstep(${FADE_START.toFixed(1)}, ${FADE_END.toFixed(1)}, depth)));
  }
`;

export class CometCloud {
  readonly group = new THREE.Group();
  /** Current xyz per comet, refreshed by `update`. Picking reads this. */
  readonly positions: Float32Array;
  private readonly eph: Ephemeris;
  private readonly count: number;
  private readonly headAttr: THREE.BufferAttribute;
  private readonly tailAttr: THREE.BufferAttribute;
  private readonly tailColorAttr: THREE.BufferAttribute;
  private readonly material: THREE.ShaderMaterial;
  private readonly scratch: Vec3 = [0, 0, 0];

  constructor(eph: Ephemeris) {
    this.eph = eph;
    const count = (this.count = eph.catalog.comets.count);
    this.positions = new Float32Array(count * 3);

    this.headAttr = new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage);
    const heads = new THREE.BufferGeometry().setAttribute("position", this.headAttr);
    this.material = new THREE.ShaderMaterial({
      uniforms: { uPointScale: { value: 1 }, uViewDistance: { value: 1 }, uColor: { value: new THREE.Color(COMET_COLOR) } },
      vertexShader: VERTEX,
      fragmentShader: POINT_FRAGMENT,
      transparent: true,
      depthWrite: false,
    });
    const points = new THREE.Points(heads, this.material);
    points.frustumCulled = false;
    points.renderOrder = 3;

    this.tailAttr = new THREE.BufferAttribute(new Float32Array(count * 6), 3).setUsage(THREE.DynamicDrawUsage);
    this.tailColorAttr = new THREE.BufferAttribute(new Float32Array(count * 6), 3).setUsage(THREE.DynamicDrawUsage);
    const tails = new THREE.BufferGeometry()
      .setAttribute("position", this.tailAttr)
      .setAttribute("color", this.tailColorAttr);
    const lines = new THREE.LineSegments(
      tails,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    lines.frustumCulled = false;
    lines.renderOrder = 3;

    this.group.add(lines, points);
  }

  /** `viewDistance` is how far the camera sits from the point it orbits, in au. */
  update(jd: number, pointScale: number, viewDistance: number): void {
    this.material.uniforms.uPointScale.value = pointScale;
    this.material.uniforms.uViewDistance.value = viewDistance;
    const head = new THREE.Color(COMET_COLOR);
    const tail = this.tailAttr.array as Float32Array;
    const tint = this.tailColorAttr.array as Float32Array;
    const p = this.scratch;
    for (let i = 0; i < this.count; i++) {
      this.eph.cometPosition(i, jd, p);
      this.positions.set(p, i * 3);
      const r = Math.hypot(p[0], p[1], p[2]);
      // Tail length and brightness follow 1/r^2, like the sunlight driving the outgassing.
      const length = r < 6 ? Math.min(0.3 / (r * r), 0.6) : 0;
      const stretch = 1 + length / Math.max(r, 1e-6);
      const glow = Math.min(1.2 / (r * r), 0.85);
      tail.set(p, i * 6);
      tail[i * 6 + 3] = p[0] * stretch;
      tail[i * 6 + 4] = p[1] * stretch;
      tail[i * 6 + 5] = p[2] * stretch;
      tint[i * 6] = head.r * glow;
      tint[i * 6 + 1] = head.g * glow;
      tint[i * 6 + 2] = head.b * glow;
    }
    this.headAttr.needsUpdate = true;
    this.tailAttr.needsUpdate = true;
    this.tailColorAttr.needsUpdate = true;
  }
}
