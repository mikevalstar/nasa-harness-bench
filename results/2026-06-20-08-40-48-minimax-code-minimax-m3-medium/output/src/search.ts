/**
 * Build a case-insensitive index from search string to matching asteroid
 * indices. Search matches: full_name, name (IAU), pdes, or spkid.
 *
 * For 42k asteroids we use a simple per-keystroke scan over a precomputed
 * lowercased keys array. With 42k items this is <10ms per keystroke on
 * modern hardware, so it's fine.
 */
import type { LoadedData } from "./types";

let cache: { lowerName: string[]; lowerPdes: string[]; spkid: string[] } | null = null;

function buildCache(data: LoadedData) {
  if (cache) return cache;
  const lowerName = new Array<string>(data.asteroidCount);
  const lowerPdes = new Array<string>(data.asteroidCount);
  const spkid = new Array<string>(data.asteroidCount);
  for (let i = 0; i < data.asteroidCount; i++) {
    const m = data.asteroidMeta[i];
    lowerName[i] = (m.fullName ?? "").toLowerCase();
    lowerPdes[i] = (m.pdes ?? "").toLowerCase();
    spkid[i] = String(m.spkid ?? "");
  }
  cache = { lowerName, lowerPdes, spkid };
  return cache;
}

export function searchAsteroids(
  data: LoadedData,
  query: string,
  limit = 80,
): Set<number> {
  if (!query || !query.trim()) return new Set();
  const c = buildCache(data);
  const q = query.trim().toLowerCase();
  const hits = new Set<number>();
  // Prefer prefix matches on name/pdes first; substring fallback.
  for (let i = 0; i < data.asteroidCount && hits.size < limit; i++) {
    if (c.lowerName[i].startsWith(q) || c.lowerPdes[i].startsWith(q)) {
      hits.add(i);
    }
  }
  for (let i = 0; i < data.asteroidCount && hits.size < limit; i++) {
    if (hits.has(i)) continue;
    if (c.lowerName[i].includes(q) || c.lowerPdes[i].includes(q) || c.spkid[i] === q) {
      hits.add(i);
    }
  }
  return hits;
}
