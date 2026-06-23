import { OrbitalElements, Position3D } from '../types';

// Constants
export const K = 0.01720209895; // Gaussian gravitational constant
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

// Date conversion helpers
export function dateToJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function julianDateToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

// Format Julian Date to readable date string
export function formatJulianDate(jd: number): string {
  const d = julianDateToDate(jd);
  if (isNaN(d.getTime())) return 'Unknown Date';
  return d.toISOString().split('T')[0] + ' ' + d.toTimeString().split(' ')[0];
}

/**
 * Solve Kepler's Equation for Elliptical Orbits (e < 1)
 * E - e * sin(E) = M
 */
function solveKeplerElliptic(M: number, e: number): number {
  // Normalize M to [-pi, pi]
  let m = M % (2 * Math.PI);
  if (m > Math.PI) m -= 2 * Math.PI;
  if (m < -Math.PI) m += 2 * Math.PI;

  // Initial guess
  let E = m;
  if (e > 0.8) {
    E = m + e * Math.sin(m);
  }

  // Newton-Raphson iteration
  const maxIterations = 30;
  const tolerance = 1e-12;

  for (let k = 0; k < maxIterations; k++) {
    const f = E - e * Math.sin(E) - m;
    const fDeriv = 1 - e * Math.cos(E);
    const diff = f / fDeriv;
    E -= diff;
    if (Math.abs(diff) < tolerance) {
      break;
    }
  }

  return E;
}

/**
 * Solve Kepler's Equation for Hyperbolic Orbits (e > 1)
 * e * sinh(F) - F = N
 */
function solveKeplerHyperbolic(N: number, e: number): number {
  // Initial guess
  let F = N;
  if (e > 1.2) {
    F = Math.log(2 * Math.abs(N) / e + 1.8) * Math.sign(N);
  }

  // Newton-Raphson iteration
  const maxIterations = 30;
  const tolerance = 1e-12;

  for (let k = 0; k < maxIterations; k++) {
    const f = e * Math.sinh(F) - F - N;
    const fDeriv = e * Math.cosh(F) - 1;
    const diff = f / fDeriv;
    F -= diff;
    if (Math.abs(diff) < tolerance) {
      break;
    }
  }

  return F;
}

/**
 * Solve Barker's Equation for Parabolic Orbits (e = 1)
 * x^3 + 3x - 2A = 0 where x = tan(v/2)
 */
function solveKeplerParabolic(A: number): number {
  // Analytical solution of cubic equation x^3 + 3x - 2A = 0
  const sqrtTerm = Math.sqrt(A * A + 1);
  const term1 = Math.cbrt(A + sqrtTerm);
  const term2 = Math.cbrt(A - sqrtTerm); // Math.cbrt handles negative numbers correctly
  return term1 + term2;
}

/**
 * Propagate Keplerian orbit to find heliocentric 3D position
 * Coordinates in J2000 ecliptic frame, in AU
 */
export function propagateOrbit(body: OrbitalElements, jd: number): Position3D {
  const { a, e, i, om, w, ma, epoch, q, tp } = body;

  // Orbit classification
  const isElliptic = e < 0.999;
  const isHyperbolic = e > 1.001;

  let xPrime = 0;
  let yPrime = 0;

  if (isElliptic) {
    // 1. Calculate time since epoch
    const deltaT = jd - epoch;

    // 2. Derive mean motion n (degrees per day)
    let nDeg = body.n;
    if (nDeg === undefined || nDeg === null) {
      nDeg = 0.9856076686 / Math.pow(a, 1.5);
    }

    // 3. Compute mean anomaly M
    const M_deg = ma + nDeg * deltaT;
    const M_rad = M_deg * DEG_TO_RAD;

    // 4. Solve Kepler's equation for Eccentric Anomaly E
    const E_rad = solveKeplerElliptic(M_rad, e);

    // 5. Coordinates in orbital plane
    xPrime = a * (Math.cos(E_rad) - e);
    yPrime = a * Math.sqrt(1 - e * e) * Math.sin(E_rad);

  } else if (isHyperbolic) {
    // Hyperbolic orbit: propagated from perihelion passage tp
    const deltaT = jd - tp;
    const aAbs = Math.abs(a);

    // Hyperbolic mean motion n_rad = K / aAbs^1.5
    const nRad = K / Math.pow(aAbs, 1.5);
    const N = nRad * deltaT;

    // Solve hyperbolic Kepler's equation for F
    const F = solveKeplerHyperbolic(N, e);

    // Coordinates in orbital plane
    xPrime = aAbs * (e - Math.cosh(F));
    yPrime = aAbs * Math.sqrt(e * e - 1) * Math.sinh(F);

  } else {
    // Parabolic orbit (0.999 <= e <= 1.001)
    const deltaT = jd - tp;
    
    // Barker's parameter A
    const A = (0.03649116244 * deltaT) / Math.pow(q, 1.5);
    
    // Solve for x = tan(v/2)
    const x = solveKeplerParabolic(A);

    // Coordinates in orbital plane
    xPrime = q * (1 - x * x);
    yPrime = 2 * q * x;
  }

  // 6. Rotate from orbital plane to ecliptic coordinates
  const iRad = i * DEG_TO_RAD;
  const omRad = om * DEG_TO_RAD;
  const wRad = w * DEG_TO_RAD;

  const cosW = Math.cos(wRad);
  const sinW = Math.sin(wRad);
  const cosOm = Math.cos(omRad);
  const sinOm = Math.sin(omRad);
  const cosI = Math.cos(iRad);
  const sinI = Math.sin(iRad);

  // Rotation matrix components
  const dxDxe = cosW * cosOm - sinW * sinOm * cosI;
  const dyDxe = cosW * sinOm + sinW * cosOm * cosI;
  const dzDxe = sinW * sinI;

  const dxDye = -sinW * cosOm - cosW * sinOm * cosI;
  const dyDye = -sinW * sinOm + cosW * cosOm * cosI;
  const dzDye = cosW * sinI;

  // Transform coordinates
  const x = xPrime * dxDxe + yPrime * dxDye;
  const y = xPrime * dyDxe + yPrime * dyDye;
  const z = xPrime * dzDxe + yPrime * dzDye;

  return { x, y, z };
}

/**
 * Generate a set of points describing the orbit shape (for drawing the orbit path)
 * Returns an array of 3D positions
 */
export function getOrbitPath(body: OrbitalElements, pointsCount = 120): Position3D[] {
  const { e } = body;
  const path: Position3D[] = [];

  if (e < 0.999) {
    // Closed elliptical orbit: generate points evenly spaced in eccentric anomaly E
    for (let j = 0; j <= pointsCount; j++) {
      const E_rad = (j / pointsCount) * 2 * Math.PI;
      const xPrime = body.a * (Math.cos(E_rad) - e);
      const yPrime = body.a * Math.sqrt(1 - e * e) * Math.sin(E_rad);

      // Rotate to ecliptic frame
      const pos = rotateToEcliptic(xPrime, yPrime, body.i, body.om, body.w);
      path.push(pos);
    }
  } else if (e > 1.001) {
    // Hyperbolic orbit: generate points centered around perihelion (F from -F_max to +F_max)
    // We only want to plot the portion of the orbit near the Sun (e.g. within 10 AU)
    const F_max = Math.acosh((10 / Math.abs(body.a)) + e); // Solve for r = a(e cosh F - 1) up to r = 10 AU
    const maxF = Math.min(F_max || 3, 3); // limit to 3 to prevent numerical overflow

    for (let j = 0; j <= pointsCount; j++) {
      const F = -maxF + (j / pointsCount) * 2 * maxF;
      const aAbs = Math.abs(body.a);
      const xPrime = aAbs * (e - Math.cosh(F));
      const yPrime = aAbs * Math.sqrt(e * e - 1) * Math.sinh(F);

      const pos = rotateToEcliptic(xPrime, yPrime, body.i, body.om, body.w);
      path.push(pos);
    }
  } else {
    // Parabolic orbit: generate points centered around perihelion (x = tan(v/2) from -x_max to +x_max)
    // Plot up to r = 10 AU, r = q(1+x^2) => x_max = sqrt(10/q - 1)
    const x_max = Math.sqrt(Math.max(10 / body.q - 1, 1));
    const maxX = Math.min(x_max, 4); // Limit to 4

    for (let j = 0; j <= pointsCount; j++) {
      const x = -maxX + (j / pointsCount) * 2 * maxX;
      const xPrime = body.q * (1 - x * x);
      const yPrime = 2 * body.q * x;

      const pos = rotateToEcliptic(xPrime, yPrime, body.i, body.om, body.w);
      path.push(pos);
    }
  }

  return path;
}

// Helper to rotate orbital plane points to ecliptic
function rotateToEcliptic(xPrime: number, yPrime: number, i: number, om: number, w: number): Position3D {
  const iRad = i * DEG_TO_RAD;
  const omRad = om * DEG_TO_RAD;
  const wRad = w * DEG_TO_RAD;

  const cosW = Math.cos(wRad);
  const sinW = Math.sin(wRad);
  const cosOm = Math.cos(omRad);
  const sinOm = Math.sin(omRad);
  const cosI = Math.cos(iRad);
  const sinI = Math.sin(iRad);

  const dxDxe = cosW * cosOm - sinW * sinOm * cosI;
  const dyDxe = cosW * sinOm + sinW * cosOm * cosI;
  const dzDxe = sinW * sinI;

  const dxDye = -sinW * cosOm - cosW * sinOm * cosI;
  const dyDye = -sinW * sinOm + cosW * cosOm * cosI;
  const dzDye = cosW * sinI;

  return {
    x: xPrime * dxDxe + yPrime * dxDye,
    y: xPrime * dyDxe + yPrime * dyDye,
    z: xPrime * dzDxe + yPrime * dzDye
  };
}
