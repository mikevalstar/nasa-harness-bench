// Shapes of the prepared data written by scripts/prepare-data.ts and fetched by the app.

/** Turns a row type into a column-oriented table: one array per field. */
export type Columns<Row> = { count: number } & { [K in keyof Row]: Row[K][] };

export type AsteroidRow = {
  name: string;
  pdes: string;
  cls: string;
  pha: boolean;
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  epoch: number;
  n: number;
  moid: number | null;
  H: number | null;
  diameter: number | null;
  albedo: number | null;
  rot_per: number | null;
  spec_B: string | null;
  spec_T: string | null;
  first_obs: string | null;
};

export type CometRow = {
  name: string;
  pdes: string;
  cls: string;
  e: number;
  q: number;
  i: number;
  om: number;
  w: number;
  tp: number;
  /** null for parabolic orbits (e = 1) */
  a: number | null;
  ma: number | null;
  n: number | null;
  epoch: number;
  M1: number | null;
  diameter: number | null;
};

/** One Earth close approach; `idx` points into the asteroid table. */
export type ApproachRow = {
  idx: number;
  jd: number;
  dist: number;
  dmin: number;
  dmax: number;
  vrel: number;
};

/** Sentry impact-risk entry joined to the asteroid table via `idx`. */
export type SentryRow = {
  idx: number;
  ip: number;
  ps_cum: number;
  ps_max: number;
  ts_max: number | null;
  range: string;
  n_imp: number;
  v_inf: number | null;
  last_obs: string;
};

export type PlanetRow = {
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

export type AsteroidTable = Columns<AsteroidRow>;
export type CometTable = Columns<CometRow>;
export type ApproachTable = Columns<ApproachRow>;
