export interface OrbitalElements {
  a: number | null; // semi-major axis (au)
  e: number;        // eccentricity
  i: number;        // inclination (deg)
  om: number;       // longitude of ascending node (deg)
  w: number;        // argument of perihelion (deg)
  ma: number | null; // mean anomaly at epoch (deg)
  epoch: number | null; // epoch of elements (Julian date)
  per: number | null;  // period (days)
  n: number | null;    // mean motion (deg/day)
  tp: number | null;   // time of perihelion passage (Julian date)
  q?: number | null;   // perihelion distance (au)
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

const GAUSSIAN_K = 0.01720209895; // Gaussian gravitational constant

export function degToRad(deg: number): number {
  return deg * Math.PI / 180;
}

export function radToDeg(rad: number): number {
  return rad * 180 / Math.PI;
}

// Convert Date to Julian Date
export function getJulianDate(date: Date): number {
  return 2440587.5 + date.getTime() / 86400000;
}

// Convert Julian Date to Date
export function getDateFromJulian(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

// Format JD to nice date string
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function propagateOrbit(elements: OrbitalElements, jd: number): Position3D {
  const { e, i, om, w } = elements;
  
  // Use elements.q if present, otherwise derive from a and e
  let q = elements.q || null;
  let a = elements.a;
  if (a !== null && q === null) {
    q = a * (1 - e);
  } else if (q !== null && a === null) {
    if (e < 1) {
      a = q / (1 - e);
    } else if (e > 1) {
      a = -q / (e - 1);
    }
  }

  let xPrime = 0;
  let yPrime = 0;

  if (e < 0.99 && a !== null) {
    // --- Elliptic Orbit ---
    let n = elements.n;
    if (n === null) {
      // Derive mean motion n (deg/day) from semi-major axis a (au)
      // n = 0.9856076686 / a^1.5
      n = 0.9856076686 / Math.pow(a, 1.5);
    }

    let ma = elements.ma;
    let epoch = elements.epoch;

    let M_rad = 0;
    if (ma !== null && epoch !== null) {
      const dt = jd - epoch;
      const M_deg = (ma + n * dt) % 360;
      M_rad = degToRad(M_deg);
    } else if (elements.tp !== null) {
      const dt = jd - elements.tp;
      const M_deg = (n * dt) % 360;
      M_rad = degToRad(M_deg);
    }

    // Solve Kepler's Equation: E - e * sin(E) = M
    let E = M_rad;
    for (let iter = 0; iter < 6; iter++) {
      const delta = (E - e * Math.sin(E) - M_rad) / (1 - e * Math.cos(E));
      E -= delta;
      if (Math.abs(delta) < 1e-6) break;
    }

    xPrime = a * (Math.cos(E) - e);
    yPrime = a * Math.sqrt(1 - e * e) * Math.sin(E);

  } else if (e > 1.01 && q !== null) {
    // --- Hyperbolic Orbit ---
    const absA = q / (e - 1);
    const tp = elements.tp !== null ? elements.tp : (elements.epoch || 2451545);
    const dt = jd - tp;
    
    // Mean motion for hyperbola: n_H = k / |a|^1.5
    const n_H = GAUSSIAN_K / Math.pow(absA, 1.5);
    const M_H = n_H * dt;

    // Solve Hyperbolic Kepler's Equation: e * sinh(F) - F = M_H
    let F = M_H / (e - 1); // good starting guess for small/moderate values
    if (Math.abs(M_H) > 5) {
      F = Math.sign(M_H) * Math.log(2 * Math.abs(M_H) / e);
    }
    for (let iter = 0; iter < 8; iter++) {
      const delta = (e * Math.sinh(F) - F - M_H) / (e * Math.cosh(F) - 1);
      F -= delta;
      if (Math.abs(delta) < 1e-6) break;
    }

    xPrime = absA * (e - Math.cosh(F));
    yPrime = absA * Math.sqrt(e * e - 1) * Math.sinh(F);

  } else if (q !== null) {
    // --- Parabolic/Near-Parabolic Orbit ---
    const tp = elements.tp !== null ? elements.tp : (elements.epoch || 2451545);
    const dt = jd - tp;

    // Barker's equation: x^3 + 3x - 6A = 0
    // where A = 0.5 * k * q^-1.5 * dt
    const A = 1.5 * GAUSSIAN_K * Math.pow(q, -1.5) * dt;
    const term = Math.sqrt(9 * A * A + 1);
    const x = Math.cbrt(3 * A + term) - Math.cbrt(term - 3 * A);

    xPrime = q * (1 - x * x);
    yPrime = 2 * q * x;
  }

  // --- Coordinate Transformation from Orbital Plane to J2000 Ecliptic Frame ---
  const iRad = degToRad(i);
  const omRad = degToRad(om);
  const wRad = degToRad(w);

  const cosom = Math.cos(omRad);
  const sinom = Math.sin(omRad);
  const cosw = Math.cos(wRad);
  const sinw = Math.sin(wRad);
  const cosi = Math.cos(iRad);
  const sini = Math.sin(iRad);

  const Px = cosw * cosom - sinw * sinom * cosi;
  const Py = cosw * sinom + sinw * cosom * cosi;
  const Pz = sinw * sini;

  const Qx = -sinw * cosom - cosw * sinom * cosi;
  const Qy = -sinw * sinom + cosw * cosom * cosi;
  const Qz = cosw * sini;

  const x_ecliptic = xPrime * Px + yPrime * Qx;
  const y_ecliptic = xPrime * Py + yPrime * Qy;
  const z_ecliptic = xPrime * Pz + yPrime * Qz;

  // Map to Three.js coordinates:
  // Three.js X = x_ecliptic
  // Three.js Y = z_ecliptic (inclination height)
  // Three.js Z = y_ecliptic (ground plane)
  return {
    x: x_ecliptic,
    y: z_ecliptic,
    z: y_ecliptic
  };
}

// Generate points along an orbit for drawing the trajectory path
export function getOrbitPathPoints(elements: OrbitalElements, count: number = 200): Position3D[] {
  const points: Position3D[] = [];
  const { e } = elements;

  if (e < 0.99) {
    // Elliptic: generate points uniformly in eccentric anomaly E [0, 2pi]
    for (let j = 0; j <= count; j++) {
      const E = (j / count) * 2 * Math.PI;
      let a = elements.a;
      let q = elements.q || null;
      if (a === null && q !== null) {
        a = q / (1 - e);
      }
      if (a !== null) {
        const xPrime = a * (Math.cos(E) - e);
        const yPrime = a * Math.sqrt(1 - e * e) * Math.sin(E);
        points.push(rotateToEcliptic(xPrime, yPrime, elements.i, elements.om, elements.w));
      }
    }
  } else if (e > 1.01) {
    // Hyperbolic: generate points in F range [-3, 3]
    for (let j = 0; j <= count; j++) {
      const F = -2.5 + (j / count) * 5;
      let q = elements.q || null;
      let a = elements.a;
      if (q === null && a !== null) {
        q = Math.abs(a) * (e - 1);
      }
      if (q !== null) {
        const absA = q / (e - 1);
        const xPrime = absA * (e - Math.cosh(F));
        const yPrime = absA * Math.sqrt(e * e - 1) * Math.sinh(F);
        points.push(rotateToEcliptic(xPrime, yPrime, elements.i, elements.om, elements.w));
      }
    }
  } else {
    // Parabolic: generate points in x range [-2.5, 2.5]
    for (let j = 0; j <= count; j++) {
      const x = -2.5 + (j / count) * 5;
      let q = elements.q || null;
      if (q === null && elements.a !== null) {
        q = elements.a * (1 - e);
      }
      if (q !== null) {
        const xPrime = q * (1 - x * x);
        const yPrime = 2 * q * x;
        points.push(rotateToEcliptic(xPrime, yPrime, elements.i, elements.om, elements.w));
      }
    }
  }

  return points;
}

function rotateToEcliptic(xPrime: number, yPrime: number, i: number, om: number, w: number): Position3D {
  const iRad = degToRad(i);
  const omRad = degToRad(om);
  const wRad = degToRad(w);

  const cosom = Math.cos(omRad);
  const sinom = Math.sin(omRad);
  const cosw = Math.cos(wRad);
  const sinw = Math.sin(wRad);
  const cosi = Math.cos(iRad);
  const sini = Math.sin(iRad);

  const Px = cosw * cosom - sinw * sinom * cosi;
  const Py = cosw * sinom + sinw * cosom * cosi;
  const Pz = sinw * sini;

  const Qx = -sinw * cosom - cosw * sinom * cosi;
  const Qy = -sinw * sinom + cosw * cosom * cosi;
  const Qz = cosw * sini;

  const x_ecliptic = xPrime * Px + yPrime * Qx;
  const y_ecliptic = xPrime * Py + yPrime * Qy;
  const z_ecliptic = xPrime * Pz + yPrime * Qz;

  return {
    x: x_ecliptic,
    y: z_ecliptic,
    z: y_ecliptic
  };
}
