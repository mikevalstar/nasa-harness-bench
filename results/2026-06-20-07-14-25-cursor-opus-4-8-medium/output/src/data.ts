import type {
  AsteroidMeta,
  PlanetRaw,
  CometRaw,
  SentryMap,
  CloseApproachMap,
} from "./types";

// All data is fetched at runtime from the bundled ./data/ directory using
// relative URLs (base is "./"), so the site works from any sub-path / iframe.
const BASE = import.meta.env.BASE_URL;

function url(file: string): string {
  return `${BASE}data/${file}`;
}

async function fetchJSON<T>(file: string): Promise<T> {
  const res = await fetch(url(file));
  if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
  return (await res.json()) as T;
}

export interface LoadedData {
  elements: Float32Array;
  meta: AsteroidMeta;
  planets: PlanetRaw[];
  comets: CometRaw[];
  sentry: SentryMap;
}

export async function loadCore(
  onProgress?: (msg: string) => void,
): Promise<LoadedData> {
  onProgress?.("Loading planets…");
  const planets = await fetchJSON<PlanetRaw[]>("planets.json");

  onProgress?.("Loading asteroid orbits…");
  const binRes = await fetch(url("asteroids.bin"));
  if (!binRes.ok) throw new Error("Failed to load asteroids.bin");
  const buf = await binRes.arrayBuffer();
  const elements = new Float32Array(buf);

  onProgress?.("Loading asteroid catalog…");
  const meta = await fetchJSON<AsteroidMeta>("asteroids-meta.json");

  onProgress?.("Loading impact-risk data…");
  const sentry = await fetchJSON<SentryMap>("sentry.json");

  onProgress?.("Loading comets…");
  const comets = await fetchJSON<CometRaw[]>("comets.json");

  return { elements, meta, planets, comets, sentry };
}

let caCache: CloseApproachMap | null = null;
export async function loadCloseApproaches(): Promise<CloseApproachMap> {
  if (caCache) return caCache;
  caCache = await fetchJSON<CloseApproachMap>("close-approaches.json");
  return caCache;
}
