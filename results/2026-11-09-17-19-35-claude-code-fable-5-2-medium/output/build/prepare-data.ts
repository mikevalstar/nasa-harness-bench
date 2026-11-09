/**
 * Build step: reads the read-only snapshot in `data/` and writes compact
 * columnar copies to `public/data/`, which Vite then copies into `dist/data/`.
 * Values are passed through unchanged apart from rounding the close-approach
 * numbers to 6 significant digits. No positions are computed here.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  ApproachTable,
  AsteroidTable,
  CometTable,
  PlanetRow,
  SentryRow,
  Sparse,
} from "../src/data/schema.ts";

interface RawAsteroid {
  full_name: string;
  pdes: string;
  pha: boolean;
  class: string;
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  epoch: number;
  n: number;
  moid: number | null;
  H: number | null;
  G: number | null;
  diameter: number | null;
  albedo: number | null;
  rot_per: number | null;
  spec_B: string | null;
  spec_T: string | null;
  first_obs: string | null;
}

interface RawComet {
  full_name: string;
  pdes: string;
  class: string;
  e: number;
  q: number;
  i: number;
  om: number;
  w: number;
  tp: number;
  M1: number | null;
  diameter: number | null;
}

interface RawApproach {
  des: string;
  jd: number;
  dist: number;
  dist_min: number;
  dist_max: number;
  v_rel: number;
}

interface RawSentry {
  des: string;
  ip: number;
  ps_cum: number;
  ps_max: number;
  ts_max: number | null;
  range: string;
  n_imp: number;
  diameter: number;
  h: number;
  v_inf: number | null;
  last_obs: string;
}

function sparse<R, T>(rows: R[], pick: (row: R) => T | null): Sparse<T> {
  const out: Sparse<T> = { idx: [], val: [] };
  rows.forEach((row, index) => {
    const value = pick(row);
    if (value !== null && value !== undefined) {
      out.idx.push(index);
      out.val.push(value);
    }
  });
  return out;
}

function classIndex<R extends { class: string }>(rows: R[]): { classes: string[]; cls: number[] } {
  const classes = [...new Set(rows.map((r) => r.class))].sort();
  return { classes, cls: rows.map((r) => classes.indexOf(r.class)) };
}

const sig6 = (x: number): number => Number(x.toPrecision(6));

export function prepareData(root: string): void {
  const read = <T>(file: string): T =>
    JSON.parse(readFileSync(join(root, "data", file), "utf8")) as T;
  const outDir = join(root, "public", "data");
  mkdirSync(outDir, { recursive: true });
  const write = (file: string, value: unknown): void =>
    writeFileSync(join(outDir, file), JSON.stringify(value));

  write("planets.json", read<PlanetRow[]>("planets.json"));

  const rawAst = read<RawAsteroid[]>("asteroids.json");
  const asteroids: AsteroidTable = {
    count: rawAst.length,
    ...classIndex(rawAst),
    fullName: rawAst.map((r) => r.full_name.trim()),
    pdes: rawAst.map((r) => r.pdes),
    pha: rawAst.map((r) => (r.pha ? 1 : 0)),
    a: rawAst.map((r) => r.a),
    e: rawAst.map((r) => r.e),
    i: rawAst.map((r) => r.i),
    om: rawAst.map((r) => r.om),
    w: rawAst.map((r) => r.w),
    ma: rawAst.map((r) => r.ma),
    epoch: rawAst.map((r) => r.epoch),
    n: rawAst.map((r) => r.n),
    moid: rawAst.map((r) => r.moid),
    H: rawAst.map((r) => r.H),
    firstObs: rawAst.map((r) => r.first_obs),
    diameter: sparse(rawAst, (r) => r.diameter),
    albedo: sparse(rawAst, (r) => r.albedo),
    rotPer: sparse(rawAst, (r) => r.rot_per),
    G: sparse(rawAst, (r) => r.G),
    specB: sparse(rawAst, (r) => r.spec_B),
    specT: sparse(rawAst, (r) => r.spec_T),
  };
  write("asteroids.json", asteroids);

  const rowOf = new Map(rawAst.map((r, index) => [r.pdes, index]));

  // Comets that are also NEOs already appear in the asteroid table; keep one copy.
  const rawComets = read<RawComet[]>("comets.json").filter((r) => !rowOf.has(r.pdes));
  const comets: CometTable = {
    count: rawComets.length,
    ...classIndex(rawComets),
    fullName: rawComets.map((r) => r.full_name.trim()),
    pdes: rawComets.map((r) => r.pdes),
    e: rawComets.map((r) => r.e),
    q: rawComets.map((r) => r.q),
    i: rawComets.map((r) => r.i),
    om: rawComets.map((r) => r.om),
    w: rawComets.map((r) => r.w),
    tp: rawComets.map((r) => r.tp),
    M1: rawComets.map((r) => r.M1),
    diameter: sparse(rawComets, (r) => r.diameter),
  };
  write("comets.json", comets);

  const rawCa = read<RawApproach[]>("close-approaches.json")
    .filter((r) => rowOf.has(r.des))
    .sort((x, y) => x.jd - y.jd);
  const approaches: ApproachTable = {
    count: rawCa.length,
    ast: rawCa.map((r) => rowOf.get(r.des) as number),
    jd: rawCa.map((r) => Number(r.jd.toFixed(4))),
    dist: rawCa.map((r) => sig6(r.dist)),
    distMin: rawCa.map((r) => sig6(r.dist_min)),
    distMax: rawCa.map((r) => sig6(r.dist_max)),
    vRel: rawCa.map((r) => Number(r.v_rel.toFixed(2))),
  };
  write("approaches.json", approaches);

  const sentry: SentryRow[] = read<RawSentry[]>("sentry.json")
    .filter((r) => rowOf.has(r.des))
    .map((r) => ({
      ast: rowOf.get(r.des) as number,
      ip: r.ip,
      psCum: r.ps_cum,
      psMax: r.ps_max,
      tsMax: r.ts_max,
      range: r.range,
      nImp: r.n_imp,
      diameter: r.diameter,
      h: r.h,
      vInf: r.v_inf === null ? null : Number(r.v_inf.toFixed(2)),
      lastObs: r.last_obs,
    }));
  write("sentry.json", sentry);

  console.log(
    `[data] ${asteroids.count} asteroids, ${comets.count} comets, ` +
      `${approaches.count} close approaches, ${sentry.length} sentry rows`,
  );
}
