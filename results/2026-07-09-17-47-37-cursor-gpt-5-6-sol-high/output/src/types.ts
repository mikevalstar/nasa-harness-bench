export interface OrbitalElements {
  a: number | null;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number | null;
  epoch: number | null;
  n: number | null;
  per: number | null;
  q?: number | null;
  ad?: number | null;
  tp?: number | null;
}

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

export interface SentryRisk {
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
  v_inf: number;
  last_obs: string;
  last_obs_jd: number;
}

export interface DataSet {
  planets: Planet[];
  asteroids: Asteroid[];
  comets: Comet[];
  approaches: CloseApproach[];
  sentry: SentryRisk[];
}

export interface AsteroidFilter {
  hazardousOnly: boolean;
  sentryOnly: boolean;
  orbitClass: string;
  minDiameter: number;
  maxMoid: number;
  approachWindowDays: number;
  search: string;
}

export type Selection =
  | { kind: "asteroid"; index: number }
  | { kind: "planet"; index: number }
  | { kind: "comet"; index: number }
  | null;

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}
