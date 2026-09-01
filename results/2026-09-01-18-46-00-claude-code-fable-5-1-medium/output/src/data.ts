import type { ApproachTable, AsteroidMeta, CometRow, PlanetRow, SentryRow } from './types';
import { STRIDE } from './types';

export interface Dataset {
  count: number;
  /** Packed orbital elements + physical fields, see types.ts F layout. */
  elements: Float32Array;
  meta: AsteroidMeta;
  approaches: ApproachTable;
  /** approach row indices per asteroid, each list sorted by date. */
  approachesByAsteroid: Map<number, number[]>;
  sentry: SentryRow[];
  sentryByAsteroid: Map<number, SentryRow>;
  comets: CometRow[];
  planets: PlanetRow[];
  /** asteroid index by lower-cased primary designation */
  byPdes: Map<string, number>;
}

async function getJson<T>(path: string, onProgress: (label: string) => void): Promise<T> {
  onProgress(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export async function loadDataset(onProgress: (label: string) => void): Promise<Dataset> {
  const base = './data/';
  const [binRes, meta, approaches, sentry, comets, planets] = await Promise.all([
    fetch(base + 'asteroids.bin'),
    getJson<AsteroidMeta>(base + 'asteroids.json', onProgress),
    getJson<ApproachTable>(base + 'approaches.json', onProgress),
    getJson<SentryRow[]>(base + 'sentry.json', onProgress),
    getJson<CometRow[]>(base + 'comets.json', onProgress),
    getJson<PlanetRow[]>(base + 'planets.json', onProgress),
  ]);
  if (!binRes.ok) throw new Error('failed to load asteroids.bin');
  const elements = new Float32Array(await binRes.arrayBuffer());
  const count = elements.length / STRIDE;

  onProgress('indexing');
  const approachesByAsteroid = new Map<number, number[]>();
  approaches.idx.forEach((ai, row) => {
    let list = approachesByAsteroid.get(ai);
    if (!list) approachesByAsteroid.set(ai, (list = []));
    list.push(row);
  });
  const sentryByAsteroid = new Map(sentry.map((s) => [s.idx, s]));
  const byPdes = new Map(meta.pdes.map((p, i) => [p.toLowerCase(), i]));

  return { count, elements, meta, approaches, approachesByAsteroid, sentry, sentryByAsteroid, comets, planets, byPdes };
}
