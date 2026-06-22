import type {
  Asteroid,
  CloseApproach,
  Comet,
  LoadedData,
  Planet,
  SentryEntry,
} from './types';

const DATA_BASE = './data';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${DATA_BASE}/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

function indexCloseApproaches(rows: CloseApproach[]): Map<string, CloseApproach[]> {
  const map = new Map<string, CloseApproach[]>();
  for (const row of rows) {
    let list = map.get(row.des);
    if (!list) {
      list = [];
      map.set(row.des, list);
    }
    list.push(row);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.jd - b.jd);
  }
  return map;
}

function indexSentry(rows: SentryEntry[]): Map<string, SentryEntry> {
  const map = new Map<string, SentryEntry>();
  for (const row of rows) {
    map.set(row.des, row);
  }
  return map;
}

export async function loadAllData(onProgress?: (msg: string) => void): Promise<LoadedData> {
  onProgress?.('Loading planets…');
  const planets = await fetchJson<Planet[]>('planets.json');

  onProgress?.('Loading asteroids (~42k)…');
  const asteroids = await fetchJson<Asteroid[]>('asteroids.json');

  onProgress?.('Loading close approaches…');
  const closeApproaches = await fetchJson<CloseApproach[]>('close-approaches.json');

  onProgress?.('Loading comets…');
  const comets = await fetchJson<Comet[]>('comets.json');

  onProgress?.('Loading Sentry impact risk…');
  const sentry = await fetchJson<SentryEntry[]>('sentry.json');

  onProgress?.('Indexing data…');
  const closeByDes = indexCloseApproaches(closeApproaches);
  const sentryByDes = indexSentry(sentry);

  const classSet = new Set<string>();
  for (const a of asteroids) {
    if (a.class) classSet.add(a.class);
  }
  const orbitClasses = [...classSet].sort();

  return {
    planets,
    asteroids,
    comets,
    closeApproaches,
    closeByDes,
    sentry,
    sentryByDes,
    orbitClasses,
  };
}
