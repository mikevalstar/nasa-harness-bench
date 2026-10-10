// Fetches the prepared data (relative URLs) and derives what the app needs from it.
import { OrbitSet } from "./orbit.ts";
import type {
  ApproachTable,
  AsteroidTable,
  CometTable,
  PlanetRow,
  SentryRow,
} from "./types.ts";

export type BodyRef =
  | { kind: "planet"; idx: number }
  | { kind: "asteroid"; idx: number }
  | { kind: "comet"; idx: number };

export type Catalog = {
  planets: PlanetRow[];
  planetOrbits: OrbitSet;
  asteroids: AsteroidTable;
  asteroidOrbits: OrbitSet;
  /** Diameter in km: measured where known, otherwise estimated from H. */
  diameterKm: Float32Array;
  diameterMeasured: Uint8Array;
  sentryByIdx: Map<number, SentryRow>;
  sentry: SentryRow[];
  approaches: ApproachTable;
  /** Approach row numbers per asteroid, in time order. */
  approachesByIdx: Map<number, number[]>;
  comets: CometTable;
  cometOrbits: OrbitSet;
};

async function getJson<T>(file: string): Promise<T> {
  const res = await fetch(`./data/${file}`);
  if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
  return (await res.json()) as T;
}

/** Diameter (km) from absolute magnitude, assuming albedo 0.14 when unknown. */
export const diameterFromH = (H: number, albedo = 0.14) => (1329 / Math.sqrt(albedo)) * 10 ** (-H / 5);

export async function loadCatalog(onProgress: (msg: string) => void): Promise<Catalog> {
  onProgress("Loading orbital elements…");
  const [planets, asteroids, comets, sentry, approaches] = await Promise.all([
    getJson<PlanetRow[]>("planets.json"),
    getJson<AsteroidTable>("asteroids.json"),
    getJson<CometTable>("comets.json"),
    getJson<SentryRow[]>("sentry.json"),
    getJson<ApproachTable>("approaches.json"),
  ]);

  onProgress(`Building ${asteroids.count.toLocaleString()} orbits…`);
  const planetOrbits = new OrbitSet(planets.map((p) => ({ ...p, q: p.a * (1 - p.e), tp: 0 })));

  const asteroidOrbits = new OrbitSet(
    Array.from({ length: asteroids.count }, (_, j) => ({
      a: asteroids.a[j]!,
      e: asteroids.e[j]!,
      i: asteroids.i[j]!,
      om: asteroids.om[j]!,
      w: asteroids.w[j]!,
      ma: asteroids.ma[j]!,
      n: asteroids.n[j]!,
      epoch: asteroids.epoch[j]!,
      q: asteroids.a[j]! * (1 - asteroids.e[j]!),
      tp: 0,
    })),
  );

  const cometOrbits = new OrbitSet(
    Array.from({ length: comets.count }, (_, j) => ({
      a: comets.a[j] ?? 0,
      e: comets.e[j]!,
      i: comets.i[j]!,
      om: comets.om[j]!,
      w: comets.w[j]!,
      ma: comets.ma[j] ?? 0,
      n: comets.n[j] ?? 0,
      epoch: comets.epoch[j]!,
      q: comets.q[j]!,
      tp: comets.tp[j]!,
    })),
  );

  const diameterKm = new Float32Array(asteroids.count);
  const diameterMeasured = new Uint8Array(asteroids.count);
  for (let j = 0; j < asteroids.count; j++) {
    const d = asteroids.diameter[j];
    const H = asteroids.H[j];
    if (d != null) {
      diameterKm[j] = d;
      diameterMeasured[j] = 1;
    } else {
      diameterKm[j] = H != null ? diameterFromH(H, asteroids.albedo[j] ?? undefined) : NaN;
    }
  }

  const approachesByIdx = new Map<number, number[]>();
  for (let r = 0; r < approaches.count; r++) {
    const idx = approaches.idx[r]!;
    const list = approachesByIdx.get(idx);
    if (list) list.push(r);
    else approachesByIdx.set(idx, [r]);
  }

  return {
    planets,
    planetOrbits,
    asteroids,
    asteroidOrbits,
    diameterKm,
    diameterMeasured,
    sentry,
    sentryByIdx: new Map(sentry.map((s) => [s.idx, s])),
    approaches,
    approachesByIdx,
    comets,
    cometOrbits,
  };
}

export function bodyName(cat: Catalog, ref: BodyRef): string {
  switch (ref.kind) {
    case "planet":
      return cat.planets[ref.idx]!.name;
    case "asteroid":
      return cat.asteroids.name[ref.idx]!;
    case "comet":
      return cat.comets.name[ref.idx]!;
  }
}

export function orbitsOf(cat: Catalog, kind: BodyRef["kind"]): OrbitSet {
  return kind === "planet" ? cat.planetOrbits : kind === "asteroid" ? cat.asteroidOrbits : cat.cometOrbits;
}

/** Index of the first approach at or after `jd` (approaches are sorted by time). */
export function firstApproachAfter(cat: Catalog, jd: number): number {
  const t = cat.approaches.jd;
  let lo = 0;
  let hi = t.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (t[mid]! < jd) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export const ORBIT_CLASSES: Record<string, string> = {
  IEO: "Atira — orbit entirely inside Earth's",
  ATE: "Aten — Earth-crossing, a < 1 au",
  APO: "Apollo — Earth-crossing, a > 1 au",
  AMO: "Amor — approaches Earth from outside",
  JFc: "Jupiter-family comet",
  JFC: "Jupiter-family comet",
  HTC: "Halley-type comet",
  ETc: "Encke-type comet",
  CTc: "Chiron-type comet",
  COM: "Comet",
  PAR: "Parabolic comet",
  HYP: "Hyperbolic comet",
};
