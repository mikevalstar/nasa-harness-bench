// Data loading. Core asteroid set streams in as a Float32Array; heavier
// auxiliary sets (details, close approaches) are fetched lazily on first use.

export const CLASS_NAMES = ['Apollo', 'Aten', 'Amor', 'Atira', 'Other'];
export const FLAG_PHA = 1;
export const FLAG_SENTRY = 2;
export const FLAG_DIAM_EST = 4;

const cache = {};

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`fetch ${path}: ${res.status}`);
  return res.json();
}

export async function loadCore(onProgress) {
  onProgress?.('orbital elements');
  const [binBuf, meta, planets, comets] = await Promise.all([
    fetch('data/asteroids.bin').then((r) => {
      if (!r.ok) throw new Error(`fetch asteroids.bin: ${r.status}`);
      return r.arrayBuffer();
    }),
    fetchJson('data/asteroids-meta.json'),
    fetchJson('data/planets.json'),
    fetchJson('data/comets.json'),
  ]);
  const bin = new Float32Array(binBuf);
  const core = {
    bin,
    stride: meta.stride,
    count: meta.count,
    epochRef: meta.epochRef,
    names: meta.names,
    pdes: meta.pdes,
    pdesToIdx: new Map(meta.pdes.map((p, i) => [p, i])),
    planets,
    comets,
  };
  cache.core = core;
  return core;
}

export async function loadDetails() {
  if (!cache.details) cache.details = await fetchJson('data/asteroid-details.json');
  return cache.details;
}

export async function loadSentry() {
  if (!cache.sentry) {
    const rows = await fetchJson('data/sentry.json');
    cache.sentry = rows;
    cache.sentryByDes = new Map(rows.map((r) => [r.des, r]));
  }
  return cache.sentry;
}
export function sentryByDes() {
  return cache.sentryByDes;
}

export async function loadCloseApproaches() {
  if (!cache.ca) cache.ca = await fetchJson('data/close-approaches.json');
  return cache.ca;
}
