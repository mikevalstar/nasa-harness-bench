import type { OrbitalElements } from "./types";

const DEG = Math.PI / 180;
const GAUSSIAN_K = 0.01720209895;
const UNIX_EPOCH_JD = 2440587.5;
const DAY_MS = 86_400_000;

function solveElliptic(meanAnomaly: number, eccentricity: number): number {
  const fullTurn = Math.PI * 2;
  const wrapped =
    ((((meanAnomaly + Math.PI) % fullTurn) + fullTurn) % fullTurn) - Math.PI;
  let eccentricAnomaly = eccentricity < 0.8 ? wrapped : Math.PI;
  for (let iteration = 0; iteration < 7; iteration += 1) {
    const delta =
      (eccentricAnomaly -
        eccentricity * Math.sin(eccentricAnomaly) -
        wrapped) /
      (1 - eccentricity * Math.cos(eccentricAnomaly));
    eccentricAnomaly -= delta;
    if (Math.abs(delta) < 1e-8) break;
  }
  return eccentricAnomaly;
}

function solveHyperbolic(meanAnomaly: number, eccentricity: number): number {
  let hyperbolicAnomaly = Math.asinh(meanAnomaly / eccentricity);
  for (let iteration = 0; iteration < 10; iteration += 1) {
    const delta =
      (eccentricity * Math.sinh(hyperbolicAnomaly) -
        hyperbolicAnomaly -
        meanAnomaly) /
      (eccentricity * Math.cosh(hyperbolicAnomaly) - 1);
    hyperbolicAnomaly -= delta;
    if (Math.abs(delta) < 1e-8) break;
  }
  return hyperbolicAnomaly;
}

function rotatePerifocal(
  elements: OrbitalElements,
  orbitalX: number,
  orbitalY: number,
  target: Float32Array | number[],
  offset: number,
): boolean {
  const ascendingNode = elements.om * DEG;
  const perihelion = elements.w * DEG;
  const inclination = elements.i * DEG;
  const cosNode = Math.cos(ascendingNode);
  const sinNode = Math.sin(ascendingNode);
  const cosPerihelion = Math.cos(perihelion);
  const sinPerihelion = Math.sin(perihelion);
  const cosInclination = Math.cos(inclination);
  const sinInclination = Math.sin(inclination);

  const eclipticX =
    (cosNode * cosPerihelion -
      sinNode * sinPerihelion * cosInclination) *
      orbitalX +
    (-cosNode * sinPerihelion -
      sinNode * cosPerihelion * cosInclination) *
      orbitalY;
  const eclipticY =
    (sinNode * cosPerihelion +
      cosNode * sinPerihelion * cosInclination) *
      orbitalX +
    (-sinNode * sinPerihelion +
      cosNode * cosPerihelion * cosInclination) *
      orbitalY;
  const eclipticZ =
    sinPerihelion * sinInclination * orbitalX +
    cosPerihelion * sinInclination * orbitalY;

  if (
    !Number.isFinite(eclipticX) ||
    !Number.isFinite(eclipticY) ||
    !Number.isFinite(eclipticZ)
  ) {
    return false;
  }

  // Three.js uses Y-up; this mapping preserves the J2000 frame's handedness.
  target[offset] = eclipticX;
  target[offset + 1] = eclipticZ;
  target[offset + 2] = -eclipticY;
  return true;
}

export function positionAt(
  elements: OrbitalElements,
  julianDate: number,
  target: Float32Array | number[],
  offset = 0,
  maxRadius = Number.POSITIVE_INFINITY,
): boolean {
  const eccentricity = elements.e;
  let orbitalX: number;
  let orbitalY: number;

  if (eccentricity < 0.9995) {
    if (!elements.a || !elements.epoch) return false;
    const meanMotion =
      elements.n !== null
        ? elements.n * DEG
        : GAUSSIAN_K / Math.pow(Math.abs(elements.a), 1.5);
    const baseMeanAnomaly =
      elements.ma !== null
        ? elements.ma * DEG
        : elements.tp
          ? meanMotion * (elements.epoch - elements.tp)
          : 0;
    const eccentricAnomaly = solveElliptic(
      baseMeanAnomaly + meanMotion * (julianDate - elements.epoch),
      eccentricity,
    );
    orbitalX = elements.a * (Math.cos(eccentricAnomaly) - eccentricity);
    orbitalY =
      elements.a *
      Math.sqrt(Math.max(0, 1 - eccentricity * eccentricity)) *
      Math.sin(eccentricAnomaly);
  } else if (eccentricity > 1.0005) {
    if (!elements.tp) return false;
    const semiMajorAxis =
      elements.a && elements.a !== 0
        ? Math.abs(elements.a)
        : (elements.q ?? 0) / (eccentricity - 1);
    if (!semiMajorAxis) return false;
    const meanMotion = GAUSSIAN_K / Math.pow(semiMajorAxis, 1.5);
    const hyperbolicAnomaly = solveHyperbolic(
      meanMotion * (julianDate - elements.tp),
      eccentricity,
    );
    orbitalX =
      semiMajorAxis * (eccentricity - Math.cosh(hyperbolicAnomaly));
    orbitalY =
      semiMajorAxis *
      Math.sqrt(eccentricity * eccentricity - 1) *
      Math.sinh(hyperbolicAnomaly);
  } else {
    const perihelionDistance = elements.q;
    if (!perihelionDistance || !elements.tp) return false;
    const barker =
      (GAUSSIAN_K * (julianDate - elements.tp)) /
      Math.sqrt(2 * Math.pow(perihelionDistance, 3));
    const tangentHalfAnomaly =
      2 * Math.sinh(Math.asinh(1.5 * barker) / 3);
    orbitalX =
      perihelionDistance * (1 - tangentHalfAnomaly * tangentHalfAnomaly);
    orbitalY = 2 * perihelionDistance * tangentHalfAnomaly;
  }

  if (Math.hypot(orbitalX, orbitalY) > maxRadius) return false;
  return rotatePerifocal(elements, orbitalX, orbitalY, target, offset);
}

export function sampleOrbit(
  elements: OrbitalElements,
  julianDate: number,
  segments = 180,
  maxRadius = 40,
): Float32Array {
  const points: number[] = [];

  if (elements.e < 1 && elements.a) {
    for (let step = 0; step <= segments; step += 1) {
      const eccentricAnomaly = (step / segments) * Math.PI * 2;
      const orbitalX =
        elements.a * (Math.cos(eccentricAnomaly) - elements.e);
      const orbitalY =
        elements.a *
        Math.sqrt(Math.max(0, 1 - elements.e * elements.e)) *
        Math.sin(eccentricAnomaly);
      rotatePerifocal(elements, orbitalX, orbitalY, points, points.length);
    }
  } else {
    const span = Math.min(3650, Math.max(500, Math.abs(julianDate - (elements.tp ?? julianDate)) * 2));
    for (let step = 0; step <= segments; step += 1) {
      const sampleDate = julianDate + (step / segments - 0.5) * span;
      const offset = points.length;
      if (positionAt(elements, sampleDate, points, offset, maxRadius)) continue;
    }
  }

  return new Float32Array(points);
}

export function dateToJulian(date: Date): number {
  return date.getTime() / DAY_MS + UNIX_EPOCH_JD;
}

export function julianToDate(julianDate: number): Date {
  return new Date((julianDate - UNIX_EPOCH_JD) * DAY_MS);
}

export function isoDate(julianDate: number): string {
  return julianToDate(julianDate).toISOString().slice(0, 10);
}

export function formatDate(julianDate: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(julianToDate(julianDate));
}
