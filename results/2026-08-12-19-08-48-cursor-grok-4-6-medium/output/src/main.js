import { createViz } from "./viz.js";
import { bindUi, detailHtml } from "./ui.js";
import { dateToJd, fromDatetimeLocal } from "./time.js";
const SPEEDS = [0.04167, 1, 7, 30, 365.25, 3652.5];

async function loadBin(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const buf = await res.arrayBuffer();
  return new Float32Array(buf);
}

async function loadJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

function parseHash() {
  const q = new URLSearchParams(location.hash.replace(/^#/, ""));
  const st = {};
  if (q.has("jd")) st.jd = Number(q.get("jd"));
  if (q.has("sel")) st.sel = q.get("sel");
  if (q.has("kind")) st.kind = q.get("kind");
  if (q.has("follow")) st.follow = q.get("follow") === "1";
  if (q.has("comets")) st.comets = q.get("comets") === "1";
  if (q.has("pha")) st.pha = q.get("pha") === "1";
  if (q.has("sentry")) st.sentry = q.get("sentry") === "1";
  if (q.has("cx")) {
    st.cam = {
      cx: Number(q.get("cx")),
      cy: Number(q.get("cy")),
      cz: Number(q.get("cz")),
      tx: Number(q.get("tx")),
      ty: Number(q.get("ty")),
      tz: Number(q.get("tz")),
    };
  }
  return st;
}

function writeHash(state) {
  const q = new URLSearchParams();
  q.set("jd", state.jd.toFixed(4));
  if (state.sel) {
    q.set("kind", state.sel.kind);
    q.set("sel", state.sel.id);
  }
  if (state.follow) q.set("follow", "1");
  if (state.comets) q.set("comets", "1");
  if (state.pha) q.set("pha", "1");
  if (state.sentry) q.set("sentry", "1");
  if (state.cam) {
    for (const k of ["cx", "cy", "cz", "tx", "ty", "tz"]) q.set(k, String(state.cam[k]));
  }
  const next = "#" + q.toString();
  if (next !== location.hash) history.replaceState(null, "", next);
}

const loader = document.getElementById("loader");
const loaderText = document.getElementById("loader-text");

async function boot() {
  loaderText.textContent = "Loading planets…";
  const planets = await loadJson("./data/planets.json");
  loaderText.textContent = "Loading 42,000 near-Earth orbits…";
  const [astOrbits, astMeta, sentry, cad] = await Promise.all([
    loadBin("./data/asteroid-orbits.bin"),
    loadJson("./data/asteroids.json"),
    loadJson("./data/sentry.json"),
    loadJson("./data/cad.json"),
  ]);
  loaderText.textContent = "Loading comets…";
  const [comOrbits, comMeta] = await Promise.all([
    loadBin("./data/comet-orbits.bin"),
    loadJson("./data/comets.json"),
  ]);

  const pdesIndex = new Map();
  for (let i = 0; i < astMeta.count; i++) pdesIndex.set(astMeta.pdes[i], i);
  const cometIndex = new Map();
  for (let i = 0; i < comMeta.count; i++) cometIndex.set(comMeta.pdes[i], i);

  const canvas = document.getElementById("c");
  const viz = createViz(canvas, document.getElementById("labels"));
  viz.setSentry(sentry);
  viz.setPlanets(planets);
  viz.setAsteroids(astOrbits, astMeta);
  viz.setComets(comOrbits, comMeta);

  const hash = parseHash();
  let jd = Number.isFinite(hash.jd) ? hash.jd : dateToJd(new Date());
  let playing = false;
  let speed = 7;
  let follow = !!hash.follow;
  let selected = null;
  let lastTs = performance.now();
  let lastDetail = 0;
  let hashTimer = 0;
  const earthTmp = [0, 0, 0];
  const posTmp = [0, 0, 0];

  if (hash.comets) document.getElementById("show-comets").checked = true;
  if (hash.pha) document.getElementById("only-pha").checked = true;
  if (hash.sentry) document.getElementById("only-sentry").checked = true;

  const ui = bindUi({
    applyFilters,
    search,
    syncShow,
    togglePlay,
    nudgeSpeed,
    setSpeed,
    setNow,
    setDateInput,
    scrub,
    toggleFollow,
    clearSelection,
  });

  function selId(sel) {
    if (!sel) return null;
    if (sel.kind === "planet") return planets[sel.index].name;
    if (sel.kind === "asteroid") return astMeta.pdes[sel.index];
    if (sel.kind === "comet") return comMeta.pdes[sel.index];
    return null;
  }

  function selLabel(sel) {
    if (!sel) return "";
    if (sel.kind === "planet") return planets[sel.index].name;
    if (sel.kind === "asteroid") return astMeta.full_name[sel.index];
    if (sel.kind === "comet") return comMeta.full_name[sel.index];
    return "";
  }

  function resolveSel(kind, id) {
    if (!id) return null;
    if (kind === "planet") {
      const index = planets.findIndex((p) => p.name === id);
      return index >= 0 ? { kind, index, id, label: id } : null;
    }
    if (kind === "asteroid") {
      const index = pdesIndex.get(id);
      return index != null ? { kind, index, id, label: astMeta.full_name[index] } : null;
    }
    if (kind === "comet") {
      const index = cometIndex.get(id);
      return index != null ? { kind, index, id, label: comMeta.full_name[index] } : null;
    }
    const ai = pdesIndex.get(id);
    if (ai != null) return { kind: "asteroid", index: ai, id, label: astMeta.full_name[ai] };
    return null;
  }

  function applyFilters() {
    const onlyPha = ui.onlyPha();
    const onlySentry = ui.onlySentry();
    const onlySized = ui.onlySized();
    const maxMoid = ui.maxMoid();
    const classOn = ui.classOn;
    const n = viz.applyFilter((i) => {
      const cls = astMeta.classes[astMeta.class[i]];
      if (classOn[cls] === false) return false;
      if (onlyPha && !astMeta.pha[i]) return false;
      if (onlySentry && !sentry[astMeta.pdes[i]]) return false;
      if (onlySized && !(astMeta.diameter[i] > 0)) return false;
      if (astMeta.moid[i] > maxMoid) return false;
      return true;
    });
    ui.setStats(`${n.toLocaleString()} asteroids visible · ${astMeta.count.toLocaleString()} NEOs`);
    scheduleHash();
  }

  function search(q) {
    q = q.trim().toLowerCase();
    if (q.length < 2) {
      ui.setSearchResults([], select);
      return;
    }
    const hits = [];
    for (let i = 0; i < astMeta.count && hits.length < 30; i++) {
      const fn = astMeta.full_name[i].toLowerCase();
      const pd = astMeta.pdes[i].toLowerCase();
      const nm = (astMeta.name[i] || "").toLowerCase();
      if (fn.includes(q) || pd.includes(q) || nm.includes(q)) {
        hits.push({
          kind: "asteroid",
          index: i,
          id: astMeta.pdes[i],
          label: astMeta.full_name[i],
        });
      }
    }
    if (ui.showComets()) {
      for (let i = 0; i < comMeta.count && hits.length < 40; i++) {
        if (comMeta.full_name[i].toLowerCase().includes(q) || comMeta.pdes[i].toLowerCase().includes(q)) {
          hits.push({
            kind: "comet",
            index: i,
            id: comMeta.pdes[i],
            label: comMeta.full_name[i],
          });
        }
      }
    }
    for (const p of planets) {
      if (p.name.toLowerCase().includes(q)) {
        hits.unshift({ kind: "planet", index: planets.indexOf(p), id: p.name, label: p.name });
      }
    }
    ui.setSearchResults(hits, select);
  }

  function syncShow() {
    viz.setShow({
      asteroids: ui.showAsteroids(),
      comets: ui.showComets(),
      orbits: ui.showOrbits(),
      labels: ui.showLabels(),
    });
    viz.updatePositions(jd);
    scheduleHash();
  }

  function togglePlay() {
    playing = !playing;
    ui.setPlaying(playing);
  }

  function setSpeed(v) {
    speed = v;
    ui.setSpeedSelect(v);
  }

  function nudgeSpeed(dir) {
    const i = SPEEDS.indexOf(speed);
    const j = Math.max(0, Math.min(SPEEDS.length - 1, (i < 0 ? 2 : i) + dir));
    setSpeed(SPEEDS[j]);
  }

  function setNow() {
    jd = dateToJd(new Date());
    ui.setClock(jd);
    viz.updatePositions(jd);
    refreshDetail();
  }

  function setDateInput(v) {
    jd = fromDatetimeLocal(v);
    ui.setClock(jd);
    viz.updatePositions(jd);
    refreshDetail();
    scheduleHash();
  }

  function scrub(v) {
    const span = 50 * 365.25;
    const mid = dateToJd(new Date());
    jd = mid + ((v / 1000) * 2 - 1) * span;
    ui.setClock(jd);
    viz.updatePositions(jd);
    refreshDetail();
  }

  function select(sel) {
    selected = sel ? { ...sel, id: selId(sel), label: selLabel(sel) } : null;
    viz.setSelected(selected, jd);
    refreshDetail();
    ui.setFollow(selected, follow);
    scheduleHash();
  }

  function clearSelection() {
    follow = false;
    select(null);
  }

  function toggleFollow() {
    if (!selected) return;
    follow = !follow;
    ui.setFollow(selected, follow);
    if (follow) viz.lookAt(selected, jd);
    scheduleHash();
  }

  function refreshDetail() {
    viz.bodyPosition(selected, jd, posTmp);
    viz.earthPosition(jd, earthTmp);
    ui.renderDetail(
      detailHtml(selected, {
        planets,
        astMeta,
        astOrbits,
        comMeta,
        comOrbits,
        sentry,
        cad,
        jd,
        pos: posTmp,
        earth: earthTmp,
        LD: viz.LD,
      })
    );
    const panel = document.getElementById("detail");
    panel.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const act = btn.getAttribute("data-act");
        if (act === "follow") {
          follow = true;
          viz.lookAt(selected, jd);
          ui.setFollow(selected, true);
          scheduleHash();
        }
        if (act === "look") viz.lookAt(selected, jd);
        if (act === "share") {
          writeHash(snapshot());
          navigator.clipboard?.writeText(location.href);
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = "Copy link"), 1200);
        }
      });
    });
    panel.querySelectorAll(".cad-list li[data-jd]").forEach((li) => {
      li.addEventListener("click", () => {
        jd = Number(li.getAttribute("data-jd"));
        ui.setClock(jd);
        viz.updatePositions(jd);
        if (selected) viz.lookAt(selected, jd);
        refreshDetail();
        scheduleHash();
      });
    });
  }

  function snapshot() {
    return {
      jd,
      sel: selected,
      follow,
      comets: ui.showComets(),
      pha: ui.onlyPha(),
      sentry: ui.onlySentry(),
      cam: viz.getCameraState(),
    };
  }

  function scheduleHash() {
    clearTimeout(hashTimer);
    hashTimer = setTimeout(() => writeHash(snapshot()), 250);
  }

  canvas.addEventListener("pointerdown", (e) => {
    const hit = viz.pick(e.clientX, e.clientY);
    if (hit) select(hit);
  });

  if (hash.sel) selected = resolveSel(hash.kind, hash.sel);
  applyFilters();
  syncShow();
  ui.setClock(jd);
  ui.setPlaying(false);
  viz.updatePositions(jd);
  if (hash.cam) viz.setCameraState(hash.cam);
  if (selected) {
    selected = { ...selected, id: selId(selected), label: selLabel(selected) };
    viz.setSelected(selected, jd);
    if (follow) viz.lookAt(selected, jd);
    refreshDetail();
    ui.setFollow(selected, follow);
  }

  loader.classList.add("gone");

  function frame(ts) {
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    if (playing) {
      jd += speed * dt;
      ui.setClock(jd);
      viz.updatePositions(jd);
      viz.updateMarker(selected, jd);
      if (ts - lastDetail > 300) {
        refreshDetail();
        lastDetail = ts;
      }
    }
    viz.follow(selected, jd, follow);
    viz.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  setInterval(scheduleHash, 2000);
}

boot().catch((err) => {
  console.error(err);
  loaderText.textContent = String(err.message || err);
});
