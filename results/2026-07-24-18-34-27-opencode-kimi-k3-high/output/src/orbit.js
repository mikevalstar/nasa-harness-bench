// Orbit propagation from Keplerian orbital elements.
// Frame: J2000 heliocentric ecliptic. Angles in degrees, distances in au, time in
// Julian days. Returns ecliptic coordinates mapped so that +Z_ecl -> +Y (three.js
// "up"), i.e. returns {x, y, z} with y = ecliptic z.

const D2R = Math.PI / 180;
const K_GAUSS = 0.01720209895; // Gaussian gravitational constant, au^3/2 / day
const MU = K_GAUSS * K_GAUSS; // heliocentric gravitational parameter, au^3/day^2

export function solveKeplerElliptic(M, e) {
  // M in radians (any range), returns eccentric anomaly E (radians)
  M = M % (2 * Math.PI);
  if (M > Math.PI) M -= 2 * Math.PI;
  if (M < -Math.PI) M += 2 * Math.PI;
  let E = e < 0.8 ? M + e * Math.sin(M) : Math.PI * Math.sign(M);
  for (let k = 0; k < 8; k++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const d = f / fp;
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return E;
}

export function solveKeplerHyperbolic(M, e) {
  // M in radians, e > 1, returns hyperbolic anomaly H
  let H = Math.sign(M) * Math.log(1 + (2 * Math.abs(M)) / e + 1.8);
  if (!isFinite(H)) H = Math.sign(M);
  for (let k = 0; k < 12; k++) {
    const f = e * Math.sinh(H) - H - M;
    const fp = e * Math.cosh(H) - 1;
    const d = f / fp;
    H -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return H;
}

// Solve Barker's equation for a parabolic orbit. t in days since perihelion.
export function solveBarker(dtDays, q) {
  // B = tan(nu/2); B + B^3/3 = 2*M_par, M_par = sqrt(mu/(2 q^3)) * dt
  const Mpar = Math.sqrt(MU / (2 * q * q * q)) * dtDays;
  const target = 2 * Mpar;
  // closed-form via Cardano: B = 2*sinh(asinh(1.5*target)/3)
  const B = 2 * Math.sinh(Math.asinh(1.5 * target) / 3);
  return B;
}

// Rotate orbital-plane coordinates into the ecliptic frame given (w, i, om) in deg.
// out: [x, y, z] in three.js coords (ecliptic z mapped to +y).
function toEcliptic(xOrb, yOrb, w, i, om, out) {
  const cw = Math.cos(w * D2R), sw = Math.sin(w * D2R);
  const ci = Math.cos(i * D2R), si = Math.sin(i * D2R);
  const co = Math.cos(om * D2R), so = Math.sin(om * D2R);
  // R_z(om) * R_x(i) * R_z(w)
  const x = (co * cw - so * sw * ci) * xOrb + (-co * sw - so * cw * ci) * yOrb;
  const zE = (so * cw + co * sw * ci) * xOrb + (-so * sw + co * cw * ci) * yOrb;
  const yE = sw * si * xOrb + cw * si * yOrb;
  out.x = x;
  out.y = yE; // ecliptic north -> three.js up
  out.z = zE;
  return out;
}

// Elliptic orbit: elements {a, e, i, om, w, ma, epoch, n(deg/day)} at time jd.
export function positionElliptic(el, jd, out = {}) {
  const M = (el.ma + el.n * (jd - el.epoch)) * D2R;
  const E = solveKeplerElliptic(M, el.e);
  const xOrb = el.a * (Math.cos(E) - el.e);
  const yOrb = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
  return toEcliptic(xOrb, yOrb, el.w, el.i, el.om, out);
}

// Hyperbolic orbit (e > 1, a < 0), propagated from tp (perihelion epoch).
export function positionHyperbolic(el, jd, out = {}) {
  const a = el.a;
  const n = Math.sqrt(MU / (-a * -a * -a)); // rad/day
  const M = n * (jd - el.tp);
  const H = solveKeplerHyperbolic(M, el.e);
  const xOrb = a * (Math.cosh(H) - el.e); // a < 0
  const yOrb = a * Math.sqrt(el.e * el.e - 1) * Math.sinh(H);
  return toEcliptic(xOrb, yOrb, el.w, el.i, el.om, out);
}

// Parabolic orbit (e == 1, no a), propagated from tp with perihelion q.
export function positionParabolic(el, jd, out = {}) {
  const B = solveBarker(jd - el.tp, el.q);
  const nu = 2 * Math.atan(B);
  const r = el.q * (1 + B * B);
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);
  return toEcliptic(xOrb, yOrb, el.w, el.i, el.om, out);
}

// Generic small-body position dispatch (used for comets).
export function positionBody(el, jd, out = {}) {
  if (el.e >= 1) {
    if (el.a != null && el.a < 0 && el.e > 1) return positionHyperbolic(el, jd, out);
    return positionParabolic({ ...el, q: el.q ?? (el.a != null ? el.a * (1 - el.e) : 1) }, jd, out);
  }
  return positionElliptic(el, jd, out);
}

// Sample an orbit path as ecliptic (three.js) points. For ellipses: full closed
// loop. For hyperbolic/parabolic: an arc around perihelion limited to rMax.
export function sampleOrbitPath(el, segments = 256, rMax = 40) {
  const pts = [];
  if (el.e < 1) {
    for (let k = 0; k <= segments; k++) {
      const E = (k / segments) * 2 * Math.PI;
      const xOrb = el.a * (Math.cos(E) - el.e);
      const yOrb = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
      pts.push(toEcliptic(xOrb, yOrb, el.w, el.i, el.om, {}));
    }
  } else if (el.a != null && el.a < 0 && el.e > 1) {
    const a = el.a;
    // solve e*cosh(H)-1 = rMax/(-a)  ->  cosh(H) = (rMax/(-a) + 1)/e
    const Hmax = Math.acosh(Math.max((rMax / -a + 1) / el.e, 1.0001));
    const Hl = isFinite(Hmax) && Hmax > 0 ? Math.min(Hmax, 12) : 3;
    for (let k = 0; k <= segments; k++) {
      const H = -Hl + (2 * Hl * k) / segments;
      const xOrb = a * (Math.cosh(H) - el.e);
      const yOrb = a * Math.sqrt(el.e * el.e - 1) * Math.sinh(H);
      pts.push(toEcliptic(xOrb, yOrb, el.w, el.i, el.om, {}));
    }
  } else {
    const q = el.q ?? 1;
    const Blim = Math.sqrt(Math.max(rMax / q - 1, 0.01));
    const Bl = Math.min(Blim, 30);
    for (let k = 0; k <= segments; k++) {
      const B = -Bl + (2 * Bl * k) / segments;
      const nu = 2 * Math.atan(B);
      const r = q * (1 + B * B);
      pts.push(toEcliptic(r * Math.cos(nu), r * Math.sin(nu), el.w, el.i, el.om, {}));
    }
  }
  return pts;
}

// ---- time helpers -----------------------------------------------------------

export function jdToDate(jd) {
  // Julian date -> JS Date (UTC)
  return new Date((jd - 2440587.5) * 86400000);
}

export function dateToJd(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

export function formatJd(jd) {
  const d = jdToDate(jd);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getUTCFullYear()}-${months[d.getUTCMonth()]}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export const AU_KM = 149597870.7;
export const LD_AU = 0.002569; // lunar distance in au (~384400 km)
