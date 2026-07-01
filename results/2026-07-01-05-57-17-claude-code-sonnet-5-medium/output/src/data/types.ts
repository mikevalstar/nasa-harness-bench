export interface PlanetElements {
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

export interface AsteroidMeta {
  full_name: string;
  pdes: string;
  name: string | null;
  class: string;
  pha: boolean;
  spkid: number;
  moid: number | null;
  H: number | null;
  diameter: number | null;
  albedo: number | null;
  rot_per: number | null;
  spec_T: string | null;
  first_obs: string;
  q: number;
  ad: number;
  per: number;
  tp: number;
}

export interface CometMeta {
  full_name: string;
  pdes: string;
  class: string;
  M1: number | null;
  diameter: number | null;
  a: number | null;
  e: number;
  per: number | null;
  epoch: number;
}

export interface CloseApproachSet {
  fields: ['cd', 'jd', 'dist', 'v_rel'];
  byDes: Record<string, [string, number, number, number][]>;
}

export interface SentryEntry {
  fullname: string;
  ip: number;
  ps_cum: number;
  ps_max: number;
  ts_max: number;
  range: string;
  n_imp: number;
  diameter: number | null;
  v_inf: number;
  h: number;
  last_obs: string;
}

export type SentryByDes = Record<string, SentryEntry>;

export interface AsteroidDataset {
  buffer: Float32Array;
  stride: number;
  count: number;
  meta: AsteroidMeta[];
}

export interface CometDataset {
  buffer: Float32Array;
  stride: number;
  count: number;
  meta: CometMeta[];
}
