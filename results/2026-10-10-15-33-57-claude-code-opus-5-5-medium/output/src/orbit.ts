// Two-body orbit propagation (Sun-centred, J2000 ecliptic elements).
//
// Scene axes: three.js is Y-up, so ecliptic (x, y, z) maps to scene (x, z, -y).
// The ecliptic plane is the scene's XZ plane and ecliptic north is +Y.

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
/** Gaussian gravitational constant (rad/day); GM_sun = K^2 in au^3/day^2. */
export const K = 0.01720209895;
export const KM_PER_AU = 149_597_870.7;
const KMS_PER_AU_DAY = KM_PER_AU / 86400;

export const OrbitKind = { Elliptic: 0, Hyperbolic: 1, Parabolic: 2 } as const;
export type OrbitKind = (typeof OrbitKind)[keyof typeof OrbitKind];

export type Elements = {
  e: number;
  i: number;
  om: number;
  w: number;
  /** Semi-major axis (au); negative for hyperbolic orbits, unused for parabolic ones. */
  a: number;
  /** Perihelion distance (au). */
  q: number;
  /** Elliptic: mean anomaly (deg) at `epoch`. */
  ma: number;
  epoch: number;
  /** Elliptic: mean motion (deg/day). */
  n: number;
  /** Time of perihelion (JD): used for open orbits. */
  tp: number;
};

export const orbitKind = (e: number): OrbitKind =>
  e < 1 ? OrbitKind.Elliptic : e === 1 ? OrbitKind.Parabolic : OrbitKind.Hyperbolic;

/** Solve Kepler's equation M = E - e sin E (radians). */
export function solveKepler(M: number, e: number): number {
  M = M % TAU;
  if (M > Math.PI) M -= TAU;
  else if (M < -Math.PI) M += TAU;
  let E = e < 0.8 ? M : M + 0.85 * e * Math.sign(Math.sin(M));
  for (let k = 0; k < 30; k++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return E;
}

/** Solve the hyperbolic Kepler equation M = e sinh H - H. */
export function solveHyperbolic(M: number, e: number): number {
  let H = Math.abs(M) < 6 * e ? Math.asinh(M / e) : Math.sign(M) * Math.log((2 * Math.abs(M)) / e + 1.8);
  for (let k = 0; k < 60; k++) {
    const d = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1);
    H -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return H;
}

/**
 * Many orbits in flat typed arrays, propagated together each frame.
 * Positions are written in scene coordinates (au).
 */
export class OrbitSet {
  readonly count: number;
  readonly kind: Uint8Array;
  /** Perifocal basis vectors P (towards perihelion) and Q, in scene coordinates. */
  readonly P: Float64Array;
  readonly Q: Float64Array;
  readonly e: Float64Array;
  readonly a: Float64Array;
  readonly q: Float64Array;
  /** Elliptic: mean anomaly (rad) at t0 and mean motion (rad/day). Open orbits: t0 = tp. */
  readonly M0: Float64Array;
  readonly n: Float64Array;
  readonly t0: Float64Array;

  constructor(elements: Elements[]) {
    const N = (this.count = elements.length);
    this.kind = new Uint8Array(N);
    this.P = new Float64Array(N * 3);
    this.Q = new Float64Array(N * 3);
    this.e = new Float64Array(N);
    this.a = new Float64Array(N);
    this.q = new Float64Array(N);
    this.M0 = new Float64Array(N);
    this.n = new Float64Array(N);
    this.t0 = new Float64Array(N);

    elements.forEach((el, j) => {
      const kind = orbitKind(el.e);
      this.kind[j] = kind;
      const [P, Q] = basis(el.i, el.om, el.w);
      this.P.set(P, j * 3);
      this.Q.set(Q, j * 3);
      this.e[j] = el.e;
      this.a[j] = el.a;
      this.q[j] = el.q;
      if (kind === OrbitKind.Elliptic) {
        this.M0[j] = el.ma * DEG;
        this.n[j] = el.n * DEG;
        this.t0[j] = el.epoch;
      } else {
        this.t0[j] = el.tp;
      }
    });
  }

  /** In-plane perifocal coordinates (x along P, y along Q) at time `jd`. */
  planar(j: number, jd: number): [number, number] {
    const e = this.e[j]!;
    const dt = jd - this.t0[j]!;
    switch (this.kind[j]) {
      case OrbitKind.Elliptic: {
        const a = this.a[j]!;
        const E = solveKepler(this.M0[j]! + this.n[j]! * dt, e);
        return [a * (Math.cos(E) - e), a * Math.sqrt(1 - e * e) * Math.sin(E)];
      }
      case OrbitKind.Hyperbolic: {
        const a = this.a[j]!; // negative
        const H = solveHyperbolic((K * dt) / Math.pow(-a, 1.5), e);
        return [a * (Math.cosh(H) - e), -a * Math.sqrt(e * e - 1) * Math.sinh(H)];
      }
      default: {
        // Barker's equation, solved in closed form for s = tan(true anomaly / 2).
        const q = this.q[j]!;
        const W = (3 * K * dt) / Math.sqrt(2 * q * q * q);
        const Y = Math.cbrt(W / 2 + Math.sqrt((W * W) / 4 + 1));
        const s = Y - 1 / Y;
        return [q * (1 - s * s), 2 * q * s];
      }
    }
  }

  /** Writes the scene position of body `j` into `out[o..o+2]`. */
  positionInto(j: number, jd: number, out: Float32Array | Float64Array | number[], o = 0) {
    const [x, y] = this.planar(j, jd);
    const b = j * 3;
    out[o] = x * this.P[b]! + y * this.Q[b]!;
    out[o + 1] = x * this.P[b + 1]! + y * this.Q[b + 1]!;
    out[o + 2] = x * this.P[b + 2]! + y * this.Q[b + 2]!;
  }

  /** Propagates every body to `jd`, writing xyz triples into `out`. */
  propagate(jd: number, out: Float32Array) {
    for (let j = 0; j < this.count; j++) this.positionInto(j, jd, out, j * 3);
  }

  position(j: number, jd: number): [number, number, number] {
    const p: [number, number, number] = [0, 0, 0];
    this.positionInto(j, jd, p);
    return p;
  }

  /** Heliocentric speed (km/s) from the vis-viva equation. */
  speedKms(j: number, jd: number): number {
    const [x, y, z] = this.position(j, jd);
    const r = Math.hypot(x, y, z);
    const inv = this.kind[j] === OrbitKind.Parabolic ? 0 : 1 / this.a[j]!;
    return K * Math.sqrt(Math.max(0, 2 / r - inv)) * KMS_PER_AU_DAY;
  }

  /**
   * Polyline of the orbit in scene coordinates. Closed orbits are sampled by
   * eccentric anomaly; open ones are cut off where they pass `maxR` au from the Sun.
   */
  path(j: number, segments = 256, maxR = 60): Float32Array {
    const e = this.e[j]!;
    const a = this.a[j]!;
    const q = this.q[j]!;
    const kind = this.kind[j];
    const pts = new Float32Array((segments + 1) * 3);
    const b = j * 3;
    for (let s = 0; s <= segments; s++) {
      const u = s / segments;
      let x: number;
      let y: number;
      if (kind === OrbitKind.Elliptic) {
        const E = u * TAU;
        x = a * (Math.cos(E) - e);
        y = a * Math.sqrt(1 - e * e) * Math.sin(E);
      } else if (kind === OrbitKind.Hyperbolic) {
        // r = a(1 - e cosh H) <= maxR  =>  cosh H <= (1 - maxR/a) / e
        const Hmax = Math.acosh(Math.max(1, (1 - maxR / a) / e));
        const H = (u * 2 - 1) * Hmax;
        x = a * (Math.cosh(H) - e);
        y = -a * Math.sqrt(e * e - 1) * Math.sinh(H);
      } else {
        // r = q(1 + s^2) <= maxR
        const smax = Math.sqrt(Math.max(0, maxR / q - 1));
        const sv = (u * 2 - 1) * smax;
        x = q * (1 - sv * sv);
        y = 2 * q * sv;
      }
      pts[s * 3] = x * this.P[b]! + y * this.Q[b]!;
      pts[s * 3 + 1] = x * this.P[b + 1]! + y * this.Q[b + 1]!;
      pts[s * 3 + 2] = x * this.P[b + 2]! + y * this.Q[b + 2]!;
    }
    return pts;
  }
}

/** Perifocal basis (P, Q) for the given angles, converted to scene axes. */
function basis(iDeg: number, omDeg: number, wDeg: number): [number[], number[]] {
  const ci = Math.cos(iDeg * DEG), si = Math.sin(iDeg * DEG);
  const cO = Math.cos(omDeg * DEG), sO = Math.sin(omDeg * DEG);
  const cw = Math.cos(wDeg * DEG), sw = Math.sin(wDeg * DEG);
  const P = [cw * cO - sw * sO * ci, cw * sO + sw * cO * ci, sw * si];
  const Q = [-sw * cO - cw * sO * ci, -sw * sO + cw * cO * ci, cw * si];
  const toScene = (v: number[]) => [v[0]!, v[2]!, -v[1]!];
  return [toScene(P), toScene(Q)];
}

// ---------------------------------------------------------------- time

const UNIX_EPOCH_JD = 2440587.5;
export const jdFromMs = (ms: number) => ms / 86_400_000 + UNIX_EPOCH_JD;
export const msFromJd = (jd: number) => (jd - UNIX_EPOCH_JD) * 86_400_000;

/** "2026-10-10 14:05" in UTC (TDB/UTC difference of ~1 minute is ignored). */
export function formatJd(jd: number, withTime = true): string {
  const d = new Date(msFromJd(jd));
  if (Number.isNaN(d.getTime())) return "—";
  const iso = d.toISOString();
  return withTime ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}` : iso.slice(0, 10);
}
