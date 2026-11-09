/**
 * Shapes of the files the build writes to `dist/data/` and the client fetches.
 * Shared by `build/prepare-data.ts` and the app so the two cannot drift.
 * Tables are columnar: one array per field, all of length `count`.
 */

/** A mostly-null column, stored as parallel row-index / value arrays. */
export interface Sparse<T> {
  idx: number[];
  val: T[];
}

export interface PlanetRow {
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

export interface AsteroidTable {
  count: number;
  /** Orbit class codes; `cls` indexes into this. */
  classes: string[];
  fullName: string[];
  pdes: string[];
  cls: number[];
  /** 1 when the object is a Potentially Hazardous Asteroid. */
  pha: number[];
  a: number[];
  e: number[];
  i: number[];
  om: number[];
  w: number[];
  ma: number[];
  epoch: number[];
  n: number[];
  moid: (number | null)[];
  H: (number | null)[];
  firstObs: (string | null)[];
  diameter: Sparse<number>;
  albedo: Sparse<number>;
  rotPer: Sparse<number>;
  G: Sparse<number>;
  specB: Sparse<string>;
  specT: Sparse<string>;
}

export interface CometTable {
  count: number;
  classes: string[];
  fullName: string[];
  pdes: string[];
  cls: number[];
  e: number[];
  q: number[];
  i: number[];
  om: number[];
  w: number[];
  /** Julian date of perihelion passage; comets are propagated from this. */
  tp: number[];
  M1: (number | null)[];
  diameter: Sparse<number>;
}

/** Earth close approaches, sorted by `jd`. `ast` is a row index into the asteroid table. */
export interface ApproachTable {
  count: number;
  ast: number[];
  jd: number[];
  dist: number[];
  distMin: number[];
  distMax: number[];
  vRel: number[];
}

export interface SentryRow {
  /** Row index into the asteroid table. */
  ast: number;
  ip: number;
  psCum: number;
  psMax: number;
  tsMax: number | null;
  range: string;
  nImp: number;
  diameter: number;
  h: number;
  vInf: number | null;
  lastObs: string;
}
