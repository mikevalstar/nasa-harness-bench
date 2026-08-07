const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI
const K = 0.01720209895
const MU = K * K // AU^3 / day^2

export function jdFromDate(d) {
  return d.getTime() / 86400000 + 2440587.5
}
export function dateFromJd(jd) {
  return new Date((jd - 2440587.5) * 86400000)
}

function normalizeAngleDeg(a) {
  a = a % 360
  if (a < 0) a += 360
  return a
}

function solveKeplerElliptic(M, e) {
  // M in radians [0, 2pi)
  let E = M
  if (e > 0.8) E = Math.PI
  for (let i = 0; i < 30; i++) {
    const f = E - e * Math.sin(E) - M
    const fp = 1 - e * Math.cos(E)
    const d = f / fp
    E -= d
    if (Math.abs(d) < 1e-12) break
  }
  return E
}
function solveKeplerHyperbolic(Mh, e) {
  // Mh = e sinh H - H
  let H = Math.asinh(Mh / e)
  // refine
  for (let i = 0; i < 30; i++) {
    const f = e * Math.sinh(H) - H - Mh
    const fp = e * Math.cosh(H) - 1
    const d = f / fp
    H -= d
    if (Math.abs(d) < 1e-12) break
  }
  return H
}

export function propagateElliptic(el, jd) {
  // el needs a,e,i,om,w,ma,epoch,n (or per)
  const a = el.a
  const e = el.e
  let n = el.n
  if ((n == null || isNaN(n)) && el.per) n = 360 / el.per
  if (n == null || isNaN(n)) {
    if (a && a > 0) n = Math.sqrt(MU / (a * a * a)) * RAD2DEG
    else n = 0
  }
  const Mdeg = normalizeAngleDeg(el.ma + n * (jd - el.epoch))
  const M = Mdeg * DEG2RAD
  const E = solveKeplerElliptic(M, e)
  const cosE = Math.cos(E)
  const sinE = Math.sin(E)
  const r = a * (1 - e * cosE)
  // true anomaly
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * sinE / (1 + 0 ? 1 : 1), Math.sqrt(1 - e) * (1 + cosE) / 2)
  // more stable: use atan2
  const nu2 = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2))
  // perifocal
  const cosNu = Math.cos(nu2)
  const sinNu = Math.sin(nu2)
  const xP = r * cosNu
  const yP = r * sinNu
  return perifocalToEcliptic(xP, yP, el)
}

function perifocalToEcliptic(xP, yP, el) {
  const om = (el.om || 0) * DEG2RAD
  const inc = (el.i || 0) * DEG2RAD
  const w = (el.w || 0) * DEG2RAD
  const cosO = Math.cos(om), sinO = Math.sin(om)
  const cosI = Math.cos(inc), sinI = Math.sin(inc)
  const cosW = Math.cos(w), sinW = Math.sin(w)
  // rotation matrix R = Rz(om) * Rx(i) * Rz(w)
  const x = (cosO * cosW - sinO * sinW * cosI) * xP + (-cosO * sinW - sinO * cosW * cosI) * yP
  const y = (sinO * cosW + cosO * sinW * cosI) * xP + (-sinO * sinW + cosO * cosW * cosI) * yP
  const z = (sinW * sinI) * xP + (cosW * sinI) * yP
  const r = Math.sqrt(x * x + y * y + z * z)
  return { x, y, z, r }
}

export function propagateComet(el, jd) {
  const e = el.e
  const i = el.i || 0
  const om = el.om || 0
  const w = el.w || 0
  const q = el.q
  // hyperbolic / parabolic use tp
  if (e == null) return { x: 0, y: 0, z: 0, r: 0 }
  if (e < 1 - 1e-6) {
    return propagateElliptic(el, jd)
  }
  const tp = el.tp
  if (tp == null) return { x: 0, y: 0, z: 0, r: 0 }
  const dt = jd - tp
  let r, nu
  if (Math.abs(e - 1) < 1e-6) {
    // parabolic Barker
    const W = Math.sqrt(MU / (2 * q * q * q)) * dt
    // solve D^3/3 + D - W =0
    // Cardano or Newton
    let D = Math.cbrt(3 * W) // initial
    // Newton
    for (let k = 0; k < 30; k++) {
      const f = D * D * D / 3 + D - W
      const fp = D * D + 1
      const d = f / fp
      D -= d
      if (Math.abs(d) < 1e-12) break
    }
    nu = 2 * Math.atan(D)
    r = q * (1 + D * D)
  } else if (e > 1) {
    const absA = q / (e - 1)
    const n_h = Math.sqrt(MU / (absA * absA * absA)) // rad/day
    const Mh = n_h * dt
    const H = solveKeplerHyperbolic(Mh, e)
    r = absA * (e * Math.cosh(H) - 1)
    // true anomaly
    nu = 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(H / 2))
    // for large H, tanh->1
  } else {
    // near-parabolic elliptic fallback
    return propagateElliptic(el, jd)
  }
  const xP = r * Math.cos(nu)
  const yP = r * Math.sin(nu)
  return perifocalToEcliptic(xP, yP, { i, om, w })
}

export function computePosition(el, jd) {
  // dispatch
  if (el.e != null && el.e >= 0.9999 && el.tp != null && (el.e >= 1 || el.a == null)) {
    // treat as comet special
    return propagateComet(el, jd)
  }
  if (el.e != null && el.e >= 1) return propagateComet(el, jd)
  return propagateElliptic(el, jd)
}

export function sampleOrbit(el, count = 128) {
  const pts = []
  if (el.e < 1) {
    for (let k = 0; k < count; k++) {
      const Mdeg = (k / count) * 360
      // construct temporary el with ma = Mdeg and jd=epoch
      const tmp = { ...el, ma: Mdeg, epoch: 0 }
      // propagate with jd=0 => M=Mdeg
      // we can directly compute E from Mdeg
      const M = Mdeg * DEG2RAD
      const E = solveKeplerElliptic(M, el.e)
      const r = el.a * (1 - el.e * Math.cos(E))
      const nu = 2 * Math.atan2(Math.sqrt(1 + el.e) * Math.sin(E / 2), Math.sqrt(1 - el.e) * Math.cos(E / 2))
      const xP = r * Math.cos(nu)
      const yP = r * Math.sin(nu)
      const p = perifocalToEcliptic(xP, yP, el)
      pts.push(p)
    }
  } else {
    // hyperbolic/parabolic: sample around tp +/- window
    // window depends on q, choose +- 800 days for small q, longer for large
    const q = el.q || 1
    const windowDays = Math.min(2000, Math.max(400, 500 * Math.sqrt(q)))
    const tp = el.tp || el.epoch
    for (let k = 0; k < count; k++) {
      const t = tp - windowDays + (2 * windowDays * k) / (count - 1)
      const p = propagateComet(el, t)
      // filter far away (>50 AU)
      if (p.r < 60) pts.push(p)
    }
  }
  return pts
}
