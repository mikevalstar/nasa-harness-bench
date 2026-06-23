import type { OrbitElements } from "./types";

const DEG_TO_RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const GAUSSIAN_K = 0.01720209895;
const MU = GAUSSIAN_K * GAUSSIAN_K;

export type Vec3 = [number, number, number];

export function dateToJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function julianDateToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

export function formatDate(jd: number): string {
  return julianDateToDate(jd).toISOString().slice(0, 10);
}

export function parseDateInput(value: string): number | null {
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) ? dateToJulianDate(new Date(time)) : null;
}

export function positionFromElements(elements: OrbitElements, jd: number): Vec3 | null {
  const e = finite(elements.e);
  const inc = finite(elements.i);
  const om = finite(elements.om);
  const w = finite(elements.w);

  if (e === null || inc === null || om === null || w === null) {
    return null;
  }

  if (e < 1) {
    return positionElliptic(elements, jd, e, inc, om, w);
  }

  const q = finite(elements.q);
  const tp = finite(elements.tp);
  if (q === null || tp === null || q <= 0) {
    return null;
  }

  if (Math.abs(e - 1) < 1e-4) {
    return rotatePerifocal(positionParabolic(q, jd - tp), inc, om, w);
  }

  return rotatePerifocal(positionHyperbolic(q, e, jd - tp), inc, om, w);
}

export function orbitPath(elements: OrbitElements, samples = 256): Vec3[] {
  const e = finite(elements.e);
  const a = finite(elements.a);
  const q = finite(elements.q);
  const inc = finite(elements.i);
  const om = finite(elements.om);
  const w = finite(elements.w);
  const points: Vec3[] = [];

  if (e === null || inc === null || om === null || w === null) {
    return points;
  }

  if (e < 1 && a !== null && a > 0) {
    for (let index = 0; index <= samples; index += 1) {
      const eccentricAnomaly = (index / samples) * TWO_PI;
      const x = a * (Math.cos(eccentricAnomaly) - e);
      const y = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(eccentricAnomaly);
      points.push(rotatePerifocal([x, y, 0], inc, om, w));
    }
    return points;
  }

  if (q !== null && q > 0) {
    const maxTrueAnomaly = e > 1 ? Math.acos(-1 / e) * 0.88 : Math.PI * 0.82;
    for (let index = 0; index <= samples; index += 1) {
      const nu = -maxTrueAnomaly + (2 * maxTrueAnomaly * index) / samples;
      const r = e === 1 ? (2 * q) / (1 + Math.cos(nu)) : (q * (1 + e)) / (1 + e * Math.cos(nu));
      points.push(rotatePerifocal([r * Math.cos(nu), r * Math.sin(nu), 0], inc, om, w));
    }
  }

  return points;
}

function positionElliptic(
  elements: OrbitElements,
  jd: number,
  e: number,
  inc: number,
  om: number,
  w: number,
): Vec3 | null {
  const a = finite(elements.a);
  const ma = finite(elements.ma);
  const epoch = finite(elements.epoch);
  if (a === null || ma === null || epoch === null || a <= 0) {
    return null;
  }

  const meanMotionDeg = finite(elements.n) ?? (Math.sqrt(MU / (a * a * a)) / DEG_TO_RAD);
  const meanAnomaly = normalizeRadians((ma + meanMotionDeg * (jd - epoch)) * DEG_TO_RAD);
  const eccentricAnomaly = solveKeplerElliptic(meanAnomaly, e);
  const x = a * (Math.cos(eccentricAnomaly) - e);
  const y = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(eccentricAnomaly);

  return rotatePerifocal([x, y, 0], inc, om, w);
}

function positionParabolic(q: number, daysSincePerihelion: number): Vec3 {
  const scale = Math.sqrt((2 * q * q * q) / MU);
  const target = daysSincePerihelion / scale;
  let d = Math.cbrt(3 * target);

  for (let step = 0; step < 10; step += 1) {
    const f = d + (d * d * d) / 3 - target;
    const fp = 1 + d * d;
    d -= f / fp;
  }

  return [q * (1 - d * d), 2 * q * d, 0];
}

function positionHyperbolic(q: number, e: number, daysSincePerihelion: number): Vec3 {
  const aAbs = q / (e - 1);
  const meanAnomaly = Math.sqrt(MU / (aAbs * aAbs * aAbs)) * daysSincePerihelion;
  const h = solveKeplerHyperbolic(meanAnomaly, e);
  const x = aAbs * (e - Math.cosh(h));
  const y = aAbs * Math.sqrt(e * e - 1) * Math.sinh(h);
  return [x, y, 0];
}

function solveKeplerElliptic(meanAnomaly: number, e: number): number {
  let eccentricAnomaly = e < 0.8 ? meanAnomaly : Math.PI;
  for (let step = 0; step < 10; step += 1) {
    const delta =
      (eccentricAnomaly - e * Math.sin(eccentricAnomaly) - meanAnomaly) /
      (1 - e * Math.cos(eccentricAnomaly));
    eccentricAnomaly -= delta;
    if (Math.abs(delta) < 1e-8) break;
  }
  return eccentricAnomaly;
}

function solveKeplerHyperbolic(meanAnomaly: number, e: number): number {
  const sign = meanAnomaly < 0 ? -1 : 1;
  let h = sign * Math.log((2 * Math.abs(meanAnomaly)) / e + 1.8);
  for (let step = 0; step < 16; step += 1) {
    const delta = (e * Math.sinh(h) - h - meanAnomaly) / (e * Math.cosh(h) - 1);
    h -= delta;
    if (Math.abs(delta) < 1e-8) break;
  }
  return h;
}

function rotatePerifocal([x, y, z]: Vec3, incDeg: number, omDeg: number, wDeg: number): Vec3 {
  const inc = incDeg * DEG_TO_RAD;
  const om = omDeg * DEG_TO_RAD;
  const w = wDeg * DEG_TO_RAD;

  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);
  const cosOm = Math.cos(om);
  const sinOm = Math.sin(om);

  const x1 = x * cosW - y * sinW;
  const y1 = x * sinW + y * cosW;
  const z1 = z;

  const x2 = x1;
  const y2 = y1 * cosI - z1 * sinI;
  const z2 = y1 * sinI + z1 * cosI;

  const x3 = x2 * cosOm - y2 * sinOm;
  const y3 = x2 * sinOm + y2 * cosOm;

  return [x3, z2, y3];
}

function normalizeRadians(value: number): number {
  return ((value % TWO_PI) + TWO_PI) % TWO_PI;
}

function finite(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
