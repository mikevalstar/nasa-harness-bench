/**
 * Asteroid filtering. One pass over the packed arrays writes the per-vertex
 * visibility attribute the shader reads — ~42k iterations, well under a frame.
 */
import { O, ORB_COLS, P, PHYS_COLS, type Dataset } from './data';
import { logScale } from './helpers';

export interface Filters {
  pha: boolean;
  sentry: boolean;
  named: boolean;
  approach: boolean;
  classes: Set<string>; // empty = all
  minDiam: number; // km, 0 = off
  maxMoid: number; // au, Infinity = off
  maxA: number; // au, Infinity = off
  query: string;
}

export function defaultFilters(): Filters {
  return {
    pha: false,
    sentry: false,
    named: false,
    approach: false,
    classes: new Set(),
    minDiam: 0,
    maxMoid: Infinity,
    maxA: Infinity,
    query: '',
  };
}

export const DIAM_STOPS = { lo: 0.005, hi: 30 };
export const MOID_STOPS = { lo: 0.0002, hi: 0.5 };
export const A_STOPS = { lo: 0.4, hi: 6 };

export function sliderToDiam(v: number): number {
  return v <= 0 ? 0 : logScale(v / 100, DIAM_STOPS.lo, DIAM_STOPS.hi);
}
export function sliderToMoid(v: number): number {
  return v >= 100 ? Infinity : logScale(v / 100, MOID_STOPS.lo, MOID_STOPS.hi);
}
export function sliderToA(v: number): number {
  return v >= 100 ? Infinity : logScale(v / 100, A_STOPS.lo, A_STOPS.hi);
}

export interface FilterResult {
  count: number;
  /** first N matching row indices, for the results list */
  sample: number[];
}

const SAMPLE_LIMIT = 400;

export function applyFilters(d: Dataset, f: Filters, out: Float32Array): FilterResult {
  const n = d.ast.count;
  const phys = d.ast.phys;
  const orb = d.ast.orb;
  const flags = d.ast.flags;
  const classes = d.ast.meta.classes;
  const search = d.ast.search;
  const names = d.ast.meta.name;
  const q = f.query.trim().toLowerCase();

  // pre-resolve class indices to a boolean lookup
  let classAllowed: boolean[] | null = null;
  if (f.classes.size > 0) {
    classAllowed = classes.map((c) => f.classes.has(c));
  }

  let count = 0;
  const sample: number[] = [];
  for (let k = 0; k < n; k++) {
    let ok = true;
    if (f.pha && flags[k * 3] !== 1) ok = false;
    else if (f.sentry && (flags[k * 3 + 2] & 2) === 0) ok = false;
    else if (classAllowed && !classAllowed[flags[k * 3 + 1]]) ok = false;
    else if (f.named && names[k] === '') ok = false;
    else if (f.approach && d.ast.caCount[k] === 0) ok = false;
    else if (f.minDiam > 0) {
      const dm = phys[k * PHYS_COLS + P.diameter];
      if (!(dm >= f.minDiam)) ok = false;
    }
    if (ok && f.maxMoid !== Infinity) {
      const m = phys[k * PHYS_COLS + P.moid];
      if (!(m <= f.maxMoid)) ok = false;
    }
    if (ok && f.maxA !== Infinity) {
      if (!(orb[k * ORB_COLS + O.a] <= f.maxA)) ok = false;
    }
    if (ok && q !== '' && search[k].indexOf(q) === -1) ok = false;

    out[k] = ok ? 1 : 0;
    if (ok) {
      count++;
      if (sample.length < SAMPLE_LIMIT) sample.push(k);
    }
  }
  return { count, sample };
}

/** Rank the filtered sample so the results list shows the interesting ones first. */
export function rankSample(d: Dataset, rows: number[], q: string): number[] {
  const phys = d.ast.phys;
  const display = d.ast.meta.display;
  const ql = q.trim().toLowerCase();
  return rows
    .slice()
    .sort((a, b) => {
      if (ql) {
        // exact-prefix matches first
        const pa = display[a].toLowerCase().indexOf(ql);
        const pb = display[b].toLowerCase().indexOf(ql);
        if (pa !== pb) return pa - pb;
      }
      const da = phys[a * PHYS_COLS + P.diameter] || 0;
      const db = phys[b * PHYS_COLS + P.diameter] || 0;
      return db - da;
    })
    .slice(0, 120);
}
