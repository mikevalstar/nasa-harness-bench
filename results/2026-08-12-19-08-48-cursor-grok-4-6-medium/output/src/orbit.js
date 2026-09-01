const DEG = Math.PI / 180;
const K = 0.01720209895; // Gaussian gravitational constant, au^(3/2) / day

export function wrapPi(a) {
  const t = a % (Math.PI * 2);
  if (t > Math.PI) return t - Math.PI * 2;
  if (t < -Math.PI) return t + Math.PI * 2;
  return t;
}

function keplerE(M, e) {
  M = wrapPi(M);
  let E = e < 0.8 ? M : Math.PI * Math.sign(M || 1);
  for (let n = 0; n < 20; n++) {
    const s = Math.sin(E);
    const c = Math.cos(E);
    const d = (E - e * s - M) / (1 - e * c);
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return E;
}

function keplerF(M, e) {
  let F = Math.sign(M || 1) * Math.log((2 * Math.abs(M)) / e + 1.8);
  for (let n = 0; n < 25; n++) {
    const sh = Math.sinh(F);
    const ch = Math.cosh(F);
    const d = (e * sh - F - M) / (e * ch - 1);
    F -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return F;
}

function rotatePerifocal(x, y, i, om, w, out, oi) {
  const cw = Math.cos(w);
  const sw = Math.sin(w);
  const ci = Math.cos(i);
  const si = Math.sin(i);
  const co = Math.cos(om);
  const so = Math.sin(om);
  const px = cw * x - sw * y;
  const py = sw * x + cw * y;
  out[oi] = co * px - so * ci * py;
  out[oi + 1] = so * px + co * ci * py;
  out[oi + 2] = si * py;
}

function meanMotion(a, nDeg) {
  if (nDeg && nDeg > 0) return nDeg * DEG;
  const aa = Math.abs(a);
  if (aa < 1e-8) return 0;
  return K / Math.pow(aa, 1.5);
}

/** Elliptical / circular from mean anomaly at epoch. */
function elliptic(a, e, i, om, w, maDeg, epoch, nDeg, jd, out, oi) {
  const n = meanMotion(a, nDeg);
  const M = maDeg * DEG + n * (jd - epoch);
  const E = keplerE(M, Math.min(e, 0.999999));
  const cE = Math.cos(E);
  const sE = Math.sin(E);
  const r = a * (1 - e * cE);
  const xv = cE - e;
  const yv = Math.sqrt(Math.max(0, 1 - e * e)) * sE;
  const nu = Math.atan2(yv, xv);
  rotatePerifocal(r * Math.cos(nu), r * Math.sin(nu), i, om, w, out, oi);
}

function hyperbolic(q, e, i, om, w, tp, aIn, nDeg, jd, out, oi) {
  const a = aIn > 0 ? aIn : q / Math.max(e - 1, 1e-8);
  const n = meanMotion(a, nDeg);
  const M = n * (jd - tp);
  const F = keplerF(M, e);
  const r = a * (e * Math.cosh(F) - 1);
  const nu = 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(F / 2));
  rotatePerifocal(r * Math.cos(nu), r * Math.sin(nu), i, om, w, out, oi);
}

function parabolic(q, i, om, w, tp, jd, out, oi) {
  const dt = jd - tp;
  const ww = (K / Math.sqrt(2 * q * q * q)) * dt;
  let D = Math.cbrt(ww + Math.sqrt(ww * ww + 1));
  D = D - 1 / D;
  for (let n = 0; n < 8; n++) {
    const f = D * D * D + 3 * D - 3 * ww;
    const df = 3 * D * D + 3;
    D -= f / df;
  }
  const r = q * (1 + D * D);
  const nu = 2 * Math.atan(D);
  rotatePerifocal(r * Math.cos(nu), r * Math.sin(nu), i, om, w, out, oi);
}

/**
 * Asteroid packed layout: a, e, i, om, w, ma, epoch, n  (degrees / au / days)
 * Writes xyz in au into out[oi..oi+2]. Y is ecliptic z so Three.js Y is up.
 */
export function propagateAsteroid(orb, i, jd, out, oi) {
  const b = i * 8;
  const a = orb[b];
  const e = orb[b + 1];
  const inc = orb[b + 2] * DEG;
  const om = orb[b + 3] * DEG;
  const w = orb[b + 4] * DEG;
  elliptic(a, e, inc, om, w, orb[b + 5], orb[b + 6], orb[b + 7], jd, out, oi);
  const z = out[oi + 2];
  out[oi + 2] = -out[oi + 1];
  out[oi + 1] = z;
}

/** Comet packed: a, e, i, om, w, ma, epoch, n, q, tp */
export function propagateComet(orb, i, jd, out, oi) {
  const b = i * 10;
  const a = orb[b];
  const e = orb[b + 1];
  const inc = orb[b + 2] * DEG;
  const om = orb[b + 3] * DEG;
  const w = orb[b + 4] * DEG;
  const q = orb[b + 8];
  const tp = orb[b + 9];
  if (e < 0.995 && a > 0) {
    elliptic(a, e, inc, om, w, orb[b + 5], orb[b + 6], orb[b + 7], jd, out, oi);
  } else if (e < 1.000001) {
    parabolic(q > 0 ? q : Math.abs(a) * (1 - e), inc, om, w, tp, jd, out, oi);
  } else {
    hyperbolic(q, e, inc, om, w, tp, a, orb[b + 7], jd, out, oi);
  }
  const z = out[oi + 2];
  out[oi + 2] = -out[oi + 1];
  out[oi + 1] = z;
}

export function propagateElements(el, jd, out, oi = 0) {
  const a = el.a;
  const e = el.e ?? 0;
  const inc = (el.i ?? 0) * DEG;
  const om = (el.om ?? 0) * DEG;
  const w = (el.w ?? 0) * DEG;
  if (e < 0.995 && a > 0) {
    elliptic(a, e, inc, om, w, el.ma ?? 0, el.epoch, el.n ?? 0, jd, out, oi);
  } else if (e < 1.000001) {
    parabolic(el.q ?? a * (1 - e), inc, om, w, el.tp, jd, out, oi);
  } else {
    hyperbolic(el.q ?? 0, e, inc, om, w, el.tp, a ?? 0, el.n ?? 0, jd, out, oi);
  }
  const z = out[oi + 2];
  out[oi + 2] = -out[oi + 1];
  out[oi + 1] = z;
}

export function sampleOrbit(el, samples = 180) {
  const pts = [];
  const tmp = [0, 0, 0];
  const e = el.e ?? 0;
  if (e < 0.995 && el.a > 0) {
    const period = el.per || (el.n ? 360 / el.n : 365.25 * Math.pow(el.a, 1.5));
    const t0 = el.epoch ?? 2451545;
    for (let i = 0; i <= samples; i++) {
      propagateElements(el, t0 + (period * i) / samples, tmp, 0);
      pts.push(tmp[0], tmp[1], tmp[2]);
    }
  } else {
    const tp = el.tp ?? el.epoch;
    const span = e >= 1 ? 4000 : el.per || 20000;
    for (let i = 0; i <= samples; i++) {
      propagateElements(el, tp + span * (i / samples - 0.5), tmp, 0);
      if (Number.isFinite(tmp[0]) && Math.hypot(tmp[0], tmp[1], tmp[2]) < 200) {
        pts.push(tmp[0], tmp[1], tmp[2]);
      }
    }
  }
  return pts;
}

export function asteroidElements(orb, i) {
  const b = i * 8;
  return {
    a: orb[b],
    e: orb[b + 1],
    i: orb[b + 2],
    om: orb[b + 3],
    w: orb[b + 4],
    ma: orb[b + 5],
    epoch: orb[b + 6],
    n: orb[b + 7],
    per: orb[b + 7] > 0 ? 360 / orb[b + 7] : undefined,
  };
}

export function cometElements(orb, i) {
  const b = i * 10;
  return {
    a: orb[b] || undefined,
    e: orb[b + 1],
    i: orb[b + 2],
    om: orb[b + 3],
    w: orb[b + 4],
    ma: orb[b + 5],
    epoch: orb[b + 6],
    n: orb[b + 7] || undefined,
    q: orb[b + 8],
    tp: orb[b + 9],
    per: orb[b + 7] > 0 ? 360 / orb[b + 7] : undefined,
  };
}
