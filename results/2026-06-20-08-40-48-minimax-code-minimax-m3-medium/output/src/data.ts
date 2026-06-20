/**
 * Data loader — fetches raw JSON plus preprocessed binary, parses string
 * tables, and returns a unified LoadedData object.
 */

import type {
  AsteroidMeta,
  CloseApproach,
  CometMeta,
  LoadedData,
  Planet,
  SentryRow,
} from "./types";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`fetch ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchBinary(path: string): Promise<ArrayBuffer> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`fetch ${path} failed: ${res.status}`);
  return res.arrayBuffer();
}

/**
 * Read a length-prefixed UTF-8 string from a Uint8Array at given offsets.
 * The offsets[] table is `count+1` long; offsets[i] is the start of entry i,
 * offsets[i+1] - offsets[i] is its length.
 */
function makeStringReader(
  u8: Uint8Array,
  offsets: Uint32Array,
  base: number,
  dec: TextDecoder,
) {
  return (idx: number): string => {
    const start = offsets[idx] + base;
    const end = offsets[idx + 1] + base;
    const len = end - start;
    if (len <= 0) return "";
    return dec.decode(u8.subarray(start, end));
  };
}

interface AsteroidIdx {
  count: number;
  stride: number;
  flags: Record<string, number>;
  classes: Record<string, number>;
  stringOffsets: { fullName: number[]; pdes: number[]; name: number[] };
  sentryCount: number;
  phaCount: number;
  diameterKnown: number;
  diameterRange: [number, number];
}

interface CometIdx {
  count: number;
  stride: number;
  flags: Record<string, number>;
  stringOffsets: { fullName: number[]; pdes: number[] };
  hyperbolicCount: number;
}

export async function loadData(onProgress?: (msg: string) => void): Promise<LoadedData> {
  onProgress?.("fetching manifest…");
  const dataBase = "./data";

  // Kick off all fetches in parallel.
  const [
    planetsRaw,
    sentryRaw,
    closeApproachesRaw,
    closeApproachIndex,
    asteroidBinBuf,
    asteroidStringsBuf,
    asteroidIdx,
    cometBinBuf,
    cometStringsBuf,
    cometIdx,
  ] = await Promise.all([
    fetchJson<Planet[]>(`${dataBase}/planets.json`),
    fetchJson<SentryRow[]>(`${dataBase}/sentry.json`),
    fetchJson<CloseApproach[]>(`${dataBase}/close-approaches.json`),
    fetchJson<Record<string, [number, number]>>(`${dataBase}/close-approaches.idx.json`),
    fetchBinary(`${dataBase}/asteroids.bin`),
    fetchBinary(`${dataBase}/asteroids.strings.bin`),
    fetchJson<AsteroidIdx>(`${dataBase}/asteroids.idx.json`),
    fetchBinary(`${dataBase}/comets.bin`),
    fetchBinary(`${dataBase}/comets.strings.bin`),
    fetchJson<CometIdx>(`${dataBase}/comets.idx.json`),
  ]);

  onProgress?.(`decoding ${asteroidIdx.count.toLocaleString()} asteroids…`);
  const dec = new TextDecoder();

  // --- Asteroids ---
  const asteroidData = new Float32Array(asteroidBinBuf);
  const asteroidStride = asteroidIdx.stride;
  const N = asteroidIdx.count;

  const astU8 = new Uint8Array(asteroidStringsBuf);
  const astDv = new DataView(asteroidStringsBuf);
  const astFullBase = astDv.getUint32(0, true);
  const astPdesBase = astDv.getUint32(4, true);
  const astNameBase = astDv.getUint32(8, true);
  const astFullOff = new Uint32Array(asteroidIdx.stringOffsets.fullName);
  const astPdesOff = new Uint32Array(asteroidIdx.stringOffsets.pdes);
  const astNameOff = new Uint32Array(asteroidIdx.stringOffsets.name);
  const readFullName = makeStringReader(astU8, astFullOff, astFullBase, dec);
  const readPdes = makeStringReader(astU8, astPdesOff, astPdesBase, dec);
  const readName = makeStringReader(astU8, astNameOff, astNameBase, dec);

  const sentryMap = new Map<string, SentryRow>();
  for (const s of sentryRaw) sentryMap.set(s.des, s);

  const asteroidMeta: AsteroidMeta[] = new Array(N);
  const asteroidFlags = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const base = i * asteroidStride;
    const flags = asteroidData[base + 25] | 0;
    const classCode = asteroidData[base + 26] | 0;
    const spkid = asteroidData[base + 27] | 0;
    asteroidMeta[i] = {
      fullName: readFullName(i),
      pdes: readPdes(i),
      name: readName(i),
      spkid,
      flags,
      classCode,
      diameter: asteroidData[base + 19],
      H: asteroidData[base + 18],
      rotPer: asteroidData[base + 28],
      moid: asteroidData[base + 17],
      q: asteroidData[base + 14],
      ad: asteroidData[base + 15],
      per: asteroidData[base + 16],
      albedo: asteroidData[base + 20],
      sentry: undefined,
    };
    if (sentryMap.has(asteroidMeta[i].pdes))
      asteroidMeta[i].sentry = sentryMap.get(asteroidMeta[i].pdes);
    asteroidFlags[i] = 1;
  }

  onProgress?.(`decoding ${cometIdx.count.toLocaleString()} comets…`);

  // --- Comets ---
  const cometData = new Float32Array(cometBinBuf);
  const cometStride = cometIdx.stride;
  const cN = cometIdx.count;

  const cU8 = new Uint8Array(cometStringsBuf);
  const cDv = new DataView(cometStringsBuf);
  const cFullBase = cDv.getUint32(0, true);
  const cPdesBase = cDv.getUint32(4, true);
  const cFullOff = new Uint32Array(cometIdx.stringOffsets.fullName);
  const cPdesOff = new Uint32Array(cometIdx.stringOffsets.pdes);
  const readCName = makeStringReader(cU8, cFullOff, cFullBase, dec);
  const readCPdes = makeStringReader(cU8, cPdesOff, cPdesBase, dec);

  const cometMeta: CometMeta[] = new Array(cN);
  const cometFlags = new Uint8Array(cN);
  for (let i = 0; i < cN; i++) {
    const base = i * cometStride;
    const flags = cometData[base + 23] | 0;
    cometMeta[i] = {
      fullName: readCName(i),
      pdes: readCPdes(i),
      isHyperbolic: (flags & 1) !== 0,
      diameter: cometData[base + 18],
    };
    cometFlags[i] = 1;
  }

  return {
    planets: planetsRaw,
    asteroidCount: N,
    asteroidStride,
    asteroidData,
    asteroidFlags,
    asteroidMeta,
    sentry: sentryMap,
    closeApproaches: closeApproachesRaw,
    closeApproachIndex,
    cometCount: cN,
    cometStride,
    cometData,
    cometMeta,
    cometFlags,
  };
}

/** Build a map from pdes → asteroid index for fast lookup. */
export function buildAsteroidIndex(meta: AsteroidMeta[]): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i < meta.length; i++) m.set(meta[i].pdes, i);
  return m;
}

/** Find close approaches by designation using the sorted index. */
export function findCloseApproaches(
  data: LoadedData,
  des: string,
  limit = 50,
): CloseApproach[] {
  const range = data.closeApproachIndex[des];
  if (!range) return [];
  const [start, end] = range;
  const out: CloseApproach[] = [];
  for (let i = start; i < end && out.length < limit; i++) {
    out.push(data.closeApproaches[i]);
  }
  out.sort((a, b) => a.dist - b.dist);
  return out;
}

/** Find upcoming close approaches between jd and jd+windowDays. */
export function findUpcomingCloseApproaches(
  data: LoadedData,
  jd: number,
  windowDays = 365,
  maxResults = 200,
): CloseApproach[] {
  const end = jd + windowDays;
  const result: CloseApproach[] = [];
  for (const ca of data.closeApproaches) {
    if (ca.jd < jd) continue;
    if (ca.jd > end) break;
    result.push(ca);
    if (result.length >= maxResults) break;
  }
  return result;
}

/** Find close approaches within ±windowDays of jd (past + future). */
export function findCloseApproachesAround(
  data: LoadedData,
  jd: number,
  windowDays = 180,
  maxResults = 50,
): CloseApproach[] {
  const lo = jd - windowDays;
  const hi = jd + windowDays;
  const result: CloseApproach[] = [];
  for (const ca of data.closeApproaches) {
    if (ca.jd < lo) continue;
    if (ca.jd > hi) break;
    result.push(ca);
    if (result.length >= maxResults) break;
  }
  return result;
}
