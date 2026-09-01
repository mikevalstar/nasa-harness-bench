import type { BodyRef } from './types';
import { nowJd } from './orbits';

export type ColorMode = 'hazard' | 'class' | 'size';
export type HazardFilter = 'all' | 'pha' | 'sentry';

export interface Filters {
  query: string;
  hazard: HazardFilter;
  /** orbit classes currently enabled */
  classes: Set<string>;
  hMin: number;
  hMax: number;
  /** au; null = no limit */
  moidMax: number | null;
  /** only objects with a close approach within ±N days of the current time; null = off */
  approachWindow: number | null;
  onlyMeasured: boolean;
}

export interface AppState {
  jd: number;
  playing: boolean;
  /** simulated days per real second */
  speed: number;
  selected: BodyRef | null;
  hovered: BodyRef | null;
  follow: boolean;
  colorMode: ColorMode;
  filters: Filters;
  showComets: boolean;
  showCometTails: boolean;
  showPlanetOrbits: boolean;
  showFilteredOrbits: boolean;
  showApproachLines: boolean;
  showGrid: boolean;
  showLabels: boolean;
}

export const ASTEROID_CLASSES = ['APO', 'ATE', 'AMO', 'IEO', 'HTC', 'ETc', 'JFc', 'JFC'] as const;
export const H_RANGE = { min: 9, max: 34 } as const;
export const SPEED_STEPS = [
  { label: '1 min/s', days: 1 / 1440 },
  { label: '1 hr/s', days: 1 / 24 },
  { label: '6 hr/s', days: 0.25 },
  { label: '1 day/s', days: 1 },
  { label: '1 wk/s', days: 7 },
  { label: '1 mo/s', days: 30 },
  { label: '6 mo/s', days: 182 },
  { label: '1 yr/s', days: 365.25 },
  { label: '5 yr/s', days: 5 * 365.25 },
] as const;

export function defaultFilters(): Filters {
  return {
    query: '',
    hazard: 'all',
    classes: new Set(ASTEROID_CLASSES),
    hMin: H_RANGE.min,
    hMax: H_RANGE.max,
    moidMax: null,
    approachWindow: null,
    onlyMeasured: false,
  };
}

export function defaultState(): AppState {
  return {
    jd: nowJd(),
    playing: true,
    speed: 1,
    selected: null,
    hovered: null,
    follow: false,
    colorMode: 'hazard',
    filters: defaultFilters(),
    showComets: true,
    showCometTails: true,
    showPlanetOrbits: true,
    showFilteredOrbits: false,
    showApproachLines: true,
    showGrid: true,
    showLabels: true,
  };
}

type Key = keyof AppState;
type Listener = (changed: ReadonlySet<Key>, state: AppState) => void;

/** Tiny observable store: set() merges and notifies with the set of changed keys. */
export class Store {
  state: AppState;
  private listeners = new Set<Listener>();

  constructor(initial: AppState) {
    this.state = initial;
  }

  set(patch: Partial<AppState>): void {
    const changed = new Set<Key>();
    for (const k of Object.keys(patch) as Key[]) {
      if (this.state[k] !== patch[k]) changed.add(k);
    }
    if (changed.size === 0) return;
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(changed, this.state);
  }

  /** Replace filters with a modified copy (filters are treated as immutable). */
  setFilters(patch: Partial<Filters>): void {
    this.set({ filters: { ...this.state.filters, ...patch } });
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}
