import type {
  AsteroidDataset,
  CloseApproachSet,
  CometDataset,
  PlanetElements,
  SentryByDes,
} from './types';

const base = import.meta.env.BASE_URL;

async function fetchJSON<T>(name: string): Promise<T> {
  const res = await fetch(`${base}data/${name}`);
  if (!res.ok) throw new Error(`Failed to load ${name}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchBinary(name: string): Promise<Float32Array> {
  const res = await fetch(`${base}data/${name}`);
  if (!res.ok) throw new Error(`Failed to load ${name}: ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Float32Array(buf);
}

export async function loadPlanets(): Promise<PlanetElements[]> {
  return fetchJSON<PlanetElements[]>('planets.json');
}

export async function loadAsteroids(
  onProgress?: (loaded: 'bin' | 'meta') => void
): Promise<AsteroidDataset> {
  const [index, buffer] = await Promise.all([
    fetchJSON<{ stride: number; count: number }>('asteroids-index.json'),
    fetchBinary('asteroids.bin'),
  ]);
  onProgress?.('bin');
  const meta = await fetchJSON<AsteroidDataset['meta']>('asteroids-meta.json');
  onProgress?.('meta');
  return { buffer, stride: index.stride, count: index.count, meta };
}

export async function loadComets(): Promise<CometDataset> {
  const [index, buffer, meta] = await Promise.all([
    fetchJSON<{ stride: number; count: number }>('comets-index.json'),
    fetchBinary('comets.bin'),
    fetchJSON<CometDataset['meta']>('comets-meta.json'),
  ]);
  return { buffer, stride: index.stride, count: index.count, meta };
}

export async function loadCloseApproaches(): Promise<CloseApproachSet> {
  return fetchJSON<CloseApproachSet>('close-approaches.json');
}

export async function loadSentry(): Promise<SentryByDes> {
  return fetchJSON<SentryByDes>('sentry.json');
}
