/** Fetches the prepared tables from `data/` and derives the lookups the app needs. */
import type {
  ApproachTable,
  AsteroidTable,
  CometTable,
  PlanetRow,
  SentryRow,
  Sparse,
} from "./schema.ts";

/** Orbit-class groups used for filtering and colour. */
export const ORBIT_GROUPS = ["apollo", "amor", "aten", "atira", "cometary"] as const;
export type OrbitGroup = (typeof ORBIT_GROUPS)[number];

export const GROUP_INFO: Record<OrbitGroup, { label: string; blurb: string }> = {
  apollo: { label: "Apollo", blurb: "Crosses Earth's orbit from outside (a > 1 au)" },
  amor: { label: "Amor", blurb: "Approaches Earth's orbit from outside without crossing it" },
  aten: { label: "Aten", blurb: "Crosses Earth's orbit from inside (a < 1 au)" },
  atira: { label: "Atira", blurb: "Orbit entirely inside Earth's" },
  cometary: { label: "Comet-like", blurb: "Near-Earth object on a comet-like orbit" },
};

const GROUP_OF_CLASS: Record<string, OrbitGroup> = { APO: "apollo", AMO: "amor", ATE: "aten", IEO: "atira" };

export const CLASS_NAMES: Record<string, string> = {
  APO: "Apollo",
  AMO: "Amor",
  ATE: "Aten",
  IEO: "Atira",
  HTC: "Halley-type comet",
  ETc: "Encke-type comet",
  JFc: "Jupiter-family comet",
  JFC: "Jupiter-family comet",
  CTc: "Chiron-type comet",
  COM: "Comet",
  PAR: "Parabolic comet",
  HYP: "Hyperbolic comet",
};

/** Albedo assumed when turning absolute magnitude into a diameter estimate. */
export const ASSUMED_ALBEDO = 0.14;

export const diameterFromH = (H: number, albedo: number): number =>
  (1329 / Math.sqrt(albedo)) * Math.pow(10, -H / 5);

export interface Catalog {
  planets: PlanetRow[];
  asteroids: AsteroidTable;
  comets: CometTable;
  sentry: SentryRow[];
  approaches: ApproachTable;
  /** Per asteroid: orbit-class group as an index into `ORBIT_GROUPS`. */
  group: Uint8Array;
  /** Per asteroid: measured diameter, else an estimate from H, else NaN. Kilometres. */
  diameterKm: Float32Array;
  measuredDiameter: Map<number, number>;
  albedo: Map<number, number>;
  rotPer: Map<number, number>;
  specB: Map<number, string>;
  specT: Map<number, string>;
  cometDiameter: Map<number, number>;
  /** Per asteroid: row in `sentry`, or -1. */
  sentryRow: Int32Array;
  /** Approach rows of asteroid `i` are `approachList[approachStart[i] .. approachStart[i + 1]]`, in date order. */
  approachStart: Uint32Array;
  approachList: Uint32Array;
  asteroidByDes: Map<string, number>;
  cometByDes: Map<string, number>;
}

const toMap = <T>(column: Sparse<T>): Map<number, T> =>
  new Map(column.idx.map((row, k) => [row, column.val[k]]));

async function fetchJson<T>(file: string): Promise<T> {
  const response = await fetch(`data/${file}`);
  if (!response.ok) throw new Error(`Could not load data/${file} (${response.status})`);
  return (await response.json()) as T;
}

export async function loadCatalog(onProgress: (done: number, total: number) => void): Promise<Catalog> {
  let done = 0;
  const total = 5;
  const tracked = async <T>(file: string): Promise<T> => {
    const value = await fetchJson<T>(file);
    onProgress(++done, total);
    return value;
  };
  const [planets, asteroids, comets, sentry, approaches] = await Promise.all([
    tracked<PlanetRow[]>("planets.json"),
    tracked<AsteroidTable>("asteroids.json"),
    tracked<CometTable>("comets.json"),
    tracked<SentryRow[]>("sentry.json"),
    tracked<ApproachTable>("approaches.json"),
  ]);

  const count = asteroids.count;
  const measuredDiameter = toMap(asteroids.diameter);
  const albedo = toMap(asteroids.albedo);

  const groupOfClass = asteroids.classes.map((code) => ORBIT_GROUPS.indexOf(GROUP_OF_CLASS[code] ?? "cometary"));
  const group = new Uint8Array(count);
  const diameterKm = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    group[i] = groupOfClass[asteroids.cls[i]];
    const H = asteroids.H[i];
    diameterKm[i] = measuredDiameter.get(i) ?? (H === null ? NaN : diameterFromH(H, albedo.get(i) ?? ASSUMED_ALBEDO));
  }

  const sentryRow = new Int32Array(count).fill(-1);
  sentry.forEach((row, k) => (sentryRow[row.ast] = k));

  const approachStart = new Uint32Array(count + 1);
  for (let k = 0; k < approaches.count; k++) approachStart[approaches.ast[k] + 1]++;
  for (let i = 0; i < count; i++) approachStart[i + 1] += approachStart[i];
  const cursor = approachStart.slice(0, count);
  const approachList = new Uint32Array(approaches.count);
  for (let k = 0; k < approaches.count; k++) approachList[cursor[approaches.ast[k]]++] = k;

  return {
    planets,
    asteroids,
    comets,
    sentry,
    approaches,
    group,
    diameterKm,
    measuredDiameter,
    albedo,
    rotPer: toMap(asteroids.rotPer),
    specB: toMap(asteroids.specB),
    specT: toMap(asteroids.specT),
    cometDiameter: toMap(comets.diameter),
    sentryRow,
    approachStart,
    approachList,
    asteroidByDes: new Map(asteroids.pdes.map((des, i) => [des, i])),
    cometByDes: new Map(comets.pdes.map((des, i) => [des, i])),
  };
}
