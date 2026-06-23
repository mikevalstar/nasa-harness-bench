export type OrbitClass = "AMO" | "APO" | "ATE" | "IEO" | string;

export interface OrbitElements {
  a: number | null;
  e: number | null;
  i: number | null;
  om: number | null;
  w: number | null;
  ma: number | null;
  epoch: number | null;
  n?: number | null;
  per?: number | null;
  q?: number | null;
  ad?: number | null;
  tp?: number | null;
}

export interface Planet extends OrbitElements {
  name: string;
  radius_km: number;
}

export interface Asteroid extends OrbitElements {
  full_name: string;
  pdes: string;
  name: string | null;
  spkid: number;
  neo: boolean;
  pha: boolean;
  class: OrbitClass;
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

export interface Comet extends OrbitElements {
  full_name: string;
  pdes: string;
  class: string | null;
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
  v_inf: number | null;
  last_obs: string | null;
  last_obs_jd: number | null;
}

export interface LoadedData {
  planets: Planet[];
  asteroids: Asteroid[];
  comets: Comet[];
  sentryByDes: Map<string, SentryRisk>;
  approachesByDes: Map<string, CloseApproach[]>;
}

export type SelectableKind = "planet" | "asteroid" | "comet";

export interface Selection {
  kind: SelectableKind;
  id: string;
}
