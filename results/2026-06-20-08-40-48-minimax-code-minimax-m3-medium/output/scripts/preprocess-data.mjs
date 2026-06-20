#!/usr/bin/env node
/**
 * Preprocess raw data into compact binary + indexed JSON for fast browser load
 * and GPU-friendly orbital rendering.
 *
 * Outputs in dist/data/ (alongside the copied raw JSON):
 *   asteroids.bin   — Float32 orbital basis + elements for every asteroid
 *   asteroids.idx.json — name table, filters, per-record string metadata
 *   comets.bin       — same for comets
 *   comets.idx.json  — name table, classification
 *   close-approaches.json — sorted by designation (binary-search friendly)
 *
 * This runs after `copy-data.mjs` and before Vite bundles. The Vite build
 * doesn't include it; the runtime fetches these files directly.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dataDir = resolve(root, "dist", "data");

if (!existsSync(dataDir)) {
  console.error(`[preprocess] dist/data missing — run copy-data first`);
  process.exit(1);
}

// ---------- helpers ----------
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// 3x3 rotation matrix multiply (row-major). M = A * B.
function mul3(A, B) {
  const r = new Float64Array(9);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += A[i * 3 + k] * B[k * 3 + j];
      r[i * 3 + j] = s;
    }
  }
  return r;
}

// Rotate around axis-X by angle a (radians), returns 3x3.
function rotX(a) {
  const c = Math.cos(a),
    s = Math.sin(a);
  return new Float64Array([1, 0, 0, 0, c, -s, 0, s, c]);
}
// Rotate around axis-Y by angle a (radians).
function rotY(a) {
  const c = Math.cos(a),
    s = Math.sin(a);
  return new Float64Array([c, 0, s, 0, 1, 0, -s, 0, c]);
}
// Rotate around axis-Z by angle a (radians).
function rotZ(a) {
  const c = Math.cos(a),
    s = Math.sin(a);
  return new Float64Array([c, -s, 0, s, c, 0, 0, 0, 1]);
}

/**
 * Given orbital elements, produce 3 unit vectors in the heliocentric
 * ecliptic J2000 frame:
 *   ex — toward perihelion (in orbital plane)
 *   ey — 90° ahead in orbit (in orbital plane)
 *   ez — orbital plane normal
 *
 * Convention: x toward vernal equinox, z toward north ecliptic pole.
 * Using rotation sequence: rotate by Ω about z, then by i about x, then by ω about z.
 * (Standard for J2000 ecliptic elements per NASA/JPL convention.)
 */
function orbitalBasis(omDeg, wDeg, iDeg) {
  const R = mul3(rotZ(omDeg * DEG), mul3(rotX(iDeg * DEG), rotZ(wDeg * DEG)));
  // Columns of R are basis vectors in heliocentric frame.
  // R = [ex | ey | ez]
  const ex = [R[0], R[1], R[2]];
  const ey = [R[3], R[4], R[5]];
  const ez = [R[6], R[7], R[8]];
  return { ex, ey, ez };
}

function packStringTable(strings) {
  // Concatenate UTF-8 bytes of every string into a single Uint8Array, with
  // an offset table marking the start of each entry. We don't need a
  // per-string length prefix because offsets[i+1] - offsets[i] gives the
  // length.
  let total = 0;
  const enc = strings.map((s) => {
    const buf = new TextEncoder().encode(s ?? "");
    total += buf.length;
    return buf;
  });
  const out = new Uint8Array(total);
  const offsets = new Uint32Array(strings.length + 1);
  let off = 0;
  for (let i = 0; i < enc.length; i++) {
    offsets[i] = off;
    out.set(enc[i], off);
    off += enc[i].length;
  }
  offsets[enc.length] = off;
  return { bytes: out, offsets };
}

function writeBinaryFloat32(path, ...arrays) {
  // Concatenate Float32 arrays, optionally with Uint8 at end.
  let total = 0;
  for (const a of arrays) total += a.byteLength;
  const buf = new ArrayBuffer(total);
  const view = new Uint8Array(buf);
  let off = 0;
  for (const a of arrays) {
    view.set(new Uint8Array(a.buffer, a.byteOffset, a.byteLength), off);
    off += a.byteLength;
  }
  writeFileSync(path, Buffer.from(buf));
}

// ---------- asteroid preprocessing ----------
function preprocessAsteroids() {
  console.log("[preprocess] asteroids: reading…");
  const t0 = Date.now();
  const raw = JSON.parse(readFileSync(resolve(dataDir, "asteroids.json"), "utf8"));
  const N = raw.length;
  console.log(`[preprocess] asteroids: ${N} records (${Date.now() - t0}ms)`);

  // Per-asteroid float arrays (Float32):
  //   per record (30 floats):
  //     0..2  ex (heliocentric)
  //     3..5  ey
  //     6..8  ez
  //     9     a (au)
  //     10    e
  //     11    ma at epoch (deg)
  //     12    mean motion (deg/day)
  //     13    epoch (JD)
  //     14    q perihelion (au)
  //     15    ad aphelion (au)
  //     16    period (days)
  //     17    moid (au)
  //     18    H (abs magnitude)
  //     19    diameter (km) — 0 if unknown
  //     20    albedo (0 if unknown)
  //     21    incl (deg, kept for re-projection fallback)
  //     22..24  color rgb (precomputed)
  //     25    flags: bit0=neo, bit1=pha, bit2=sentry, bit3=hasDiameter
  //     26    class code (uint8 packed)
  //     27    spkid (uint32-as-float, since uniform packing is float32)
  //     28    rot_per (hours)
  //     29    reserved

  const STRIDE = 30;
  const data = new Float32Array(N * STRIDE);
  const fullNames = new Array(N);
  const pdeses = new Array(N);
  const names = new Array(N);
  const spkids = new Uint32Array(N);
  const sentrySet = new Set();

  // Sentry designations (joined later).
  let sentryRaw = null;
  const sentryPath = resolve(dataDir, "sentry.json");
  if (existsSync(sentryPath)) {
    sentryRaw = JSON.parse(readFileSync(sentryPath, "utf8"));
    for (const s of sentryRaw) if (s.des) sentrySet.add(s.des);
  }
  const sentryMap = new Map();
  if (sentryRaw) for (const s of sentryRaw) sentryMap.set(s.des, s);

  let minD = Infinity,
    maxD = -Infinity,
    diamCount = 0,
    phaCount = 0,
    sentryCount = 0;

  for (let i = 0; i < N; i++) {
    const r = raw[i];
    const a = r.a ?? 0;
    const e = r.e ?? 0;
    const iDeg = r.i ?? 0;
    const omDeg = r.om ?? 0;
    const wDeg = r.w ?? 0;
    const ma = r.ma ?? 0;
    const epoch = r.epoch ?? 0;
    const n = r.n ?? 0;
    const q = r.q ?? 0;
    const ad = r.ad ?? 0;
    const per = r.per ?? 0;
    const moid = r.moid ?? 0;
    const H = r.H ?? 0;
    const diameter = r.diameter ?? 0;
    const albedo = r.albedo ?? 0;
    const rotPer = r.rot_per ?? 0;

    let ex, ey, ez;
    try {
      const b = orbitalBasis(omDeg, wDeg, iDeg);
      ex = b.ex;
      ey = b.ey;
      ez = b.ez;
    } catch (err) {
      ex = [1, 0, 0];
      ey = [0, 1, 0];
      ez = [0, 0, 1];
    }

    const base = i * STRIDE;
    data[base + 0] = ex[0];
    data[base + 1] = ex[1];
    data[base + 2] = ex[2];
    data[base + 3] = ey[0];
    data[base + 4] = ey[1];
    data[base + 5] = ey[2];
    data[base + 6] = ez[0];
    data[base + 7] = ez[1];
    data[base + 8] = ez[2];
    data[base + 9] = a;
    data[base + 10] = e;
    data[base + 11] = ma;
    data[base + 12] = n;
    data[base + 13] = epoch;
    data[base + 14] = q;
    data[base + 15] = ad;
    data[base + 16] = per;
    data[base + 17] = moid;
    data[base + 18] = H;
    data[base + 19] = diameter;
    data[base + 20] = albedo;
    data[base + 21] = iDeg;
    // color — pre-assigned by class for stable lookup
    const cls = r.class ?? "";
    let r0 = 0.55,
      g0 = 0.7,
      b0 = 1.0;
    if (cls === "AMO") {
      r0 = 0.55;
      g0 = 0.7;
      b0 = 1.0;
    } else if (cls === "APO") {
      r0 = 1.0;
      g0 = 0.7;
      b0 = 0.4;
    } else if (cls === "ATE") {
      r0 = 1.0;
      g0 = 0.5;
      b0 = 0.7;
    } else if (cls === "IEO") {
      r0 = 0.9;
      g0 = 0.4;
      b0 = 0.9;
    }
    if (r.pha) {
      r0 = 1.0;
      g0 = 0.35;
      b0 = 0.35;
      phaCount++;
    }
    const isSentry = r.pdes && sentrySet.has(r.pdes);
    if (isSentry) sentryCount++;
    data[base + 22] = r0;
    data[base + 23] = g0;
    data[base + 24] = b0;

    let flags = 0;
    if (r.neo) flags |= 1;
    if (r.pha) flags |= 2;
    if (isSentry) flags |= 4;
    if (diameter > 0) {
      flags |= 8;
      if (diameter < minD) minD = diameter;
      if (diameter > maxD) maxD = diameter;
      diamCount++;
    }
    data[base + 25] = flags;

    let classCode = 0;
    if (cls === "AMO") classCode = 1;
    else if (cls === "APO") classCode = 2;
    else if (cls === "ATE") classCode = 3;
    else if (cls === "IEO") classCode = 4;
    data[base + 26] = classCode;

    data[base + 27] = r.spkid ?? 0;
    data[base + 28] = rotPer;
    data[base + 29] = 0;

    fullNames[i] = r.full_name ?? r.pdes ?? `asteroid ${i}`;
    pdeses[i] = r.pdes ?? "";
    names[i] = r.name ?? "";
    spkids[i] = r.spkid ?? 0;
  }

  console.log(
    `[preprocess] asteroids: PHAs=${phaCount}, sentry=${sentryCount}, with-diameter=${diamCount} (range ${minD.toFixed(
      2,
    )} – ${maxD.toFixed(2)} km)`,
  );

  // Pack strings.
  const fullPack = packStringTable(fullNames);
  const pdesPack = packStringTable(pdeses);
  const namePack = packStringTable(names);

  // Combined string blob: full + pdes + name, with offsets header.
  const headerSize = 12; // 3 x uint32 (start offsets)
  const combined = new Uint8Array(
    headerSize + fullPack.bytes.length + pdesPack.bytes.length + namePack.bytes.length,
  );
  const dv = new DataView(combined.buffer);
  let off = 0;
  dv.setUint32(off, headerSize, true);
  off += 4;
  dv.setUint32(off, headerSize + fullPack.bytes.length, true);
  off += 4;
  dv.setUint32(off, headerSize + fullPack.bytes.length + pdesPack.bytes.length, true);
  off += 4;
  combined.set(fullPack.bytes, headerSize);
  combined.set(pdesPack.bytes, headerSize + fullPack.bytes.length);
  combined.set(namePack.bytes, headerSize + fullPack.bytes.length + pdesPack.bytes.length);

  // Build offsets arrays for each string table.
  const idx = {
    count: N,
    stride: STRIDE,
    flags: {
      neoBit: 1,
      phaBit: 2,
      sentryBit: 4,
      hasDiameterBit: 8,
    },
    classes: { AMO: 1, APO: 2, ATE: 3, IEO: 4 },
    stringOffsets: {
      fullName: Array.from(fullPack.offsets),
      pdes: Array.from(pdesPack.offsets),
      name: Array.from(namePack.offsets),
    },
    sentryCount,
    phaCount,
    diameterKnown: diamCount,
    diameterRange: [minD === Infinity ? 0 : minD, maxD === -Infinity ? 0 : maxD],
  };

  writeFileSync(resolve(dataDir, "asteroids.bin"), Buffer.from(data.buffer));
  writeFileSync(resolve(dataDir, "asteroids.strings.bin"), Buffer.from(combined));
  writeFileSync(resolve(dataDir, "asteroids.idx.json"), JSON.stringify(idx));
  console.log(
    `[preprocess] asteroids: wrote asteroids.bin (${(data.byteLength / 1e6).toFixed(2)} MB), ` +
      `asteroids.strings.bin (${(combined.byteLength / 1e6).toFixed(2)} MB), ` +
      `asteroids.idx.json (${(Buffer.byteLength(JSON.stringify(idx)) / 1e3).toFixed(1)} KB)`,
  );
}

// ---------- comet preprocessing ----------
function preprocessComets() {
  console.log("[preprocess] comets: reading…");
  const t0 = Date.now();
  const raw = JSON.parse(readFileSync(resolve(dataDir, "comets.json"), "utf8"));
  const N = raw.length;
  console.log(`[preprocess] comets: ${N} records (${Date.now() - t0}ms)`);

  const STRIDE = 24;
  const data = new Float32Array(N * STRIDE);
  const fullNames = new Array(N);
  const pdeses = new Array(N);

  let hypoCount = 0;
  for (let i = 0; i < N; i++) {
    const r = raw[i];
    const a = r.a ?? 0;
    const e = r.e ?? 0;
    const iDeg = r.i ?? 0;
    const omDeg = r.om ?? 0;
    const wDeg = r.w ?? 0;
    const ma = r.ma ?? 0;
    const epoch = r.epoch ?? 0;
    const n = r.n ?? 0;
    const q = r.q ?? 0;
    const per = r.per ?? 0;
    const tp = r.tp ?? 0;
    const M1 = r.M1 ?? 0;
    const diameter = r.diameter ?? 0;

    let ex, ey, ez;
    try {
      const b = orbitalBasis(omDeg, wDeg, iDeg);
      ex = b.ex;
      ey = b.ey;
      ez = b.ez;
    } catch (err) {
      ex = [1, 0, 0];
      ey = [0, 1, 0];
      ez = [0, 0, 1];
    }

    if (e >= 1) hypoCount++;

    const base = i * STRIDE;
    data[base + 0] = ex[0];
    data[base + 1] = ex[1];
    data[base + 2] = ex[2];
    data[base + 3] = ey[0];
    data[base + 4] = ey[1];
    data[base + 5] = ey[2];
    data[base + 6] = ez[0];
    data[base + 7] = ez[1];
    data[base + 8] = ez[2];
    data[base + 9] = a;
    data[base + 10] = e;
    data[base + 11] = ma;
    data[base + 12] = n;
    data[base + 13] = epoch;
    data[base + 14] = q;
    data[base + 15] = per;
    data[base + 16] = tp;
    data[base + 17] = M1;
    data[base + 18] = diameter;
    data[base + 19] = iDeg;
    // color: comets are pale blue-white
    data[base + 20] = 0.7;
    data[base + 21] = 0.85;
    data[base + 22] = 1.0;
    let flags = 0;
    if (e >= 1) flags |= 1;
    if (diameter > 0) flags |= 2;
    data[base + 23] = flags;

    fullNames[i] = r.full_name ?? r.pdes ?? `comet ${i}`;
    pdeses[i] = r.pdes ?? "";
  }
  console.log(`[preprocess] comets: hyperbolic=${hypoCount}`);

  const fullPack = packStringTable(fullNames);
  const pdesPack = packStringTable(pdeses);
  const headerSize = 8;
  const combined = new Uint8Array(headerSize + fullPack.bytes.length + pdesPack.bytes.length);
  const dv = new DataView(combined.buffer);
  dv.setUint32(0, headerSize, true);
  dv.setUint32(4, headerSize + fullPack.bytes.length, true);
  combined.set(fullPack.bytes, headerSize);
  combined.set(pdesPack.bytes, headerSize + fullPack.bytes.length);

  const idx = {
    count: N,
    stride: STRIDE,
    flags: { hyperbolicBit: 1, hasDiameterBit: 2 },
    stringOffsets: {
      fullName: Array.from(fullPack.offsets),
      pdes: Array.from(pdesPack.offsets),
    },
    hyperbolicCount: hypoCount,
  };

  writeFileSync(resolve(dataDir, "comets.bin"), Buffer.from(data.buffer));
  writeFileSync(resolve(dataDir, "comets.strings.bin"), Buffer.from(combined));
  writeFileSync(resolve(dataDir, "comets.idx.json"), JSON.stringify(idx));
  console.log(
    `[preprocess] comets: wrote comets.bin (${(data.byteLength / 1e6).toFixed(2)} MB), ` +
      `comets.strings.bin (${(combined.byteLength / 1e6).toFixed(2)} MB)`,
  );
}

// ---------- close-approaches preprocessing ----------
function preprocessCloseApproaches() {
  console.log("[preprocess] close-approaches: reading…");
  const t0 = Date.now();
  const raw = JSON.parse(readFileSync(resolve(dataDir, "close-approaches.json"), "utf8"));
  // Sort by `des` then by `jd` for binary search.
  raw.sort((a, b) => {
    if (a.des < b.des) return -1;
    if (a.des > b.des) return 1;
    return a.jd - b.jd;
  });
  // Build index: for each unique des, store (startIdx, endIdx).
  const index = {};
  let i = 0;
  while (i < raw.length) {
    const des = raw[i].des;
    let j = i;
    while (j < raw.length && raw[j].des === des) j++;
    index[des] = [i, j];
    i = j;
  }
  // Strip down to minimal fields to save bytes.
  const compact = raw.map((r) => ({
    des: r.des,
    cd: r.cd,
    jd: r.jd,
    dist: r.dist,
    dist_min: r.dist_min,
    dist_max: r.dist_max,
    v_rel: r.v_rel,
    v_inf: r.v_inf,
    h: r.h,
  }));
  writeFileSync(resolve(dataDir, "close-approaches.json"), JSON.stringify(compact));
  writeFileSync(resolve(dataDir, "close-approaches.idx.json"), JSON.stringify(index));
  console.log(
    `[preprocess] close-approaches: ${raw.length} events, ${Object.keys(index).length} unique designations (${Date.now() - t0}ms)`,
  );
}

// ---------- planets (tiny, just emit as-is) ----------
function preprocessPlanets() {
  const raw = JSON.parse(readFileSync(resolve(dataDir, "planets.json"), "utf8"));
  // Pre-compute orbital basis per planet (the JSON already has all elements).
  // We do this in the browser; raw JSON is small enough to ship as-is.
  writeFileSync(resolve(dataDir, "planets.json"), JSON.stringify(raw));
}

console.log("[preprocess] running…");
preprocessPlanets();
preprocessAsteroids();
preprocessComets();
preprocessCloseApproaches();
console.log("[preprocess] done");
