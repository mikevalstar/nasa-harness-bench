/**
 * Pack orbital datasets into compact binary + sidecar JSON for fast runtime load.
 * Source data/ is never modified; outputs go to public/data/.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(root, "data");
const outDir = join(root, "public", "data");

mkdirSync(outDir, { recursive: true });

const DEG = Math.PI / 180;
const GM_SUN = 0.0002959122082855911; // au^3 / day^2

function readJson(name) {
  return JSON.parse(readFileSync(join(dataDir, name), "utf8"));
}

function packFloat32(arr) {
  return Buffer.from(new Float32Array(arr).buffer);
}

function packUint8(arr) {
  return Buffer.from(Uint8Array.from(arr));
}

function packUint16(arr) {
  return Buffer.from(new Uint16Array(arr).buffer);
}

function packUint32(arr) {
  return Buffer.from(new Uint32Array(arr).buffer);
}

function orbitKind(e) {
  if (e == null || !Number.isFinite(e)) return 0; // elliptic fallback
  if (e < 1) return 0;
  if (Math.abs(e - 1) < 1e-6) return 1; // parabolic
  return 2; // hyperbolic
}

/**
 * Packed asteroid layout (per object, float32 unless noted):
 * a, e, i, om, w, ma, epoch, n, q, H, diameter, moid
 * + uint8: pha, classIndex, hasSentry
 * + uint16: sentryIndex (0xffff = none)
 */
function preprocessAsteroids(asteroids, sentryByDes) {
  const classSet = new Map();
  const classes = [];
  const ensureClass = (c) => {
    const key = c || "UNK";
    if (!classSet.has(key)) {
      classSet.set(key, classes.length);
      classes.push(key);
    }
    return classSet.get(key);
  };

  const meta = [];
  const floats = [];
  const flags = [];
  const sentryIdx = [];

  for (const a of asteroids) {
    const e = a.e ?? 0;
    const aSemi = a.a ?? (a.q != null && e < 1 ? a.q / (1 - e) : 0);
    let n = a.n;
    if ((n == null || !Number.isFinite(n)) && aSemi > 0 && e < 1) {
      n = (Math.sqrt(GM_SUN / (aSemi * aSemi * aSemi)) * 180) / Math.PI;
    }
    n = n ?? 0;

    const des = String(a.pdes ?? "");
    const sentry = sentryByDes.get(des);
    const sIdx = sentry ? sentry.index : 0xffff;

    floats.push(
      aSemi,
      e,
      (a.i ?? 0) * DEG,
      (a.om ?? 0) * DEG,
      (a.w ?? 0) * DEG,
      (a.ma ?? 0) * DEG,
      a.epoch ?? 0,
      n * DEG, // rad/day
      a.q ?? 0,
      a.H ?? NaN,
      a.diameter ?? NaN,
      a.moid ?? NaN,
    );
    flags.push(a.pha ? 1 : 0, ensureClass(a.class), sentry ? 1 : 0);
    sentryIdx.push(sIdx);

    meta.push({
      pdes: des,
      full_name: a.full_name ?? des,
      name: a.name ?? null,
      class: a.class ?? "UNK",
      neo: !!a.neo,
      pha: !!a.pha,
      H: a.H ?? null,
      diameter: a.diameter ?? null,
      albedo: a.albedo ?? null,
      moid: a.moid ?? null,
      rot_per: a.rot_per ?? null,
      spec_B: a.spec_B ?? null,
      spec_T: a.spec_T ?? null,
      first_obs: a.first_obs ?? null,
      a: aSemi,
      e,
      i: a.i ?? null,
      om: a.om ?? null,
      w: a.w ?? null,
      q: a.q ?? null,
      ad: a.ad ?? null,
      per: a.per ?? null,
      n: a.n ?? null,
      epoch: a.epoch ?? null,
      tp: a.tp ?? null,
    });
  }

  const floatBuf = packFloat32(floats);
  const flagBuf = packUint8(flags);
  // Pad so Uint16Array sentry section is 2-byte aligned
  const flagPad = (4 - ((floatBuf.length + flagBuf.length) % 4)) % 4;
  const padBuf = Buffer.alloc(flagPad);
  const sentryBuf = packUint16(sentryIdx);
  const flagOffset = floatBuf.length;
  const sentryOffset = floatBuf.length + flagBuf.length + flagPad;

  writeFileSync(join(outDir, "asteroids.bin"), Buffer.concat([floatBuf, flagBuf, padBuf, sentryBuf]));
  writeFileSync(
    join(outDir, "asteroids.meta.json"),
    JSON.stringify({
      count: asteroids.length,
      floatStride: 12,
      classes,
      byteOffsets: {
        floats: 0,
        flags: flagOffset,
        sentry: sentryOffset,
      },
    }),
  );
  writeFileSync(join(outDir, "asteroids.catalog.json"), JSON.stringify(meta));
  return { count: asteroids.length, classes };
}

function preprocessComets(comets) {
  const meta = [];
  const floats = [];
  const kinds = [];

  for (const c of comets) {
    const e = c.e ?? 0;
    const kind = orbitKind(e);
    const q = c.q ?? 0;
    let aSemi = c.a;
    if (aSemi == null || !Number.isFinite(aSemi)) {
      if (kind === 0 && e < 1) aSemi = q / (1 - e);
      else if (kind === 2) aSemi = q / (e - 1); // positive |a| for hyperbola
      else aSemi = 0;
    } else if (aSemi < 0) {
      aSemi = Math.abs(aSemi);
    }

    let n = c.n;
    if (kind === 0) {
      if ((n == null || !Number.isFinite(n)) && aSemi > 0) {
        n = (Math.sqrt(GM_SUN / (aSemi * aSemi * aSemi)) * 180) / Math.PI;
      }
      n = n ?? 0;
    } else if (kind === 2) {
      // mean motion analog for hyperbola: sqrt(mu / |a|^3) rad/day
      n = aSemi > 0 ? Math.sqrt(GM_SUN / (aSemi * aSemi * aSemi)) : 0;
    } else {
      n = 0;
    }

    floats.push(
      aSemi,
      e,
      (c.i ?? 0) * DEG,
      (c.om ?? 0) * DEG,
      (c.w ?? 0) * DEG,
      (c.ma ?? 0) * DEG,
      c.epoch ?? c.tp ?? 0,
      kind === 0 ? n * DEG : n, // elliptic: convert deg/day→rad/day; hyp already rad/day
      q,
      c.tp ?? 0,
      c.M1 ?? NaN,
      c.diameter ?? NaN,
    );
    kinds.push(kind);

    meta.push({
      pdes: String(c.pdes ?? ""),
      full_name: c.full_name ?? String(c.pdes ?? ""),
      class: c.class ?? "UNK",
      kind,
      a: aSemi || null,
      e,
      i: c.i ?? null,
      om: c.om ?? null,
      w: c.w ?? null,
      q,
      per: c.per ?? null,
      n: c.n ?? null,
      epoch: c.epoch ?? null,
      tp: c.tp ?? null,
      M1: c.M1 ?? null,
      diameter: c.diameter ?? null,
    });
  }

  const floatBuf = packFloat32(floats);
  const kindBuf = packUint8(kinds);
  writeFileSync(join(outDir, "comets.bin"), Buffer.concat([floatBuf, kindBuf]));
  writeFileSync(
    join(outDir, "comets.meta.json"),
    JSON.stringify({
      count: comets.length,
      floatStride: 12,
      byteOffsets: { floats: 0, kinds: floatBuf.length },
    }),
  );
  // kinds is Uint8 — no alignment constraint beyond floats at 0
  writeFileSync(join(outDir, "comets.catalog.json"), JSON.stringify(meta));
  return { count: comets.length };
}

function preprocessSentry(sentry) {
  const byDes = new Map();
  const rows = sentry.map((s, index) => {
    const row = {
      index,
      des: String(s.des ?? ""),
      fullname: s.fullname ?? s.des ?? "",
      ip: s.ip ?? 0,
      ps_cum: s.ps_cum ?? null,
      ps_max: s.ps_max ?? null,
      ts_max: s.ts_max ?? 0,
      range: s.range ?? "",
      n_imp: s.n_imp ?? 0,
      diameter: s.diameter ?? null,
      h: s.h ?? null,
      v_inf: s.v_inf ?? null,
      last_obs: s.last_obs ?? null,
    };
    byDes.set(row.des, row);
    return row;
  });
  writeFileSync(join(outDir, "sentry.json"), JSON.stringify(rows));
  return byDes;
}

function preprocessApproaches(approaches) {
  // Group by designation; keep sorted by jd. Cap per-object history for UI.
  const byDes = new Map();
  for (const a of approaches) {
    const des = String(a.des ?? "");
    if (!byDes.has(des)) byDes.set(des, []);
    byDes.get(des).push({
      jd: a.jd,
      cd: a.cd,
      dist: a.dist,
      dist_min: a.dist_min,
      dist_max: a.dist_max,
      v_rel: a.v_rel,
      v_inf: a.v_inf,
      h: a.h,
    });
  }
  for (const list of byDes.values()) {
    list.sort((x, y) => x.jd - y.jd);
  }

  // Compact upcoming index: next approaches after a reference epoch for highlights
  const REF_JD = 2461200.5; // ~2026-06 matching asteroid epoch
  const upcoming = [];
  for (const [des, list] of byDes) {
    for (const ev of list) {
      if (ev.jd >= REF_JD - 30 && ev.jd <= REF_JD + 365 * 5 && ev.dist <= 0.05) {
        upcoming.push({ des, ...ev });
      }
    }
  }
  upcoming.sort((a, b) => a.jd - b.jd);

  writeFileSync(join(outDir, "approaches-by-des.json"), JSON.stringify(Object.fromEntries(byDes)));
  writeFileSync(join(outDir, "approaches-upcoming.json"), JSON.stringify(upcoming));
  return { total: approaches.length, objects: byDes.size, upcoming: upcoming.length };
}

function main() {
  console.log("Preprocessing orbital data…");
  const planets = readJson("planets.json");
  const asteroids = readJson("asteroids.json");
  const comets = readJson("comets.json");
  const sentry = readJson("sentry.json");
  const approaches = readJson("close-approaches.json");
  const provenance = readJson("provenance.json");

  // Planets: convert angles to radians in a runtime-friendly copy
  const planetsOut = planets.map((p) => ({
    name: p.name,
    a: p.a,
    e: p.e,
    i: p.i * DEG,
    om: p.om * DEG,
    w: p.w * DEG,
    ma: p.ma * DEG,
    epoch: p.epoch,
    n: p.n * DEG, // rad/day
    per: p.per,
    radius_km: p.radius_km,
  }));
  writeFileSync(join(outDir, "planets.json"), JSON.stringify(planetsOut));

  const sentryByDes = preprocessSentry(sentry);
  const ast = preprocessAsteroids(asteroids, sentryByDes);
  const com = preprocessComets(comets);
  const app = preprocessApproaches(approaches);

  writeFileSync(join(outDir, "provenance.json"), JSON.stringify(provenance));
  writeFileSync(
    join(outDir, "manifest.json"),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      asteroids: ast.count,
      comets: com.count,
      sentry: sentry.length,
      approaches: app,
      classes: ast.classes,
      sunRadiusKm: 696000,
      auKm: 149597870.7,
    }),
  );

  console.log(
    `Done: ${ast.count} asteroids, ${com.count} comets, ${sentry.length} sentry, ${app.total} approaches → public/data/`,
  );
}

main();
