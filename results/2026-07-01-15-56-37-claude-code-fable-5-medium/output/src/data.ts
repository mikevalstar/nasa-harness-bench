// Runtime data loading from the preprocessed files in gen/ (relative URLs —
// the site is served from a sub-path inside an iframe).

export const AST_FLOATS = 14;
// float layout per asteroid:
export const F_A = 0, F_E = 1, F_MA = 2, F_N = 3, F_EPOCH = 4,
  F_PX = 5, F_PY = 6, F_PZ = 7, F_QX = 8, F_QY = 9, F_QZ = 10,
  F_H = 11, F_DIAM = 12, F_MOID = 13;
// flag bits:
export const FLAG_PHA = 1, FLAG_SENTRY = 2, FLAG_NAMED = 4;

export interface Meta {
  count: number;
  classes: string[];
  pdes: string[];
  label: string[];
}

export interface Planet {
  name: string; a: number; e: number; i: number; om: number; w: number;
  ma: number; epoch: number; n: number; per: number; radius_km: number;
}

export interface Comet {
  label: string; pdes: string; cls: string;
  e: number; a: number | null; q: number; i: number; om: number; w: number;
  ma: number | null; tp: number; per: number | null; n: number | null; epoch: number;
  M1: number | null; diameter: number | null;
}

export interface SentryRow {
  ip: number; ps_cum: number; ps_max: number; ts_max: number;
  range: string; n_imp: number; v_inf: number; diameter: number | null; last_obs: string;
}

export interface Details {
  i: (number | null)[]; om: (number | null)[]; w: (number | null)[];
  q: (number | null)[]; ad: (number | null)[]; per: (number | null)[];
  epoch: number[]; albedo: (number | null)[]; rot: (number | null)[];
  spec: (string | null)[]; firstObs: (string | null)[];
}

export interface AppData {
  meta: Meta;
  ast: Float32Array;      // AST_FLOATS per asteroid
  flags: Uint8Array;
  cls: Uint8Array;
  planets: Planet[];
  comets: Comet[];
  sentry: Record<string, SentryRow>;
  caF: Float32Array;      // [jd-J2000, dist au, v_rel km/s] per event, sorted by jd
  caIdx: Uint32Array;     // asteroid index per event
  caByAst: Map<number, number[]>; // asteroid index -> event indices
}

async function bin(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${url}: ${r.status}`);
  return r.arrayBuffer();
}
async function json<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${url}: ${r.status}`);
  return r.json();
}

export async function loadData(onProgress: (msg: string) => void): Promise<AppData> {
  onProgress('Loading orbital elements…');
  const [meta, astBuf, flagsBuf, clsBuf, planets, comets, sentry, caFBuf, caIBuf] =
    await Promise.all([
      json<Meta>('gen/meta.json'),
      bin('gen/asteroids.f32'),
      bin('gen/asteroids.flags.u8'),
      bin('gen/asteroids.class.u8'),
      json<Planet[]>('gen/planets.json'),
      json<Comet[]>('gen/comets.json'),
      json<Record<string, SentryRow>>('gen/sentry.json'),
      bin('gen/approaches.f32'),
      bin('gen/approaches.u32'),
    ]);
  onProgress('Indexing…');
  const caIdx = new Uint32Array(caIBuf);
  const caByAst = new Map<number, number[]>();
  for (let i = 0; i < caIdx.length; i++) {
    const a = caIdx[i];
    let list = caByAst.get(a);
    if (!list) caByAst.set(a, (list = []));
    list.push(i);
  }
  return {
    meta,
    ast: new Float32Array(astBuf),
    flags: new Uint8Array(flagsBuf),
    cls: new Uint8Array(clsBuf),
    planets, comets, sentry,
    caF: new Float32Array(caFBuf),
    caIdx, caByAst,
  };
}

let detailsPromise: Promise<Details> | null = null;
export function loadDetails(): Promise<Details> {
  if (!detailsPromise) detailsPromise = json<Details>('gen/details.json');
  return detailsPromise;
}
