/**
 * Runtime data loading. Everything comes from ./data next to index.html
 * (relative URLs — the site is served from a sub-path inside an iframe).
 */
import type { Elements } from './astro';

export interface Planet {
  name: string;
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  n: number;
  per: number;
  epoch0: number;
  radius_km: number;
}

export interface AsteroidMeta {
  count: number;
  classes: string[];
  display: string[];
  name: string[];
  pdes: string[];
  spec: string[];
  first_obs: string[];
}

export interface SentryRow {
  row: number;
  des: string;
  fullname: string;
  ip: number | null;
  ps_cum: number | null;
  ps_max: number | null;
  ts_max: number | null;
  range: string | null;
  n_imp: number | null;
  diameter: number | null;
  h: number | null;
  v_inf: number | null;
  last_obs: string | null;
}

export interface CometMeta {
  count: number;
  classes: string[];
  name: string[];
  pdes: string[];
}

export const ORB_COLS = 8;
export const PHYS_COLS = 8;
export const CORB_COLS = 10;

/** Column offsets inside the packed asteroid arrays. */
export const O = { a: 0, e: 1, i: 2, om: 3, w: 4, ma: 5, n: 6, epoch0: 7 } as const;
export const P = { H: 0, diameter: 1, moid: 2, q: 3, ad: 4, per: 5, albedo: 6, tp0: 7 } as const;
export const CO = { e: 0, a: 1, q: 2, i: 3, om: 4, w: 5, ma: 6, n: 7, epoch0: 8, tp0: 9 } as const;

export interface Dataset {
  planets: Planet[];
  ast: {
    count: number;
    orb: Float32Array;
    phys: Float32Array;
    flags: Uint8Array;
    caOffset: Uint32Array;
    caCount: Uint16Array;
    meta: AsteroidMeta;
    /** lower-cased search haystack, built once */
    search: string[];
  };
  ca: {
    count: number;
    jd: Float64Array;
    data: Float32Array;
    row: Uint32Array;
  };
  sentry: SentryRow[];
  sentryByRow: Map<number, SentryRow>;
  comets: {
    count: number;
    orb: Float32Array;
    flags: Uint8Array;
    mag: Float32Array;
    meta: CometMeta;
  };
}

const BASE = 'data/';

async function fetchBin<T>(path: string, ctor: new (b: ArrayBuffer) => T): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`failed to load ${path}: ${res.status}`);
  return new ctor(await res.arrayBuffer());
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export async function loadAll(onProgress: (msg: string, frac: number) => void): Promise<Dataset> {
  onProgress('loading planets & orbital elements…', 0.05);
  const [planets, orb, flags, meta] = await Promise.all([
    fetchJson<Planet[]>('planets.json'),
    fetchBin('asteroids.orb.f32', Float32Array),
    fetchBin('asteroids.flags.u8', Uint8Array),
    fetchJson<AsteroidMeta>('asteroids.meta.json'),
  ]);

  onProgress('loading physical properties…', 0.45);
  const [phys, caOffset, caCount] = await Promise.all([
    fetchBin('asteroids.phys.f32', Float32Array),
    fetchBin('asteroids.caoff.u32', Uint32Array),
    fetchBin('asteroids.cacount.u16', Uint16Array),
  ]);

  onProgress('loading close approaches & risk data…', 0.7);
  const [caJd, caData, caRow, caMeta, sentry, comets, cflags, cmag, cmeta] = await Promise.all([
    fetchBin('approaches.jd.f64', Float64Array),
    fetchBin('approaches.data.f32', Float32Array),
    fetchBin('approaches.row.u32', Uint32Array),
    fetchJson<{ count: number }>('approaches.meta.json'),
    fetchJson<SentryRow[]>('sentry.json'),
    fetchBin('comets.orb.f32', Float32Array),
    fetchBin('comets.flags.u8', Uint8Array),
    fetchBin('comets.mag.f32', Float32Array),
    fetchJson<CometMeta>('comets.meta.json'),
  ]);

  onProgress('indexing…', 0.92);
  const search = new Array<string>(meta.count);
  for (let k = 0; k < meta.count; k++) search[k] = meta.display[k].toLowerCase();

  const sentryByRow = new Map<number, SentryRow>();
  for (const s of sentry) if (s.row >= 0) sentryByRow.set(s.row, s);

  return {
    planets,
    ast: { count: meta.count, orb, phys, flags, caOffset, caCount, meta, search },
    ca: { count: caMeta.count, jd: caJd, data: caData, row: caRow },
    sentry,
    sentryByRow,
    comets: { count: cmeta.count, orb: comets, flags: cflags, mag: cmag, meta: cmeta },
  };
}

/* ------------------------------------------------------------- accessors */

export function asteroidElements(d: Dataset, k: number): Elements {
  const b = k * ORB_COLS;
  const o = d.ast.orb;
  return {
    a: o[b + O.a],
    e: o[b + O.e],
    i: o[b + O.i],
    om: o[b + O.om],
    w: o[b + O.w],
    ma: o[b + O.ma],
    n: o[b + O.n],
    epoch0: o[b + O.epoch0],
    q: d.ast.phys[k * PHYS_COLS + P.q],
    tp0: d.ast.phys[k * PHYS_COLS + P.tp0],
  };
}

export function cometElements(d: Dataset, k: number): Elements {
  const b = k * CORB_COLS;
  const o = d.comets.orb;
  return {
    a: o[b + CO.a],
    e: o[b + CO.e],
    i: o[b + CO.i],
    om: o[b + CO.om],
    w: o[b + CO.w],
    ma: o[b + CO.ma],
    n: o[b + CO.n],
    epoch0: o[b + CO.epoch0],
    q: o[b + CO.q],
    tp0: o[b + CO.tp0],
  };
}

export function planetElements(p: Planet): Elements {
  return { a: p.a, e: p.e, i: p.i, om: p.om, w: p.w, ma: p.ma, n: p.n, epoch0: p.epoch0 };
}

export function isPHA(d: Dataset, k: number): boolean {
  return d.ast.flags[k * 3] === 1;
}

export function classOf(d: Dataset, k: number): string {
  return d.ast.meta.classes[d.ast.flags[k * 3 + 1]] ?? 'UNK';
}

export function hasSentry(d: Dataset, k: number): boolean {
  return (d.ast.flags[k * 3 + 2] & 2) !== 0;
}

export function diameterMeasured(d: Dataset, k: number): boolean {
  return (d.ast.flags[k * 3 + 2] & 1) !== 0;
}
