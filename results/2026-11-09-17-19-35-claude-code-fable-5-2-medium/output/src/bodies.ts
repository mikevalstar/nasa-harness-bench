/** Where every body is at a given Julian date, plus the names and conics the UI needs. */
import type { Catalog } from "./data/catalog.ts";
import {
  conicPosition,
  DEG,
  eccentricAnomaly,
  ellipsePosition,
  perifocalBasis,
  type Basis,
  type Vec3,
} from "./orbit.ts";

export type BodyKind = "sun" | "planet" | "asteroid" | "comet";

export interface BodyRef {
  kind: BodyKind;
  index: number;
}

export const SUN: BodyRef = { kind: "sun", index: 0 };

export const sameBody = (x: BodyRef | null, y: BodyRef | null): boolean =>
  x === y || (x !== null && y !== null && x.kind === y.kind && x.index === y.index);

/** Shape and orientation of an orbit, enough to draw it and to get speed from distance. */
export interface Conic {
  q: number;
  e: number;
  basis: Basis;
}

/**
 * Asteroid mean anomalies are stored at one shared reference date so the GPU can
 * advance all of them with a single time offset. Each object is first advanced
 * from its own epoch to this date in double precision.
 */
export const REFERENCE_JD = 2461200.5;

export class Ephemeris {
  readonly catalog: Catalog;
  /** Per asteroid, xyz triples: perihelion direction scaled by a, and its in-plane normal scaled by b. */
  readonly astP: Float64Array;
  readonly astQ: Float64Array;
  /** Per asteroid: mean anomaly at `REFERENCE_JD` and mean motion, radians and radians/day. */
  readonly astM: Float64Array;
  readonly astN: Float64Array;
  private readonly planetBasis: Basis[];
  private readonly cometBasis: Basis[];
  private readonly earthIndex: number;

  constructor(catalog: Catalog) {
    this.catalog = catalog;
    const ast = catalog.asteroids;
    this.astP = new Float64Array(ast.count * 3);
    this.astQ = new Float64Array(ast.count * 3);
    this.astM = new Float64Array(ast.count);
    this.astN = new Float64Array(ast.count);
    for (let i = 0; i < ast.count; i++) {
      const basis = perifocalBasis(ast.i[i], ast.om[i], ast.w[i]);
      const a = ast.a[i];
      const b = a * Math.sqrt(1 - ast.e[i] * ast.e[i]);
      this.astP.set([basis.px * a, basis.py * a, basis.pz * a], i * 3);
      this.astQ.set([basis.qx * b, basis.qy * b, basis.qz * b], i * 3);
      const meanDeg = ast.ma[i] + ast.n[i] * (REFERENCE_JD - ast.epoch[i]);
      this.astM[i] = (((meanDeg % 360) + 360) % 360) * DEG;
      this.astN[i] = ast.n[i] * DEG;
    }
    this.planetBasis = catalog.planets.map((p) => perifocalBasis(p.i, p.om, p.w));
    const comets = catalog.comets;
    this.cometBasis = comets.i.map((inc, k) => perifocalBasis(inc, comets.om[k], comets.w[k]));
    this.earthIndex = catalog.planets.findIndex((p) => p.name === "Earth");
  }

  get earth(): BodyRef {
    return { kind: "planet", index: this.earthIndex };
  }

  asteroidPosition(i: number, jd: number, out: Vec3): Vec3 {
    const e = this.catalog.asteroids.e[i];
    const E = eccentricAnomaly(this.astM[i] + this.astN[i] * (jd - REFERENCE_JD), e);
    const x = Math.cos(E) - e;
    const y = Math.sin(E);
    const k = i * 3;
    out[0] = x * this.astP[k] + y * this.astQ[k];
    out[1] = x * this.astP[k + 1] + y * this.astQ[k + 1];
    out[2] = x * this.astP[k + 2] + y * this.astQ[k + 2];
    return out;
  }

  cometPosition(i: number, jd: number, out: Vec3): Vec3 {
    const comets = this.catalog.comets;
    return conicPosition(comets.q[i], comets.e[i], jd - comets.tp[i], this.cometBasis[i], out);
  }

  position(ref: BodyRef, jd: number, out: Vec3): Vec3 {
    switch (ref.kind) {
      case "sun":
        out[0] = out[1] = out[2] = 0;
        return out;
      case "planet": {
        const p = this.catalog.planets[ref.index];
        return ellipsePosition(p.a, p.e, (p.ma + p.n * (jd - p.epoch)) * DEG, this.planetBasis[ref.index], out);
      }
      case "asteroid":
        return this.asteroidPosition(ref.index, jd, out);
      case "comet":
        return this.cometPosition(ref.index, jd, out);
    }
  }

  /** Null for the Sun, which has no orbit here. */
  conic(ref: BodyRef): Conic | null {
    const { planets, asteroids, comets } = this.catalog;
    switch (ref.kind) {
      case "sun":
        return null;
      case "planet": {
        const p = planets[ref.index];
        return { q: p.a * (1 - p.e), e: p.e, basis: this.planetBasis[ref.index] };
      }
      case "asteroid": {
        const i = ref.index;
        return {
          q: asteroids.a[i] * (1 - asteroids.e[i]),
          e: asteroids.e[i],
          basis: perifocalBasis(asteroids.i[i], asteroids.om[i], asteroids.w[i]),
        };
      }
      case "comet":
        return { q: comets.q[ref.index], e: comets.e[ref.index], basis: this.cometBasis[ref.index] };
    }
  }

  /** Name without the provisional designation, for labels: "99942 Apophis (2004 MN4)" -> "99942 Apophis". */
  shortName(ref: BodyRef): string {
    const full = this.name(ref);
    if (ref.kind !== "asteroid") return full;
    return full.startsWith("(") ? full.slice(1, -1) : full.replace(/ \(.*\)$/, "");
  }

  name(ref: BodyRef): string {
    switch (ref.kind) {
      case "sun":
        return "Sun";
      case "planet":
        return this.catalog.planets[ref.index].name;
      case "asteroid":
        return this.catalog.asteroids.fullName[ref.index];
      case "comet":
        return this.catalog.comets.fullName[ref.index];
    }
  }
}
