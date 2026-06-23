// Loads the preprocessed data and packs it into efficient runtime structures.

import type {
  Asteroid,
  AsteroidOrbit,
  Planet,
  Comet,
  CloseApproach,
  SentryEntry,
} from './types';

export interface PackedAsteroid {
  count: number;
  // Index by pdes for detail lookup.
  indexByPdes: Map<string, number>;

  // Per-orbit floats (rad-units for om/w/i/ma precomputed), layout:
  //   [a, e, n_rad_per_day, ma0_rad, epoch_jd, Px, Py, Pz, Qx, Qy, Qz]
  // Stored as Float32Array for fast inner-loop access.
  orbit: Float32Array;

  // Per-orbit scalars (diameter, moid, H, etc.) and metadata.
  meta: Array<{
    pdes: string;
    full_name: string;
    name: string | null;
    spkid: number | null;
    class: string | null;
    neo: boolean;
    pha: boolean;
    diameter: number | null;
    H: number | null;
    moid: number | null;
    albedo: number | null;
    rot_per: number | null;
    spec_B: string | null;
    spec_T: string | null;
    first_obs: string | null;
  }>;

  sentryByPdes: Record<string, SentryEntry>;
  closeApproachesByPdes: Record<string, CloseApproach[]>;
}

export interface LoadedData {
  packed: PackedAsteroid;
  planets: Planet[];
  comets: Comet[];
}

// Layout (14 floats per body):
//   0  a            (au)
//   1  e            (—)
//   2  n            (rad / day)
//   3  ma0          (rad at epoch)
//   4  epoch        (JD)
//   5  Px, 6 Py, 7 Pz           (rotation row P, in J2000 ecliptic)
//   8  Qx, 9 Qy, 10 Qz          (rotation row Q)
//   11 i_deg        (degrees, kept for detail display)
//   12 om_deg       (degrees)
//   13 w_deg        (degrees)
const ORBIT_FLOATS_PER_BODY = 14;

export async function loadAllData(onProgress?: (msg: string, pct: number) => void): Promise<LoadedData> {
  const base = './data/';
  const fetches = [
    fetch(base + 'asteroids.min.json').then((r) => r.json()),
    fetch(base + 'planets.min.json').then((r) => r.json()),
    fetch(base + 'comets.min.json').then((r) => r.json()),
    fetch(base + 'close-approaches.min.json').then((r) => r.json()),
    fetch(base + 'sentry.min.json').then((r) => r.json()),
  ];
  const steps = ['asteroids', 'planets', 'comets', 'close-approaches', 'sentry'];
  let done = 0;
  const tick = () => {
    done++;
    if (onProgress) onProgress(`Loaded ${steps[done - 1]}`, done / steps.length);
  };
  const [rawAst, rawPlan, rawCom, rawCA, rawSentry] = await Promise.all(
    fetches.map(async (p) => {
      const v = await p;
      tick();
      return v;
    }),
  );

  if (onProgress) onProgress('Packing asteroid orbits', 0.9);

  const N = rawAst.length;
  const orbit = new Float32Array(N * ORBIT_FLOATS_PER_BODY);
  const meta: PackedAsteroid['meta'] = new Array(N);
  const indexByPdes = new Map<string, number>();

  const DEG = Math.PI / 180;
  for (let i = 0; i < N; i++) {
    const r = rawAst[i] as Asteroid & AsteroidOrbit;
    indexByPdes.set(r.pdes, i);

    const om = r.om * DEG;
    const w = r.w * DEG;
    const inc = r.i * DEG;
    const cosOm = Math.cos(om);
    const sinOm = Math.sin(om);
    const cosW = Math.cos(w);
    const sinW = Math.sin(w);
    const cosI = Math.cos(inc);
    const sinI = Math.sin(inc);

    const o = i * ORBIT_FLOATS_PER_BODY;
    orbit[o + 0] = r.a;
    orbit[o + 1] = r.e;
    orbit[o + 2] = r.n * DEG; // n in rad/day
    orbit[o + 3] = r.ma * DEG; // ma in rad
    orbit[o + 4] = r.epoch;
    orbit[o + 5] = cosOm * cosW - sinOm * sinW * cosI; // Px
    orbit[o + 6] = sinOm * cosW + cosOm * sinW * cosI; // Py
    orbit[o + 7] = sinW * sinI; // Pz
    orbit[o + 8] = -cosOm * sinW - sinOm * cosW * cosI; // Qx
    orbit[o + 9] = -sinOm * sinW + cosOm * cosW * cosI; // Qy
    orbit[o + 10] = cosW * sinI; // Qz
    orbit[o + 11] = r.i;   // deg (for detail display)
    orbit[o + 12] = r.om;  // deg
    orbit[o + 13] = r.w;   // deg

    meta[i] = {
      pdes: r.pdes,
      full_name: r.full_name ?? r.pdes,
      name: r.name ?? null,
      spkid: r.spkid ?? null,
      class: r.class ?? null,
      neo: r.neo,
      pha: r.pha,
      diameter: r.diameter ?? null,
      H: r.H ?? null,
      moid: r.moid ?? null,
      albedo: r.albedo ?? null,
      rot_per: r.rot_per ?? null,
      spec_B: r.spec_B ?? null,
      spec_T: r.spec_T ?? null,
      first_obs: r.first_obs ?? null,
    };
  }

  if (onProgress) onProgress('Done', 1);

  return {
    packed: {
      count: N,
      indexByPdes,
      orbit,
      meta,
      sentryByPdes: rawSentry,
      closeApproachesByPdes: rawCA,
    },
    planets: rawPlan,
    comets: rawCom,
  };
}
