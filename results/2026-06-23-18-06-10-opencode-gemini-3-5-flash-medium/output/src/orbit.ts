import * as THREE from 'three';

export interface OrbitalElements {
  pdes: string;
  name: string | null;
  full_name: string;
  class: string;
  a: number | null;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number | null;
  epoch: number | null;
  per: number | null;
  tp: number | null;
  n: number | null;
  q?: number | null;
  M1?: number | null;
  diameter: number | null;
}

const GAUSSIAN_K = 0.01720209895; // Gaussian gravitational constant

/**
 * Converts a standard JavaScript Date object to Julian Date.
 */
export function dateToJulianDate(date: Date): number {
  return 2440587.5 + date.getTime() / 86400000;
}

/**
 * Converts a Julian Date to a standard JavaScript Date object.
 */
export function julianDateToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

/**
 * Formats Julian Date to a human readable UTC string.
 */
export function formatJulianDate(jd: number): string {
  const date = julianDateToDate(jd);
  return date.toUTCString().replace(' GMT', ' UTC');
}

/**
 * Solves Kepler's equation for elliptical orbits: E - e * sin(E) = M
 * @param M Mean anomaly in radians
 * @param e Eccentricity (e < 1)
 */
function solveKeplerElliptical(M: number, e: number): number {
  let E = M;
  const tol = 1e-6;
  for (let k = 0; k < 12; k++) {
    const diff = E - e * Math.sin(E) - M;
    if (Math.abs(diff) < tol) break;
    E = E - diff / (1.0 - e * Math.cos(E));
  }
  return E;
}

/**
 * Solves Kepler's equation for hyperbolic orbits: e * sinh(F) - F = N
 * @param N Mean anomaly in radians
 * @param e Eccentricity (e > 1)
 */
function solveKeplerHyperbolic(N: number, e: number): number {
  // Good starting approximation
  let F = N;
  if (N > 0) {
    F = Math.log(2 * N / e + 1.0);
  } else if (N < 0) {
    F = -Math.log(-2 * N / e + 1.0);
  }
  
  const tol = 1e-6;
  for (let k = 0; k < 15; k++) {
    const diff = e * Math.sinh(F) - F - N;
    if (Math.abs(diff) < tol) break;
    F = F - diff / (e * Math.cosh(F) - 1.0);
  }
  return F;
}

/**
 * Solves Barker's equation for parabolic or near-parabolic orbits:
 * tan(v/2) + (1/3)*tan^3(v/2) = B
 * Returns tan(v/2)
 */
function solveBarker(B: number): number {
  const threeBOver2 = 1.5 * B;
  const rad = Math.sqrt(1.0 + threeBOver2 * threeBOver2);
  return Math.cbrt(threeBOver2 + rad) - Math.cbrt(-threeBOver2 + rad);
}

/**
 * Rotates orbital-plane coordinates (x', y', 0) to J2000 heliocentric ecliptic coordinates.
 */
export function rotateToEcliptic(
  xPrime: number, 
  yPrime: number, 
  iDeg: number, 
  omDeg: number, 
  wDeg: number
): THREE.Vector3 {
  const iRad = iDeg * Math.PI / 180;
  const omRad = omDeg * Math.PI / 180;
  const wRad = wDeg * Math.PI / 180;

  const cosOm = Math.cos(omRad);
  const sinOm = Math.sin(omRad);
  const cosW = Math.cos(wRad);
  const sinW = Math.sin(wRad);
  const cosI = Math.cos(iRad);
  const sinI = Math.sin(iRad);

  const px = cosW * cosOm - sinW * sinOm * cosI;
  const py = cosW * sinOm + sinW * cosOm * cosI;
  const pz = sinW * sinI;

  const qx = -sinW * cosOm - cosW * sinOm * cosI;
  const qy = -sinW * sinOm + cosW * cosOm * cosI;
  const qz = cosW * sinI;

  const x = xPrime * px + yPrime * qx;
  const y = xPrime * py + yPrime * qy;
  const z = xPrime * pz + yPrime * qz;

  return new THREE.Vector3(x, y, z);
}

/**
 * Computes 3D position of an object from its orbital elements at a specific Julian Date.
 * Units are in AU.
 */
export function propagateOrbit(body: OrbitalElements, jd: number): THREE.Vector3 {
  const e = body.e;
  const i = body.i;
  const om = body.om;
  const w = body.w;

  // 1. Parabolic / near-parabolic orbits (e.g. e >= 0.999 and e <= 1.001) or comets without a semi-major axis
  if (e >= 0.999 && e <= 1.001) {
    const q = body.q || (body.a ? body.a * (1 - e) : null);
    if (!q) return new THREE.Vector3(0, 0, 0); // fallback

    const tp = body.tp || jd;
    const deltaT = jd - tp;
    
    // Barker's equation parameter B
    const B = (GAUSSIAN_K / (Math.sqrt(2) * Math.pow(q, 1.5))) * deltaT;
    const tanVOver2 = solveBarker(B);
    const r = q * (1.0 + tanVOver2 * tanVOver2);

    const xPrime = q * (1.0 - tanVOver2 * tanVOver2);
    const yPrime = 2 * q * tanVOver2;

    return rotateToEcliptic(xPrime, yPrime, i, om, w);
  }

  // 2. Hyperbolic orbits (e > 1)
  if (e > 1.001) {
    const q = body.q || (body.a ? Math.abs(body.a) * (e - 1) : null);
    if (!q) return new THREE.Vector3(0, 0, 0); // fallback

    // semi-major axis is negative for hyperbolas
    const a = body.a !== null && body.a < 0 ? body.a : -q / (e - 1);
    const absA = Math.abs(a);

    const tp = body.tp || jd;
    const deltaT = jd - tp;

    // Hyperbolic mean motion n (radians/day)
    const nRad = GAUSSIAN_K / Math.pow(absA, 1.5);
    const N = nRad * deltaT;

    const F = solveKeplerHyperbolic(N, e);

    const xPrime = a * (Math.cosh(F) - e);
    const yPrime = absA * Math.sqrt(e * e - 1.0) * Math.sinh(F);

    return rotateToEcliptic(xPrime, yPrime, i, om, w);
  }

  // 3. Elliptical orbits (e < 0.999)
  const a = body.a;
  if (a === null || a <= 0) return new THREE.Vector3(0, 0, 0); // fallback

  const epoch = body.epoch || 2451545.0; // Default to J2000
  const deltaT = jd - epoch;

  // Compute mean motion n in degrees/day
  let n = body.n;
  if (n === null || n === undefined) {
    if (body.per) {
      n = 360.0 / body.per;
    } else {
      n = 0.9856076686 / Math.pow(a, 1.5); // Derivation from Kepler's 3rd law
    }
  }

  // Compute mean anomaly at time t
  const ma0 = body.ma || 0;
  const M = (ma0 + n * deltaT) % 360;
  const MRad = M * Math.PI / 180;

  // Solve Kepler's equation for E
  const E = solveKeplerElliptical(MRad, e);

  // Compute positions in orbital plane
  const xPrime = a * (Math.cos(E) - e);
  const yPrime = a * Math.sqrt(1.0 - e * e) * Math.sin(E);

  return rotateToEcliptic(xPrime, yPrime, i, om, w);
}

/**
 * Computes a list of 3D points representing the orbital path.
 * This is used for rendering the orbit path in the scene.
 */
export function getOrbitPathPoints(body: OrbitalElements, numPoints: number = 180): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const e = body.e;
  const i = body.i;
  const om = body.om;
  const w = body.w;

  // Elliptical Orbit: Draw full ellipse by stepping Eccentric Anomaly E from 0 to 2PI
  if (e < 0.999) {
    const a = body.a;
    if (a === null || a <= 0) return [];
    
    for (let k = 0; k <= numPoints; k++) {
      const E = (k / numPoints) * 2 * Math.PI;
      const xPrime = a * (Math.cos(E) - e);
      const yPrime = a * Math.sqrt(1.0 - e * e) * Math.sin(E);
      points.push(rotateToEcliptic(xPrime, yPrime, i, om, w));
    }
    return points;
  }

  // Hyperbolic Orbit: Draw curve by stepping F from -2.0 to 2.0
  if (e > 1.001) {
    const q = body.q || (body.a ? Math.abs(body.a) * (e - 1) : null);
    if (!q) return [];
    const a = body.a !== null && body.a < 0 ? body.a : -q / (e - 1);
    const absA = Math.abs(a);

    // Limit F range so the path doesn't go off to infinity too quickly
    const maxF = 2.2;
    for (let k = 0; k <= numPoints; k++) {
      const F = -maxF + (k / numPoints) * (2 * maxF);
      const xPrime = a * (Math.cosh(F) - e);
      const yPrime = absA * Math.sqrt(e * e - 1.0) * Math.sinh(F);
      points.push(rotateToEcliptic(xPrime, yPrime, i, om, w));
    }
    return points;
  }

  // Parabolic Orbit: Draw curve by stepping tan(v/2) from -2.5 to 2.5
  const q = body.q || (body.a ? body.a * (1 - e) : null);
  if (!q) return [];

  const maxTan = 2.5;
  for (let k = 0; k <= numPoints; k++) {
    const tanVOver2 = -maxTan + (k / numPoints) * (2 * maxTan);
    const xPrime = q * (1.0 - tanVOver2 * tanVOver2);
    const yPrime = 2 * q * tanVOver2;
    points.push(rotateToEcliptic(xPrime, yPrime, i, om, w));
  }
  return points;
}
