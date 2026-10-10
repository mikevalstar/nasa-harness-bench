// Build step: reads the read-only JPL snapshot in data/ and writes compact,
// column-oriented JSON into public/data/ (copied into dist/data/ by Vite).
// Positions are NOT precomputed here; the app propagates orbits at runtime.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import type {
  ApproachRow,
  AsteroidRow,
  CometRow,
  Columns,
  PlanetRow,
  SentryRow,
} from "../src/types.ts";

type RawAsteroid = {
  full_name: string; pdes: string; name: string | null; pha: boolean; class: string;
  a: number; e: number; i: number; om: number; w: number; ma: number; epoch: number; n: number;
  moid: number | null; H: number | null; diameter: number | null; albedo: number | null;
  rot_per: number | null; spec_B: string | null; spec_T: string | null; first_obs: string | null;
};
type RawComet = Omit<CometRow, "name" | "cls"> & { full_name: string; class: string };
type RawApproach = {
  des: string; jd: number; dist: number; dist_min: number; dist_max: number; v_rel: number;
};
type RawSentry = Omit<SentryRow, "idx"> & { des: string };

const SRC = "data";
const OUT = "public/data";

const read = <T>(file: string): T => JSON.parse(readFileSync(`${SRC}/${file}`, "utf8")) as T;

function toColumns<Row extends Record<string, unknown>>(rows: Row[], keys: (keyof Row)[]): Columns<Row> {
  const out = { count: rows.length } as Record<string, unknown>;
  for (const k of keys) out[k as string] = rows.map((r) => r[k]);
  return out as Columns<Row>;
}

/** Round to a number of significant digits to keep the JSON small. */
const sig = (x: number, digits = 7) => Number(x.toPrecision(digits));

const asteroidsRaw = read<RawAsteroid[]>("asteroids.json");
const asteroids: AsteroidRow[] = asteroidsRaw.map((r) => ({
  name: r.full_name.trim(),
  pdes: r.pdes,
  cls: r.class,
  pha: r.pha,
  a: r.a, e: r.e, i: r.i, om: r.om, w: r.w, ma: r.ma, epoch: r.epoch,
  // Mean motion is derivable from a when missing (Gaussian gravitational constant, deg/day).
  n: r.n ?? 0.9856076686 / Math.pow(r.a, 1.5),
  moid: r.moid, H: r.H, diameter: r.diameter, albedo: r.albedo, rot_per: r.rot_per,
  spec_B: r.spec_B, spec_T: r.spec_T, first_obs: r.first_obs,
}));
// Draw order = array order: put hazardous and bright objects last so they render on top.
const sentryDes = new Set(read<RawSentry[]>("sentry.json").map((r) => r.des));
const rank = (a: AsteroidRow) => (sentryDes.has(a.pdes) ? 2 : a.pha ? 1 : 0);
asteroids.sort((x, y) => rank(x) - rank(y) || (y.H ?? 99) - (x.H ?? 99));
const indexByDes = new Map(asteroids.map((a, idx) => [a.pdes, idx]));

const comets: CometRow[] = read<RawComet[]>("comets.json").map((r) => ({
  name: r.full_name.trim(),
  pdes: r.pdes,
  cls: r.class,
  e: r.e, q: r.q, i: r.i, om: r.om, w: r.w, tp: r.tp,
  a: r.a, ma: r.ma, n: r.n, epoch: r.epoch, M1: r.M1, diameter: r.diameter,
}));

const approaches: ApproachRow[] = [];
for (const r of read<RawApproach[]>("close-approaches.json")) {
  const idx = indexByDes.get(r.des);
  if (idx === undefined) continue;
  approaches.push({
    idx,
    jd: Math.round(r.jd * 1e5) / 1e5,
    dist: sig(r.dist, 6),
    dmin: sig(r.dist_min, 6),
    dmax: sig(r.dist_max, 6),
    vrel: sig(r.v_rel, 5),
  });
}
approaches.sort((x, y) => x.jd - y.jd);

const sentry: SentryRow[] = [];
for (const r of read<RawSentry[]>("sentry.json")) {
  const idx = indexByDes.get(r.des);
  if (idx === undefined) continue;
  sentry.push({
    idx, ip: r.ip, ps_cum: r.ps_cum, ps_max: r.ps_max, ts_max: r.ts_max, range: r.range,
    n_imp: r.n_imp, v_inf: r.v_inf === null ? null : sig(r.v_inf, 4), last_obs: r.last_obs,
  });
}

const planets = read<PlanetRow[]>("planets.json");

mkdirSync(OUT, { recursive: true });
const write = (file: string, value: unknown) => writeFileSync(`${OUT}/${file}`, JSON.stringify(value));

write("asteroids.json", toColumns(asteroids, Object.keys(asteroids[0]!) as (keyof AsteroidRow)[]));
write("comets.json", toColumns(comets, Object.keys(comets[0]!) as (keyof CometRow)[]));
write("approaches.json", toColumns(approaches, Object.keys(approaches[0]!) as (keyof ApproachRow)[]));
write("sentry.json", sentry);
write("planets.json", planets);
copyFileSync(`${SRC}/provenance.json`, `${OUT}/provenance.json`);

console.log(
  `prepared ${asteroids.length} asteroids, ${comets.length} comets, ` +
    `${approaches.length} approaches, ${sentry.length} sentry rows, ${planets.length} planets`,
);
