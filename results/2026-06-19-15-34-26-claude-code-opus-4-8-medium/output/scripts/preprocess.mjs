// Build-time preprocessing.
//
// Reads the read-only JSON in ../data and emits a compact, runtime-friendly
// copy into ../public/data (which Vite copies verbatim into dist/). The heavy
// orbital data is packed into Float32 binary blobs so the GPU can propagate
// ~42k Kepler orbits per frame; lightweight display/search/filter fields stay
// as trimmed JSON.
//
// Propagation convention (used identically on the GPU): every body is advanced
// from its time of perihelion passage `tp`. For an elliptic orbit the mean
// anomaly at time t (Julian date) is M = n * (t - tp), with mean motion
// n = k * a^-1.5 (k = Gaussian gravitational constant). This was verified to
// reproduce the dataset's own `ma` at `epoch` for asteroids and comets.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA = join(ROOT, "data");
const OUT = join(ROOT, "public", "data");

const K = 0.01720209895; // Gaussian gravitational constant (rad/day, au)
const DEG = Math.PI / 180;
const REF_EPOCH = 2451545.0; // J2000, offsets keep numbers small for Float32

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const readJSON = (f) => JSON.parse(readFileSync(join(DATA, f), "utf8"));
const round = (x, d = 4) =>
  x == null || !isFinite(x) ? null : Number(x.toFixed(d));

console.log("[preprocess] reading data/...");
const asteroids = readJSON("asteroids.json");
const comets = readJSON("comets.json");
const planets = readJSON("planets.json");
const sentry = readJSON("sentry.json");
const approaches = readJSON("close-approaches.json");

// ---- Sentry set (for the hasSentry flag) ----------------------------------
const sentryByDes = new Map();
for (const s of sentry) sentryByDes.set(String(s.des), s);

// ---- Orbit-element packing -------------------------------------------------
// Two Float32 attribute blocks per body:
//   A = (a, e, i_rad, om_rad)
//   B = (w_rad, n_rad_per_day, q_au, tpOff)         tpOff = tp - REF_EPOCH
// plus a small per-body extras block:
//   E = (sizeKey, flags)   flags bits: 1=pha 2=sentry 4=comet
//
// For e>=1 (hyperbolic/parabolic) `a` may be negative or undefined; the GPU
// branches on e and uses q + tpOff (and n as hyperbolic mean motion) instead.

function packBody(o, isComet) {
  const e = o.e;
  if (e == null || o.q == null || o.tp == null) return null; // unusable
  if (!(o.i != null && o.om != null && o.w != null)) return null;

  let a, n;
  if (e < 1) {
    a = o.a != null ? o.a : o.q / (1 - e);
    if (!(a > 0)) return null;
    n = K / Math.pow(a, 1.5);
  } else if (e > 1) {
    a = o.q / (1 - e); // negative
    n = K / Math.pow(Math.abs(a), 1.5); // hyperbolic mean motion
  } else {
    a = 0; // parabolic: handled via q in the shader (Barker's equation)
    n = 0;
  }

  return {
    A: [a, e, o.i * DEG, o.om * DEG],
    B: [o.w * DEG, n, o.q, o.tp - REF_EPOCH],
  };
}

function buildSet(list, isComet) {
  const A = [];
  const B = [];
  const E = [];
  const meta = [];
  let kept = 0;
  for (const o of list) {
    const p = packBody(o, isComet);
    if (!p) continue;
    const des = String(o.pdes ?? "");
    const hasSentry = sentryByDes.has(des);
    const pha = !!o.pha;
    let flags = 0;
    if (pha) flags |= 1;
    if (hasSentry) flags |= 2;
    if (isComet) flags |= 4;

    // sizeKey: absolute magnitude (H for asteroids, M1 for comets); smaller =
    // intrinsically larger/brighter. Fall back to a dim default.
    const sizeKey = isComet
      ? o.M1 ?? o.H ?? 12
      : o.H ?? 22;

    A.push(p.A[0], p.A[1], p.A[2], p.A[3]);
    B.push(p.B[0], p.B[1], p.B[2], p.B[3]);
    E.push(sizeKey, flags);

    meta.push(
      isComet
        ? {
            i: kept,
            n: o.full_name ?? o.pdes,
            d: des,
            c: o.class,
            a: round(o.a),
            e: round(o.e, 5),
            inc: round(o.i, 3),
            q: round(o.q, 4),
            per: round(o.per, 1),
            tp: o.tp,
            M1: round(o.M1, 2),
            dia: round(o.diameter, 3),
            comet: 1,
          }
        : {
            i: kept,
            n: o.full_name ?? o.pdes,
            nm: o.name ?? null,
            d: des,
            c: o.class,
            pha: pha ? 1 : 0,
            neo: o.neo ? 1 : 0,
            a: round(o.a),
            e: round(o.e, 5),
            inc: round(o.i, 3),
            om: round(o.om, 3),
            w: round(o.w, 3),
            q: round(o.q, 4),
            ad: round(o.ad, 4),
            per: round(o.per, 1),
            tp: o.tp,
            moid: round(o.moid, 5),
            H: round(o.H, 2),
            dia: round(o.diameter, 3),
            alb: round(o.albedo, 3),
            rot: round(o.rot_per, 3),
            spec: o.spec_B ?? o.spec_T ?? null,
            obs: o.first_obs ?? null,
            sentry: hasSentry ? 1 : 0,
          }
    );
    kept++;
  }
  return {
    A: new Float32Array(A),
    B: new Float32Array(B),
    E: new Float32Array(E),
    meta,
    count: kept,
  };
}

function writeSet(name, set) {
  writeFileSync(join(OUT, `${name}.A.bin`), Buffer.from(set.A.buffer));
  writeFileSync(join(OUT, `${name}.B.bin`), Buffer.from(set.B.buffer));
  writeFileSync(join(OUT, `${name}.E.bin`), Buffer.from(set.E.buffer));
  writeFileSync(join(OUT, `${name}.meta.json`), JSON.stringify(set.meta));
  console.log(
    `[preprocess] ${name}: ${set.count} bodies, ` +
      `${((set.A.byteLength + set.B.byteLength + set.E.byteLength) / 1e6).toFixed(1)}MB binary`
  );
}

console.log("[preprocess] packing asteroids...");
const astSet = buildSet(asteroids, false);
writeSet("asteroids", astSet);

console.log("[preprocess] packing comets...");
const cometSet = buildSet(comets, true);
writeSet("comets", cometSet);

// ---- Planets (small; computed on the CPU at runtime) ----------------------
const planetsOut = planets.map((p) => ({
  name: p.name,
  a: p.a,
  e: p.e,
  i: p.i,
  om: p.om,
  w: p.w,
  ma: p.ma,
  n: p.n, // deg/day, from dataset
  per: p.per,
  epoch: p.epoch,
  radius_km: p.radius_km,
}));
writeFileSync(join(OUT, "planets.json"), JSON.stringify(planetsOut));
console.log(`[preprocess] planets: ${planetsOut.length}`);

// ---- Sentry (trimmed) ------------------------------------------------------
const sentryOut = sentry.map((s) => ({
  des: String(s.des),
  name: s.fullname,
  ip: s.ip,
  ps_cum: s.ps_cum,
  ps_max: s.ps_max,
  ts_max: s.ts_max,
  range: s.range,
  n_imp: s.n_imp,
  dia: s.diameter,
  h: s.h,
  v_inf: s.v_inf,
  last_obs: s.last_obs,
}));
writeFileSync(join(OUT, "sentry.json"), JSON.stringify(sentryOut));
console.log(`[preprocess] sentry: ${sentryOut.length}`);

// ---- Close approaches (trimmed, lazy-loaded at runtime) -------------------
const caOut = approaches.map((c) => ({
  des: String(c.des),
  cd: c.cd,
  jd: c.jd,
  dist: round(c.dist, 6),
  dmin: round(c.dist_min, 6),
  v: round(c.v_rel, 3),
  h: round(c.h, 2),
}));
writeFileSync(join(OUT, "close-approaches.json"), JSON.stringify(caOut));
console.log(`[preprocess] close-approaches: ${caOut.length}`);

// ---- Manifest --------------------------------------------------------------
const classCounts = {};
for (const m of astSet.meta) classCounts[m.c] = (classCounts[m.c] || 0) + 1;
writeFileSync(
  join(OUT, "manifest.json"),
  JSON.stringify({
    refEpoch: REF_EPOCH,
    k: K,
    asteroids: astSet.count,
    comets: cometSet.count,
    classes: classCounts,
    generated: "build-time",
  })
);

console.log("[preprocess] done.");
