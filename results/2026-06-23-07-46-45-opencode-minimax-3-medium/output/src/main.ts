// Main entry point. Wires the renderer, scene, data, UI, and animation loop.

import * as THREE from 'three';
import { createScene } from './scene';
import { loadAllData, type LoadedData, type PackedAsteroid } from './data';
import { buildPlanets, type PlanetObjects } from './planets';
import { buildAsteroidCloud, type AsteroidCloud } from './asteroid_cloud';
import { buildComets, type CometCloud } from './comets';
import { propagateAsteroidsDirect, buildPrecomputedOrbits } from './asteroid_lookup_prop';
import type { PrecomputedOrbits } from './orbit_lookup';
import { buildOrbitPath } from './orbit_path';
import { jdToDate, dateToJd, formatDate, formatAu, formatNumber, formatDays, formatKm, clamp, wrap360 } from './util';
import { AU_KM, EARTH_RADIUS_KM, propagateElliptic, buildEllipticProp } from './orbit';
import type { Planet, Asteroid, CloseApproach, SentryEntry } from './types';

type Meta = PackedAsteroid['meta'][number];
type Sentry = SentryEntry;

const JD_NOW = dateToJd(new Date());
const MIN_JD = dateToJd(new Date('1900-01-01T00:00:00Z'));
const MAX_JD = dateToJd(new Date('2200-01-01T00:00:00Z'));

// ---------- App state ------------------------------------------------------

interface State {
  data: LoadedData;
  cloud: AsteroidCloud;
  comets: CometCloud;
  planets: PlanetObjects;
  orbits: PrecomputedOrbits;
  time: number; // JD
  playing: boolean;
  playingForward: boolean;
  speed: number; // sim seconds per real second
  filter: FilterState;
  selected: SelectedObject | null;
  followed: SelectedObject | null;
  showOrbits: boolean;
  showLabels: boolean;
  showComets: boolean;
  showApproaches: boolean;
}

interface FilterState {
  neoOnly: boolean;
  phaOnly: boolean;
  sentryOnly: boolean;
  orbitClass: string;
  maxDiameter: number | null; // km
  maxMoid: number | null; // au
  minH: number | null;
}

interface SelectedObject {
  kind: 'asteroid' | 'planet' | 'comet';
  pdes: string;
  name: string;
}

// ---------- URL state -------------------------------------------------------

interface UrlState {
  t?: number; // JD
  sel?: string; // pdes or planet name
  follow?: string;
  cam?: string; // base64-encoded camera state
}

function readUrl(): UrlState {
  const u = new URL(window.location.href);
  const o: UrlState = {};
  const t = u.searchParams.get('t');
  if (t) o.t = Number(t);
  const sel = u.searchParams.get('sel');
  if (sel) o.sel = sel;
  const follow = u.searchParams.get('follow');
  if (follow) o.follow = follow;
  const cam = u.searchParams.get('cam');
  if (cam) o.cam = cam;
  return o;
}

let writeUrlTimer: number | null = null;
function writeUrl(state: State, ctx?: ReturnType<typeof createScene>) {
  if (writeUrlTimer != null) clearTimeout(writeUrlTimer);
  writeUrlTimer = window.setTimeout(() => {
    const u = new URL(window.location.href);
    u.searchParams.set('t', state.time.toFixed(3));
    if (state.selected) u.searchParams.set('sel', state.selected.pdes);
    else u.searchParams.delete('sel');
    if (state.followed) u.searchParams.set('follow', state.followed.pdes);
    else u.searchParams.delete('follow');
    if (ctx) {
      const c = ctx.camera;
      // Camera relative to target.
      const t = ctx.controls.target;
      const dx = c.position.x - t.x;
      const dy = c.position.y - t.y;
      const dz = c.position.z - t.z;
      const dist = Math.hypot(dx, dy, dz);
      const az = Math.atan2(dx, dz) * 180 / Math.PI;
      const alt = Math.asin(dy / dist) * 180 / Math.PI;
      const camStr = `${dist.toFixed(4)},${az.toFixed(2)},${alt.toFixed(2)}`;
      u.searchParams.set('cam', camStr);
    }
    window.history.replaceState({}, '', u.toString());
  }, 250);
}

// ---------- Helpers ---------------------------------------------------------

function hideLoader(progress = 1, msg = '') {
  const el = document.getElementById('loader');
  if (!el) return;
  if (msg) {
    const m = document.getElementById('loader-msg');
    if (m) m.textContent = msg;
  }
  el.classList.add('hidden');
  setTimeout(() => el.remove(), 500);
}

function setLoaderMsg(msg: string) {
  const m = document.getElementById('loader-msg');
  if (m) m.textContent = msg;
}

// ---------- Boot ------------------------------------------------------------

async function boot() {
  const canvas = document.getElementById('scene') as HTMLCanvasElement;
  const labelLayer = document.createElement('div');
  labelLayer.style.position = 'absolute';
  labelLayer.style.inset = '0';
  labelLayer.style.pointerEvents = 'none';
  labelLayer.style.zIndex = '3';
  document.getElementById('app')!.appendChild(labelLayer);

  const ctx = createScene(canvas, labelLayer);
  activeCtx = ctx;

  setLoaderMsg('Loading dataset…');
  const data = await loadAllData((msg) => setLoaderMsg(msg));
  setLoaderMsg('Precomputing orbits…');
  // eslint-disable-next-line no-undef
  await new Promise<void>((r) => setTimeout(r, 0)); // yield so the loader message repaints
  const orbits = buildPrecomputedOrbits(data.packed);

  setLoaderMsg('Building scene…');

  const planets = buildPlanets(data.packed ? data.planets : [], labelLayer);
  // planets is added to scene
  ctx.scene.add(planets.group);

  const cloud = buildAsteroidCloud(data.packed);
  ctx.scene.add(cloud.points);

  const comets = buildComets(data.comets);
  comets.points.visible = false;
  ctx.scene.add(comets.points);

  // Stats
  document.getElementById('stat-total')!.textContent = data.packed.count.toLocaleString();
  const phaCount = data.packed.meta.filter((m) => m.pha).length;
  document.getElementById('stat-pha')!.textContent = phaCount.toLocaleString();
  const sentryCount = Object.keys(data.packed.sentryByPdes).length;
  document.getElementById('stat-sentry')!.textContent = sentryCount.toLocaleString();
  document.getElementById('stat-comets')!.textContent = data.comets.length.toLocaleString();

  const urlState = readUrl();

  const state: State = {
    data,
    cloud,
    comets,
    planets,
    orbits,
    time: clamp(urlState.t ?? JD_NOW, MIN_JD, MAX_JD),
    playing: false,
    playingForward: true,
    speed: 86400,
    filter: {
      neoOnly: true,
      phaOnly: false,
      sentryOnly: false,
      orbitClass: '',
      maxDiameter: null,
      maxMoid: null,
      minH: null,
    },
    selected: null,
    followed: null,
    showOrbits: false,
    showLabels: true,
    showComets: false,
    showApproaches: true,
  };

  // If URL says follow a body, set that up.
  if (urlState.follow) {
    const target = resolveSelection(state, urlState.follow);
    if (target) {
      state.followed = target;
      const hint = document.getElementById('follow-hint')!;
      hint.hidden = false;
      (document.getElementById('follow-name') as HTMLElement).textContent = target.name;
    }
  }

  // If URL says select a body, open its detail panel.
  if (urlState.sel) {
    const target = resolveSelection(state, urlState.sel);
    if (target) {
      state.selected = target;
      renderDetail(state);
      applyOrbitLines(state, ctx);
      (document.getElementById('rightpanel') as HTMLElement).hidden = false;
    }
  }

  // If URL says camera state, restore it.
  if (urlState.cam) {
    const parts = urlState.cam.split(',').map(Number);
    if (parts.length === 3 && parts.every((v) => isFinite(v))) {
      const [dist, az, alt] = parts;
      const ar = (az * Math.PI) / 180;
      const al = (alt * Math.PI) / 180;
      const cx = dist * Math.cos(al) * Math.sin(ar);
      const cy = dist * Math.sin(al);
      const cz = dist * Math.cos(al) * Math.cos(ar);
      ctx.camera.position.set(cx, cy, cz);
      ctx.controls.update();
    }
  }

  // Build initial per-body visibility for stat counter.
  recomputeStats(state);

  setupUi(state, ctx);
  setupKeyboard(state, ctx);
  setupPicking(state, ctx);

  // Initial frame.
  updatePositions(state);
  updatePlanetLabels(ctx.camera, state.planets);
  updateVisibleStat(state);
  setDateDisplay(state);
  syncScrub(state);

  hideLoader();
  setLoaderMsg('Ready.');

  // Animation loop.
  let last = performance.now();
  let lastTime = state.time;
  function frame(now: number) {
    const dt = (now - last) / 1000;
    last = now;
    advanceTime(state, dt);
    const timeChanged = state.time !== lastTime;
    if (timeChanged) {
      updatePositions(state);
      lastTime = state.time;
    }
    updateCameraFollow(state, ctx);
    updatePlanetLabels(ctx.camera, state.planets);
    ctx.controls.update();
    ctx.renderer.render(ctx.scene, ctx.camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---------- Time & positions ----------------------------------------------

let activeCtx: ReturnType<typeof createScene> | null = null;

function advanceTime(state: State, dtReal: number) {
  if (!state.playing) return;
  const dir = state.playingForward ? 1 : -1;
  // state.time is in JD; state.speed is in sim-seconds per real-second; convert
  // to JD days.
  const dDays = (dir * state.speed * dtReal) / 86400;
  state.time = clamp(state.time + dDays, MIN_JD, MAX_JD);
  setDateDisplay(state);
  syncScrub(state);
  writeUrl(state, activeCtx ?? undefined);
}

function updatePositions(state: State) {
  state.cloud.positions.array = state.cloud.rawPositions;
  propagateAsteroidsDirect(
    state.orbits,
    state.time,
    state.cloud.rawPositions,
  );
  state.cloud.positions.needsUpdate = true;

  // Planets
  state.planets.update(state.time);

  // Comets
  if (state.showComets) {
    state.comets.points.visible = true;
    state.comets.update(state.time);
  } else {
    state.comets.points.visible = false;
  }
}

function updateVisibleStat(state: State) {
  // Stats: count PHAs, sentry, etc.
  // Visible is everything (we always render the cloud), but we expose a
  // "currently in view" approximation using camera distance cutoff if wanted.
  const v = state.data.packed.count;
  const el = document.getElementById('stat-visible');
  if (el) el.textContent = v.toLocaleString();
}

function recomputeStats(_state: State) {
  // Reserved for filter-induced recompute.
}

function setDateDisplay(state: State) {
  const el = document.getElementById('date-display');
  if (!el) return;
  el.textContent = formatDate(state.time);
  // sync date input
  const di = document.getElementById('date') as HTMLInputElement;
  if (di && document.activeElement !== di) {
    di.value = jdToDate(state.time).toISOString().slice(0, 10);
  }
}

function syncScrub(state: State) {
  const scrub = document.getElementById('scrub') as HTMLInputElement;
  if (!scrub) return;
  if (document.activeElement === scrub) return;
  const t = (state.time - MIN_JD) / (MAX_JD - MIN_JD);
  scrub.value = String(clamp(t * 100, 0, 100));
}

// ---------- Camera follow ---------------------------------------------------

const FOLLOW_OFFSETS = [
  new THREE.Vector3(0.005, 0.004, 0.008),
  new THREE.Vector3(0.002, 0.002, 0.003),
];

function updateCameraFollow(state: State, ctx: ReturnType<typeof createScene>) {
  if (!state.followed) return;
  const target = positionOf(state, state.followed);
  if (!target) return;
  ctx.followGroup.position.copy(target);
  // The camera target tracks the body; the camera position stays roughly
  // where the user left it relative to that target.
  ctx.controls.target.lerp(target, 0.25);
}

// ---------- UI wiring -------------------------------------------------------

function setupUi(state: State, ctx: ReturnType<typeof createScene>) {
  const playBtn = document.getElementById('btn-play')!;
  const revBtn = document.getElementById('btn-reverse')!;
  const speedSel = document.getElementById('sel-speed') as HTMLSelectElement;
  const scrub = document.getElementById('scrub') as HTMLInputElement;
  const dateInput = document.getElementById('date') as HTMLInputElement;
  const detailClose = document.getElementById('btn-close')!;

  playBtn.addEventListener('click', () => {
    state.playing = !state.playing;
    state.playingForward = true;
    playBtn.textContent = state.playing ? '⏸' : '▶';
  });
  revBtn.addEventListener('click', () => {
    state.playing = !state.playing;
    state.playingForward = false;
    revBtn.textContent = state.playing ? '⏸' : '⟲';
  });
  speedSel.addEventListener('change', () => {
    const v = Number(speedSel.value);
    if (v === 0) {
      state.playing = false;
      playBtn.textContent = '▶';
    } else {
      state.speed = v;
    }
  });

  scrub.addEventListener('input', () => {
    const t = (Number(scrub.value) / 100) * (MAX_JD - MIN_JD) + MIN_JD;
    state.time = t;
    setDateDisplay(state);
    updatePositions(state);
    writeUrl(state, ctx);
  });

  dateInput.addEventListener('change', () => {
    if (!dateInput.value) return;
    const d = new Date(dateInput.value + 'T00:00:00Z');
    if (!isNaN(d.getTime())) {
      state.time = clamp(dateToJd(d), MIN_JD, MAX_JD);
      setDateDisplay(state);
      syncScrub(state);
      updatePositions(state);
      writeUrl(state, ctx);
    }
  });

  detailClose.addEventListener('click', () => {
    state.selected = null;
    state.followed = null;
    (document.getElementById('rightpanel') as HTMLElement).hidden = true;
    (document.getElementById('follow-hint') as HTMLElement).hidden = true;
    writeUrl(state, ctx);
  });

  // Filters
  bindCheckbox('f-neo', (v) => {
    state.filter.neoOnly = v;
    applyFilter(state, ctx);
  });
  bindCheckbox('f-pha', (v) => {
    state.filter.phaOnly = v;
    applyFilter(state, ctx);
  });
  bindCheckbox('f-sentry', (v) => {
    state.filter.sentryOnly = v;
    applyFilter(state, ctx);
  });
  bindSelect('f-class', (v) => {
    state.filter.orbitClass = v;
    applyFilter(state, ctx);
  });
  bindNumber('f-maxdia', (v) => {
    state.filter.maxDiameter = v;
    applyFilter(state, ctx);
  });
  bindNumber('f-moid', (v) => {
    state.filter.maxMoid = v;
    applyFilter(state, ctx);
  });
  bindNumber('f-h', (v) => {
    state.filter.minH = v;
    applyFilter(state, ctx);
  });

  // Layer toggles
  bindCheckbox('l-orbits', (v) => {
    state.showOrbits = v;
    applyOrbitLines(state, ctx);
  });
  bindCheckbox('l-labels', (v) => {
    state.showLabels = v;
    document.querySelectorAll<HTMLElement>('.label3d').forEach((e) => {
      e.style.display = v ? 'block' : 'none';
    });
  });
  bindCheckbox('l-comets', (v) => {
    state.showComets = v;
    state.comets.points.visible = v;
  });
  bindCheckbox('l-approaches', (v) => {
    state.showApproaches = v;
    if (state.selected) renderDetail(state);
  });

  // Default: show close approaches in detail panel.
  (document.getElementById('l-approaches') as HTMLInputElement).checked = state.showApproaches;

  // Search
  const search = document.getElementById('search') as HTMLInputElement;
  const searchResults = document.getElementById('search-results')!;
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    if (!q) {
      searchResults.innerHTML = '';
      return;
    }
    const matches = searchAsteroids(state, q, 12);
    searchResults.innerHTML = '';
    for (const m of matches) {
      const div = document.createElement('div');
      div.className = 'item';
      const n = document.createElement('span');
      n.className = 'name';
      n.textContent = m.full_name;
      const meta = document.createElement('span');
      meta.className = 'meta';
      meta.textContent = m.pha ? 'PHA' : m.neo ? 'NEO' : '';
      div.appendChild(n);
      div.appendChild(meta);
      div.addEventListener('click', () => {
        selectObject(state, { kind: 'asteroid', pdes: m.pdes, name: m.full_name }, ctx);
        searchResults.innerHTML = '';
        search.value = '';
      });
      searchResults.appendChild(div);
    }
  });
}

function bindCheckbox(id: string, cb: (v: boolean) => void) {
  const el = document.getElementById(id) as HTMLInputElement;
  el.addEventListener('change', () => cb(el.checked));
}
function bindSelect(id: string, cb: (v: string) => void) {
  const el = document.getElementById(id) as HTMLSelectElement;
  el.addEventListener('change', () => cb(el.value));
}
function bindNumber(id: string, cb: (v: number | null) => void) {
  const el = document.getElementById(id) as HTMLInputElement;
  el.addEventListener('input', () => {
    const v = el.value === '' ? null : Number(el.value);
    cb(v == null || isNaN(v) ? null : v);
  });
}

// ---------- Keyboard --------------------------------------------------------

function setupKeyboard(state: State, ctx: ReturnType<typeof createScene>) {
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.code === 'Space') {
      state.playing = !state.playing;
      const b = document.getElementById('btn-play')!;
      b.textContent = state.playing ? '⏸' : '▶';
      e.preventDefault();
    } else if (e.key === 'f' || e.key === 'F') {
      // Toggle follow on currently selected object.
      if (state.selected) {
        if (state.followed) {
          state.followed = null;
          (document.getElementById('follow-hint') as HTMLElement).hidden = true;
        } else {
          state.followed = state.selected;
          (document.getElementById('follow-hint') as HTMLElement).hidden = false;
          (document.getElementById('follow-name') as HTMLElement).textContent = state.selected.name;
        }
        writeUrl(state, ctx);
      }
    } else if (e.key === 'Escape') {
      state.selected = null;
      state.followed = null;
      (document.getElementById('rightpanel') as HTMLElement).hidden = true;
      (document.getElementById('follow-hint') as HTMLElement).hidden = true;
    }
  });
}

// ---------- Picking ---------------------------------------------------------

const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.005;
const mouse = new THREE.Vector2();

function setupPicking(state: State, ctx: ReturnType<typeof createScene>) {
  const canvas = ctx.renderer.domElement;
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, ctx.camera);

    // Hit planets first (sphere pick), then asteroids (point pick).
    const planetHits = raycaster.intersectObjects(
      Array.from(state.planets.meshes.values()),
      false,
    );
    if (planetHits.length > 0) {
      const m = planetHits[0].object as THREE.Mesh;
      const name = (m.userData as any).planetName ?? m.name;
      const planetName = m.name;
      selectObject(state, { kind: 'planet', pdes: planetName, name: planetName }, ctx);
      return;
    }

    // Asteroids — pick by threshold on Points.
    const hits = raycaster.intersectObject(state.cloud.points, false);
    if (hits.length > 0) {
      const idx = hits[0].index ?? -1;
      if (idx >= 0) {
        const meta = state.data.packed.meta[idx];
        selectObject(
          state,
          { kind: 'asteroid', pdes: meta.pdes, name: meta.full_name },
          ctx,
        );
      }
    }
  });

  // Tag planet meshes with their names for pick resolution.
  for (const [name, mesh] of state.planets.meshes) mesh.name = name;
}

// ---------- Filter ----------------------------------------------------------

function applyFilter(state: State, ctx: ReturnType<typeof createScene>) {
  // Recompute sizes + alpha + flags for the entire cloud, so we keep a single
  // mesh. Hidden asteroids get sizes ~0 so they don't appear; visible ones
  // stay.
  const f = state.filter;
  const N = state.data.packed.count;
  const sizes = state.cloud.sizes.array as Float32Array;
  const alphas = state.cloud.alphas.array as Float32Array;
  const flags = state.cloud.flags.array as Float32Array;
  const meta = state.data.packed.meta;
  const sentry = state.data.packed.sentryByPdes;

  for (let i = 0; i < N; i++) {
    const m = meta[i];
    let visible = true;
    if (f.neoOnly && !m.neo) visible = false;
    if (f.phaOnly && !m.pha) visible = false;
    if (f.sentryOnly && !sentry[m.pdes]) visible = false;
    if (f.orbitClass && m.class !== f.orbitClass) visible = false;
    if (f.maxDiameter != null) {
      const d = m.diameter ?? estimateDiameter(m.H);
      if (d == null || d > f.maxDiameter) visible = false;
    }
    if (f.maxMoid != null) {
      if (m.moid == null || m.moid > f.maxMoid) visible = false;
    }
    if (f.minH != null) {
      if (m.H == null || m.H < f.minH) visible = false;
    }
    sizes[i] = visible ? baseSizeFor(m, sentry) : 0;
    alphas[i] = visible ? baseAlphaFor(m, sentry) : 0;
    flags[i] = visible ? baseFlagFor(m, sentry) : 0;
  }
  state.cloud.sizes.needsUpdate = true;
  state.cloud.alphas.needsUpdate = true;
  state.cloud.flags.needsUpdate = true;

  // Recompute visible count stat.
  updateVisibleStat(state);
}

function estimateDiameter(H: number | null): number | null {
  if (H == null) return null;
  // Rough H→km assuming albedo 0.15 (median NEO albedo).
  // D = 1329 / sqrt(p) * 10^(-H/5), p=0.15 → 1329/sqrt(0.15) ≈ 3430.
  return 3430 * Math.pow(10, -H / 5);
}

function baseSizeFor(m: Meta, sentry: Record<string, unknown>): number {
  const sBase = (() => {
    if (m.diameter != null) {
      const d = Math.max(0.05, Math.min(50, m.diameter));
      const s = Math.log10(d + 1);
      return clamp(0.6 + ((s - 0.7) / 1.0) * 4.0, 0.6, 5.0);
    }
    if (m.H != null) {
      const h = clamp(m.H, 10, 28);
      return clamp(0.8 + (28 - h) * 0.18, 0.6, 5.0);
    }
    return 0.7;
  })();
  // Bump sentry/PHA so they read as "important".
  if (m.pha) return Math.max(sBase, 1.4);
  if (sentry[m.pdes]) return Math.max(sBase, 1.2);
  return sBase;
}
function baseAlphaFor(m: Meta, sentry: Record<string, unknown>): number {
  if (m.pha) return 0.95;
  if (sentry[m.pdes]) return 0.9;
  if (m.H != null && m.H < 18) return 0.85;
  return 0.6;
}
function baseFlagFor(
  m: Meta,
  sentry: Record<string, unknown>,
): number {
  const isSentry = !!sentry[m.pdes];
  if (m.pha && isSentry) return 3;
  if (isSentry) return 2;
  if (m.pha) return 1;
  return 0;
}

// ---------- Orbit path overlay ---------------------------------------------

let currentOrbitLine: THREE.Line | null = null;

function applyOrbitLines(state: State, ctx: ReturnType<typeof createScene>) {
  // Remove previous
  if (currentOrbitLine) {
    ctx.scene.remove(currentOrbitLine);
    currentOrbitLine.geometry.dispose();
    (currentOrbitLine.material as THREE.Material).dispose();
    currentOrbitLine = null;
  }
  if (state.showOrbits && state.selected && state.selected.kind === 'asteroid') {
    const line = buildOrbitPath(state.data.packed, state.selected.pdes);
    if (line) {
      ctx.scene.add(line);
      currentOrbitLine = line;
    }
  }
}

// ---------- Detail panel ----------------------------------------------------

function selectObject(
  state: State,
  obj: SelectedObject,
  ctx: ReturnType<typeof createScene>,
) {
  state.selected = obj;
  renderDetail(state);
  applyOrbitLines(state, ctx);
  (document.getElementById('rightpanel') as HTMLElement).hidden = false;
  writeUrl(state, ctx);
}

function renderDetail(state: State) {
  const obj = state.selected;
  if (!obj) return;
  const panel = document.getElementById('rightpanel')!;
  const title = document.getElementById('detail-title')!;
  const body = document.getElementById('detail-body')!;
  title.textContent = obj.name;

  let html = '';
  if (obj.kind === 'planet') {
    const p = state.data.planets.find((x) => x.name === obj.pdes);
    if (p) html = renderPlanetDetail(p);
  } else if (obj.kind === 'asteroid') {
    const i = state.data.packed.indexByPdes.get(obj.pdes);
    if (i != null) {
      const m = state.data.packed.meta[i];
      const o = state.data.packed.orbit;
      const off = i * 14;
      const sentry = state.data.packed.sentryByPdes[obj.pdes] ?? null;
      const cas = state.data.packed.closeApproachesByPdes[obj.pdes] ?? [];
      html = renderAsteroidDetail(m, o, off, sentry, cas, state);
    }
  }
  body.innerHTML = html;

  // Wire follow button.
  const followBtn = body.querySelector('.follow-btn');
  if (followBtn) {
    followBtn.addEventListener('click', () => {
      if (state.followed && state.followed.pdes === obj.pdes) {
        state.followed = null;
        (document.getElementById('follow-hint') as HTMLElement).hidden = true;
      } else {
        state.followed = obj;
        (document.getElementById('follow-hint') as HTMLElement).hidden = false;
        (document.getElementById('follow-name') as HTMLElement).textContent = obj.name;
      }
      writeUrl(state, activeCtx ?? undefined);
    });
  }
}

function renderPlanetDetail(p: Planet): string {
  return `
    <div class="detail-section">
      <div class="h">Identity</div>
      <div class="detail-grid">
        <span class="k">Type</span><span class="v">Planet</span>
        <span class="k">Radius</span><span class="v">${formatKm(p.radius_km)}</span>
      </div>
    </div>
    <div class="detail-section">
      <div class="h">Orbit (J2000)</div>
      <div class="detail-grid">
        <span class="k">Semi-major axis</span><span class="v">${formatAu(p.a)}</span>
        <span class="k">Eccentricity</span><span class="v">${formatNumber(p.e)}</span>
        <span class="k">Inclination</span><span class="v">${formatNumber(p.i)}°</span>
        <span class="k">Long. asc. node (Ω)</span><span class="v">${formatNumber(p.om)}°</span>
        <span class="k">Arg. perihelion (ω)</span><span class="v">${formatNumber(p.w)}°</span>
        <span class="k">Mean anomaly</span><span class="v">${formatNumber(p.ma)}°</span>
        <span class="k">Period</span><span class="v">${formatDays(p.per)}</span>
      </div>
    </div>
  `;
}

function renderAsteroidDetail(
  m: Meta,
  o: Float32Array,
  off: number,
  sentry: Sentry | null,
  cas: CloseApproach[],
  state: State,
): string {
  const a = o[off + 0];
  const e = o[off + 1];
  const epoch = o[off + 4];
  // n can be negative for retrograde orbits; |period| is the orbital period.
  const per = (2 * Math.PI) / Math.abs(o[off + 2]);
  // Wrap angles to 0-360 for display (raw i/om/w can be many revolutions).
  const iDeg = wrap360(o[off + 11]);
  const omDeg = wrap360(o[off + 12]);
  const wDeg = wrap360(o[off + 13]);
  const tags: string[] = [];
  if (m.pha) tags.push('<span class="detail-tag pha">PHA</span>');
  if (m.neo) tags.push('<span class="detail-tag">NEO</span>');
  if (m.class) tags.push(`<span class="detail-tag">${m.class}</span>`);
  if (sentry) {
    if (sentry.ts_max && sentry.ts_max > 0) {
      tags.push(`<span class="detail-tag torino">Torino ${sentry.ts_max}</span>`);
    } else {
      tags.push(`<span class="detail-tag sentry">Sentry</span>`);
    }
  }

  const approachCount = cas.length;
  const nowJd = state.time;
  // Show approaches closest in time to the current sim time, but mix in the
  // closest-by-distance ones when nothing is near "now".
  const upcoming = cas
    .filter((c) => c.j >= nowJd - 30)
    .sort((a, b) => a.j - b.j)
    .slice(0, 8);
  let shown = upcoming;
  if (shown.length < 5) {
    const closest = [...cas].sort((a, b) => a.d - b.d).slice(0, 8);
    shown = closest;
  }
  const pastApproachesHtml = shown.length
    ? shown
        .map((c) => {
          const hot = c.d < 0.05;
          const past = c.j < nowJd - 1;
          const date = formatDate(c.j);
          return `<div class="row${hot ? ' hot' : ''}">
            <span class="date">${date.slice(0, 16)}${past ? ' (past)' : ''}</span>
            <span class="dist">${c.d.toFixed(4)} au</span>
            <span class="v">${(c.v ?? 0).toFixed(1)} km/s</span>
          </div>`;
        })
        .join('')
    : `<div class="row"><span class="date">No close approaches in dataset</span></div>`;

  const followedHere = state.followed && state.followed.pdes === m.pdes;

  return `
    <div class="detail-section">
      <div class="h">Identity</div>
      <div class="detail-grid">
        <span class="k">Designation</span><span class="v">${m.pdes}</span>
        ${m.name ? `<span class="k">Name</span><span class="v">${m.name}</span>` : ''}
        ${m.spkid ? `<span class="k">SPK-ID</span><span class="v">${m.spkid}</span>` : ''}
        <span class="k">Class</span><span class="v">${m.class ?? '—'}</span>
      </div>
      <div class="detail-tags">${tags.join('')}</div>
      <div style="margin-top:8px"><button class="ctl-btn follow-btn">${followedHere ? 'Unfollow' : 'Follow (F)'}</button></div>
    </div>

    <div class="detail-section">
      <div class="h">Orbit (J2000)</div>
      <div class="detail-grid">
        <span class="k">Semi-major axis (a)</span><span class="v">${formatAu(a)}</span>
        <span class="k">Eccentricity (e)</span><span class="v">${formatNumber(e)}</span>
        <span class="k">Inclination (i)</span><span class="v">${formatNumber(iDeg)}°</span>
        <span class="k">Long. asc. node (Ω)</span><span class="v">${formatNumber(omDeg)}°</span>
        <span class="k">Arg. perihelion (ω)</span><span class="v">${formatNumber(wDeg)}°</span>
        <span class="k">Period</span><span class="v">${formatDays(per)}</span>
        <span class="k">Perihelion</span><span class="v">${formatAu(a * (1 - e))}</span>
        <span class="k">Aphelion</span><span class="v">${formatAu(a * (1 + e))}</span>
        <span class="k">MOID</span><span class="v">${m.moid != null ? formatAu(m.moid) : '—'}</span>
        <span class="k">Epoch</span><span class="v">JD ${epoch.toFixed(2)}</span>
      </div>
    </div>

    <div class="detail-section">
      <div class="h">Physical</div>
      <div class="detail-grid">
        <span class="k">Diameter</span><span class="v">${m.diameter != null ? `${formatNumber(m.diameter)} km` : '—'}</span>
        <span class="k">H (abs. mag.)</span><span class="v">${m.H != null ? formatNumber(m.H) : '—'}</span>
        <span class="k">Albedo</span><span class="v">${m.albedo != null ? formatNumber(m.albedo) : '—'}</span>
        <span class="k">Rot. period</span><span class="v">${m.rot_per != null ? `${formatNumber(m.rot_per)} h` : '—'}</span>
        <span class="k">Spec. (B/T)</span><span class="v">${(m.spec_B ?? '—') + ' / ' + (m.spec_T ?? '—')}</span>
        <span class="k">First obs.</span><span class="v">${m.first_obs ?? '—'}</span>
      </div>
    </div>

    ${
      sentry
        ? `<div class="detail-section">
      <div class="h">Sentry impact risk</div>
      <div class="detail-grid">
        <span class="k">Cumulative P<sub>impact</sub></span><span class="v">${sentry.ip != null ? sentry.ip.toExponential(2) : '—'}</span>
        <span class="k">Palermo (cum)</span><span class="v">${formatNumber(sentry.ps_cum)}</span>
        <span class="k">Palermo (max)</span><span class="v">${formatNumber(sentry.ps_max)}</span>
        <span class="k">Torino (max)</span><span class="v">${sentry.ts_max ?? '—'}</span>
        <span class="k">Potential impacts</span><span class="v">${sentry.n_imp ?? '—'}</span>
        <span class="k">Year range</span><span class="v">${sentry.range ?? '—'}</span>
        <span class="k">V<sub>∞</sub></span><span class="v">${sentry.v_inf != null ? formatNumber(sentry.v_inf) + ' km/s' : '—'}</span>
        <span class="k">Last observed</span><span class="v">${sentry.last_obs ?? '—'}</span>
      </div>
    </div>`
        : ''
    }

    <div class="detail-section">
      <div class="h">Close approaches to Earth (${approachCount} in dataset)</div>
      ${state.showApproaches ? `<div class="approaches">${pastApproachesHtml}</div>` : `<div style="font-size:11px;color:var(--fg-2);margin-top:4px">Toggle "Show close approaches" to see the nearest events in time.</div>`}
    </div>
  `;
}

// (degree-element fields i, om, w are now stored at offsets +11/+12/+13 of the
// packed orbit buffer so we can render them in the detail panel without
// re-fetching the source JSON.)

// ---------- Resolution / selection helpers ---------------------------------

function resolveSelection(state: State, key: string): SelectedObject | null {
  // Try planet first.
  const planet = state.data.planets.find((p) => p.name === key);
  if (planet) return { kind: 'planet', pdes: planet.name, name: planet.name };
  // Try asteroid.
  const idx = state.data.packed.indexByPdes.get(key);
  if (idx != null) {
    return {
      kind: 'asteroid',
      pdes: key,
      name: state.data.packed.meta[idx].full_name,
    };
  }
  // Try by name (lazy match).
  for (let i = 0; i < state.data.packed.meta.length; i++) {
    const m = state.data.packed.meta[i];
    if (m.name === key || m.full_name === key) {
      return { kind: 'asteroid', pdes: m.pdes, name: m.full_name };
    }
  }
  return null;
}

function positionOf(state: State, sel: SelectedObject): THREE.Vector3 | null {
  if (sel.kind === 'planet') {
    const p = state.data.planets.find((x) => x.name === sel.pdes);
    if (!p) return null;
    const prop = buildEllipticProp(p);
    const o = [0, 0, 0];
    propagateElliptic(prop, state.time, o);
    return new THREE.Vector3(o[0], o[1], o[2]);
  } else if (sel.kind === 'asteroid') {
    const i = state.data.packed.indexByPdes.get(sel.pdes);
    if (i == null) return null;
    const o = state.cloud.rawPositions;
    return new THREE.Vector3(o[i * 3 + 0], o[i * 3 + 1], o[i * 3 + 2]);
  }
  return null;
}

function searchAsteroids(
  state: State,
  q: string,
  limit: number,
): Meta[] {
  const out: Meta[] = [];
  const meta = state.data.packed.meta;
  const lower = q.toLowerCase();
  // First: pdes exact-prefix matches
  for (let i = 0; i < meta.length && out.length < limit; i++) {
    if (meta[i].pdes.toLowerCase().startsWith(lower)) out.push(meta[i]);
  }
  // Then: name contains
  for (let i = 0; i < meta.length && out.length < limit; i++) {
    const m = meta[i];
    if (out.indexOf(m) !== -1) continue;
    const n = (m.name ?? '').toLowerCase();
    if (n && n.includes(lower)) {
      out.push(m);
      continue;
    }
    if (m.full_name.toLowerCase().includes(lower)) out.push(m);
  }
  return out;
}

// ---------- Label update ----------------------------------------------------

function updatePlanetLabels(
  camera: THREE.Camera,
  planets: PlanetObjects,
) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const v = new THREE.Vector3();
  for (const [, lbl] of planets.labels) {
    v.copy(lbl.world).project(camera);
    const x = (v.x * 0.5 + 0.5) * w;
    const y = (-v.y * 0.5 + 0.5) * h;
    const visible = v.z > -1 && v.z < 1;
    lbl.el.style.left = `${x}px`;
    lbl.el.style.top = `${y}px`;
    lbl.el.style.display = visible ? 'block' : 'none';
  }
}

// ---------- Boot ------------------------------------------------------------

window.addEventListener('DOMContentLoaded', () => {
  boot().catch((err) => {
    console.error(err);
    setLoaderMsg('Failed: ' + (err?.message ?? err));
  });
});
