import "./style.css";
import * as THREE from "three";
import { Scene, AU } from "./scene";
import { buildBodyCloud } from "./bodies";
import {
  loadManifest,
  loadBodySet,
  loadAsteroidMeta,
  loadCometMeta,
  loadPlanets,
  loadSentry,
  loadCloseApproachIndex,
  type SentryRow,
  type BodySet,
} from "./data";
import {
  propagate,
  type OrbitParams,
  REF_EPOCH,
  dateToJD,
  jdToDate,
} from "./kepler";
import { TimeController, formatDate } from "./timectl";
import { buildUI, legendHTML } from "./ui";
import { renderAsteroid, renderComet, renderPlanet } from "./detail";
import {
  readState,
  writeState,
  cameraArray,
  type ViewState,
} from "./urlstate";

// ---------------------------------------------------------------------------
// Scrub slider range
const SCRUB_MIN_JD = dateToJD(new Date(Date.UTC(1950, 0, 1)));
const SCRUB_MAX_JD = dateToJD(new Date(Date.UTC(2125, 0, 1)));

type Selection =
  | { kind: "a"; idx: number }
  | { kind: "c"; idx: number }
  | { kind: "p"; idx: number }
  | null;

async function main() {
  const app = document.getElementById("app")!;
  const loading = document.getElementById("loading")!;

  // ---- load everything ----
  const [manifest, astSet, cometSet, astMeta, cometMeta, planets, sentryRows] =
    await Promise.all([
      loadManifest(),
      loadBodySet("asteroids"),
      loadBodySet("comets"),
      loadAsteroidMeta(),
      loadCometMeta(),
      loadPlanets(),
      loadSentry(),
    ]);

  const sentryByDes = new Map<string, SentryRow>();
  for (const s of sentryRows) sentryByDes.set(s.des, s);

  // ---- scene & clouds ----
  const sc = new Scene(app);
  sc.addPlanets(planets);

  const astCloud = buildBodyCloud(astSet, { scale: AU });
  const cometCloud = buildBodyCloud(cometSet, { scale: AU });
  sc.scene.add(astCloud.points);
  sc.scene.add(cometCloud.points);

  // ---- UI ----
  const classList = Object.entries(manifest.classes)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
  const ui = buildUI(app, classList);

  const phaCount = astMeta.reduce((n, a) => n + a.pha, 0);
  ui.countAst.textContent = manifest.asteroids.toLocaleString();
  ui.countComet.textContent = manifest.comets.toLocaleString();
  ui.countPha.textContent = phaCount.toLocaleString();

  // ---- time ----
  const init = readState();
  const time = new TimeController(init.jd ?? dateToJD(new Date()));
  if (init.rate != null) time.rate = init.rate;
  if (init.playing != null) time.playing = init.playing;
  let colorMode = init.color ?? 0;
  ui.color.value = String(colorMode);
  astCloud.material.uniforms.uColorMode.value = colorMode;
  cometCloud.material.uniforms.uColorMode.value = colorMode;
  ui.legend.innerHTML = legendHTML(colorMode);

  // scrub labels
  (document.getElementById("scrub-min") as HTMLElement).textContent = "1950";
  (document.getElementById("scrub-max") as HTMLElement).textContent = "2125";

  // ---- selection state ----
  let selection: Selection = null;
  let following = false;
  const selParams: OrbitParams = {
    a: 0, e: 0, i: 0, om: 0, w: 0, n: 0, q: 0, tp: 0,
  };
  const selPos = new THREE.Vector3();

  function paramsFromSet(set: BodySet, idx: number, out: OrbitParams) {
    const o = idx * 4;
    out.a = set.A[o];
    out.e = set.A[o + 1];
    out.i = set.A[o + 2];
    out.om = set.A[o + 3];
    out.w = set.B[o];
    out.n = set.B[o + 1];
    out.q = set.B[o + 2];
    out.tp = set.B[o + 3] + REF_EPOCH;
  }

  // ---- planet labels ----
  const planetLabels: HTMLElement[] = [];
  const sunLabel = document.createElement("div");
  sunLabel.className = "plabel sun";
  sunLabel.textContent = "Sun";
  ui.labels.appendChild(sunLabel);
  for (const p of sc.planets) {
    const el = document.createElement("div");
    el.className = "plabel";
    el.textContent = p.row.name;
    ui.labels.appendChild(el);
    planetLabels.push(el);
  }

  // =====================================================================
  // Selection
  // =====================================================================
  async function select(sel: Selection, opts: { fly?: boolean } = {}) {
    selection = sel;
    astCloud.material.uniforms.uSelected.value =
      sel?.kind === "a" ? sel.idx : -1;
    cometCloud.material.uniforms.uSelected.value =
      sel?.kind === "c" ? sel.idx : -1;

    if (!sel) {
      ui.detail.classList.remove("open");
      sc.setSelectedOrbit(null);
      following = false;
      sc.setFollow(null);
      pushState();
      return;
    }

    if (sel.kind === "p") {
      sc.setSelectedOrbit(sc.planets[sel.idx].params);
      ui.detail.innerHTML = renderPlanet(sc.planets[sel.idx].row);
    } else {
      const set = sel.kind === "a" ? astSet : cometSet;
      paramsFromSet(set, sel.idx, selParams);
      sc.setSelectedOrbit(selParams);

      const caIndex = await loadCloseApproachIndex();
      if (sel.kind === "a") {
        const a = astMeta[sel.idx];
        const approaches = caIndex.get(a.d) ?? [];
        const s = a.sentry ? sentryByDes.get(a.d) : undefined;
        ui.detail.innerHTML = renderAsteroid(
          a, s, approaches, time.jd, following
        );
      } else {
        const c = cometMeta[sel.idx];
        const approaches = caIndex.get(c.d) ?? [];
        ui.detail.innerHTML = renderComet(c, approaches, time.jd, following);
      }
    }
    ui.detail.classList.add("open");
    wireDetailButtons();

    if (opts.fly) frameSelection();
    pushState();
  }

  function currentSelPos(out: THREE.Vector3): boolean {
    if (!selection) return false;
    if (selection.kind === "p") {
      out.copy(sc.planets[selection.idx].pos);
      return true;
    }
    const set = selection.kind === "a" ? astSet : cometSet;
    paramsFromSet(set, selection.idx, selParams);
    propagate(selParams, time.jd, out).multiplyScalar(AU);
    return true;
  }

  function frameSelection() {
    if (!currentSelPos(selPos)) return;
    const dist = AU * 0.6;
    const dir = sc.camera.position
      .clone()
      .sub(sc.controls.target)
      .normalize();
    sc.controls.target.copy(selPos);
    sc.camera.position.copy(selPos).addScaledVector(dir, dist);
  }

  function wireDetailButtons() {
    document.getElementById("d-close")?.addEventListener("click", () =>
      select(null)
    );
    document.getElementById("d-frame")?.addEventListener("click", () =>
      frameSelection()
    );
    const fb = document.getElementById("d-follow");
    fb?.addEventListener("click", () => {
      following = !following;
      fb.classList.toggle("active", following);
      fb.textContent = following ? "Following ✓" : "Follow";
      if (!following) sc.setFollow(null);
      pushState();
    });
  }

  // =====================================================================
  // Picking (CPU): project all bodies at current time, find nearest to click
  // =====================================================================
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tmpP = new THREE.Vector3();
  const tmpParams: OrbitParams = {
    a: 0, e: 0, i: 0, om: 0, w: 0, n: 0, q: 0, tp: 0,
  };

  function pick(clientX: number, clientY: number) {
    const rect = sc.renderer.domElement.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    ndc.x = (mx / rect.width) * 2 - 1;
    ndc.y = -(my / rect.height) * 2 + 1;

    // 1) planets via raycaster (their meshes are real geometry)
    raycaster.setFromCamera(ndc, sc.camera);
    raycaster.params.Points = { threshold: 0 };
    const meshes = sc.planets.map((p) => p.mesh);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (hit) {
      const idx = meshes.indexOf(hit.object as THREE.Mesh);
      if (idx >= 0) return void select({ kind: "p", idx });
    }
    // also allow clicking the Sun
    const sunHit = raycaster.intersectObject(sc.sun, false)[0];
    if (sunHit) return; // sun has no detail panel

    // 2) point bodies: project to screen, nearest within threshold
    const w = rect.width,
      h = rect.height;
    const sx = (mx / rect.width) * w; // == mx
    const sy = my;
    let best = -1,
      bestKind: "a" | "c" = "a",
      bestD2 = 16 * 16; // px threshold
    const vp = sc.camera;

    const scan = (set: BodySet, kind: "a" | "c", showCheck: () => boolean) => {
      if (!showCheck()) return;
      const n = set.count;
      const shown =
        kind === "a" ? astCloud.shown : cometCloud.shown;
      const filterActive =
        (kind === "a"
          ? astCloud.material.uniforms.uFilterActive.value
          : cometCloud.material.uniforms.uFilterActive.value) > 0.5;
      for (let i = 0; i < n; i++) {
        if (filterActive && shown[i] < 0.5) continue;
        paramsFromSet(set, i, tmpParams);
        propagate(tmpParams, time.jd, tmpP).multiplyScalar(AU);
        tmpP.project(vp);
        if (tmpP.z > 1 || tmpP.z < -1) continue;
        const px = ((tmpP.x + 1) / 2) * w;
        const py = ((1 - tmpP.y) / 2) * h;
        const dx = px - sx,
          dy = py - sy;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          best = i;
          bestKind = kind;
        }
      }
    };
    scan(astSet, "a", () => astCloud.points.visible);
    scan(cometSet, "c", () => cometCloud.points.visible);

    if (best >= 0) select({ kind: bestKind, idx: best });
    else select(null);
  }

  let downX = 0,
    downY = 0;
  sc.renderer.domElement.addEventListener("pointerdown", (e) => {
    downX = e.clientX;
    downY = e.clientY;
  });
  sc.renderer.domElement.addEventListener("pointerup", (e) => {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 5) {
      pick(e.clientX, e.clientY);
    }
  });

  // =====================================================================
  // Filtering
  // =====================================================================
  const astVisible = new Uint8Array(astSet.count);
  function applyFilters() {
    const phaOnly = ui.fPha.checked;
    const sentryOnly = ui.fSentry.checked;
    const cls = ui.fClass.value;
    const minDia = parseFloat(ui.fDia.value);
    const maxMoid = parseFloat(ui.fMoid.value);
    const showAst = ui.fAsteroids.checked;
    const showComets = ui.fComets.checked;

    astCloud.points.visible = showAst;
    cometCloud.points.visible = showComets;

    const active =
      phaOnly ||
      sentryOnly ||
      cls !== "" ||
      minDia > 0 ||
      maxMoid < 0.5;

    let shownN = 0;
    if (!active) {
      astCloud.setShown(null);
      shownN = showAst ? astSet.count : 0;
    } else {
      for (let i = 0; i < astMeta.length; i++) {
        const a = astMeta[i];
        let ok = true;
        if (phaOnly && !a.pha) ok = false;
        else if (sentryOnly && !a.sentry) ok = false;
        else if (cls && a.c !== cls) ok = false;
        else if (minDia > 0 && (a.dia == null || a.dia < minDia)) ok = false;
        else if (maxMoid < 0.5 && (a.moid == null || a.moid > maxMoid))
          ok = false;
        astVisible[i] = ok ? 1 : 0;
        if (ok) shownN++;
      }
      astCloud.setShown(astVisible);
    }
    ui.countShown.textContent = (showAst ? shownN : 0).toLocaleString();
  }

  // ---- filter events ----
  for (const el of [ui.fPha, ui.fSentry, ui.fAsteroids, ui.fComets, ui.fClass])
    el.addEventListener("change", applyFilters);
  ui.fDia.addEventListener("input", () => {
    ui.fDiaVal.textContent =
      parseFloat(ui.fDia.value) > 0 ? `≥ ${ui.fDia.value} km` : "any";
    applyFilters();
  });
  ui.fMoid.addEventListener("input", () => {
    ui.fMoidVal.textContent =
      parseFloat(ui.fMoid.value) < 0.5 ? `≤ ${ui.fMoid.value} au` : "any";
    applyFilters();
  });
  ui.fReset.addEventListener("click", () => {
    ui.fPha.checked = false;
    ui.fSentry.checked = false;
    ui.fAsteroids.checked = true;
    ui.fComets.checked = true;
    ui.fClass.value = "";
    ui.fDia.value = "0";
    ui.fMoid.value = "0.5";
    ui.fDiaVal.textContent = "any";
    ui.fMoidVal.textContent = "any";
    applyFilters();
  });

  // ---- display events ----
  ui.color.addEventListener("change", () => {
    colorMode = parseInt(ui.color.value);
    astCloud.material.uniforms.uColorMode.value = colorMode;
    cometCloud.material.uniforms.uColorMode.value = colorMode;
    ui.legend.innerHTML = legendHTML(colorMode);
    pushState();
  });
  ui.sizeBoost.addEventListener("input", () => {
    const v = parseFloat(ui.sizeBoost.value);
    astCloud.material.uniforms.uSizeBoost.value = v;
    cometCloud.material.uniforms.uSizeBoost.value = v;
  });

  // =====================================================================
  // Search
  // =====================================================================
  let searchTimer: number | undefined;
  ui.search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = window.setTimeout(runSearch, 120);
  });
  ui.search.addEventListener("focus", runSearch);
  document.addEventListener("click", (e) => {
    if (!ui.results.contains(e.target as Node) && e.target !== ui.search)
      ui.results.classList.remove("open");
  });

  function runSearch() {
    const q = ui.search.value.trim().toLowerCase();
    if (q.length < 1) {
      ui.results.classList.remove("open");
      return;
    }
    const out: string[] = [];
    let count = 0;
    for (let i = 0; i < astMeta.length && count < 40; i++) {
      const a = astMeta[i];
      if (
        a.n.toLowerCase().includes(q) ||
        (a.nm && a.nm.toLowerCase().includes(q)) ||
        a.d.toLowerCase().includes(q)
      ) {
        out.push(
          `<div class="result" data-k="a" data-i="${i}"><span class="nm">${a.nm || a.n}</span><span class="cls">${a.c}${a.pha ? " · PHA" : ""}</span></div>`
        );
        count++;
      }
    }
    for (let i = 0; i < cometMeta.length && count < 50; i++) {
      const c = cometMeta[i];
      if (c.n.toLowerCase().includes(q) || c.d.toLowerCase().includes(q)) {
        out.push(
          `<div class="result" data-k="c" data-i="${i}"><span class="nm">${c.n}</span><span class="cls">comet</span></div>`
        );
        count++;
      }
    }
    ui.results.innerHTML =
      out.join("") ||
      `<div class="result"><span class="cls">No matches</span></div>`;
    ui.results.classList.add("open");
  }
  ui.results.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest(".result") as HTMLElement;
    if (!el || !el.dataset.i) return;
    const kind = el.dataset.k as "a" | "c";
    const idx = parseInt(el.dataset.i);
    ui.results.classList.remove("open");
    ui.search.value = "";
    select({ kind, idx }, { fly: true });
  });

  // =====================================================================
  // Time controls
  // =====================================================================
  function updatePlayBtn() {
    ui.play.textContent = time.playing ? "⏸" : "▶";
  }
  ui.play.addEventListener("click", () => {
    time.playing = !time.playing;
    updatePlayBtn();
    pushState();
  });
  ui.rateBtns.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      time.rate = parseFloat((b as HTMLElement).dataset.rate!);
      time.playing = true;
      updatePlayBtn();
      pushState();
    });
  });
  ui.scrub.addEventListener("input", () => {
    const t = parseFloat(ui.scrub.value) / 1000;
    time.setJD(SCRUB_MIN_JD + t * (SCRUB_MAX_JD - SCRUB_MIN_JD));
  });
  ui.dateInput.addEventListener("change", () => {
    if (!ui.dateInput.value) return;
    const [y, m, d] = ui.dateInput.value.split("-").map(Number);
    time.setJD(dateToJD(new Date(Date.UTC(y, m - 1, d))));
  });
  ui.nowBtn.addEventListener("click", () => {
    time.setJD(dateToJD(new Date()));
  });
  ui.share.addEventListener("click", async () => {
    pushState(true);
    try {
      await navigator.clipboard.writeText(location.href);
      ui.share.textContent = "Copied ✓";
    } catch {
      ui.share.textContent = "Copy this URL";
    }
    setTimeout(() => (ui.share.textContent = "Copy share link"), 1600);
  });

  // =====================================================================
  // URL state
  // =====================================================================
  function selToken(): string | undefined {
    if (!selection) return undefined;
    return `${selection.kind}:${selection.idx}`;
  }
  function pushState(immediate = false) {
    const s: ViewState = {
      jd: time.jd,
      rate: time.rate,
      playing: time.playing,
      sel: selToken(),
      follow: following || undefined,
      color: colorMode,
      cam: cameraArray(sc.camera, sc.controls.target),
    };
    if (immediate) {
      // force-write synchronously by bypassing throttle window
      writeState(s);
    } else {
      writeState(s);
    }
  }

  // restore selection / camera / follow from URL
  if (init.cam && init.cam.length === 6) {
    sc.camera.position.set(init.cam[0], init.cam[1], init.cam[2]);
    sc.controls.target.set(init.cam[3], init.cam[4], init.cam[5]);
  }
  updatePlayBtn();
  applyFilters();

  if (init.sel) {
    const [k, iStr] = init.sel.split(":");
    const idx = parseInt(iStr);
    if ((k === "a" || k === "c" || k === "p") && idx >= 0) {
      following = !!init.follow;
      await select({ kind: k, idx } as Selection);
    }
  }

  // =====================================================================
  // Render loop
  // =====================================================================
  loading.classList.add("hidden");

  const proj = new THREE.Vector3();
  let last = performance.now();
  let stateClock = 0;

  function projectLabel(el: HTMLElement, world: THREE.Vector3) {
    proj.copy(world).project(sc.camera);
    if (proj.z > 1 || proj.z < -1) {
      el.style.display = "none";
      return;
    }
    const rect = sc.renderer.domElement;
    const x = (proj.x * 0.5 + 0.5) * rect.clientWidth;
    const y = (1 - (proj.y * 0.5 + 0.5)) * rect.clientHeight;
    el.style.display = "block";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }

  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    time.tick(dt);

    // update uniforms
    const tRel = time.jd - REF_EPOCH;
    astCloud.material.uniforms.uTRel.value = tRel;
    cometCloud.material.uniforms.uTRel.value = tRel;
    const ps = sc.pointScale();
    astCloud.material.uniforms.uPointScale.value = ps;
    cometCloud.material.uniforms.uPointScale.value = ps;

    sc.updatePlanets(time.jd);

    // follow
    if (following && selection && currentSelPos(selPos)) {
      sc.setFollow(selPos);
    }

    // selected orbit dot position handled by shader; keep orbit line static
    sc.render();

    // labels
    projectLabel(sunLabel, sc.sun.position);
    for (let i = 0; i < sc.planets.length; i++)
      projectLabel(planetLabels[i], sc.planets[i].pos);

    // time readout
    ui.date.textContent = formatDate(time.date);
    ui.rateLabel.textContent = rateText(time.rate, time.playing);
    if (!scrubbing) {
      const t =
        (time.jd - SCRUB_MIN_JD) / (SCRUB_MAX_JD - SCRUB_MIN_JD);
      ui.scrub.value = String(Math.max(0, Math.min(1000, t * 1000)));
    }

    // periodically persist time/cam to URL
    stateClock += dt;
    if (stateClock > 0.5) {
      stateClock = 0;
      pushState();
    }

    requestAnimationFrame(frame);
  }

  // track scrubbing to avoid fighting the slider
  let scrubbing = false;
  ui.scrub.addEventListener("pointerdown", () => (scrubbing = true));
  addEventListener("pointerup", () => (scrubbing = false));

  // set date input default
  ui.dateInput.valueAsDate = jdToDate(time.jd);

  requestAnimationFrame(frame);
}

function rateText(rate: number, playing: boolean): string {
  const abs = Math.abs(rate);
  let s: string;
  if (abs >= 365) s = `${(abs / 365.25).toFixed(abs >= 3650 ? 0 : 1)} yr/s`;
  else if (abs >= 1) s = `${abs.toFixed(abs < 10 ? 1 : 0)} days/s`;
  else s = `${(abs * 24).toFixed(1)} h/s`;
  const dir = rate < 0 ? "◀ " : "";
  return playing ? `${dir}${s}` : "paused";
}

main().catch((err) => {
  console.error(err);
  const l = document.getElementById("loading");
  if (l)
    l.innerHTML = `<span style="color:#ff6a6a">Failed to load: ${
      (err as Error).message
    }</span>`;
});
