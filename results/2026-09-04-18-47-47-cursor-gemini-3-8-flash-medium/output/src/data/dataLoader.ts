import {
  PlanetData,
  AsteroidData,
  CometData,
  CloseApproachData,
  SentryData,
} from '../types/solar';
import { computeOrbitalBasis, OrbitalBasis } from '../math/kepler';

export interface PrecomputedAsteroidArrays {
  count: number;
  a: Float32Array;
  e: Float32Array;
  epoch: Float64Array;
  n: Float32Array; // rad/day
  ma: Float32Array; // rad
  H: Float32Array;
  diameter: Float32Array;
  moid: Float32Array;
  flags: Uint8Array; // bit 0: neo, bit 1: pha, bit 2: hasSentry
  classId: Uint8Array; // 0: APO, 1: ATE, 2: AMO, 3: IEO, 4: other
  Px: Float32Array;
  Py: Float32Array;
  Pz: Float32Array;
  Qx: Float32Array;
  Qy: Float32Array;
  Qz: Float32Array;
}

export interface PrecomputedCometArrays {
  count: number;
  a: Float32Array;
  e: Float32Array;
  q: Float32Array;
  epoch: Float64Array;
  tp: Float64Array;
  n: Float32Array; // rad/day
  ma: Float32Array; // rad
  M1: Float32Array;
  diameter: Float32Array;
  Px: Float32Array;
  Py: Float32Array;
  Pz: Float32Array;
  Qx: Float32Array;
  Qy: Float32Array;
  Qz: Float32Array;
}

export interface SolarSystemData {
  planets: PlanetData[];
  asteroids: AsteroidData[];
  comets: CometData[];
  sentry: SentryData[];
  closeApproaches: CloseApproachData[];
  planetBases: Map<string, OrbitalBasis>;
  sentryMap: Map<string, SentryData>;
  closeApproachesMap: Map<string, CloseApproachData[]>;
  asteroidArrays: PrecomputedAsteroidArrays;
  cometArrays: PrecomputedCometArrays;
}

export async function loadSolarSystemData(
  onProgress?: (step: string, fraction: number) => void
): Promise<SolarSystemData> {
  const DEG_TO_RAD = Math.PI / 180;
  const GAUSSIAN_K = 0.01720209895;

  onProgress?.('Fetching planetary and orbital datasets...', 0.1);

  // Load small files in parallel
  const [planetsRes, sentryRes, cometsRes] = await Promise.all([
    fetch('./data/planets.json').then((r) => r.json() as Promise<PlanetData[]>),
    fetch('./data/sentry.json').then((r) => r.json() as Promise<SentryData[]>),
    fetch('./data/comets.json').then((r) => r.json() as Promise<CometData[]>),
  ]);

  onProgress?.('Fetching NEO close approach history...', 0.35);
  const closeApproachesRes = await fetch('./data/close-approaches.json').then(
    (r) => r.json() as Promise<CloseApproachData[]>
  );

  onProgress?.('Fetching Near-Earth Asteroids catalog (42k objects)...', 0.6);
  const asteroidsRes = await fetch('./data/asteroids.json').then(
    (r) => r.json() as Promise<AsteroidData[]>
  );

  onProgress?.('Indexing impact risks and close approaches...', 0.85);

  const sentryMap = new Map<string, SentryData>();
  for (const s of sentryRes) {
    sentryMap.set(s.des, s);
  }

  const closeApproachesMap = new Map<string, CloseApproachData[]>();
  for (const ca of closeApproachesRes) {
    let list = closeApproachesMap.get(ca.des);
    if (!list) {
      list = [];
      closeApproachesMap.set(ca.des, list);
    }
    list.push(ca);
  }

  // Precompute planet orbital bases
  const planetBases = new Map<string, OrbitalBasis>();
  for (const p of planetsRes) {
    planetBases.set(p.name, computeOrbitalBasis(p.i, p.om, p.w));
  }

  onProgress?.('Compiling GPU orbital vertex buffers...', 0.95);

  // Precompute asteroid typed arrays for instant GPU transfer and fast CPU evaluation
  const astCount = asteroidsRes.length;
  const astArrays: PrecomputedAsteroidArrays = {
    count: astCount,
    a: new Float32Array(astCount),
    e: new Float32Array(astCount),
    epoch: new Float64Array(astCount),
    n: new Float32Array(astCount),
    ma: new Float32Array(astCount),
    H: new Float32Array(astCount),
    diameter: new Float32Array(astCount),
    moid: new Float32Array(astCount),
    flags: new Uint8Array(astCount),
    classId: new Uint8Array(astCount),
    Px: new Float32Array(astCount),
    Py: new Float32Array(astCount),
    Pz: new Float32Array(astCount),
    Qx: new Float32Array(astCount),
    Qy: new Float32Array(astCount),
    Qz: new Float32Array(astCount),
  };

  for (let i = 0; i < astCount; i++) {
    const a = asteroidsRes[i];
    astArrays.a[i] = a.a;
    astArrays.e[i] = a.e;
    astArrays.epoch[i] = a.epoch;

    let nVal = a.n;
    if (nVal === null || isNaN(nVal)) {
      nVal = a.per > 0 ? 360 / a.per : (GAUSSIAN_K / Math.pow(a.a, 1.5)) * (180 / Math.PI);
    }
    astArrays.n[i] = nVal * DEG_TO_RAD;
    astArrays.ma[i] = (a.ma || 0) * DEG_TO_RAD;

    astArrays.H[i] = a.H ?? 99;
    astArrays.diameter[i] = a.diameter ?? -1;
    astArrays.moid[i] = a.moid ?? -1;

    let flag = 0;
    if (a.neo) flag |= 1;
    if (a.pha) flag |= 2;
    if (sentryMap.has(a.pdes)) flag |= 4;
    astArrays.flags[i] = flag;

    let cid = 4;
    if (a.class === 'APO') cid = 0;
    else if (a.class === 'ATE') cid = 1;
    else if (a.class === 'AMO') cid = 2;
    else if (a.class === 'IEO') cid = 3;
    astArrays.classId[i] = cid;

    const basis = computeOrbitalBasis(a.i, a.om, a.w);
    astArrays.Px[i] = basis.Px;
    astArrays.Py[i] = basis.Py;
    astArrays.Pz[i] = basis.Pz;
    astArrays.Qx[i] = basis.Qx;
    astArrays.Qy[i] = basis.Qy;
    astArrays.Qz[i] = basis.Qz;
  }

  // Precompute comet typed arrays
  const cometCount = cometsRes.length;
  const cometArrays: PrecomputedCometArrays = {
    count: cometCount,
    a: new Float32Array(cometCount),
    e: new Float32Array(cometCount),
    q: new Float32Array(cometCount),
    epoch: new Float64Array(cometCount),
    tp: new Float64Array(cometCount),
    n: new Float32Array(cometCount),
    ma: new Float32Array(cometCount),
    M1: new Float32Array(cometCount),
    diameter: new Float32Array(cometCount),
    Px: new Float32Array(cometCount),
    Py: new Float32Array(cometCount),
    Pz: new Float32Array(cometCount),
    Qx: new Float32Array(cometCount),
    Qy: new Float32Array(cometCount),
    Qz: new Float32Array(cometCount),
  };

  for (let i = 0; i < cometCount; i++) {
    const c = cometsRes[i];
    cometArrays.a[i] = c.a ?? -1;
    cometArrays.e[i] = c.e;
    cometArrays.q[i] = c.q;
    cometArrays.epoch[i] = c.epoch;
    cometArrays.tp[i] = c.tp;

    let nVal = c.n;
    if (nVal === null || isNaN(nVal)) {
      if (c.per && c.per > 0) {
        nVal = 360 / c.per;
      } else if (c.a && c.a > 0) {
        nVal = (GAUSSIAN_K / Math.pow(c.a, 1.5)) * (180 / Math.PI);
      } else {
        nVal = 0;
      }
    }
    cometArrays.n[i] = nVal * DEG_TO_RAD;
    cometArrays.ma[i] = (c.ma ?? 0) * DEG_TO_RAD;
    cometArrays.M1[i] = c.M1 ?? 99;
    cometArrays.diameter[i] = c.diameter ?? -1;

    const basis = computeOrbitalBasis(c.i, c.om, c.w);
    cometArrays.Px[i] = basis.Px;
    cometArrays.Py[i] = basis.Py;
    cometArrays.Pz[i] = basis.Pz;
    cometArrays.Qx[i] = basis.Qx;
    cometArrays.Qy[i] = basis.Qy;
    cometArrays.Qz[i] = basis.Qz;
  }

  onProgress?.('Ready', 1.0);

  return {
    planets: planetsRes,
    asteroids: asteroidsRes,
    comets: cometsRes,
    sentry: sentryRes,
    closeApproaches: closeApproachesRes,
    planetBases,
    sentryMap,
    closeApproachesMap,
    asteroidArrays: astArrays,
    cometArrays,
  };
}
