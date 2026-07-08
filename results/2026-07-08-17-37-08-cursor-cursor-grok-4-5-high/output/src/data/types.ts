export type Planet = {
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
};

export type AsteroidMeta = {
  pdes: string;
  full_name: string;
  name: string | null;
  class: string;
  neo: boolean;
  pha: boolean;
  H: number | null;
  diameter: number | null;
  albedo: number | null;
  moid: number | null;
  rot_per: number | null;
  spec_B: string | null;
  spec_T: string | null;
  first_obs: string | null;
  a: number;
  e: number;
  i: number | null;
  om: number | null;
  w: number | null;
  q: number | null;
  ad: number | null;
  per: number | null;
  n: number | null;
  epoch: number | null;
  tp: number | null;
};

export type CometMeta = {
  pdes: string;
  full_name: string;
  class: string;
  kind: 0 | 1 | 2;
  a: number | null;
  e: number;
  i: number | null;
  om: number | null;
  w: number | null;
  q: number;
  per: number | null;
  n: number | null;
  epoch: number | null;
  tp: number | null;
  M1: number | null;
  diameter: number | null;
};

export type SentryRow = {
  index: number;
  des: string;
  fullname: string;
  ip: number;
  ps_cum: number | null;
  ps_max: number | null;
  ts_max: number;
  range: string;
  n_imp: number;
  diameter: number | null;
  h: number | null;
  v_inf: number | null;
  last_obs: string | null;
};

export type ApproachEvent = {
  jd: number;
  cd: string;
  dist: number;
  dist_min: number;
  dist_max: number;
  v_rel: number;
  v_inf: number;
  h: number;
};

export type UpcomingApproach = ApproachEvent & { des: string };

export type AsteroidPack = {
  count: number;
  /** Float32: a,e,i,om,w,ma,epoch,n,q,H,diameter,moid per object */
  floats: Float32Array;
  floatStride: number;
  /** Uint8: pha, classIndex, hasSentry per object */
  flags: Uint8Array;
  sentryIndex: Uint16Array;
  classes: string[];
  catalog: AsteroidMeta[];
};

export type CometPack = {
  count: number;
  /** Float32: a,e,i,om,w,ma,epoch,n,q,tp,M1,diameter */
  floats: Float32Array;
  floatStride: number;
  kinds: Uint8Array;
  catalog: CometMeta[];
};

export type AppData = {
  planets: Planet[];
  asteroids: AsteroidPack;
  comets: CometPack;
  sentry: SentryRow[];
  sentryByDes: Map<string, SentryRow>;
  approachesByDes: Record<string, ApproachEvent[]>;
  upcoming: UpcomingApproach[];
  manifest: {
    asteroids: number;
    comets: number;
    sentry: number;
    classes: string[];
    sunRadiusKm: number;
    auKm: number;
  };
};

export type Selection =
  | { kind: "planet"; index: number }
  | { kind: "asteroid"; index: number }
  | { kind: "comet"; index: number }
  | null;

export type Filters = {
  query: string;
  phaOnly: boolean;
  sentryOnly: boolean;
  classes: Set<string>;
  minDiameter: number | null; // km
  maxMoid: number | null; // au
  showComets: boolean;
  showAsteroids: boolean;
  highlightUpcoming: boolean;
};
