// Runtime data loading. All assets are produced by scripts/prepare-data.mjs and
// fetched with RELATIVE URLs (the site is served from a sub-path inside an iframe).

export interface AstMeta {
  count: number;
  spkid: number[];
  pdes: (string | null)[];
  name: (string | null)[];
  full_name: (string | null)[];
  class: (string | null)[];
  pha: number[];
  neo: number[];
  H: (number | null)[];
  diameter: (number | null)[];
  albedo: (number | null)[];
  moid: (number | null)[];
  q: (number | null)[];
  ad: (number | null)[];
  per: (number | null)[];
  a: (number | null)[];
  e: (number | null)[];
  i: (number | null)[];
  first_obs: (string | null)[];
  rot_per: (number | null)[];
  spec: (string | null)[];
}

export interface Planet {
  name: string;
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  epoch: number;
  n: number;
  per: number;
  radius_km: number;
}

export interface Comet {
  full_name: string;
  pdes: string;
  class: string | null;
  e: number;
  a: number;
  q: number;
  i: number;
  om: number;
  w: number;
  ma: number | null;
  tp: number;
  per: number | null;
  n: number | null;
  epoch: number;
  M1: number | null;
  diameter: number | null;
}

export interface SentryRow {
  des: string;
  fullname: string;
  ip: number;
  ps_cum: number;
  ps_max: number;
  ts_max: number;
  range: string;
  n_imp: number;
  diameter: number | null;
  h: number | null;
  v_inf: number | null;
  last_obs: string;
}

export interface CloseApproach {
  cd: string;
  jd: number;
  dist: number;
  dist_min: number;
  dist_max: number;
  v_rel: number;
  v_inf: number;
  h: number | null;
}

export interface NotableApproach {
  des: string;
  jd: number;
  cd: string;
  dist: number;
  v_rel: number;
  h: number | null;
}

export interface Manifest {
  baseJD: number;
  asteroidCount: number;
  cometCount: number;
  sentryCount: number;
  closeApproachCount: number;
  generatedAt: string;
}

export interface LoadedData {
  manifest: Manifest;
  orbits: Float32Array; // 8 floats per asteroid
  meta: AstMeta;
  planets: Planet[];
  comets: Comet[];
  sentryByDes: Map<string, SentryRow>;
  notable: NotableApproach[];
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

type Progress = (msg: string) => void;

export async function loadAll(onProgress: Progress = () => {}): Promise<LoadedData> {
  onProgress('Loading manifest…');
  const manifest = await fetchJSON<Manifest>('./meta.json');

  onProgress('Loading planets…');
  const [planets, comets, sentryArr, notable] = await Promise.all([
    fetchJSON<Planet[]>('./planets.json'),
    fetchJSON<Comet[]>('./comets.json'),
    fetchJSON<SentryRow[]>('./sentry.json'),
    fetchJSON<NotableApproach[]>('./ca-notable.json'),
  ]);

  onProgress(`Loading ${manifest.asteroidCount.toLocaleString()} asteroids…`);
  const orbitsRes = await fetch('./ast-orbits.f32');
  if (!orbitsRes.ok) throw new Error('Failed to fetch ast-orbits.f32');
  const orbitsBuf = await orbitsRes.arrayBuffer();
  const orbits = new Float32Array(orbitsBuf);

  onProgress('Loading asteroid metadata…');
  const meta = await fetchJSON<AstMeta>('./ast-meta.json');

  const sentryByDes = new Map<string, SentryRow>();
  for (const s of sentryArr) sentryByDes.set(s.des, s);

  return { manifest, orbits, meta, planets, comets, sentryByDes, notable };
}

// Close-approach details are large (~10MB); load only when first needed.
let caCache: Record<string, CloseApproach[]> | null = null;
let caPromise: Promise<Record<string, CloseApproach[]>> | null = null;

export async function loadCloseApproaches(): Promise<Record<string, CloseApproach[]>> {
  if (caCache) return caCache;
  if (!caPromise) {
    caPromise = fetchJSON<Record<string, CloseApproach[]>>('./ca-grouped.json').then((d) => {
      caCache = d;
      return d;
    });
  }
  return caPromise;
}

export function getCloseApproachesSync(des: string): CloseApproach[] | undefined {
  return caCache?.[des];
}
