// Runtime data loading. All paths are relative (the site is served from a
// sub-path inside an iframe).

export interface AsteroidMeta {
  i: number;
  n: string; // full name
  nm: string | null; // IAU name
  d: string; // designation (pdes)
  c: string; // orbit class
  pha: number;
  neo: number;
  a: number;
  e: number;
  inc: number;
  om: number;
  w: number;
  q: number;
  ad: number;
  per: number;
  tp: number;
  moid: number | null;
  H: number | null;
  dia: number | null;
  alb: number | null;
  rot: number | null;
  spec: string | null;
  obs: string | null;
  sentry: number;
}

export interface CometMeta {
  i: number;
  n: string;
  d: string;
  c: string;
  a: number | null;
  e: number;
  inc: number;
  q: number;
  per: number | null;
  tp: number;
  M1: number | null;
  dia: number | null;
  comet: 1;
}

export interface PlanetRow {
  name: string;
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  n: number;
  per: number;
  epoch: number;
  radius_km: number;
}

export interface SentryRow {
  des: string;
  name: string;
  ip: number;
  ps_cum: number;
  ps_max: number;
  ts_max: number;
  range: string;
  n_imp: number;
  dia: number | null;
  h: number | null;
  v_inf: number | null;
  last_obs: string;
}

export interface CloseApproach {
  des: string;
  cd: string;
  jd: number;
  dist: number;
  dmin: number;
  v: number;
  h: number;
}

export interface Manifest {
  refEpoch: number;
  k: number;
  asteroids: number;
  comets: number;
  classes: Record<string, number>;
}

export interface BodySet {
  A: Float32Array; // vec4 * N : (a, e, i, om)
  B: Float32Array; // vec4 * N : (w, n, q, tpOff)
  E: Float32Array; // vec2 * N : (sizeKey, flags)
  count: number;
}

const base = import.meta.env.BASE_URL || "./";
const url = (p: string) => `${base}data/${p}`;

async function fetchBin(p: string): Promise<Float32Array> {
  const r = await fetch(url(p));
  if (!r.ok) throw new Error(`failed to load ${p}: ${r.status}`);
  const buf = await r.arrayBuffer();
  return new Float32Array(buf);
}

async function fetchJSON<T>(p: string): Promise<T> {
  const r = await fetch(url(p));
  if (!r.ok) throw new Error(`failed to load ${p}: ${r.status}`);
  return r.json();
}

export async function loadBodySet(name: string): Promise<BodySet> {
  const [A, B, E] = await Promise.all([
    fetchBin(`${name}.A.bin`),
    fetchBin(`${name}.B.bin`),
    fetchBin(`${name}.E.bin`),
  ]);
  return { A, B, E, count: A.length / 4 };
}

export const loadAsteroidMeta = () =>
  fetchJSON<AsteroidMeta[]>("asteroids.meta.json");
export const loadCometMeta = () => fetchJSON<CometMeta[]>("comets.meta.json");
export const loadPlanets = () => fetchJSON<PlanetRow[]>("planets.json");
export const loadSentry = () => fetchJSON<SentryRow[]>("sentry.json");
export const loadManifest = () => fetchJSON<Manifest>("manifest.json");

let caCache: CloseApproach[] | null = null;
let caIndex: Map<string, CloseApproach[]> | null = null;
export async function loadCloseApproachIndex(): Promise<
  Map<string, CloseApproach[]>
> {
  if (caIndex) return caIndex;
  caCache = await fetchJSON<CloseApproach[]>("close-approaches.json");
  caIndex = new Map();
  for (const c of caCache) {
    let arr = caIndex.get(c.des);
    if (!arr) caIndex.set(c.des, (arr = []));
    arr.push(c);
  }
  for (const arr of caIndex.values()) arr.sort((a, b) => a.jd - b.jd);
  return caIndex;
}
