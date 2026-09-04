import { Vector3D } from '../types/solar';

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
export const TWO_PI = Math.PI * 2;
export const GAUSSIAN_K = 0.01720209895; // AU^(3/2) / day

export interface OrbitalBasis {
  Px: number;
  Py: number;
  Pz: number;
  Qx: number;
  Qy: number;
  Qz: number;
}

export function computeOrbitalBasis(iDeg: number, omDeg: number, wDeg: number): OrbitalBasis {
  const inc = iDeg * DEG_TO_RAD;
  const om = omDeg * DEG_TO_RAD;
  const w = wDeg * DEG_TO_RAD;

  const cosOm = Math.cos(om);
  const sinOm = Math.sin(om);
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);

  const Px = cosOm * cosW - sinOm * sinW * cosI;
  const Py = sinOm * cosW + cosOm * sinW * cosI;
  const Pz = sinW * sinI;

  const Qx = -cosOm * sinW - sinOm * cosW * cosI;
  const Qy = -sinOm * sinW + cosOm * cosW * cosI;
  const Qz = cosW * sinI;

  return { Px, Py, Pz, Qx, Qy, Qz };
}

export function solveEllipticKepler(M: number, e: number): number {
  let normM = M % TWO_PI;
  if (normM < 0) normM += TWO_PI;

  let E = normM + e * Math.sin(normM);
  for (let iter = 0; iter < 5; iter++) {
    const f = E - e * Math.sin(E) - normM;
    const fPrime = 1 - e * Math.cos(E);
    const dE = f / fPrime;
    E -= dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

export function solveHyperbolicKepler(Mh: number, e: number): number {
  let H = Math.asinh(Mh / e);
  for (let iter = 0; iter < 8; iter++) {
    const f = e * Math.sinh(H) - H - Mh;
    const fPrime = e * Math.cosh(H) - 1;
    const dH = f / fPrime;
    H -= dH;
    if (Math.abs(dH) < 1e-8) break;
  }
  return H;
}

export function solveBarker(W: number): number {
  const disc = Math.sqrt(9 * W * W + 1);
  const u = Math.cbrt(3 * W + disc);
  const v = Math.cbrt(3 * W - disc);
  return u + v;
}

export function propagatePerifocal(
  a: number | null,
  e: number,
  q: number,
  jd: number,
  epoch: number,
  maDeg: number | null,
  nDegPerDay: number | null,
  tp: number | null
): { xp: number; yp: number } {
  // Elliptic orbit
  if (e < 0.9999 && a !== null && a > 0) {
    let n = nDegPerDay;
    if (n === null || isNaN(n)) {
      n = (GAUSSIAN_K / Math.pow(a, 1.5)) * RAD_TO_DEG;
    }
    const nRad = n * DEG_TO_RAD;

    let M: number;
    if (maDeg !== null && !isNaN(maDeg)) {
      const dt = jd - epoch;
      M = (maDeg * DEG_TO_RAD + nRad * dt) % TWO_PI;
    } else if (tp !== null && !isNaN(tp)) {
      const dt = jd - tp;
      M = (nRad * dt) % TWO_PI;
    } else {
      M = 0;
    }

    const E = solveEllipticKepler(M, e);
    const xp = a * (Math.cos(E) - e);
    const yp = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);
    return { xp, yp };
  }

  // Parabolic orbit
  if (Math.abs(e - 1.0) <= 0.0001) {
    const effectiveQ = q > 0 ? q : (a ? a * (1 - e) : 1.0);
    const tRef = tp !== null ? tp : epoch;
    const dt = jd - tRef;
    const W = (GAUSSIAN_K / (Math.SQRT2 * Math.pow(effectiveQ, 1.5))) * dt;
    const B = solveBarker(W);
    const xp = effectiveQ * (1 - B * B);
    const yp = 2 * effectiveQ * B;
    return { xp, yp };
  }

  // Hyperbolic orbit (e > 1.0001)
  const effectiveQ = q > 0 ? q : (a ? Math.abs(a) * (e - 1) : 1.0);
  const aAbs = effectiveQ / (e - 1);
  const tRef = tp !== null ? tp : epoch;
  const dt = jd - tRef;
  const nHyper = GAUSSIAN_K / Math.pow(aAbs, 1.5);
  const Mh = nHyper * dt;
  const H = solveHyperbolicKepler(Mh, e);
  const xp = aAbs * (e - Math.cosh(H));
  const yp = aAbs * Math.sqrt(e * e - 1) * Math.sinh(H);
  return { xp, yp };
}

export function toThreeCoords(rx: number, ry: number, rz: number): Vector3D {
  return {
    x: rx,
    y: rz,
    z: -ry,
  };
}

export function perifocalToThree(xp: number, yp: number, basis: OrbitalBasis): Vector3D {
  const rx = xp * basis.Px + yp * basis.Qx;
  const ry = xp * basis.Py + yp * basis.Qy;
  const rz = xp * basis.Pz + yp * basis.Qz;
  return toThreeCoords(rx, ry, rz);
}

export function generateOrbitPoints(
  a: number | null,
  e: number,
  q: number,
  basis: OrbitalBasis,
  numSegments: number = 120
): Vector3D[] {
  const points: Vector3D[] = [];

  if (e < 0.9999 && a !== null && a > 0) {
    const b = a * Math.sqrt(Math.max(0, 1 - e * e));
    for (let i = 0; i <= numSegments; i++) {
      const E = (i / numSegments) * TWO_PI;
      const xp = a * (Math.cos(E) - e);
      const yp = b * Math.sin(E);
      points.push(perifocalToThree(xp, yp, basis));
    }
  } else if (Math.abs(e - 1) <= 0.0001) {
    const effectiveQ = q > 0 ? q : 1.0;
    const maxB = 3.5;
    for (let i = 0; i <= numSegments; i++) {
      const frac = i / numSegments;
      const B = -maxB + frac * 2 * maxB;
      const xp = effectiveQ * (1 - B * B);
      const yp = 2 * effectiveQ * B;
      points.push(perifocalToThree(xp, yp, basis));
    }
  } else {
    // Hyperbola
    const effectiveQ = q > 0 ? q : 1.0;
    const aAbs = effectiveQ / (e - 1);
    const maxH = 2.8;
    for (let i = 0; i <= numSegments; i++) {
      const frac = i / numSegments;
      const H = -maxH + frac * 2 * maxH;
      const xp = aAbs * (e - Math.cosh(H));
      const yp = aAbs * Math.sqrt(e * e - 1) * Math.sinh(H);
      points.push(perifocalToThree(xp, yp, basis));
    }
  }

  return points;
}
