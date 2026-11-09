import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  conicPosition,
  DEG,
  eccentricAnomaly,
  ellipsePosition,
  GAUSS_K,
  perifocalBasis,
  TAU,
  type Vec3,
} from "./orbit.ts";

interface Row {
  pdes: string;
  des: string;
  name: string;
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  epoch: number;
  n: number;
  q: number;
  tp: number;
  jd: number;
  dist: number;
}
const load = (file: string): Row[] => JSON.parse(readFileSync(`data/${file}.json`, "utf8")) as Row[];

function elementsPosition(row: Row, jd: number): Vec3 {
  const basis = perifocalBasis(row.i, row.om, row.w);
  return ellipsePosition(row.a, row.e, (row.ma + row.n * (jd - row.epoch)) * DEG, basis, [0, 0, 0]);
}

describe("eccentricAnomaly", () => {
  it("satisfies Kepler's equation across the eccentricity range of the NEO catalogue", () => {
    let worst = 0;
    for (const e of [0, 0.0028, 0.2, 0.59, 0.61, 0.9, 0.97, 0.99, 0.9964, 0.9999]) {
      for (let k = -2000; k <= 2000; k++) {
        const m = (k / 2000) * Math.PI * 0.999999;
        const E = eccentricAnomaly(m, e);
        worst = Math.max(worst, Math.abs(E - e * Math.sin(E) - m));
      }
    }
    expect(worst).toBeLessThan(1e-9);
  });

  it("wraps mean anomalies outside one revolution", () => {
    expect(eccentricAnomaly(1 + 5 * TAU, 0.3)).toBeCloseTo(eccentricAnomaly(1, 0.3), 9);
  });
});

describe("conicPosition", () => {
  it("matches the elliptic solver for closed orbits", () => {
    const basis = perifocalBasis(12, 80, 200);
    for (const e of [0.05, 0.5, 0.9, 0.99, 0.9999]) {
      const q = 0.7;
      const a = q / (1 - e);
      const n = GAUSS_K / Math.pow(a, 1.5);
      for (const dt of [-900, -30, -0.5, 0, 3, 77, 400, 5000]) {
        const u = conicPosition(q, e, dt, basis, [0, 0, 0]);
        const v = ellipsePosition(a, e, n * dt, basis, [0, 0, 0]);
        expect(Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2])).toBeLessThan(1e-7 * a);
      }
    }
  });

  it("conserves energy and passes perihelion at dt = 0 on open orbits", () => {
    const basis = perifocalBasis(40, 10, 120);
    for (const e of [1, 1.0003, 1.2, 6.14]) {
      const q = 1.3;
      const at = (dt: number): Vec3 => conicPosition(q, e, dt, basis, [0, 0, 0]);
      expect(Math.hypot(...at(0))).toBeCloseTo(q, 10);
      for (const dt of [-40000, -200, 15, 3000, 80000]) {
        const h = 1e-3 * Math.max(1, Math.abs(dt) / 1000);
        const r = Math.hypot(...at(dt));
        const [x1, y1, z1] = at(dt - h);
        const [x2, y2, z2] = at(dt + h);
        const speed = Math.hypot(x2 - x1, y2 - y1, z2 - z1) / (2 * h);
        const visViva = GAUSS_K * Math.sqrt(2 / r - (1 - e) / q);
        expect(speed / visViva).toBeCloseTo(1, 4);
      }
    }
  });
});

describe("against the dataset", () => {
  it("puts asteroids near Earth at their recorded close approaches around the element epoch", () => {
    const earth = load("planets").find((p) => p.name === "Earth") as Row;
    const byDes = new Map(load("asteroids").map((r) => [r.pdes, r]));
    const errors: number[] = [];
    for (const ca of load("close-approaches")) {
      const ast = byDes.get(ca.des);
      if (!ast || Math.abs(ca.jd - ast.epoch) > 200) continue;
      const p = elementsPosition(ast, ca.jd);
      const q = elementsPosition(earth, ca.jd);
      errors.push(Math.abs(Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) - ca.dist));
    }
    errors.sort((x, y) => x - y);
    expect(errors.length).toBeGreaterThan(500);
    // Elements are rounded to 4 digits and Earth's are mean J2000 elements,
    // so agreement to about a hundredth of an au is what the data allows.
    expect(errors[Math.floor(errors.length / 2)]).toBeLessThan(0.01);
  });

  it("agrees with tp: asteroids sit at perihelion distance at their perihelion time", () => {
    const rows = load("asteroids").filter((_, index) => index % 50 === 0);
    let worst = 0;
    for (const row of rows) {
      const r = Math.hypot(...elementsPosition(row, row.tp));
      worst = Math.max(worst, Math.abs(r - row.q) / row.q);
    }
    expect(worst).toBeLessThan(0.02);
  });
});
