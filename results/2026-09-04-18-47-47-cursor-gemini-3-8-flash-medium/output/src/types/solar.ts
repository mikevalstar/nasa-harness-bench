export interface PlanetData {
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

export interface AsteroidData {
  full_name: string;
  pdes: string;
  name: string | null;
  spkid?: number;
  neo: boolean;
  pha: boolean;
  class: string;
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  epoch: number;
  q: number;
  ad: number;
  per: number;
  n: number | null;
  tp: number | null;
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

export interface CometData {
  full_name: string;
  pdes: string;
  e: number;
  a: number | null;
  q: number;
  i: number;
  om: number;
  w: number;
  ma: number | null;
  tp: number;
  per: number | null;
  n: number | null;
  epoch: number;
  class: string;
  M1: number | null;
  diameter: number | null;
}

export interface CloseApproachData {
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

export interface SentryData {
  id?: string;
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

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BodyOrbitState {
  position: Vector3D;
  distanceAu: number;
  speedKmS?: number;
}

export type BodyType = 'planet' | 'asteroid' | 'comet' | 'sun';

export interface SelectedObjectInfo {
  type: BodyType;
  id: string; // pdes or planet name
  displayName: string;
  data: AsteroidData | PlanetData | CometData | { name: 'Sun' };
  sentry?: SentryData;
  closeApproaches?: CloseApproachData[];
}
