import type { Dataset } from './data';
import { F, FLAG_PHA, FLAG_SENTRY, STRIDE } from './types';
import { H_RANGE, type Filters } from './state';
import { lowerBound } from './scene';

export interface FilterResult {
  mask: Uint8Array;
  visible: number;
}

/**
 * Evaluate the filter set against every asteroid. `jd` is only used for the
 * approach-window filter. Runs in ~1 ms for 42k objects.
 */
export function applyFilters(data: Dataset, f: Filters, jd: number, out?: Uint8Array): FilterResult {
  const { elements, count, meta } = data;
  const mask = out ?? new Uint8Array(count);
  const classIdx = new Set<number>();
  meta.classes.forEach((c, k) => { if (f.classes.has(c)) classIdx.add(k); });
  const allClasses = classIdx.size === meta.classes.length;

  // approach-window: set of asteroid indices with an approach in [jd - w, jd + w]
  let inWindow: Uint8Array | null = null;
  if (f.approachWindow !== null) {
    inWindow = new Uint8Array(count);
    const { jd: jds, idx } = data.approaches;
    const lo = lowerBound(jds, jd - f.approachWindow), hi = lowerBound(jds, jd + f.approachWindow);
    for (let r = lo; r < hi; r++) inWindow[idx[r]!] = 1;
  }

  const q = f.query.trim().toLowerCase();
  let visible = 0;
  for (let k = 0; k < count; k++) {
    const b = k * STRIDE;
    let ok = true;
    const flags = elements[b + F.flags]!;
    if (f.hazard === 'pha') ok = (flags & FLAG_PHA) !== 0;
    else if (f.hazard === 'sentry') ok = (flags & FLAG_SENTRY) !== 0;
    if (ok && !allClasses) ok = classIdx.has(elements[b + F.cls]!);
    if (ok) {
      const H = elements[b + F.H]!;
      // unknown H is stored as 99; keep those objects unless the user narrowed the upper bound
      ok = H >= f.hMin && (H <= f.hMax || (H >= 99 && f.hMax >= H_RANGE.max));
    }
    if (ok && f.moidMax !== null) {
      const moid = elements[b + F.moid]!;
      ok = moid >= 0 && moid <= f.moidMax;
    }
    if (ok && f.onlyMeasured) ok = elements[b + F.diameter]! > 0;
    if (ok && inWindow) ok = inWindow[k] === 1;
    if (ok && q) ok = meta.full_name[k]!.toLowerCase().includes(q);
    mask[k] = ok ? 1 : 0;
    if (ok) visible++;
  }
  return { mask, visible };
}

/** Name search for the search box: up to `limit` asteroid indices, best matches first. */
export function searchAsteroids(data: Dataset, query: string, limit: number): number[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const exact = data.byPdes.get(q);
  const starts: number[] = [];
  const contains: number[] = [];
  const names = data.meta.full_name;
  for (let k = 0; k < names.length && contains.length < limit * 4; k++) {
    const n = names[k]!.toLowerCase();
    if (k === exact) continue;
    if (n.startsWith(q) || n.startsWith('(' + q)) starts.push(k);
    else if (n.includes(q)) contains.push(k);
    if (starts.length >= limit) break;
  }
  const res = exact !== undefined ? [exact, ...starts, ...contains] : [...starts, ...contains];
  return res.slice(0, limit);
}

export function searchComets(data: Dataset, query: string, limit: number): number[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const res: number[] = [];
  for (let k = 0; k < data.comets.length && res.length < limit; k++) {
    if (data.comets[k]!.full_name.toLowerCase().includes(q)) res.push(k);
  }
  return res;
}
