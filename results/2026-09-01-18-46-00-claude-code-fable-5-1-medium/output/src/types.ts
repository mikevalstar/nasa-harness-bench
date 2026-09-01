/** Shapes of the files emitted by scripts/prepare-data.mjs. */

export type Vec3 = readonly [number, number, number];

export interface AsteroidMeta {
  classes: string[];
  pdes: string[];
  full_name: string[];
  name: (string | null)[];
  spkid: number[];
  class: string[];
  i: number[];
  om: number[];
  w: number[];
  q: number[];
  ad: number[];
  per: number[];
  tp: number[];
  epoch: number[];
  albedo: (number | null)[];
  rot_per: (number | null)[];
  spec_B: (string | null)[];
  spec_T: (string | null)[];
  first_obs: (string | null)[];
  G: (number | null)[];
}

export interface ApproachTable {
  idx: number[];
  jd: number[];
  dist: number[];
  dmin: number[];
  dmax: number[];
  vrel: number[];
}

export interface SentryRow {
  idx: number;
  ip: number;
  ps_cum: number;
  ps_max: number;
  ts_max: number;
  range: string;
  n_imp: number;
  diameter: number | null;
  v_inf: number | null;
  last_obs: string | null;
}

export interface CometRow {
  full_name: string;
  pdes: string;
  class: string;
  e: number;
  q: number;
  a: number | null;
  i: number;
  om: number;
  w: number;
  tp: number;
  epoch: number;
  per: number | null;
  M1: number | null;
  diameter: number | null;
  P: Vec3;
  Q: Vec3;
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

/** Float32 layout of asteroids.bin; must match prepare-data.mjs. */
export const STRIDE = 16;
export const F = {
  a: 0, e: 1, ma: 2, n: 3, epoch: 4, H: 5, moid: 6, diameter: 7,
  P: 8, Q: 11, flags: 14, cls: 15,
} as const;
export const FLAG_PHA = 1;
export const FLAG_SENTRY = 2;
export const FLAG_APPROACH = 4;

/** Something the user can select: an asteroid, a planet, a comet, or the Sun. */
export type BodyRef =
  | { kind: 'asteroid'; index: number }
  | { kind: 'comet'; index: number }
  | { kind: 'planet'; index: number }
  | { kind: 'sun' };

export function sameBody(a: BodyRef | null, b: BodyRef | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.kind !== b.kind) return false;
  if (a.kind === 'sun' || b.kind === 'sun') return true;
  return a.index === (b as { index: number }).index;
}
