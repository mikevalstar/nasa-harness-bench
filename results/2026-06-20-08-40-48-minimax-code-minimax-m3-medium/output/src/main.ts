/**
 * Main entry: wires the scene, data loader, HUD, time loop, search,
 * filter, detail panel, focus/follow, and URL deep-linking.
 */

import * as THREE from "three";
import {
  createScene,
  populatePlanets,
  populateAsteroids,
  populateComets,
  updatePlanetPositions,
  applyFilters,
  applyCameraState,
  highlightAsteroid,
  showOrbitFor,
  readCameraState,
  type SceneRefs,
} from "./scene";
import {
  loadData,
  buildAsteroidIndex,
  findCloseApproachesAround,
} from "./data";
import type { LoadedData } from "./types";
import {
  getHudRefs,
  readFilters,
  writeFilters,
  defaultFilters,
  showDetailForPlanet,
  showDetailForAsteroid,
  hideDetail,
  showToast,
  showTooltip,
  hideTooltip,
} from "./hud";
import { searchAsteroids } from "./search";
import { dateToJd, formatJd, parseDateInput } from "./orbit";
import { decodeStateFromHash, encodeStateToHash, nowJd, updateHash } from "./share";
import { Overlay } from "./overlay";
import type { AppState, CameraState, FilterState } from "./types";

interface AppRefs {
  refs: SceneRefs;
  hud: ReturnType<typeof getHudRefs>;
  data: LoadedData;
  state: AppState;
  searchHits: Set<number> | null;
  asteroidIdx: Map<string, number>;
}

const PLANET_DISPLAY_RADIUS: Record<string, number> = {
  Mercury: 0.025,
  Venus: 0.045,
  Earth: 0.05,
  Mars: 0.04,
  Jupiter: 0.16,
  Saturn: 0.14,
  Uranus: 0.1,
  Neptune: 0.1,
};

async function bootstrap() {
  const canvas = document.getElementById("scene") as HTMLCanvasElement;
  const loadingEl = document.getElementById("loading") as HTMLElement;
  const appEl = document.getElementById("app") as HTMLElement;
  const loadingBarFill = document.getElementById("loading-bar-fill") as HTMLElement;
  const loadingStatus = document.getElementById("loading-status") as HTMLElement;

  function setStatus(msg: string, pct?: number) {
    loadingStatus.textContent = msg;
    if (pct != null) loadingBarFill.style.width = `${pct}%`;
  }

  setStatus("starting up…", 5);

  const { refs, dispose } = createScene(canvas);
  const hud = getHudRefs();

  // Default state.
  const initialTime = nowJd();
  const state: AppState = {
    time: initialTime,
    playing: true,
    speed: 1,
    selected: null,
    follow: null,
    filters: defaultFilters(),
    camera: { x: 10, y: 6, z: 10, tx: 0, ty: 0, tz: 0 },
  };

  // Read hash for initial state.
  const fromHash = decodeStateFromHash(initialTime);
  if (fromHash) {
    // Shallow-merge top-level but DEEP-merge `filters` so we don't blow away
    // defaults for keys that aren't in the URL.
    for (const k of Object.keys(fromHash) as (keyof AppState)[]) {
      if (k === "filters" && fromHash.filters) {
        state.filters = { ...state.filters, ...fromHash.filters };
      } else {
        (state as any)[k] = (fromHash as any)[k];
      }
    }
  }
  writeFilters(hud, state.filters);
  // Sync speed dropdown with state.
  if (state.speed && state.speed !== 1) {
    hud.timeSpeed.value = String(state.speed);
  }

  setStatus("loading data…", 20);

  let data: LoadedData;
  try {
    data = await loadData((msg) => setStatus(msg, 40));
  } catch (err) {
    console.error(err);
    setStatus(`error: ${(err as Error).message}`, 100);
    return;
  }

  setStatus("building scene…", 70);
  populatePlanets(refs, data.planets);
  populateAsteroids(refs, data);
  populateComets(refs, data);

  const asteroidIdx = buildAsteroidIndex(data.asteroidMeta);

  // Apply filters immediately.
  applyFilters(refs, data, state.filters, null);

  // Camera from hash.
  applyCameraState(refs, state.camera);

  setStatus("ready", 100);

  // Hide loading screen.
  setTimeout(() => {
    loadingEl.style.display = "none";
    appEl.classList.remove("hidden");
  }, 250);

  const app: AppRefs = {
    refs,
    hud,
    data,
    state,
    searchHits: null,
    asteroidIdx,
  };

  const overlay = new Overlay();

  wireTimeControls(app);
  wireFilters(app);
  wireSearch(app);
  wireDetail(app);
  wirePick(app);
  wireKeyboard(app);

  // If a body is selected (via deep link), open its detail panel.
  if (state.selected) {
    const planet = data.planets.find((p) => p.name === state.selected);
    if (planet) {
      showDetailForPlanet(hud, planet, state.time);
    } else {
      const idx = asteroidIdx.get(state.selected);
      if (idx != null) {
        const meta = data.asteroidMeta[idx];
        showDetailForAsteroid(hud, data, meta, state.time);
        highlightAsteroid(refs, data, meta.pdes);
        showOrbitFor(refs, data, meta.pdes);
      }
    }
  }

  // First-frame render to populate positions.
  updatePlanetPositions(refs, data.planets, state.time);
  setHudMeta(app);

  // Main loop.
  let lastTs = performance.now();
  let frame = 0;
  function loop() {
    const now = performance.now();
    const dt = (now - lastTs) / 1000; // seconds
    lastTs = now;
    if (state.playing) {
      state.time += state.speed * dt;
    }
    // Update planet positions on CPU.
    updatePlanetPositions(refs, data.planets, state.time);
    // Update asteroid time uniform.
    const astMat = refs.asteroidMesh.material as THREE.ShaderMaterial;
    astMat.uniforms.uTime.value = state.time;
    const cMatE = refs.cometMeshElliptic.material as THREE.ShaderMaterial;
    cMatE.uniforms.uTime.value = state.time;
    const cMatH = refs.cometMeshHyperbolic.material as THREE.ShaderMaterial;
    cMatH.uniforms.uTime.value = state.time;
    // Follow camera.
    if (state.follow) {
      const target = getBodyPosition(app, state.follow);
      if (target) {
        refs.controls.target.set(target.x, target.y, target.z);
        // Camera offset stays constant; we just retarget.
      }
    }
    refs.controls.update();
    refs.renderer.render(refs.scene, refs.camera);
    overlay.update(refs, state.filters.labels);

    // Update HUD every ~5 frames to reduce DOM churn.
    if ((frame++ & 3) === 0) {
      setHudMeta(app);
      // Use a sensible scrub range: 2025-01-01 to 2050-01-01.
      const scrubMin = 2460676.5; // 2025-01-01
      const scrubMax = 2469806.5; // 2050-01-01
      const t = (state.time - scrubMin) / (scrubMax - scrubMin);
      if (document.activeElement !== hud.timeScrub) {
        hud.timeScrub.value = String(Math.max(0, Math.min(1, t)));
      }
      // Auto-update URL hash for shareable deep links (debounced).
      if (hashUpdateTimer === null) {
        hashUpdateTimer = window.setTimeout(() => {
          hashUpdateTimer = null;
          state.camera = readCameraState(refs);
          updateHash(state);
        }, 600);
      }
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function setHudMeta(app: AppRefs) {
  const { hud, state, refs } = app;
  hud.uiDate.textContent = formatJd(state.time);
  hud.uiSpeed.textContent = state.playing
    ? `${state.speed} d/s`
    : "paused";
  // Show visible count from the visibility buffer.
  let visible = 0;
  const vis = (refs.asteroidMesh.userData as any).visibleArr as Float32Array;
  for (let i = 0; i < vis.length; i++) if (vis[i] > 0) visible++;
  hud.uiShown.textContent = `${visible.toLocaleString()} / ${app.data.asteroidCount.toLocaleString()}`;
  hud.timeStart.textContent = "2025-01-01";
  hud.timeEnd.textContent = "2050-01-01";
}

let hashUpdateTimer: number | null = null;

// ===================== time controls =====================
function wireTimeControls(app: AppRefs) {
  const { hud, state } = app;

  hud.timePlay.addEventListener("click", () => {
    state.playing = !state.playing;
    hud.timePlay.textContent = state.playing ? "❚❚" : "▶";
    hud.timePlay.classList.toggle("btn-primary", state.playing);
    if (state.playing) hud.timePlay.classList.remove("btn");
    if (!state.playing) hud.timePlay.classList.add("btn");
  });
  // Initialize play button.
  hud.timePlay.textContent = "❚❚";

  hud.timeBack.addEventListener("click", () => {
    state.time -= 30;
  });
  hud.timeFwd.addEventListener("click", () => {
    state.time += 30;
  });
  hud.timeNow.addEventListener("click", () => {
    state.time = nowJd();
    showToast(app.hud, `Jumped to now (${formatJd(state.time)})`);
  });

  hud.timeSpeed.addEventListener("change", () => {
    state.speed = parseFloat(hud.timeSpeed.value);
  });
  // Initialize speed from UI.
  state.speed = parseFloat(hud.timeSpeed.value);

  hud.timeScrub.addEventListener("input", () => {
    const v = parseFloat(hud.timeScrub.value);
    const min = 2460676.5;
    const max = 2469806.5;
    state.time = min + v * (max - min);
  });

  hud.timeJumpBtn.addEventListener("click", () => {
    const jd = parseDateInput(hud.timeJump.value);
    if (jd == null) {
      showToast(hud, `Couldn't parse "${hud.timeJump.value}"`);
      return;
    }
    state.time = jd;
    showToast(hud, `Jumped to ${formatJd(jd)}`);
  });
  hud.timeJump.addEventListener("keydown", (e) => {
    if (e.key === "Enter") hud.timeJumpBtn.click();
  });
}

// ===================== filters =====================
function wireFilters(app: AppRefs) {
  const { hud, state, refs, data } = app;
  const update = () => {
    state.filters = readFilters(hud);
    applyFilters(refs, data, state.filters, app.searchHits);
    showOrbitFor(refs, data, state.selected);
    setHudMeta(app);
  };
  for (const el of [
    hud.filterOrbits,
    hud.filterLabels,
    hud.filterComets,
    hud.filterPha,
    hud.filterSentry,
    hud.filterClose,
  ]) {
    el.addEventListener("change", update);
  }
  hud.filterClass.addEventListener("change", update);
  hud.filterDiameter.addEventListener("input", debounce(update, 250));
  hud.filterMoid.addEventListener("input", debounce(update, 250));
  hud.filterReset.addEventListener("click", () => {
    state.filters = defaultFilters();
    app.searchHits = null;
    writeFilters(hud, state.filters);
    applyFilters(refs, data, state.filters, null);
    showOrbitFor(refs, data, state.selected);
    setHudMeta(app);
    showToast(hud, "Filters reset");
  });
}

// ===================== search =====================
function wireSearch(app: AppRefs) {
  const { hud, state, refs, data } = app;
  let timer: number | null = null;
  hud.filterSearch.addEventListener("input", () => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      const q = hud.filterSearch.value.trim();
      state.filters.search = q;
      app.searchHits = q ? searchAsteroids(data, q) : null;
      applyFilters(refs, data, state.filters, app.searchHits);
      setHudMeta(app);
      if (app.searchHits && app.searchHits.size > 0) {
        showToast(hud, `${app.searchHits.size} match${app.searchHits.size === 1 ? "" : "es"}`);
      } else if (q) {
        showToast(hud, "No matches");
      }
    }, 220);
  });
}

// ===================== detail panel =====================
function wireDetail(app: AppRefs) {
  const { hud, refs, data, state, asteroidIdx } = app;

  hud.detailClose.addEventListener("click", () => {
    hideDetail(hud);
    state.selected = null;
    state.follow = null;
    highlightAsteroid(refs, data, null);
    showOrbitFor(refs, data, null);
  });

  hud.detailFollow.addEventListener("click", () => {
    if (state.selected) {
      state.follow = state.selected;
      showToast(hud, `Following ${state.selected}`);
    }
  });

  hud.detailShare.addEventListener("click", () => {
    const cam = readCameraState(refs);
    state.camera = cam;
    const hash = encodeStateToHash(state);
    const url = `${location.origin}${location.pathname}#${hash}`;
    history.replaceState(null, "", `#${hash}`);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => showToast(hud, "Link copied"))
        .catch(() => showToast(hud, "Link in URL bar"));
    } else {
      showToast(hud, "Link in URL bar");
    }
  });

  // Click on close-approach row → jump time + select.
  hud.detailApproaches.addEventListener("click", (e) => {
    const tr = (e.target as HTMLElement).closest("tr[data-jd]");
    if (!tr) return;
    const jd = parseFloat(tr.getAttribute("data-jd") ?? "0");
    if (jd > 0) {
      state.time = jd;
      showToast(hud, `Jumped to ${formatJd(jd)}`);
    }
  });
  void asteroidIdx;
}

// ===================== picking (raycast) =====================
function wirePick(app: AppRefs) {
  const { refs, hud, data, state, asteroidIdx } = app;
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let dragStart: { x: number; y: number } | null = null;

  refs.renderer.domElement.addEventListener("pointerdown", (e) => {
    dragStart = { x: e.clientX, y: e.clientY };
  });
  refs.renderer.domElement.addEventListener("pointerup", (e) => {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    dragStart = null;
    if (dx * dx + dy * dy > 16) return; // it was a drag

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    ray.setFromCamera(mouse, refs.camera);

    // First try planet meshes.
    const planetHits = ray.intersectObjects(refs.planetMeshes, false);
    if (planetHits.length > 0) {
      const hit = planetHits[0];
      const name = (hit.object.userData as any).name as string;
      const planet = data.planets.find((p) => p.name === name);
      if (planet) {
        state.selected = name;
        showDetailForPlanet(hud, planet, state.time);
        highlightAsteroid(refs, data, null);
        showOrbitFor(refs, data, null);
        return;
      }
    }
    // Try asteroid instanced mesh.
    const astHits = ray.intersectObject(refs.asteroidMesh, false);
    if (astHits.length > 0) {
      const hit = astHits[0];
      const inst = hit.instanceId;
      if (inst != null && inst >= 0 && inst < data.asteroidCount) {
        const meta = data.asteroidMeta[inst];
        state.selected = meta.pdes;
        state.follow = null;
        showDetailForAsteroid(hud, data, meta, state.time);
        highlightAsteroid(refs, data, meta.pdes);
        showOrbitFor(refs, data, meta.pdes);
        return;
      }
    }
    // Background click — deselect.
    state.selected = null;
    state.follow = null;
    hideDetail(hud);
    highlightAsteroid(refs, data, null);
    showOrbitFor(refs, data, null);
  });

  // Hover tooltip.
  refs.renderer.domElement.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    ray.setFromCamera(mouse, refs.camera);

    const planetHits = ray.intersectObjects(refs.planetMeshes, false);
    if (planetHits.length > 0) {
      const name = (planetHits[0].object.userData as any).name as string;
      const radius = PLANET_DISPLAY_RADIUS[name] ?? 0.05;
      showTooltip(hud, e.clientX, e.clientY, name, `Planet · ${(radius * 149597870.7).toFixed(0)} km display radius`);
      return;
    }
    const astHits = ray.intersectObject(refs.asteroidMesh, false);
    if (astHits.length > 0) {
      const inst = astHits[0].instanceId;
      if (inst != null && inst >= 0 && inst < data.asteroidCount) {
        const m = data.asteroidMeta[inst];
        const cls = ["", "AMO", "APO", "ATE", "IEO"][m.classCode] || "";
        showTooltip(
          hud,
          e.clientX,
          e.clientY,
          m.name || m.fullName,
          `${m.pdes} · ${cls} · H ${m.H.toFixed(1)}${m.diameter ? " · " + m.diameter.toFixed(1) + " km" : ""}`,
        );
        return;
      }
    }
    hideTooltip(hud);
  });
  refs.renderer.domElement.addEventListener("pointerleave", () => {
    hideTooltip(hud);
  });
  void asteroidIdx;
}

// ===================== keyboard shortcuts =====================
function wireKeyboard(app: AppRefs) {
  const { hud, state, refs, data } = app;
  window.addEventListener("keydown", (e) => {
    if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;
    switch (e.key) {
      case " ":
        state.playing = !state.playing;
        hud.timePlay.textContent = state.playing ? "❚❚" : "▶";
        e.preventDefault();
        break;
      case "ArrowLeft":
        state.time -= 10;
        break;
      case "ArrowRight":
        state.time += 10;
        break;
      case "f":
      case "F":
        if (state.selected) {
          state.follow = state.follow ? null : state.selected;
          showToast(hud, state.follow ? `Following ${state.selected}` : "Unfollowed");
        }
        break;
      case "Escape":
        state.selected = null;
        state.follow = null;
        hideDetail(hud);
        highlightAsteroid(refs, data, null);
        showOrbitFor(refs, data, null);
        break;
    }
  });
}

// ===================== helpers =====================
function debounce<F extends (...a: any[]) => void>(fn: F, ms: number): F {
  let t: number | null = null;
  return ((...args: any[]) => {
    if (t != null) clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  }) as F;
}

function getBodyPosition(
  app: AppRefs,
  key: string,
): THREE.Vector3 | null {
  const { refs, data } = app;
  if (key === "Sun") return new THREE.Vector3(0, 0, 0);
  // Planet?
  const planetIdx = data.planets.findIndex((p) => p.name === key);
  if (planetIdx >= 0) {
    return refs.planetMeshes[planetIdx].position.clone();
  }
  // Asteroid by pdes.
  const idx = app.asteroidIdx.get(key);
  if (idx != null) {
    return computeAsteroidPos(app, idx);
  }
  return null;
}

function computeAsteroidPos(app: AppRefs, idx: number): THREE.Vector3 {
  const { refs, data, state } = app;
  const stride = data.asteroidStride;
  const base = idx * stride;
  // Pull orbital basis + elements.
  const exX = data.asteroidData[base + 0];
  const exY = data.asteroidData[base + 1];
  const exZ = data.asteroidData[base + 2];
  const eyX = data.asteroidData[base + 3];
  const eyY = data.asteroidData[base + 4];
  const eyZ = data.asteroidData[base + 5];
  const a = data.asteroidData[base + 9];
  const e = data.asteroidData[base + 10];
  const ma = data.asteroidData[base + 11];
  const n = data.asteroidData[base + 12];
  const epoch = data.asteroidData[base + 13];

  const Mdeg = ma + n * (state.time - epoch);
  const M = Mdeg * (Math.PI / 180);
  let E: number;
  if (e >= 1) {
    // Hyperbolic Kepler
    let H = M / Math.max(1.0001, e - 1);
    for (let i = 0; i < 24; i++) {
      const sH = Math.sinh(H);
      const cH = Math.cosh(H);
      const fp = e * cH - 1;
      if (Math.abs(fp) < 1e-12) break;
      const f = e * sH - H - M;
      H -= f / fp;
    }
    const aSigned = -Math.abs(a);
    const sqrtE2_1 = Math.sqrt(Math.max(0, e * e - 1));
    const xPF = aSigned * (e - Math.cosh(H));
    const yPF = aSigned * sqrtE2_1 * Math.sinh(H);
    return new THREE.Vector3(
      exX * xPF + eyX * yPF,
      exY * xPF + eyY * yPF,
      exZ * xPF + eyZ * yPF,
    );
  }
  // Elliptic Kepler
  let Mw = M;
  Mw = ((Mw + Math.PI) % (2 * Math.PI)) - Math.PI;
  if (Mw < -Math.PI) Mw += 2 * Math.PI;
  E = Mw + e * Math.sin(Mw);
  for (let i = 0; i < 8; i++) {
    const f = E - e * Math.sin(E) - Mw;
    const fp = 1 - e * Math.cos(E);
    E -= f / fp;
    if (Math.abs(f) < 1e-10) break;
  }
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const sqrtE2 = Math.sqrt(Math.max(0, 1 - e * e));
  const xPF = a * (cosE - e);
  const yPF = a * sqrtE2 * sinE;
  return new THREE.Vector3(
    exX * xPF + eyX * yPF,
    exY * xPF + eyY * yPF,
    exZ * xPF + eyZ * yPF,
  );
}

// Boot.
bootstrap().catch((err) => {
  console.error(err);
  const loadingStatus = document.getElementById("loading-status");
  if (loadingStatus) loadingStatus.textContent = `Error: ${err.message}`;
});
