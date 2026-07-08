import type {
  AppData,
  AsteroidMeta,
  AsteroidPack,
  CometMeta,
  CometPack,
  Planet,
  SentryRow,
  ApproachEvent,
  UpcomingApproach,
} from "./types";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchBuf(path: string): Promise<ArrayBuffer> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.arrayBuffer();
}

function parseAsteroids(
  buf: ArrayBuffer,
  meta: {
    count: number;
    floatStride: number;
    classes: string[];
    byteOffsets: { floats: number; flags: number; sentry: number };
  },
  catalog: AsteroidMeta[],
): AsteroidPack {
  const { count, floatStride, byteOffsets, classes } = meta;
  const floats = new Float32Array(buf, byteOffsets.floats, count * floatStride);
  const flags = new Uint8Array(buf, byteOffsets.flags, count * 3);
  const sentryIndex = new Uint16Array(buf, byteOffsets.sentry, count);
  return { count, floats, floatStride, flags, sentryIndex, classes, catalog };
}

function parseComets(
  buf: ArrayBuffer,
  meta: {
    count: number;
    floatStride: number;
    byteOffsets: { floats: number; kinds: number };
  },
  catalog: CometMeta[],
): CometPack {
  const { count, floatStride, byteOffsets } = meta;
  const floats = new Float32Array(buf, byteOffsets.floats, count * floatStride);
  const kinds = new Uint8Array(buf, byteOffsets.kinds, count);
  return { count, floats, floatStride, kinds, catalog };
}

export async function loadAppData(onProgress?: (msg: string) => void): Promise<AppData> {
  const base = "data/";
  onProgress?.("Loading manifest…");
  const manifest = await fetchJson<AppData["manifest"] & { generatedAt?: string }>(
    base + "manifest.json",
  );

  onProgress?.("Loading planets & risk catalogs…");
  const [planets, sentry, upcoming, astMeta, comMeta] = await Promise.all([
    fetchJson<Planet[]>(base + "planets.json"),
    fetchJson<SentryRow[]>(base + "sentry.json"),
    fetchJson<UpcomingApproach[]>(base + "approaches-upcoming.json"),
    fetchJson<{
      count: number;
      floatStride: number;
      classes: string[];
      byteOffsets: { floats: number; flags: number; sentry: number };
    }>(base + "asteroids.meta.json"),
    fetchJson<{
      count: number;
      floatStride: number;
      byteOffsets: { floats: number; kinds: number };
    }>(base + "comets.meta.json"),
  ]);

  onProgress?.("Loading asteroid & comet packs…");
  const [astBin, astCatalog, comBin, comCatalog] = await Promise.all([
    fetchBuf(base + "asteroids.bin"),
    fetchJson<AsteroidMeta[]>(base + "asteroids.catalog.json"),
    fetchBuf(base + "comets.bin"),
    fetchJson<CometMeta[]>(base + "comets.catalog.json"),
  ]);

  onProgress?.("Parsing packs…");
  const asteroids = parseAsteroids(astBin, astMeta, astCatalog);
  const comets = parseComets(comBin, comMeta, comCatalog);

  const sentryByDes = new Map<string, SentryRow>();
  for (const s of sentry) sentryByDes.set(s.des, s);

  return {
    planets,
    asteroids,
    comets,
    sentry,
    sentryByDes,
    approachesByDes: {},
    upcoming,
    manifest: {
      asteroids: manifest.asteroids,
      comets: manifest.comets,
      sentry: manifest.sentry,
      classes: manifest.classes,
      sunRadiusKm: manifest.sunRadiusKm,
      auKm: manifest.auKm,
    },
  };
}

let approachesPromise: Promise<Record<string, ApproachEvent[]>> | null = null;

/** Lazy-load full close-approach history (large JSON). */
export function loadApproachesByDes(): Promise<Record<string, ApproachEvent[]>> {
  if (!approachesPromise) {
    approachesPromise = fetchJson<Record<string, ApproachEvent[]>>(
      "data/approaches-by-des.json",
    );
  }
  return approachesPromise;
}

/** Read elliptic elements for asteroid i (angles already radians) */
export function asteroidElements(pack: AsteroidPack, i: number) {
  const s = pack.floatStride;
  const f = pack.floats;
  const o = i * s;
  return {
    a: f[o],
    e: f[o + 1],
    i: f[o + 2],
    om: f[o + 3],
    w: f[o + 4],
    ma: f[o + 5],
    epoch: f[o + 6],
    n: f[o + 7],
    q: f[o + 8],
    H: f[o + 9],
    diameter: f[o + 10],
    moid: f[o + 11],
    pha: pack.flags[i * 3] === 1,
    classIndex: pack.flags[i * 3 + 1],
    hasSentry: pack.flags[i * 3 + 2] === 1,
    sentryIndex: pack.sentryIndex[i],
    kind: 0 as const,
  };
}

export function cometElements(pack: CometPack, i: number) {
  const s = pack.floatStride;
  const f = pack.floats;
  const o = i * s;
  const kind = pack.kinds[i] as 0 | 1 | 2;
  return {
    a: f[o],
    e: f[o + 1],
    i: f[o + 2],
    om: f[o + 3],
    w: f[o + 4],
    ma: f[o + 5],
    epoch: f[o + 6],
    n: f[o + 7],
    q: f[o + 8],
    tp: f[o + 9],
    M1: f[o + 10],
    diameter: f[o + 11],
    kind,
  };
}
