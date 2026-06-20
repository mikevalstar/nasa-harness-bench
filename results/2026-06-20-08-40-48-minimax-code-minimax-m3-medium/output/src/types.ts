// Domain types shared across the app.

export interface Planet {
  name: string;
  a: number; // au
  e: number;
  i: number; // deg
  om: number; // deg
  w: number; // deg
  ma: number; // deg
  epoch: number; // JD
  n: number; // deg/day
  per: number; // days
  radius_km: number;
}

export interface SentryRow {
  des: string;
  fullname: string;
  ip: number; // cumulative impact probability
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

export interface AsteroidMeta {
  fullName: string;
  pdes: string;
  name: string;
  spkid: number;
  flags: number; // bit0 neo, bit1 pha, bit2 sentry, bit3 hasDiameter
  classCode: number; // 0=other, 1=AMO, 2=APO, 3=ATE, 4=IEO
  diameter: number; // km, 0 if unknown
  H: number;
  rotPer: number;
  moid: number;
  q: number;
  ad: number;
  per: number;
  albedo: number;
  sentry?: SentryRow;
}

export interface CometMeta {
  fullName: string;
  pdes: string;
  isHyperbolic: boolean;
  diameter: number;
}

export interface LoadedData {
  planets: Planet[];
  asteroidCount: number;
  asteroidStride: number;
  asteroidData: Float32Array; // interleaved orbital basis + elements
  asteroidFlags: Uint8Array; // bit per asteroid: visibility (mutable)
  asteroidMeta: AsteroidMeta[];
  sentry: Map<string, SentryRow>;
  closeApproaches: CloseApproach[];
  closeApproachIndex: Record<string, [number, number]>;
  cometCount: number;
  cometStride: number;
  cometData: Float32Array;
  cometMeta: CometMeta[];
  cometFlags: Uint8Array;
}

export interface FilterState {
  orbits: boolean;
  labels: boolean;
  comets: boolean;
  phaOnly: boolean;
  sentryOnly: boolean;
  closeOnly: boolean;
  classCode: number; // 0 = all
  minDiameter: number; // km, 0 = any
  maxMoid: number; // au, 0 = any
  search: string;
}

export interface CameraState {
  x: number;
  y: number;
  z: number;
  tx: number;
  ty: number;
  tz: number;
}

export interface AppState {
  time: number; // Julian date
  playing: boolean;
  speed: number; // days per second
  selected: string | null; // pdes or planet name
  follow: string | null;
  filters: FilterState;
  camera: CameraState;
}
