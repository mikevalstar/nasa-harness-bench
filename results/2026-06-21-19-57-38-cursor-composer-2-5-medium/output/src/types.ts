import type { OrbitalElements } from './orbit';

export interface Planet extends OrbitalElements {
  name: string;
  radius_km: number;
}

export interface Asteroid extends OrbitalElements {
  full_name: string;
  pdes: string;
  name: string | null;
  spkid: number;
  neo: boolean;
  pha: boolean;
  class: string;
  q: number;
  ad: number;
  moid: number | null;
  H: number | null;
  G: number | null;
  diameter: number | null;
  albedo: number | null;
  rot_per: number | null;
  spec_B: string | null;
  spec_T: string | null;
  first_obs: string | null;
}

export interface Comet extends OrbitalElements {
  full_name: string;
  pdes: string;
  class: string;
  M1: number | null;
  diameter: number | null;
  q: number;
}

export interface CloseApproach {
  des: string;
  cd: string;
  jd: number;
  dist: number;
  dist_min: number;
  dist_max: number;
  v_rel: number;
  v_inf: number;
  h: number | null;
}

export interface SentryEntry {
  des: string;
  fullname: string;
  ip: number;
  ps_cum: number;
  ps_max: number;
  ts_max: number;
  range: string;
  n_imp: number;
  diameter: number | null;
  h: number | null;
  v_inf: number | null;
  last_obs: string;
  last_obs_jd: number;
}

export type BodyKind = 'sun' | 'planet' | 'asteroid' | 'comet';

export interface BodyRef {
  kind: BodyKind;
  id: string;
  index?: number;
}

export interface Filters {
  search: string;
  phaOnly: boolean;
  sentryOnly: boolean;
  orbitClass: string;
  moidMax: number | null;
  showComets: boolean;
  showOrbits: boolean;
}

export interface AppState {
  jd: number;
  playing: boolean;
  speedDaysPerSec: number;
  selected: BodyRef | null;
  following: boolean;
  filters: Filters;
}

export interface LoadedData {
  planets: Planet[];
  asteroids: Asteroid[];
  comets: Comet[];
  closeApproaches: CloseApproach[];
  closeByDes: Map<string, CloseApproach[]>;
  sentry: SentryEntry[];
  sentryByDes: Map<string, SentryEntry>;
  orbitClasses: string[];
}

export function asteroidLabel(a: Asteroid): string {
  if (a.name) return `${a.name} (${a.pdes})`;
  return a.full_name || a.pdes;
}

export function getDisplayName(
  kind: BodyKind,
  data: LoadedData,
  ref: BodyRef,
): string {
  switch (kind) {
    case 'sun':
      return 'Sun';
    case 'planet': {
      const p = data.planets.find((pl) => pl.name === ref.id);
      return p?.name ?? ref.id;
    }
    case 'asteroid': {
      const a = data.asteroids[ref.index ?? -1];
      return a ? asteroidLabel(a) : ref.id;
    }
    case 'comet': {
      const c = data.comets[ref.index ?? -1];
      return c?.full_name ?? ref.id;
    }
  }
}
