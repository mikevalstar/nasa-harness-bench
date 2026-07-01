export type BodyKind = 'planet' | 'asteroid' | 'comet';

export interface Selection {
  kind: BodyKind;
  /** Index into the planet array, or asteroid/comet dataset index. */
  index: number;
  /** Stable id for URL encoding: planet name, asteroid pdes, or comet pdes. */
  id: string;
}

export interface Filters {
  search: string;
  phaOnly: boolean;
  orbitClasses: Set<string>; // empty = all
  minDiameterKm: number | null;
  maxDiameterKm: number | null;
  maxMoidAu: number | null;
}

export function defaultFilters(): Filters {
  return {
    search: '',
    phaOnly: false,
    orbitClasses: new Set(),
    minDiameterKm: null,
    maxDiameterKm: null,
    maxMoidAu: null,
  };
}

type Listener = () => void;

/** Small central store: current selection, filters, follow-camera mode, and
 * overlay toggles. Plain pub/sub — no framework dependency. */
export class AppState {
  selection: Selection | null = null;
  filters: Filters = defaultFilters();
  followSelected = false;
  showComets = true;
  showAsteroids = true;
  showOrbitLines = true;

  private listeners = new Set<Listener>();

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(): void {
    for (const fn of this.listeners) fn();
  }

  setSelection(sel: Selection | null): void {
    this.selection = sel;
    if (!sel) this.followSelected = false;
    this.emit();
  }

  setFollow(on: boolean): void {
    this.followSelected = on && this.selection != null;
    this.emit();
  }

  updateFilters(patch: Partial<Filters>): void {
    this.filters = { ...this.filters, ...patch };
    this.emit();
  }
}
