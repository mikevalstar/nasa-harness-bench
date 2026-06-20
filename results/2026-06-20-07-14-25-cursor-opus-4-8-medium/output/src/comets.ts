import * as THREE from "three";
import { prepareOrbit, propagate, deg2rad, type PreparedOrbit, type Vec3 } from "./kepler";
import type { CometRaw } from "./types";

// Comets are propagated on the CPU (~4k bodies, cheap) because a meaningful
// fraction are hyperbolic/parabolic (e >= 1) and must be advanced from tp with
// the appropriate orbit type — see kepler.ts.

export class CometLayer {
  readonly points: THREE.Points;
  readonly count: number;
  readonly data: CometRaw[];
  private readonly orbits: PreparedOrbit[];
  private readonly positions: Float32Array;
  private readonly posAttr: THREE.BufferAttribute;
  private readonly material: THREE.PointsMaterial;
  private readonly tmp: Vec3 = { x: 0, y: 0, z: 0 };
  private _visible = false;

  constructor(comets: CometRaw[], pixelRatio: number) {
    this.data = comets;
    this.count = comets.length;
    this.orbits = comets.map((c) =>
      prepareOrbit({
        a: c.a,
        e: c.e,
        i: deg2rad(c.i),
        om: deg2rad(c.om),
        w: deg2rad(c.w),
        q: c.q,
        tp: c.tp, // absolute JD
      }),
    );

    this.positions = new Float32Array(this.count * 3);
    const color = new Float32Array(this.count * 3);
    const size = new Float32Array(this.count);
    for (let k = 0; k < this.count; k++) {
      // icy blue-white
      color[k * 3 + 0] = 0.6;
      color[k * 3 + 1] = 0.85;
      color[k * 3 + 2] = 1.0;
      const m1 = comets[k].M1;
      size[k] = m1 != null ? THREE.MathUtils.clamp(14 - m1 * 0.6, 2, 9) : 3;
    }

    const geom = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.positions, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    geom.setAttribute("position", this.posAttr);
    geom.setAttribute("color", new THREE.BufferAttribute(color, 3));
    geom.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);

    this.material = new THREE.PointsMaterial({
      size: 3.5 * pixelRatio,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: makeDiscTexture(),
      sizeAttenuation: false,
    });

    this.points = new THREE.Points(geom, this.material);
    this.points.frustumCulled = false;
    this.points.visible = false;
    this.points.renderOrder = 2;
  }

  update(jd: number): void {
    if (!this._visible) return;
    const p = this.positions;
    for (let k = 0; k < this.count; k++) {
      propagate(this.orbits[k], jd, this.tmp);
      let { x, y, z } = this.tmp;
      // Park far/invalid comets out of view to avoid float blowups.
      const r2 = x * x + y * y + z * z;
      if (!isFinite(r2) || r2 > 6400) {
        x = y = z = 1e7;
      }
      p[k * 3 + 0] = x;
      p[k * 3 + 1] = y;
      p[k * 3 + 2] = z;
    }
    this.posAttr.needsUpdate = true;
  }

  getPosition(index: number, out: THREE.Vector3): THREE.Vector3 {
    out.set(
      this.positions[index * 3],
      this.positions[index * 3 + 1],
      this.positions[index * 3 + 2],
    );
    return out;
  }

  orbitFor(index: number): PreparedOrbit {
    return this.orbits[index];
  }

  setVisible(v: boolean): void {
    this._visible = v;
    this.points.visible = v;
  }
  get visible(): boolean {
    return this._visible;
  }

  setPixelRatio(pr: number): void {
    this.material.size = 3.5 * pr;
  }
}

function makeDiscTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(200,230,255,0.8)");
  g.addColorStop(1, "rgba(160,210,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(32, 32, 32, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  return tex;
}
