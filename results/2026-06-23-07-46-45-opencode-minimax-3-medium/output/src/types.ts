// Compact typed-array representation of an asteroid for fast propagation.

export interface Asteroid {
  pdes: string;
  full_name: string;
  name: string | null;
  spkid: number | null;
  neo: boolean;
  pha: boolean;
  class: string | null;
  moid: number | null;
  H: number | null;
  diameter: number | null;
  albedo: number | null;
  rot_per: number | null;
  spec_B: string | null;
  spec_T: string | null;
  first_obs: string | null;
}

export interface AsteroidOrbit {
  a: number;
  e: number;
  i: number; // deg
  om: number; // deg  Ω
  w: number; // deg  ω
  ma: number; // deg  M at epoch
  epoch: number; // JD
  n: number; // deg/day
  per: number; // days
  q: number;
  ad: number;
}

export interface Planet {
  name: string;
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  epoch: number;
  n: number;
  per: number;
  radius_km: number;
}

export interface Comet {
  pdes: string;
  full_name: string;
  name: string | null;
  class: string | null;
  e: number;
  a: number; // may be negative/infinity for hyperbolic
  q: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  tp: number; // JD
  per: number | null;
  n: number | null;
  epoch: number;
  M1: number | null;
  diameter: number | null;
}

export interface CloseApproach {
  j: number; // JD
  d: number; // dist (au)
  dn: number; // dist_min
  dx: number; // dist_max
  v: number; // v_rel (km/s)
  h: number; // absolute magnitude
}

export interface SentryEntry {
  id?: string;
  fullname?: string;
  ip?: number;
  ps_cum?: number;
  ps_max?: number;
  ts_max?: number;
  range?: string;
  n_imp?: number;
  diameter?: number;
  h?: number;
  v_inf?: number;
  last_obs?: string;
  last_obs_jd?: number;
}

export interface AsteroidFull extends Asteroid {
  orbit: AsteroidOrbit;
  sentry: SentryEntry | null;
  close_approaches: CloseApproach[];
}
