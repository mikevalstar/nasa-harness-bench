import type { AstMeta } from './data';

export interface FilterState {
  phaOnly: boolean;
  sentryOnly: boolean;
  classes: string[]; // empty => all classes
  maxH: number; // include objects with H <= maxH (brighter/larger). 99 = all
  maxMoid: number; // include objects with moid <= maxMoid (au). 9 = all
  search: string;
}

export const defaultFilters = (): FilterState => ({
  phaOnly: false,
  sentryOnly: false,
  classes: [],
  maxH: 99,
  maxMoid: 9,
  search: '',
});

// Compute a visibility mask over all asteroids from the current filter state.
export function applyFilters(
  meta: AstMeta,
  state: FilterState,
  sentrySet: Set<string>
): { mask: Uint8Array; count: number } {
  const N = meta.count;
  const mask = new Uint8Array(N);
  const classSet = state.classes.length ? new Set(state.classes) : null;
  const search = state.search.trim().toLowerCase();
  let count = 0;

  for (let i = 0; i < N; i++) {
    if (state.phaOnly && !meta.pha[i]) continue;
    if (classSet && !classSet.has(meta.class[i] ?? '')) continue;
    const H = meta.H[i];
    if (state.maxH < 99 && (H == null || H > state.maxH)) continue;
    const moid = meta.moid[i];
    if (state.maxMoid < 9 && (moid == null || moid > state.maxMoid)) continue;
    if (state.sentryOnly && !sentrySet.has(meta.pdes[i] ?? '')) continue;
    if (search) {
      const name = (meta.name[i] ?? '').toLowerCase();
      const full = (meta.full_name[i] ?? '').toLowerCase();
      const pdes = (meta.pdes[i] ?? '').toLowerCase();
      if (!name.includes(search) && !full.includes(search) && !pdes.includes(search)) continue;
    }
    mask[i] = 1;
    count++;
  }
  return { mask, count };
}

// Free-text search returning matching asteroid indices (for the results list).
export function searchAsteroids(meta: AstMeta, query: string, limit = 50): number[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: number[] = [];
  for (let i = 0; i < meta.count && out.length < limit; i++) {
    const name = (meta.name[i] ?? '').toLowerCase();
    const full = (meta.full_name[i] ?? '').toLowerCase();
    const pdes = (meta.pdes[i] ?? '').toLowerCase();
    if (name.includes(q) || full.includes(q) || pdes.includes(q)) out.push(i);
  }
  return out;
}
