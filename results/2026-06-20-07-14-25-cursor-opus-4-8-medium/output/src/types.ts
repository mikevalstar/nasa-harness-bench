export interface AsteroidMeta {
  count: number;
  full_name: string[];
  pdes: (string | null)[];
  name: (string | null)[];
  cls: string[];
  pha: number[];
  neo: number[];
  a: (number | null)[];
  e: (number | null)[];
  i: (number | null)[];
  q: (number | null)[];
  ad: (number | null)[];
  per: (number | null)[];
  moid: (number | null)[];
  H: (number | null)[];
  diameter: (number | null)[];
  albedo: (number | null)[];
}

export interface PlanetRaw {
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

export interface CometRaw {
  full_name: string;
  pdes: string | null;
  cls: string;
  e: number;
  q: number;
  i: number;
  om: number;
  w: number;
  tp: number;
  a: number | null;
  M1: number | null;
  diameter: number | null;
}

export interface SentryEntry {
  fullname: string | null;
  ip: number | null;
  ps_cum: number | null;
  ps_max: number | null;
  ts_max: number | null;
  range: string | null;
  n_imp: number | null;
  diameter: number | null;
  h: number | null;
  v_inf: number | null;
}

export type SentryMap = Record<string, SentryEntry>;

export interface CloseApproach {
  cd: string;
  jd: number | null;
  dist: number | null;
  dist_min: number | null;
  v_rel: number | null;
}

export type CloseApproachMap = Record<string, CloseApproach[]>;
