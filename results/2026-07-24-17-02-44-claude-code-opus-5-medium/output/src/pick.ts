/**
 * Screen-space picking for the point clouds.
 *
 * The GPU owns the positions, so picking re-solves Kepler on the CPU. To keep
 * that affordable for 42,000 objects the rotation terms are pre-baked once and
 * the inner loop uses the closed-form true-anomaly identities (no atan2), with
 * a shortened Newton iteration — screen-space accuracy only needs ~1e-4 rad.
 */
import * as THREE from 'three';
import { DEG } from './astro';
import { CO, CORB_COLS, O, ORB_COLS, type Dataset } from './data';

const STRIDE = 12; // a, e, n, ma, epoch0, cw, sw, ci, si, co, so, _pad

export class PickIndex {
  private ast: Float32Array;
  private com: Float32Array;
  private cometKind: Uint8Array; // 0 elliptic, 1 hyperbolic, 2 parabolic
  private cometQ: Float32Array;
  private cometTp: Float32Array;

  constructor(d: Dataset) {
    this.ast = buildCache(d.ast.count, (k, out, at) => {
      const b = k * ORB_COLS;
      const o = d.ast.orb;
      writeRot(out, at, o[b + O.a], o[b + O.e], o[b + O.n], o[b + O.ma], o[b + O.epoch0], o[b + O.w], o[b + O.i], o[b + O.om]);
    });

    const n = d.comets.count;
    this.com = buildCache(n, (k, out, at) => {
      const b = k * CORB_COLS;
      const o = d.comets.orb;
      let a = o[b + CO.a];
      const e = o[b + CO.e];
      if (!Number.isFinite(a)) a = 0;
      writeRot(out, at, a, e, o[b + CO.n], o[b + CO.ma], o[b + CO.epoch0], o[b + CO.w], o[b + CO.i], o[b + CO.om]);
    });
    this.cometKind = new Uint8Array(n);
    this.cometQ = new Float32Array(n);
    this.cometTp = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const b = k * CORB_COLS;
      const e = d.comets.orb[b + CO.e];
      this.cometKind[k] = e > 1.001 ? 1 : e >= 0.999 ? 2 : 0;
      this.cometQ[k] = d.comets.orb[b + CO.q];
      this.cometTp[k] = d.comets.orb[b + CO.tp0];
    }
  }

  /**
   * Nearest visible point to (sx, sy) in CSS pixels, or -1.
   * `vp` is the combined view-projection matrix.
   */
  pickAsteroid(
    vis: Float32Array,
    t: number,
    vp: THREE.Matrix4,
    w: number,
    h: number,
    sx: number,
    sy: number,
    radiusPx: number
  ): number {
    return pickIn(this.ast, vis, t, vp, w, h, sx, sy, radiusPx, null, null, null);
  }

  pickComet(
    vis: Float32Array,
    t: number,
    vp: THREE.Matrix4,
    w: number,
    h: number,
    sx: number,
    sy: number,
    radiusPx: number
  ): number {
    return pickIn(this.com, vis, t, vp, w, h, sx, sy, radiusPx, this.cometKind, this.cometQ, this.cometTp);
  }
}

function buildCache(n: number, fill: (k: number, out: Float32Array, at: number) => void): Float32Array {
  const out = new Float32Array(n * STRIDE);
  for (let k = 0; k < n; k++) fill(k, out, k * STRIDE);
  return out;
}

function writeRot(
  out: Float32Array,
  at: number,
  a: number,
  e: number,
  nDeg: number,
  maDeg: number,
  epoch0: number,
  wDeg: number,
  iDeg: number,
  omDeg: number
) {
  out[at] = a;
  out[at + 1] = e;
  out[at + 2] = (Number.isFinite(nDeg) ? nDeg : 0) * DEG;
  out[at + 3] = (Number.isFinite(maDeg) ? maDeg : 0) * DEG;
  out[at + 4] = epoch0;
  out[at + 5] = Math.cos(wDeg * DEG);
  out[at + 6] = Math.sin(wDeg * DEG);
  out[at + 7] = Math.cos(iDeg * DEG);
  out[at + 8] = Math.sin(iDeg * DEG);
  out[at + 9] = Math.cos(omDeg * DEG);
  out[at + 10] = Math.sin(omDeg * DEG);
}

const TAU = Math.PI * 2;

function pickIn(
  cache: Float32Array,
  vis: Float32Array,
  t: number,
  vp: THREE.Matrix4,
  w: number,
  h: number,
  sx: number,
  sy: number,
  radiusPx: number,
  kind: Uint8Array | null,
  qArr: Float32Array | null,
  tpArr: Float32Array | null
): number {
  const m = vp.elements;
  const n = vis.length;
  const r2max = radiusPx * radiusPx;
  let best = -1;
  let bestScore = Infinity;
  const halfW = w / 2;
  const halfH = h / 2;

  for (let k = 0; k < n; k++) {
    if (vis[k] < 0.5) continue;
    const at = k * STRIDE;
    const a = cache[at];
    const e = cache[at + 1];

    let r: number;
    let cnu: number;
    let snu: number;

    const ki = kind ? kind[k] : 0;
    if (ki === 0) {
      let M = (cache[at + 3] + cache[at + 2] * (t - cache[at + 4])) % TAU;
      if (M < 0) M += TAU;
      let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
      for (let it = 0; it < 6; it++) {
        const sE = Math.sin(E);
        const cE = Math.cos(E);
        const d = (E - e * sE - M) / (1 - e * cE);
        E -= d;
        if (d < 1e-7 && d > -1e-7) break;
      }
      const cE = Math.cos(E);
      const sE = Math.sin(E);
      const den = 1 - e * cE;
      r = a * den;
      cnu = (cE - e) / den;
      snu = (Math.sqrt(1 - e * e) * sE) / den;
    } else if (ki === 1) {
      const M = cache[at + 2] * (t - tpArr![k]);
      const s = M >= 0 ? 1 : -1;
      let H = s * Math.log((2 * Math.abs(M)) / e + 1.8);
      if (!Number.isFinite(H)) H = s * 0.1;
      for (let it = 0; it < 20; it++) {
        const sh = Math.sinh(H);
        const ch = Math.cosh(H);
        const d = (e * sh - H - M) / (e * ch - 1);
        H -= d;
        if (d < 1e-8 && d > -1e-8) break;
      }
      const ch = Math.cosh(H);
      const sh = Math.sinh(H);
      const den = e * ch - 1;
      r = a * (1 - e * ch);
      cnu = (e - ch) / den;
      snu = (Math.sqrt(e * e - 1) * sh) / den;
    } else {
      const q = qArr![k];
      const Mp = (0.01720209895 / Math.sqrt(2 * q * q * q)) * (t - tpArr![k]);
      const W = 1.5 * Mp;
      const y = Math.cbrt(W + Math.sqrt(W * W + 1));
      const D = y - 1 / y;
      r = q * (1 + D * D);
      const inv = 1 / (1 + D * D);
      cnu = (1 - D * D) * inv;
      snu = 2 * D * inv;
    }

    if (!(r > 0) || r > 200) continue;

    const cw = cache[at + 5];
    const sw = cache[at + 6];
    const cu = cnu * cw - snu * sw;
    const su = snu * cw + cnu * sw;
    const ci = cache[at + 7];
    const si = cache[at + 8];
    const co = cache[at + 9];
    const so = cache[at + 10];
    const x = r * (co * cu - so * su * ci);
    const y2 = r * (so * cu + co * su * ci);
    const z = r * (su * si);

    const cw3 = m[3] * x + m[7] * y2 + m[11] * z + m[15];
    if (cw3 <= 0) continue;
    const ndcX = (m[0] * x + m[4] * y2 + m[8] * z + m[12]) / cw3;
    const ndcY = (m[1] * x + m[5] * y2 + m[9] * z + m[13]) / cw3;
    if (ndcX < -1.2 || ndcX > 1.2 || ndcY < -1.2 || ndcY > 1.2) continue;
    const px = (ndcX + 1) * halfW;
    const py = (1 - ndcY) * halfH;
    const dx = px - sx;
    const dy = py - sy;
    const d2 = dx * dx + dy * dy;
    if (d2 > r2max) continue;
    // prefer near-cursor first, then nearer to the camera
    const score = d2 + cw3 * 0.02;
    if (score < bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}
