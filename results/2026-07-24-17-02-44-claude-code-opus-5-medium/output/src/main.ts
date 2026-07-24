/**
 * Near-Earth Space — an interactive 3D view of the inner solar system and the
 * ~42,000 catalogued near-Earth objects, propagated from orbital elements.
 */
import './style.css';
import * as THREE from 'three';
import { World, PLANET_STYLE } from './world';
import { AsteroidCloud, CometCloud, CLASS_LABEL, type ColorMode } from './clouds';
import { PickIndex } from './pick';
import {
  loadAll,
  asteroidElements,
  cometElements,
  P,
  PHYS_COLS,
  type Dataset,
} from './data';
import {
  applyFilters,
  defaultFilters,
  rankSample,
  sliderToA,
  sliderToDiam,
  sliderToMoid,
  type Filters,
} from './filters';
import {
  renderDetail,
  selectionFromKey,
  selectionKey,
  selectionName,
  selectionPosition,
  type Selection,
} from './detail';
import { formatDate, isoDate, sampleOrbit, tFromDate } from './astro';
import { clamp, logScale } from './helpers';
import { escapeHtml, fmt, fmtInt, fmtSize, torinoColor } from './format';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const T_MIN = tFromDate(new Date(Date.UTC(1900, 0, 1)));
const T_MAX = tFromDate(new Date(Date.UTC(2199, 11, 31)));
const RATE_MIN = 0.002; // days per second
const RATE_MAX = 4000;

/* ------------------------------------------------------------------ state */

interface AppState {
  t: number;
  playing: boolean;
  rate: number; // days per real second (signed)
  follow: boolean;
  selection: Selection;
  showOrbit: boolean;
  colorMode: ColorMode;
  showComets: boolean;
  highlightTab: 'approach' | 'risk' | 'big';
}

const state: AppState = {
  t: tFromDate(new Date()),
  playing: true,
  rate: 0.5,
  follow: false,
  selection: null,
  showOrbit: true,
  colorMode: 'hazard',
  showComets: false,
  highlightTab: 'approach',
};

let filters: Filters = defaultFilters();

/* ------------------------------------------------------------------- boot */

async function boot() {
  const bar = $('loader-bar');
  const sub = $('loader-sub');
  const d = await loadAll((msg, frac) => {
    sub.textContent = msg;
    bar.style.width = `${(frac * 100).toFixed(0)}%`;
  });
  sub.textContent = 'building the scene…';
  bar.style.width = '97%';
  await new Promise((r) => setTimeout(r, 0));
  run(d);
  bar.style.width = '100%';
  $('loader').classList.add('done');
  setTimeout(() => $('loader').remove(), 700);
}

boot().catch((err) => {
  console.error(err);
  $('loader-sub').textContent = `failed to load: ${err.message}`;
});

/* ------------------------------------------------------------------- app */

function run(d: Dataset) {
  const canvas = $<HTMLCanvasElement>('view');
  const world = new World(canvas, d.planets);
  const asteroids = new AsteroidCloud(d);
  const comets = new CometCloud(d);
  const picker = new PickIndex(d);
  world.scene.add(asteroids.points, comets.points);

  /* ---- selection visuals ---- */
  const orbitLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x59c8ff, transparent: true, opacity: 0.85 })
  );
  orbitLine.frustumCulled = false;
  orbitLine.renderOrder = 5;
  orbitLine.visible = false;
  world.scene.add(orbitLine);

  const ringGeom = new THREE.BufferGeometry();
  {
    const pts: number[] = [];
    for (let k = 0; k <= 64; k++) {
      const a = (k / 64) * Math.PI * 2;
      pts.push(Math.cos(a), Math.sin(a), 0);
    }
    ringGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
  }
  const selRing = new THREE.LineLoop(
    ringGeom,
    new THREE.LineBasicMaterial({ color: 0x59c8ff, transparent: true, opacity: 0.9, depthTest: false })
  );
  selRing.renderOrder = 6;
  selRing.visible = false;
  world.scene.add(selRing);

  /* ---- precomputed highlight indices ---- */
  const caByTime = new Uint32Array(d.ca.count);
  for (let k = 0; k < d.ca.count; k++) caByTime[k] = k;
  {
    const jd = d.ca.jd;
    Array.prototype.sort.call(caByTime, (a: number, b: number) => jd[a] - jd[b]);
  }
  const biggest = Array.from({ length: d.ast.count }, (_, k) => k)
    .filter((k) => Number.isFinite(d.ast.phys[k * PHYS_COLS + P.diameter]))
    .sort((a, b) => d.ast.phys[b * PHYS_COLS + P.diameter] - d.ast.phys[a * PHYS_COLS + P.diameter])
    .slice(0, 80);

  /* ------------------------------------------------------------ filtering */

  let visibleCount = d.ast.count;
  let sampleRows: number[] = [];

  function refilter() {
    const res = applyFilters(d, filters, asteroids.visible);
    asteroids.markVisibleDirty();
    visibleCount = res.count;
    sampleRows = rankSample(d, res.sample, filters.query);
    $('visible-count').textContent = fmtInt(res.count);
    $('visible-total').textContent = `of ${fmtInt(d.ast.count)} near-Earth objects shown`;
    renderResults();
  }

  /* -------------------------------------------------------------- results */

  function rowHtml(k: number, meta: string, sel: boolean): string {
    return `<div class="res${sel ? ' sel' : ''}" data-row="${k}">
      <span class="res-name">${escapeHtml(d.ast.meta.display[k])}</span>
      <span class="res-meta">${meta}</span></div>`;
  }

  function renderResults() {
    const host = $('search-results');
    if (!filters.query && visibleCount === d.ast.count) {
      host.innerHTML = `<div class="empty">Type a name or designation, or narrow the filters below.</div>`;
      return;
    }
    if (sampleRows.length === 0) {
      host.innerHTML = `<div class="empty">Nothing matches these filters.</div>`;
      return;
    }
    const selRow = state.selection?.kind === 'asteroid' ? state.selection.index : -1;
    host.innerHTML = sampleRows
      .map((k) => rowHtml(k, fmtSize(d.ast.phys[k * PHYS_COLS + P.diameter]), k === selRow))
      .join('');
  }

  $('search-results').addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('.res') as HTMLElement | null;
    if (!el) return;
    select({ kind: 'asteroid', index: +el.dataset.row! }, true);
  });

  /* ----------------------------------------------------------- highlights */

  function renderHighlights() {
    const host = $('highlight-list');
    if (state.highlightTab === 'approach') {
      // first upcoming approaches at the current clock time
      let lo = 0;
      let hi = d.ca.count;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (d.ca.jd[caByTime[mid]] < state.t) lo = mid + 1;
        else hi = mid;
      }
      const rows: string[] = [];
      for (let j = lo; j < Math.min(d.ca.count, lo + 60); j++) {
        const idx = caByTime[j];
        const row = d.ca.row[idx];
        const dist = d.ca.data[idx * 3];
        rows.push(`<div class="res" data-row="${row}" data-jd="${d.ca.jd[idx]}">
            <span class="res-name">${escapeHtml(d.ast.meta.display[row])}</span>
            <span class="res-meta">${formatDate(d.ca.jd[idx]).slice(3)} · ${(dist / 0.00256955529).toFixed(1)} LD</span>
          </div>`);
      }
      host.innerHTML = rows.length
        ? rows.join('')
        : `<div class="empty">No further approaches on record after this date.</div>`;
    } else if (state.highlightTab === 'risk') {
      host.innerHTML = d.sentry
        .slice(0, 60)
        .map((s) => {
          const label = s.row >= 0 ? d.ast.meta.display[s.row] : s.fullname || s.des;
          return `<div class="res" ${s.row >= 0 ? `data-row="${s.row}"` : ''}>
            <span class="res-name">${escapeHtml(label)}</span>
            <span class="res-meta" style="color:${torinoColor(s.ts_max)}">PS ${fmt(s.ps_cum, 2)} · ${
              s.range ?? ''
            }</span></div>`;
        })
        .join('');
    } else {
      host.innerHTML = biggest
        .map((k) => rowHtml(k, fmtSize(d.ast.phys[k * PHYS_COLS + P.diameter]), false))
        .join('');
    }
  }

  $('highlight-list').addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('.res') as HTMLElement | null;
    if (!el || !el.dataset.row) return;
    if (el.dataset.jd) setTime(+el.dataset.jd);
    select({ kind: 'asteroid', index: +el.dataset.row }, true);
  });

  document.querySelectorAll<HTMLElement>('.tab[data-hl]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab[data-hl]').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      state.highlightTab = tab.dataset.hl as AppState['highlightTab'];
      renderHighlights();
    });
  });

  /* ------------------------------------------------------------ selection */

  let detailDirtyAt = 0;

  function select(sel: Selection, frameIt = false) {
    state.selection = sel;
    asteroids.setSelected(sel?.kind === 'asteroid' ? sel.index : -1);
    comets.setSelected(sel?.kind === 'comet' ? sel.index : -1);
    updateOrbitLine();
    renderDetailPanel();
    renderResults();
    if (frameIt && sel) frameSelection();
    syncUrl();
  }

  function updateOrbitLine() {
    const sel = state.selection;
    if (!sel || !state.showOrbit || sel.kind === 'sun') {
      orbitLine.visible = false;
      return;
    }
    let pts: Float32Array;
    if (sel.kind === 'asteroid') pts = sampleOrbit(asteroidElements(d, sel.index), 512);
    else if (sel.kind === 'comet') pts = sampleOrbit(cometElements(d, sel.index), 640, 45);
    else {
      orbitLine.visible = false; // planet orbits already drawn
      return;
    }
    if (pts.length < 6) {
      orbitLine.visible = false;
      return;
    }
    orbitLine.geometry.dispose();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    orbitLine.geometry = g;
    orbitLine.visible = true;
  }

  function frameSelection() {
    const sel = state.selection;
    if (!sel) return;
    const p = selectionPosition(d, sel, state.t);
    const target = new THREE.Vector3(p.x, p.y, p.z);
    const dist = clamp(world.camera.position.distanceTo(world.controls.target), 0.02, 3.5);
    const dir = new THREE.Vector3().subVectors(world.camera.position, world.controls.target).normalize();
    if (dir.lengthSq() < 1e-6) dir.set(0, -1, 0.5).normalize();
    world.controls.target.copy(target);
    world.camera.position.copy(target).addScaledVector(dir, dist);
  }

  function renderDetailPanel() {
    const panel = $('right');
    const host = $('detail');
    if (!state.selection) {
      panel.classList.add('hidden');
      host.innerHTML = '';
      return;
    }
    const scroll = host.scrollTop;
    panel.classList.remove('hidden');
    host.innerHTML = renderDetail(d, state.selection, state.t);
    host.scrollTop = scroll;
    detailDirtyAt = performance.now();
  }

  $('detail').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
    if (btn) {
      const act = btn.dataset.act;
      if (act === 'focus') {
        state.follow = true;
        $<HTMLInputElement>('f-follow').checked = true;
        frameSelection();
        syncUrl();
      } else if (act === 'orbit') {
        state.showOrbit = !state.showOrbit;
        updateOrbitLine();
      } else if (act === 'next-ca') {
        jumpToNextApproach();
      }
      return;
    }
    const tr = (e.target as HTMLElement).closest('tr[data-jd]') as HTMLElement | null;
    if (tr) {
      setTime(+tr.dataset.jd!);
      state.playing = false;
      updatePlayButton();
    }
  });

  $('detail-close').addEventListener('click', () => select(null));

  function jumpToNextApproach() {
    const sel = state.selection;
    if (sel?.kind !== 'asteroid') return;
    const off = d.ast.caOffset[sel.index];
    const n = d.ast.caCount[sel.index];
    for (let j = off; j < off + n; j++) {
      if (d.ca.jd[j] >= state.t) {
        setTime(d.ca.jd[j]);
        state.playing = false;
        updatePlayButton();
        return;
      }
    }
    toast('No further approaches on record for this object.');
  }

  /* -------------------------------------------------------------- picking */

  const vp = new THREE.Matrix4();
  function updateVP() {
    vp.multiplyMatrices(world.camera.projectionMatrix, world.camera.matrixWorldInverse);
  }

  function pickAt(sx: number, sy: number): Selection {
    updateVP();
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // planets & Sun first — they are big, obvious targets
    let best: Selection = null;
    let bestD2 = 18 * 18;
    const v = new THREE.Vector3();
    const testBody = (pos: THREE.Vector3, sel: Selection) => {
      v.copy(pos).applyMatrix4(vp);
      if (v.z < -1 || v.z > 1) return;
      const px = (v.x + 1) * (w / 2);
      const py = (1 - v.y) * (h / 2);
      const d2 = (px - sx) ** 2 + (py - sy) ** 2;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = sel;
      }
    };
    world.planetPos.forEach((p, k) => testBody(p, { kind: 'planet', index: k }));
    testBody(new THREE.Vector3(0, 0, 0), { kind: 'sun' });
    if (best) return best;

    if (state.showComets) {
      const c = picker.pickComet(comets.visible, state.t, vp, w, h, sx, sy, 11);
      if (c >= 0) return { kind: 'comet', index: c };
    }
    const a = picker.pickAsteroid(asteroids.visible, state.t, vp, w, h, sx, sy, 11);
    if (a >= 0) return { kind: 'asteroid', index: a };
    return null;
  }

  let downAt = { x: 0, y: 0, time: 0 };
  canvas.addEventListener('pointerdown', (e) => {
    downAt = { x: e.clientX, y: e.clientY, time: performance.now() };
  });
  canvas.addEventListener('pointerup', (e) => {
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    if (moved > 4 || performance.now() - downAt.time > 600) return;
    const r = canvas.getBoundingClientRect();
    const sel = pickAt(e.clientX - r.left, e.clientY - r.top);
    select(sel, false);
  });

  /* --------------------------------------------------------------- hover */

  const hoverEl = $('hover');
  let hoverPending: number | null = null;
  let lastHover = 0;
  canvas.addEventListener('pointermove', (e) => {
    if (e.buttons !== 0) {
      hoverEl.classList.add('hidden');
      return;
    }
    const now = performance.now();
    if (now - lastHover < 90) {
      if (hoverPending !== null) clearTimeout(hoverPending);
      hoverPending = window.setTimeout(() => doHover(e.clientX, e.clientY), 90);
      return;
    }
    lastHover = now;
    doHover(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointerleave', () => hoverEl.classList.add('hidden'));

  function doHover(cx: number, cy: number) {
    const r = canvas.getBoundingClientRect();
    const sel = pickAt(cx - r.left, cy - r.top);
    if (!sel) {
      hoverEl.classList.add('hidden');
      canvas.style.cursor = 'default';
      return;
    }
    canvas.style.cursor = 'pointer';
    hoverEl.classList.remove('hidden');
    hoverEl.style.left = `${cx - r.left}px`;
    hoverEl.style.top = `${cy - r.top}px`;
    hoverEl.innerHTML = hoverHtml(sel);
  }

  function hoverHtml(sel: Selection): string {
    if (!sel) return '';
    const name = escapeHtml(selectionName(d, sel));
    if (sel.kind === 'asteroid') {
      const k = sel.index;
      const cls = d.ast.meta.classes[d.ast.flags[k * 3 + 1]];
      const pha = d.ast.flags[k * 3] === 1;
      const dm = d.ast.phys[k * PHYS_COLS + P.diameter];
      return `<div>${name}</div><div class="h-sub">${cls} · ${fmtSize(dm)}${
        pha ? ' · <span style="color:#ff5470">PHA</span>' : ''
      }</div>`;
    }
    if (sel.kind === 'comet') {
      const cls = d.comets.meta.classes[d.comets.flags[sel.index]];
      return `<div>${name}</div><div class="h-sub">comet · ${cls}</div>`;
    }
    return `<div>${name}</div><div class="h-sub">${sel.kind}</div>`;
  }

  /* ----------------------------------------------------------------- time */

  function setTime(t: number, fromUi = false) {
    state.t = clamp(t, T_MIN, T_MAX);
    if (!fromUi) syncTimeInputs();
    renderDetailPanel();
    if (state.highlightTab === 'approach') renderHighlights();
    syncUrl();
  }

  $('scrub-min').textContent = '1900';
  $('scrub-max').textContent = '2199';

  function syncTimeInputs() {
    $<HTMLInputElement>('date-input').value = isoDate(state.t);
    $<HTMLInputElement>('scrub').value = String(((state.t - T_MIN) / (T_MAX - T_MIN)) * 1000);
  }

  function updatePlayButton() {
    $('btn-play').textContent = state.playing ? '❚❚' : '▶';
  }

  function rateLabel(r: number): string {
    const a = Math.abs(r);
    const sign = r < 0 ? '−' : '';
    if (a < 1 / 24) return `${sign}${(a * 24 * 60).toFixed(0)} min/s`;
    if (a < 1) return `${sign}${(a * 24).toFixed(1)} h/s`;
    if (a < 365) return `${sign}${a.toFixed(a < 10 ? 2 : 0)} d/s`;
    return `${sign}${(a / 365.25).toFixed(2)} yr/s`;
  }

  $('btn-play').addEventListener('click', () => {
    state.playing = !state.playing;
    updatePlayButton();
  });
  $('btn-step-fwd').addEventListener('click', () => setTime(state.t + Math.max(1, state.rate * 5)));
  $('btn-step-back').addEventListener('click', () => setTime(state.t - Math.max(1, state.rate * 5)));
  $('btn-now').addEventListener('click', () => setTime(tFromDate(new Date())));

  $('date-input').addEventListener('change', (e) => {
    const v = (e.target as HTMLInputElement).value;
    if (!v) return;
    const parts = v.split('-').map(Number);
    setTime(tFromDate(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))), true);
    $<HTMLInputElement>('scrub').value = String(((state.t - T_MIN) / (T_MAX - T_MIN)) * 1000);
  });

  $('scrub').addEventListener('input', (e) => {
    const v = +(e.target as HTMLInputElement).value / 1000;
    setTime(T_MIN + v * (T_MAX - T_MIN), true);
    $<HTMLInputElement>('date-input').value = isoDate(state.t);
  });

  const speedEl = $<HTMLInputElement>('speed');
  function applySpeed() {
    const v = +speedEl.value;
    const mag = Math.abs(v) / 100;
    state.rate = mag < 0.02 ? 0 : Math.sign(v) * logScale(mag, RATE_MIN, RATE_MAX);
    $('speed-label').textContent = state.rate === 0 ? 'paused' : rateLabel(state.rate);
    syncUrl();
  }
  speedEl.addEventListener('input', applySpeed);

  $<HTMLInputElement>('f-follow').addEventListener('change', (e) => {
    state.follow = (e.target as HTMLInputElement).checked;
    if (state.follow && state.selection) frameSelection();
    syncUrl();
  });

  /* ------------------------------------------------------------- filter ui */

  const chipHost = $('f-class');
  const classCounts = new Map<string, number>();
  for (let k = 0; k < d.ast.count; k++) {
    const c = d.ast.meta.classes[d.ast.flags[k * 3 + 1]];
    classCounts.set(c, (classCounts.get(c) ?? 0) + 1);
  }
  chipHost.innerHTML = [...classCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(
      ([c, n]) =>
        `<span class="chip" data-class="${escapeHtml(c)}" title="${escapeHtml(
          CLASS_LABEL[c] ?? c
        )} — ${fmtInt(n)} objects">${escapeHtml(c)}</span>`
    )
    .join('');
  chipHost.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('.chip') as HTMLElement | null;
    if (!el) return;
    const c = el.dataset.class!;
    if (filters.classes.has(c)) filters.classes.delete(c);
    else filters.classes.add(c);
    el.classList.toggle('on');
    refilter();
    syncUrl();
  });

  const bindCheck = (id: string, key: 'pha' | 'sentry' | 'named' | 'approach') => {
    $<HTMLInputElement>(id).addEventListener('change', (e) => {
      filters[key] = (e.target as HTMLInputElement).checked;
      refilter();
      syncUrl();
    });
  };
  bindCheck('f-pha', 'pha');
  bindCheck('f-sentry', 'sentry');
  bindCheck('f-named', 'named');
  bindCheck('f-approach', 'approach');

  const diamEl = $<HTMLInputElement>('f-diam-min');
  const moidEl = $<HTMLInputElement>('f-moid-max');
  const aEl = $<HTMLInputElement>('f-a-max');

  function syncRangeLabels() {
    $('f-diam-label').textContent = filters.minDiam <= 0 ? 'any' : `≥ ${fmtSize(filters.minDiam)}`;
    $('f-moid-label').textContent =
      filters.maxMoid === Infinity ? 'any' : `≤ ${filters.maxMoid.toFixed(4)} au`;
    $('f-a-label').textContent = filters.maxA === Infinity ? 'any' : `≤ ${filters.maxA.toFixed(2)} au`;
  }

  diamEl.addEventListener('input', () => {
    filters.minDiam = sliderToDiam(+diamEl.value);
    syncRangeLabels();
    refilter();
    syncUrl();
  });
  moidEl.addEventListener('input', () => {
    filters.maxMoid = sliderToMoid(+moidEl.value);
    syncRangeLabels();
    refilter();
    syncUrl();
  });
  aEl.addEventListener('input', () => {
    filters.maxA = sliderToA(+aEl.value);
    syncRangeLabels();
    refilter();
    syncUrl();
  });

  const searchEl = $<HTMLInputElement>('search');
  let searchTimer: number | null = null;
  searchEl.addEventListener('input', () => {
    if (searchTimer !== null) clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      filters.query = searchEl.value;
      refilter();
      syncUrl();
    }, 120);
  });

  $('btn-reset-filters').addEventListener('click', () => {
    filters = defaultFilters();
    searchEl.value = '';
    diamEl.value = '0';
    moidEl.value = '100';
    aEl.value = '100';
    ['f-pha', 'f-sentry', 'f-named', 'f-approach'].forEach((id) => ($<HTMLInputElement>(id).checked = false));
    chipHost.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
    syncRangeLabels();
    refilter();
    syncUrl();
  });

  /* ------------------------------------------------------------ display ui */

  const colorEl = $<HTMLSelectElement>('color-mode');
  function applyColorMode() {
    state.colorMode = colorEl.value as ColorMode;
    asteroids.setColorMode(state.colorMode);
    $('legend').innerHTML = AsteroidCloud.legendFor(state.colorMode)
      .map((l) => `<span><i style="background:${l.color}"></i>${escapeHtml(l.label)}</span>`)
      .join('');
    syncUrl();
  }
  colorEl.addEventListener('change', applyColorMode);

  $<HTMLInputElement>('d-comets').addEventListener('change', (e) => {
    state.showComets = (e.target as HTMLInputElement).checked;
    comets.points.visible = state.showComets;
    syncUrl();
  });
  $<HTMLInputElement>('d-orbits').addEventListener('change', (e) =>
    world.setOrbitsVisible((e.target as HTMLInputElement).checked)
  );
  $<HTMLInputElement>('d-ecliptic').addEventListener('change', (e) =>
    world.setGridVisible((e.target as HTMLInputElement).checked)
  );
  let showLabels = true;
  $<HTMLInputElement>('d-labels').addEventListener('change', (e) => {
    showLabels = (e.target as HTMLInputElement).checked;
    labelHost.style.display = showLabels ? '' : 'none';
  });

  const psizeEl = $<HTMLInputElement>('d-psize');
  function applyPointSize() {
    const s = (+psizeEl.value / 100) * 4.5;
    asteroids.setPointScale(s);
    comets.setPointScale(s * 1.2);
    $('d-psize-label').textContent = `${(+psizeEl.value / 100).toFixed(2)}×`;
  }
  psizeEl.addEventListener('input', applyPointSize);

  const bscaleEl = $<HTMLInputElement>('d-bscale');
  function applyBodyScale() {
    const v = +bscaleEl.value / 100;
    const s = v <= 0 ? 1 : logScale(v, 1, 6000);
    world.setBodyScale(s);
    $('d-bscale-label').textContent = s < 1.5 ? 'true scale' : `${fmtInt(s)}×`;
  }
  bscaleEl.addEventListener('input', applyBodyScale);

  /* ---------------------------------------------------------------- labels */

  const labelHost = $('labels');
  const labelEls: HTMLElement[] = [];
  for (let k = 0; k < d.planets.length; k++) {
    const el = document.createElement('div');
    el.className = 'label planet';
    el.innerHTML = `<span class="dot" style="color:${new THREE.Color(
      PLANET_STYLE[d.planets[k].name].color
    ).getStyle()}"></span>${d.planets[k].name}`;
    labelHost.appendChild(el);
    labelEls.push(el);
  }
  const sunLabel = document.createElement('div');
  sunLabel.className = 'label planet';
  sunLabel.textContent = 'Sun';
  labelHost.appendChild(sunLabel);
  const selLabel = document.createElement('div');
  selLabel.className = 'label sel';
  labelHost.appendChild(selLabel);

  const tmpV = new THREE.Vector3();
  function placeLabel(el: HTMLElement, pos: THREE.Vector3, offsetY: number) {
    tmpV.copy(pos).applyMatrix4(vp);
    if (tmpV.z < -1 || tmpV.z > 1 || Math.abs(tmpV.x) > 1.15 || Math.abs(tmpV.y) > 1.15) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    el.style.transform = `translate(-50%,-50%) translate(${((tmpV.x + 1) * w) / 2}px, ${
      ((1 - tmpV.y) * h) / 2 + offsetY
    }px)`;
  }

  /* ------------------------------------------------------------ deep links */

  let urlTimer: number | null = null;
  function syncUrl() {
    if (urlTimer !== null) return;
    urlTimer = window.setTimeout(() => {
      urlTimer = null;
      history.replaceState(null, '', buildUrl());
    }, 800);
  }

  function buildUrl(): string {
    const p = new URLSearchParams();
    p.set('t', state.t.toFixed(4));
    if (state.selection) p.set('s', selectionKey(state.selection));
    if (state.follow) p.set('fo', '1');
    if (state.showComets) p.set('cm', '1');
    if (state.colorMode !== 'hazard') p.set('cl', state.colorMode);
    p.set('r', state.rate.toFixed(4));
    const c = world.camera.position;
    const tg = world.controls.target;
    p.set(
      'v',
      [c.x, c.y, c.z, tg.x, tg.y, tg.z].map((n) => n.toFixed(4)).join(',')
    );
    const f: string[] = [];
    if (filters.pha) f.push('pha');
    if (filters.sentry) f.push('sen');
    if (filters.named) f.push('nam');
    if (filters.approach) f.push('ca');
    if (f.length) p.set('f', f.join(','));
    if (filters.classes.size) p.set('cls', [...filters.classes].join(','));
    if (filters.minDiam > 0) p.set('dm', diamEl.value);
    if (filters.maxMoid !== Infinity) p.set('mo', moidEl.value);
    if (filters.maxA !== Infinity) p.set('ax', aEl.value);
    if (filters.query) p.set('q', filters.query);
    return `${location.pathname}${location.search}#${p.toString()}`;
  }

  function readUrl() {
    const h = location.hash.replace(/^#/, '');
    if (!h) return;
    const p = new URLSearchParams(h);
    const t = parseFloat(p.get('t') ?? '');
    if (Number.isFinite(t)) state.t = clamp(t, T_MIN, T_MAX);
    const r = parseFloat(p.get('r') ?? '');
    if (Number.isFinite(r)) {
      state.rate = r;
      const mag = Math.abs(r) <= 0 ? 0 : Math.log(Math.abs(r) / RATE_MIN) / Math.log(RATE_MAX / RATE_MIN);
      speedEl.value = String(Math.sign(r) * clamp(mag, 0, 1) * 100);
    }
    state.follow = p.get('fo') === '1';
    $<HTMLInputElement>('f-follow').checked = state.follow;
    state.showComets = p.get('cm') === '1';
    $<HTMLInputElement>('d-comets').checked = state.showComets;
    comets.points.visible = state.showComets;
    const cl = p.get('cl');
    if (cl) colorEl.value = cl;
    const f = (p.get('f') ?? '').split(',');
    filters.pha = f.includes('pha');
    filters.sentry = f.includes('sen');
    filters.named = f.includes('nam');
    filters.approach = f.includes('ca');
    $<HTMLInputElement>('f-pha').checked = filters.pha;
    $<HTMLInputElement>('f-sentry').checked = filters.sentry;
    $<HTMLInputElement>('f-named').checked = filters.named;
    $<HTMLInputElement>('f-approach').checked = filters.approach;
    const cls = p.get('cls');
    if (cls)
      cls.split(',').forEach((c) => {
        filters.classes.add(c);
        chipHost.querySelector(`[data-class="${CSS.escape(c)}"]`)?.classList.add('on');
      });
    if (p.get('dm')) {
      diamEl.value = p.get('dm')!;
      filters.minDiam = sliderToDiam(+diamEl.value);
    }
    if (p.get('mo')) {
      moidEl.value = p.get('mo')!;
      filters.maxMoid = sliderToMoid(+moidEl.value);
    }
    if (p.get('ax')) {
      aEl.value = p.get('ax')!;
      filters.maxA = sliderToA(+aEl.value);
    }
    const q = p.get('q');
    if (q) {
      filters.query = q;
      searchEl.value = q;
    }
    const v = (p.get('v') ?? '').split(',').map(Number);
    if (v.length === 6 && v.every(Number.isFinite)) {
      world.camera.position.set(v[0], v[1], v[2]);
      world.controls.target.set(v[3], v[4], v[5]);
    }
    const s = p.get('s');
    if (s) state.selection = selectionFromKey(d, s);
  }

  $('btn-share').addEventListener('click', async () => {
    const url = location.origin + location.pathname + location.search + '#' + buildUrl().split('#')[1];
    try {
      await navigator.clipboard.writeText(url);
      toast('View link copied to clipboard');
    } catch {
      history.replaceState(null, '', buildUrl());
      toast('Link is in the address bar');
    }
  });

  /* ------------------------------------------------------------------ help */

  $('btn-help').addEventListener('click', () => showModal(HELP_HTML));
  $('modal-close').addEventListener('click', () => $('modal').classList.add('hidden'));
  $('modal').addEventListener('click', (e) => {
    if (e.target === $('modal')) $('modal').classList.add('hidden');
  });
  function showModal(html: string) {
    $('modal-body').innerHTML = html;
    $('modal').classList.remove('hidden');
  }

  window.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') {
      if (e.key === 'Escape') (e.target as HTMLElement).blur();
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      state.playing = !state.playing;
      updatePlayButton();
    } else if (e.key === 'ArrowRight') setTime(state.t + Math.max(1, state.rate * 5));
    else if (e.key === 'ArrowLeft') setTime(state.t - Math.max(1, state.rate * 5));
    else if (e.key === 'f' && state.selection) {
      state.follow = !state.follow;
      $<HTMLInputElement>('f-follow').checked = state.follow;
      if (state.follow) frameSelection();
    } else if (e.key === 'Escape') select(null);
    else if (e.key === '?') showModal(HELP_HTML);
  });

  /* ------------------------------------------------------------------ loop */

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    world.resize(w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  let last = performance.now();
  let highlightsAt = 0;
  const selVec = new THREE.Vector3();
  const prevTarget = new THREE.Vector3();

  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    if (state.playing && state.rate !== 0) {
      const nt = state.t + state.rate * dt;
      state.t = nt > T_MAX ? T_MIN : nt < T_MIN ? T_MAX : nt;
      syncTimeInputs();
      if (now - detailDirtyAt > 900 && state.selection) renderDetailPanel();
      if (now - highlightsAt > 1500 && state.highlightTab === 'approach') {
        highlightsAt = now;
        renderHighlights();
      }
      syncUrl();
    }

    world.update(state.t);
    asteroids.setTime(state.t);
    comets.setTime(state.t);

    // follow: keep the camera's offset while re-centring on the body
    if (state.follow && state.selection) {
      const p = selectionPosition(d, state.selection, state.t);
      selVec.set(p.x, p.y, p.z);
      prevTarget.copy(world.controls.target);
      world.controls.target.copy(selVec);
      world.camera.position.add(selVec.clone().sub(prevTarget));
    }

    world.controls.update();
    world.camera.updateMatrixWorld();
    updateVP();

    // selection ring, sized to stay constant on screen
    if (state.selection) {
      const p = selectionPosition(d, state.selection, state.t);
      selVec.set(p.x, p.y, p.z);
      selRing.position.copy(selVec);
      selRing.quaternion.copy(world.camera.quaternion);
      selRing.scale.setScalar(world.camera.position.distanceTo(selVec) * 0.022);
      selRing.visible = true;
      if (showLabels) {
        selLabel.textContent = selectionName(d, state.selection);
        placeLabel(selLabel, selVec, -16);
      }
    } else {
      selRing.visible = false;
      selLabel.style.display = 'none';
    }

    if (showLabels) {
      for (let k = 0; k < labelEls.length; k++) placeLabel(labelEls[k], world.planetPos[k], -12);
      placeLabel(sunLabel, new THREE.Vector3(0, 0, 0), -14);
    }

    $('brand-sub').textContent = `${formatDate(state.t, true)} · ${fmtInt(visibleCount)} objects`;

    world.renderer.render(world.scene, world.camera);
    requestAnimationFrame(frame);
  }

  /* -------------------------------------------------------------- start up */

  readUrl();
  syncTimeInputs();
  applySpeed();
  applyColorMode();
  applyPointSize();
  applyBodyScale();
  syncRangeLabels();
  refilter();
  renderHighlights();
  updatePlayButton();
  if (state.selection) {
    asteroids.setSelected(state.selection.kind === 'asteroid' ? state.selection.index : -1);
    comets.setSelected(state.selection.kind === 'comet' ? state.selection.index : -1);
    updateOrbitLine();
    renderDetailPanel();
  }
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ toast */

function toast(msg: string) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  $('app').appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

const HELP_HTML = `
  <h2>Near-Earth Space</h2>
  <p>Every body here is drawn by solving its own Kepler orbit from the JPL orbital elements in
  <code>data/</code> — nothing is a stored position. The ~42,000 near-Earth asteroids are
  propagated on the GPU, one Kepler solution per point per frame.</p>

  <h3>Getting around</h3>
  <p>Drag to orbit, scroll to zoom, right-drag (or two fingers) to pan. Click any point, planet or
  the Sun to open its detail panel; hover for a quick identification.</p>

  <h3>Keyboard</h3>
  <p><kbd>space</kbd> play/pause · <kbd>←</kbd> <kbd>→</kbd> step time ·
  <kbd>f</kbd> follow selection · <kbd>esc</kbd> clear selection · <kbd>?</kbd> this panel</p>

  <h3>Reading the view</h3>
  <p>Distances are true to scale in astronomical units. Body <em>sizes</em> are not — the planets and
  the Sun are exaggerated by the slider in the Display section, otherwise they would be
  sub-pixel. Asteroid point size scales with the object's estimated diameter, not its true angular
  size.</p>

  <h3>Caveats</h3>
  <p>Positions come from unperturbed two-body propagation of each object's own osculating elements,
  which is what the dataset supports. Accuracy degrades the further you move from an object's epoch,
  especially for objects with short observation arcs. Close-approach and Sentry entries are the
  values published by CNEOS, not recomputed here.</p>
`;
