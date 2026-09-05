// Runtime data loading (relative fetch URLs — the site is served from a sub-path).
import type { Elements } from './orbit';

const base = new URL('data/', document.baseURI).toString();
async function get(path: string): Promise<Response> {
  const r = await fetch(base + path);
  if (!r.ok) throw new Error(`failed to load ${path}: ${r.status}`);
  return r;
}

export interface PlanetRec extends Elements {
  name: string;
  radiusKm: number;
  per: number;
}

export interface BodyStore {
  n: number;
  els: Elements[]; // lightweight views over packed arrays
  pdes: string[];
  label: string[]; // display name
  cls: string[];
  pha: Uint8Array; // asteroids only (zeros for comets)
  H: Float32Array;
  diam: Float32Array;
  moid: Float32Array; // asteroids only
  alb: Float32Array;
  rotp: Float32Array;
  spec: ([string | null, string | null])[]; // asteroids only
  firstObs: (string | null)[]; // asteroids only
  M1: Float32Array; // comets only
  per: Float32Array;
  byPdes: Map<string, number>;
}

function packAsteroids(buf: ArrayBuffer, meta: any): BodyStore {
  const dv = new DataView(buf);
  const n = dv.getUint32(0, true);
  const els: Elements[] = new Array(n);
  const H = new Float32Array(n);
  const diam = new Float32Array(n);
  const moid = new Float32Array(n);
  const alb = new Float32Array(n);
  const rotp = new Float32Array(n);
  const pha = new Uint8Array(n);
  let o = 4;
  const g = () => {
    const v = dv.getFloat32(o, true);
    o += 4;
    return v;
  };
  for (let k = 0; k < n; k++) {
    const a = g(), e = g(), i = g(), om = g(), w = g(), ma = g(), epoch = g(), nn = g();
    H[k] = g();
    diam[k] = g();
    moid[k] = g();
    alb[k] = g();
    rotp[k] = g();
    els[k] = { a, e, i, om, w, ma, epoch, n: nn, tp: NaN, q: NaN };
    pha[k] = meta.pha[k] ? 1 : 0;
  }
  const z = () => new Float32Array(n).fill(NaN);
  return finish(n, els, meta.pdes, meta.name, meta.cls, pha, H, diam, moid, alb, rotp, meta.spec, meta.firstObs, z(), z());
}

function packComets(buf: ArrayBuffer, meta: any): BodyStore {
  const dv = new DataView(buf);
  const n = dv.getUint32(0, true);
  const els: Elements[] = new Array(n);
  const M1 = new Float32Array(n);
  const diam = new Float32Array(n);
  const per = new Float32Array(n);
  let o = 4;
  const g = () => {
    const v = dv.getFloat32(o, true);
    o += 4;
    return v;
  };
  for (let k = 0; k < n; k++) {
    const a = g(), e = g(), i = g(), om = g(), w = g(), ma = g(), epoch = g(), nn = g();
    const q = g(), tp = g(), m1 = g(), dm = g(), pr = g();
    els[k] = { a, e, i, om, w, ma, epoch, n: nn, tp, q };
    M1[k] = m1;
    diam[k] = dm;
    per[k] = pr;
  }
  const z = () => new Float32Array(n).fill(NaN);
  const emptySpec: ([string | null, string | null])[] = new Array(n).fill(null).map(() => [null, null]);
  return finish(n, els, meta.pdes, meta.name, meta.cls, new Uint8Array(n), z(), diam, z(), z(), z(), emptySpec, new Array(n).fill(null), M1, per);
}

function finish(
  n: number, els: Elements[], pdes: string[], names: (string | null)[], cls: string[],
  pha: Uint8Array, H: Float32Array, diam: Float32Array, moid: Float32Array,
  alb: Float32Array, rotp: Float32Array, spec: ([string | null, string | null])[],
  firstObs: (string | null)[], M1: Float32Array, per: Float32Array,
): BodyStore {
  const label = new Array<string>(n);
  for (let k = 0; k < n; k++) label[k] = names[k] || pdes[k];
  const byPdes = new Map<string, number>();
  for (let k = 0; k < n; k++) if (!byPdes.has(pdes[k])) byPdes.set(pdes[k], k);
  return { n, els, pdes, label, cls, pha, H, diam, moid, alb, rotp, spec, firstObs, M1, per, byPdes };
}

export interface SentryRec {
  des: string;
  fullname: string;
  ip: number;
  ps_cum: number;
  ps_max: number;
  ts_max: number;
  range: string;
  n_imp: number;
  diameter: number | null;
}

export interface Dataset {
  planets: PlanetRec[];
  asteroids: BodyStore;
  comets: BodyStore;
  caByDes: Record<string, [number, number, number][]>; // [jd, distAu, vrel]
  caTimeline: [number, string, number][]; // sorted [jd, des, dist]
  sentry: SentryRec[];
  sentryByDes: Map<string, SentryRec>;
  manifest: any;
}

export async function loadDataset(onProgress: (msg: string) => void): Promise<Dataset> {
  onProgress('Loading planets…');
  const planetsRaw = await (await get('planets.json')).json();
  const planets: PlanetRec[] = planetsRaw.map((p: any) => ({
    name: p.name, radiusKm: p.radius_km, per: p.per,
    a: p.a, e: p.e, i: p.i, om: p.om, w: p.w, ma: p.ma,
    epoch: p.epoch, n: p.n, tp: NaN, q: NaN,
  }));
  onProgress('Loading asteroids…');
  const [abuf, ameta] = await Promise.all([
    (await get('asteroids.bin')).arrayBuffer(),
    (await get('asteroids-meta.json')).json(),
  ]);
  const asteroids = packAsteroids(abuf, ameta);
  onProgress('Loading comets…');
  const [cbuf, cmeta] = await Promise.all([
    (await get('comets.bin')).arrayBuffer(),
    (await get('comets-meta.json')).json(),
  ]);
  const comets = packComets(cbuf, cmeta);
  onProgress('Loading close approaches…');
  const [caByDes, caTimeline] = await Promise.all([
    (await get('ca-by-des.json')).json(),
    (await get('ca-timeline.json')).json(),
  ]);
  onProgress('Loading impact-risk data…');
  const sentry: SentryRec[] = await (await get('sentry.json')).json();
  const sentryByDes = new Map(sentry.map((s) => [s.des, s]));
  const manifest = await (await get('manifest.json')).json();
  onProgress('Ready');
  return { planets, asteroids, comets, caByDes, caTimeline, sentry, sentryByDes, manifest };
}

/** Binary-search the sorted CA timeline for the first index with jd >= target. */
export function timelineIndex(timeline: [number, string, number][], target: number): number {
  let lo = 0;
  let hi = timeline.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (timeline[mid][0] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
