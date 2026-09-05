import * as THREE from 'three';
import './style.css';
import { createScene, addPlanet, PLANET_COLORS, CLASS_COLORS, DEFAULT_AST_COLOR, AU_KM, type SceneHandle } from './scene';
import { loadDataset, timelineIndex, type Dataset, type BodyStore } from './data';
import { elementsToPos, orbitPath, meanMotion, type Elements } from './orbit';
import { parseDateInput, formatJd, formatDateShort, jdFromDate } from './time';

type SelKind = 'a' | 'c' | 'p';
interface Selection { kind: SelKind; idx: number; }

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const state = {
  jd: 2440587.5 + Date.now() / 86400000,
  playing: true,
  dir: 1,
  dps: 7, // days per second at speed-slider default
  sel: null as Selection | null,
  follow: false,
  hl: 'none',
  showComets: true,
  showOrbits: true,
  showLabels: true,
  phaOnly: false,
  classes: new Set<string>(),
  hMax: 30,
  dMin: 0,
  moidMax: 1,
  matchCount: 0,
};

let H: SceneHandle;
let D: Dataset;
let jdMinView = 2415024;
let jdMaxView = 2524590;
const tmpE = new Float64Array(3);
const tmpV = new THREE.Vector3();
const projOut = { x: 0, y: 0, visible: false };
let lastPropJd = NaN;
let lastUpcomingDay = NaN;
let upcoming = new Map<string, { jd: number; dist: number }>();
let upcomingList: [number, string, number][] = [];
let selLabelEl: HTMLDivElement | null = null;
let scrubbing = false;

// ---------- propagation ----------

function propagate(store: BodyStore, pos: Float32Array, jd: number): void {
  const els = store.els;
  const n = Math.min(store.n, pos.length / 3);
  for (let k = 0; k < n; k++) {
    if (elementsToPos(els[k], jd, tmpE)) {
      pos[k * 3] = tmpE[0];
      pos[k * 3 + 1] = tmpE[2];
      pos[k * 3 + 2] = -tmpE[1];
    } else {
      pos[k * 3] = NaN;
      pos[k * 3 + 1] = NaN;
      pos[k * 3 + 2] = NaN;
    }
  }
}

function propagateAll(jd: number): void {
  propagate(D.asteroids, H.ast.pos, jd);
  if (state.showComets) propagate(D.comets, H.comets.pos, jd);
  for (let p = 0; p < D.planets.length; p++) {
    if (elementsToPos(D.planets[p], jd, tmpE)) {
      H.planets[p].mesh.position.set(tmpE[0], tmpE[2], -tmpE[1]);
    }
  }
  H.syncAttributes('both');
  lastPropJd = jd;
  if (state.follow && state.sel) applyFollow();
  if (state.sel) positionSelMarker();
  updateUpcomingIfNeeded(jd);
}

// ---------- filters + coloring ----------

function matchesFilters(i: number): boolean {
  const A = D.asteroids;
  if (state.phaOnly && !A.pha[i]) return false;
  if (state.classes.size > 0 && !state.classes.has(A.cls[i])) return false;
  const h = A.H[i];
  if (Number.isFinite(h) && h > state.hMax) return false;
  if (state.dMin > 0 && !(A.diam[i] >= state.dMin)) return false;
  if (state.moidMax < 1 && !(A.moid[i] <= state.moidMax)) return false;
  return true;
}

function astBaseSize(i: number): number {
  const A = D.asteroids;
  const h = A.H[i];
  let s = Number.isFinite(h) ? 3.1 - (h - 12) * 0.095 : 1.7;
  const d = A.diam[i];
  if (Number.isFinite(d) && d > 2) s += Math.min(1.6, Math.log10(d) * 1.1);
  return Math.min(4.4, Math.max(1.1, s));
}

function setAstPoint(i: number, r: number, g: number, b: number, size: number, alpha: number): void {
  H.ast.col[i * 3] = r;
  H.ast.col[i * 3 + 1] = g;
  H.ast.col[i * 3 + 2] = b;
  H.ast.size[i] = size;
  H.ast.alpha[i] = alpha;
}

const PHA_RGB: [number, number, number] = [1, 0.28, 0.28];
const UP_RGB: [number, number, number] = [1, 0.6, 0.2];
const SENT_RGB: [number, number, number] = [0.88, 0.48, 1];
const LARGE_RGB: [number, number, number] = [0.45, 1, 0.55];

function recolorAsteroids(): void {
  const A = D.asteroids;
  let match = 0;
  const dimAll = state.hl !== 'none';
  const selIdx = state.sel?.kind === 'a' ? state.sel.idx : -1;
  const cap = Math.min(A.n, H.ast.size.length);
  for (let i = 0; i < cap; i++) {
    const m = matchesFilters(i);
    if (m) match++;
    const cc = CLASS_COLORS[A.cls[i]] ?? DEFAULT_AST_COLOR;
    let r = cc[0], g = cc[1], b = cc[2];
    let alpha = m ? 0.85 : 0.05;
    let size = m ? astBaseSize(i) : 1.1;
    if (m && A.pha[i] && state.hl === 'none') {
      r = r * 0.35 + PHA_RGB[0] * 0.65;
      g = g * 0.35 + PHA_RGB[1] * 0.65;
      b = b * 0.35 + PHA_RGB[2] * 0.65;
      size += 0.4;
    }
    if (dimAll && m) {
      const pdes = A.pdes[i];
      if (state.hl === 'pha') {
        if (A.pha[i]) { r = PHA_RGB[0]; g = PHA_RGB[1]; b = PHA_RGB[2]; size += 0.6; alpha = 1; }
        else alpha = 0.05;
      } else if (state.hl === 'upcoming') {
        if (upcoming.has(pdes)) { r = UP_RGB[0]; g = UP_RGB[1]; b = UP_RGB[2]; size += 0.6; alpha = 1; }
        else alpha = 0.05;
      } else if (state.hl === 'sentry') {
        if (D.sentryByDes.has(pdes)) { r = SENT_RGB[0]; g = SENT_RGB[1]; b = SENT_RGB[2]; size += 0.6; alpha = 1; }
        else alpha = 0.05;
      } else if (state.hl === 'large') {
        if (A.diam[i] >= 1) { r = LARGE_RGB[0]; g = LARGE_RGB[1]; b = LARGE_RGB[2]; size += Math.min(1.5, A.diam[i] * 0.15); alpha = 1; }
        else alpha = 0.05;
      }
    }
    if (i === selIdx) { r = 1; g = 1; b = 1; size = 5.5; alpha = 1; }
    setAstPoint(i, r, g, b, size, alpha);
  }
  state.matchCount = match;
  H.syncAttributes('ast');
  $('match-count').textContent = `· ${match.toLocaleString()} shown`;
  updateStats();
}

function recolorComets(): void {
  const C = D.comets;
  const selIdx = state.sel?.kind === 'c' ? state.sel.idx : -1;
  const cap = Math.min(C.n, H.comets.size.length);
  for (let i = 0; i < cap; i++) {
    const m1 = C.M1[i];
    const bright = Number.isFinite(m1) ? Math.min(1, Math.max(0.25, (16 - m1) / 12)) : 0.45;
    let r = 0.49 * bright + 0.25, g = 0.91 * bright + 0.1, b = 1;
    let size = 1.6 + bright * 2.2;
    let alpha = 0.9;
    if (i === selIdx) { r = 1; g = 1; b = 1; size = 6; alpha = 1; }
    H.comets.col[i * 3] = r;
    H.comets.col[i * 3 + 1] = g;
    H.comets.col[i * 3 + 2] = b;
    H.comets.size[i] = size;
    H.comets.alpha[i] = alpha;
  }
  H.syncAttributes('comets');
}

// ---------- selection ----------

function storeFor(kind: SelKind): BodyStore | null {
  return kind === 'a' ? D.asteroids : kind === 'c' ? D.comets : null;
}

function selectedPos(out: THREE.Vector3): boolean {
  const s = state.sel;
  if (!s) return false;
  if (s.kind === 'p') return out.copy(H.planets[s.idx].mesh.position), true;
  const arr = s.kind === 'a' ? H.ast.pos : H.comets.pos;
  const x = arr[s.idx * 3], y = arr[s.idx * 3 + 1], z = arr[s.idx * 3 + 2];
  if (!Number.isFinite(x + y + z)) return false;
  return out.set(x, y, z), true;
}

function selectedElements(): Elements | null {
  const s = state.sel;
  if (!s) return null;
  if (s.kind === 'p') return D.planets[s.idx];
  return storeFor(s.kind)!.els[s.idx];
}

function select(kind: SelKind, idx: number): void {
  state.sel = { kind, idx };
  rebuildSelOrbit();
  fillDetail();
  $('right').classList.remove('hidden');
  recolorAsteroids();
  recolorComets();
  positionSelMarker();
  H.selMarker.visible = true;
  H.selOrbit.visible = true;
  if (!selLabelEl) {
    selLabelEl = document.createElement('div');
    selLabelEl.className = 'sel-label';
    H.labelLayer.appendChild(selLabelEl);
  }
  updateFollowBtn();
  writeHash();
}

function clearSelection(): void {
  state.sel = null;
  state.follow = false;
  H.selOrbit.visible = false;
  H.selMarker.visible = false;
  if (selLabelEl) selLabelEl.style.display = 'none';
  $('right').classList.add('hidden');
  recolorAsteroids();
  recolorComets();
  writeHash();
}

function rebuildSelOrbit(): void {
  const el = selectedElements();
  if (!el) return;
  const pts = orbitPath(el, el.e < 1 ? 256 : 128);
  const g = H.selOrbit.geometry;
  if (!pts) {
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
    return;
  }
  const n = pts.length / 3;
  const arr = new Float32Array((el.e < 1 ? n + 1 : n) * 3);
  for (let k = 0; k < n; k++) {
    arr[k * 3] = pts[k * 3];
    arr[k * 3 + 1] = pts[k * 3 + 2];
    arr[k * 3 + 2] = -pts[k * 3 + 1];
  }
  if (el.e < 1) {
    arr[n * 3] = arr[0];
    arr[n * 3 + 1] = arr[1];
    arr[n * 3 + 2] = arr[2];
  }
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
}

function positionSelMarker(): void {
  if (!state.sel) return;
  if (selectedPos(tmpV)) {
    H.selMarker.position.copy(tmpV);
    const d = H.camera.position.distanceTo(tmpV);
    H.selMarker.scale.setScalar(Math.max(0.03, d * 0.02));
  }
}

function applyFollow(): void {
  if (!state.sel || !selectedPos(tmpV)) return;
  const delta = tmpV.clone().sub(H.controls.target);
  H.camera.position.add(delta);
  H.controls.target.copy(tmpV);
}

// ---------- detail panel ----------

const LD_AU = 0.00256933; // one lunar distance in AU
function fmt(v: number | null | undefined, digits = 3): string {
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '—';
}

function selTitle(): string {
  const s = state.sel!;
  if (s.kind === 'p') return D.planets[s.idx].name;
  const st = storeFor(s.kind)!;
  const lbl = st.label[s.idx];
  return lbl === st.pdes[s.idx] ? `(${lbl})` : `${lbl} (${st.pdes[s.idx]})`;
}

function fillDetail(): void {
  const s = state.sel!;
  $('d-title').textContent = selTitle();
  const badges: string[] = [];
  if (s.kind === 'p') {
    badges.push('<span class="badge cls">planet</span>');
  } else {
    const st = storeFor(s.kind)!;
    badges.push(`<span class="badge cls">${st.cls[s.idx]}</span>`);
    if (s.kind === 'a' && st.pha[s.idx]) badges.push('<span class="badge pha">PHA</span>');
    if (s.kind === 'a' && D.sentryByDes.has(st.pdes[s.idx])) badges.push('<span class="badge sentry">SENTRY</span>');
    if (s.kind === 'c') badges.push('<span class="badge cls">comet</span>');
  }
  $('d-badges').innerHTML = badges.join('');

  const el = selectedElements()!;
  const rows: [string, string][] = [];
  if (s.kind === 'p') {
    const pl = D.planets[s.idx];
    rows.push(['Radius', `${pl.radiusKm.toLocaleString()} km`]);
    rows.push(['Semi-major axis', `${fmt(el.a, 4)} au`]);
    rows.push(['Eccentricity', fmt(el.e, 4)]);
    rows.push(['Inclination', `${fmt(el.i)}°`]);
    rows.push(['Period', `${fmt(pl.per, 1)} d (${fmt(pl.per / 365.25, 2)} yr)`]);
  } else {
    const st = storeFor(s.kind)!;
    const i = s.idx;
    const per = Number.isFinite(st.per[i]) ? st.per[i]
      : el.e < 1 ? 365.2569 * Math.pow(el.a, 1.5) : NaN;
    rows.push(['Semi-major axis', Number.isFinite(el.a) && el.a > 0 ? `${fmt(el.a, 4)} au` : 'open orbit']);
    rows.push(['Eccentricity', fmt(el.e, 4)]);
    rows.push(['Inclination', `${fmt(el.i)}°`]);
    rows.push(['Perihelion q', `${fmt(Number.isFinite(el.q) ? el.q : el.a * (1 - el.e), 4)} au`]);
    rows.push(['Aphelion', el.e < 1 ? `${fmt(el.a * (1 + el.e), 4)} au` : '— (unbound)']);
    rows.push(['Period', Number.isFinite(per) ? `${fmt(per, 0)} d (${fmt(per / 365.25, 2)} yr)` : '—']);
    if (s.kind === 'a') {
      rows.push(['Abs. magnitude H', fmt(st.H[i], 2)]);
      rows.push(['Diameter', Number.isFinite(st.diam[i]) ? `~${fmt(st.diam[i], 2)} km` : 'unknown']);
      rows.push(['Albedo', fmt(st.alb[i], 3)]);
      rows.push(['Rotation', Number.isFinite(st.rotp[i]) ? `${fmt(st.rotp[i], 2)} h` : 'unknown']);
      const sp = st.spec[i];
      rows.push(['Spectrum', sp[0] || sp[1] ? `${sp[0] ?? '?'} / ${sp[1] ?? '?'}` : 'unknown']);
      rows.push(['MOID', `${fmt(st.moid[i], 4)} au`]);
      rows.push(['First observed', st.firstObs[i] ?? '—']);
    } else {
      rows.push(['Total magnitude M1', fmt(st.M1[i], 1)]);
      rows.push(['Diameter', Number.isFinite(st.diam[i]) ? `~${fmt(st.diam[i], 1)} km` : 'unknown']);
    }
  }
  const sen = s.kind === 'a' ? D.sentryByDes.get(storeFor(s.kind)!.pdes[s.idx]) : undefined;
  if (sen) {
    const oneIn = sen.ip > 0 ? Math.round(1 / sen.ip).toLocaleString() : '—';
    rows.push(['Impact probability', `${sen.ip.toExponential(2)} (1 in ${oneIn})`]);
    rows.push(['Palermo (cum/max)', `${fmt(sen.ps_cum, 2)} / ${fmt(sen.ps_max, 2)}`]);
    rows.push(['Torino max', String(sen.ts_max)]);
    rows.push(['Impact window', sen.range]);
    rows.push(['Potential impacts', String(sen.n_imp)]);
  }
  $('d-body').innerHTML = '<table>' + rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('') + '</table>';

  const box = $('d-ca');
  if (s.kind !== 'a') {
    box.innerHTML = s.kind === 'p'
      ? '<span class="none">Planets have no CAD events in this dataset.</span>'
      : '<span class="none">No close-approach data for comets.</span>';
    return;
  }
  const pdes = D.asteroids.pdes[s.idx];
  const list = D.caByDes[pdes];
  if (!list || list.length === 0) {
    box.innerHTML = '<span class="none">No recorded close approaches.</span>';
    return;
  }
  let firstFuture = list.findIndex((e) => e[0] >= state.jd - 1);
  if (firstFuture < 0) firstFuture = list.length;
  const past = list.slice(Math.max(0, firstFuture - 4), firstFuture).reverse();
  const future = list.slice(firstFuture, firstFuture + 8);
  const row = (e: [number, number, number], f: boolean) =>
    `<tr class="${f ? 'future' : ''}" ${f ? `data-jd="${e[0]}"` : ''}>` +
    `<td>${formatDateShort(e[0])}</td><td>${fmt(e[1], 4)}</td>` +
    `<td>${fmt(e[1] / LD_AU, 1)}</td><td>${fmt(e[2], 1)}</td></tr>`;
  box.innerHTML = '<table><tr><th>date</th><th>au</th><th>LD</th><th>km/s</th></tr>' +
    past.map((e) => row(e, false)).join('') + future.map((e) => row(e, true)).join('') + '</table>';
  box.querySelectorAll('tr.future').forEach((tr) => {
    tr.addEventListener('click', () => {
      state.jd = parseFloat((tr as HTMLElement).dataset.jd!);
      writeHash();
    });
  });
}

function updateFollowBtn(): void {
  $('btn-follow').textContent = state.follow ? 'Unfollow' : 'Follow';
  $('btn-follow').classList.toggle('active', state.follow);
}

// ---------- upcoming approaches ----------

function updateUpcomingIfNeeded(jd: number): void {
  const day = Math.floor(jd);
  if (day === lastUpcomingDay && upcoming.size > 0) return;
  lastUpcomingDay = day;
  upcoming = new Map();
  upcomingList = [];
  const tl = D.caTimeline;
  const start = timelineIndex(tl, jd - 1);
  for (let k = start; k < tl.length && tl[k][0] <= jd + 45; k++) {
    upcomingList.push(tl[k]);
    if (!upcoming.has(tl[k][1])) upcoming.set(tl[k][1], { jd: tl[k][0], dist: tl[k][2] });
  }
  if (state.hl === 'upcoming') {
    recolorAsteroids();
    renderUpcoming();
  }
}

function renderUpcoming(): void {
  const box = $('upcoming');
  if (state.hl !== 'upcoming') {
    box.classList.add('hidden');
    return;
  }
  box.classList.remove('hidden');
  const ul = $('up-list');
  if (upcomingList.length === 0) {
    ul.innerHTML = '<li class="none">No approaches within 45 days of this date.</li>';
    return;
  }
  ul.innerHTML = upcomingList.slice(0, 14).map(([jd, des, dist]) => {
    const i = D.asteroids.byPdes.get(des);
    const name = i === undefined ? des : D.asteroids.label[i];
    const pha = i !== undefined && D.asteroids.pha[i] ? ' ⚠' : '';
    return `<li data-jd="${jd}" data-des="${des}">${formatDateShort(jd)} — ${name}${pha} — ${dist.toFixed(4)} au</li>`;
  }).join('');
  ul.querySelectorAll('li[data-jd]').forEach((li) => {
    li.addEventListener('click', () => {
      const el = li as HTMLElement;
      state.jd = parseFloat(el.dataset.jd!);
      const i = D.asteroids.byPdes.get(el.dataset.des!);
      if (i !== undefined) select('a', i);
      writeHash();
    });
  });
}

// ---------- time controls ----------

function setPlaying(p: boolean): void {
  state.playing = p;
  $('btn-play').textContent = p ? '⏸' : '▶';
}

function speedFromSlider(v: number): number {
  return Math.pow(10, (v / 100) * (Math.log10(365) + 2) - 2);
}

function updateSpeedLabel(): void {
  $('speed-label').textContent = state.dps < 1
    ? `${(state.dps * 24).toFixed(1)} h/s`
    : state.dps < 60 ? `${state.dps.toFixed(1)} d/s` : `${Math.round(state.dps)} d/s`;
}

function wireTime(): void {
  $('btn-play').addEventListener('click', () => setPlaying(!state.playing));
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !/INPUT|TEXTAREA/.test((e.target as HTMLElement).tagName)) {
      e.preventDefault();
      setPlaying(!state.playing);
    } else if (e.key === 'Escape') {
      clearSelection();
    }
  });
  const sp = $('speed') as HTMLInputElement;
  sp.addEventListener('input', () => {
    state.dps = speedFromSlider(parseFloat(sp.value));
    updateSpeedLabel();
    writeHash();
  });
  state.dps = speedFromSlider(parseFloat(sp.value));
  $('btn-rev').addEventListener('click', () => {
    state.dir *= -1;
    $('btn-rev').classList.toggle('active', state.dir < 0);
    writeHash();
  });
  const step = (d: number) => () => { state.jd += d; writeHash(); };
  $('step-b').addEventListener('click', step(-30));
  $('step-s').addEventListener('click', step(-1));
  $('step-f').addEventListener('click', step(1));
  $('step-fb').addEventListener('click', step(30));
  const go = () => {
    const inp = $('date-input') as HTMLInputElement;
    const jd = parseDateInput(inp.value);
    if (jd === null) {
      inp.style.borderColor = '#ff5252';
      setTimeout(() => (inp.style.borderColor = ''), 800);
      return;
    }
    state.jd = jd;
    writeHash();
  };
  $('btn-go').addEventListener('click', go);
  ($('date-input') as HTMLInputElement).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') go();
  });
  $('btn-now').addEventListener('click', () => {
    state.jd = 2440587.5 + Date.now() / 86400000;
    writeHash();
  });
  const sc = $('scrub') as HTMLInputElement;
  sc.addEventListener('pointerdown', () => (scrubbing = true));
  window.addEventListener('pointerup', () => (scrubbing = false));
  sc.addEventListener('input', () => {
    state.jd = jdMinView + (parseFloat(sc.value) / 2000) * (jdMaxView - jdMinView);
    writeHash();
  });
  updateSpeedLabel();
}

function syncTimeUI(): void {
  $('clock').textContent = formatJd(state.jd);
  if (!scrubbing) {
    const v = Math.round(((state.jd - jdMinView) / (jdMaxView - jdMinView)) * 2000);
    ($('scrub') as HTMLInputElement).value = String(Math.min(2000, Math.max(0, v)));
  }
}

// ---------- filters / search / layers ----------

function className(c: string): string {
  return { APO: 'Apollo', ATE: 'Aten', AMO: 'Amor', IEO: 'Interior-Earth Object' }[c] ?? c;
}

function wirePanels(): void {
  const classes = [...new Set(D.asteroids.cls)].sort();
  const box = $('f-classes');
  box.innerHTML = classes.map((c) =>
    `<label title="${className(c)}"><input type="checkbox" data-cls="${c}" />${c}</label>`).join('');
  box.querySelectorAll('input').forEach((cb) => {
    cb.addEventListener('change', () => {
      state.classes = new Set(
        [...box.querySelectorAll('input:checked')].map((e) => (e as HTMLInputElement).dataset.cls!),
      );
      recolorAsteroids();
      writeHash();
    });
  });
  $('f-pha').addEventListener('change', (e) => {
    state.phaOnly = (e.target as HTMLInputElement).checked;
    recolorAsteroids();
    writeHash();
  });
  const num = (id: string, vid: string, fn: (v: number) => void) => {
    $(id).addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value);
      $(vid).textContent = String(v);
      fn(v);
      recolorAsteroids();
      writeHash();
    });
  };
  num('f-hmax', 'f-hmax-v', (v) => (state.hMax = v));
  num('f-dmin', 'f-dmin-v', (v) => (state.dMin = v));
  num('f-moid', 'f-moid-v', (v) => (state.moidMax = v));
  $('btn-reset-filters').addEventListener('click', () => {
    state.phaOnly = false;
    state.classes.clear();
    state.hMax = 30;
    state.dMin = 0;
    state.moidMax = 1;
    ($('f-pha') as HTMLInputElement).checked = false;
    box.querySelectorAll('input').forEach((cb) => ((cb as HTMLInputElement).checked = false));
    ($('f-hmax') as HTMLInputElement).value = '30';
    ($('f-dmin') as HTMLInputElement).value = '0';
    ($('f-moid') as HTMLInputElement).value = '1';
    $('f-hmax-v').textContent = '30';
    $('f-dmin-v').textContent = '0';
    $('f-moid-v').textContent = '1';
    recolorAsteroids();
    writeHash();
  });

  document.querySelectorAll('input[name="hl"]').forEach((r) => {
    r.addEventListener('change', (e) => {
      state.hl = (e.target as HTMLInputElement).value;
      lastUpcomingDay = NaN;
      updateUpcomingIfNeeded(state.jd);
      recolorAsteroids();
      renderUpcoming();
      writeHash();
    });
  });

  const lyr = (id: string, fn: (on: boolean) => void) => {
    $(id).addEventListener('change', (e) => {
      fn((e.target as HTMLInputElement).checked);
      writeHash();
    });
  };
  lyr('l-comets', (on) => {
    state.showComets = on;
    H.comets.points.visible = on;
    lastPropJd = NaN;
  });
  lyr('l-orbits', (on) => {
    state.showOrbits = on;
    H.planets.forEach((p) => (p.orbitLine.visible = on));
  });
  lyr('l-labels', (on) => {
    state.showLabels = on;
    H.labelLayer.style.display = on ? '' : 'none';
  });
  lyr('l-true', (on) => H.setTrueScale(on));

  let deb: number | undefined;
  ($('search') as HTMLInputElement).addEventListener('input', (e) => {
    window.clearTimeout(deb);
    deb = window.setTimeout(() => runSearch((e.target as HTMLInputElement).value), 140);
  });
  $('search-results').addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest('li[data-sel]') as HTMLElement | null;
    if (!li) return;
    const [kind, idx] = li.dataset.sel!.split(':');
    select(kind as SelKind, parseInt(idx, 10));
  });

  $('btn-close-detail').addEventListener('click', clearSelection);
  $('btn-follow').addEventListener('click', () => {
    state.follow = !state.follow;
    updateFollowBtn();
    writeHash();
  });
  $('btn-jump-next').addEventListener('click', () => {
    if (!state.sel || state.sel.kind !== 'a') return;
    const list = D.caByDes[D.asteroids.pdes[state.sel.idx]];
    if (!list) return;
    const nx = list.find((ev) => ev[0] > state.jd + 0.5);
    if (nx) {
      state.jd = nx[0] - 2;
      fillDetail();
      writeHash();
    }
  });
  $('btn-copylink').addEventListener('click', async () => {
    writeHash();
    try {
      await navigator.clipboard.writeText(location.href);
      $('btn-copylink').textContent = 'Copied ✓';
      setTimeout(() => ($('btn-copylink').textContent = 'Copy link'), 1200);
    } catch {
      prompt('Copy this link:', location.href);
    }
  });
  $('btn-help').addEventListener('click', () => $('help').classList.remove('hidden'));
  $('btn-close-help').addEventListener('click', () => $('help').classList.add('hidden'));
  $('help').addEventListener('click', (e) => {
    if (e.target === $('help')) $('help').classList.add('hidden');
  });
}

function runSearch(q0: string): void {
  const q = q0.trim().toLowerCase();
  const ul = $('search-results');
  if (q.length < 2) {
    ul.innerHTML = '';
    return;
  }
  const out: string[] = [];
  for (let p = 0; p < D.planets.length && out.length < 60; p++) {
    if (D.planets[p].name.toLowerCase().includes(q)) {
      out.push(`<li data-sel="p:${p}">${D.planets[p].name}<span class="cls">planet</span></li>`);
    }
  }
  const A = D.asteroids;
  for (let i = 0; i < A.n && out.length < 60; i++) {
    if (A.pdes[i].toLowerCase().includes(q) || A.label[i].toLowerCase().includes(q)) {
      const nm = A.label[i] === A.pdes[i] ? `(${A.pdes[i]})` : `${A.label[i]} (${A.pdes[i]})`;
      out.push(`<li data-sel="a:${i}">${nm}${A.pha[i] ? ' ⚠' : ''}<span class="cls">${A.cls[i]}</span></li>`);
    }
  }
  const C = D.comets;
  for (let i = 0; i < C.n && out.length < 60; i++) {
    if (C.pdes[i].toLowerCase().includes(q) || C.label[i].toLowerCase().includes(q)) {
      out.push(`<li data-sel="c:${i}">${C.label[i]}<span class="cls">comet</span></li>`);
    }
  }
  ul.innerHTML = out.length > 0 ? out.join('') : '<li class="none">No matches</li>';
}

// ---------- picking ----------

function wirePicking(): void {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down: [number, number] | null = null;
  const el = H.renderer.domElement;
  el.addEventListener('pointerdown', (e) => (down = [e.clientX, e.clientY]));
  el.addEventListener('pointerup', (e) => {
    if (!down) return;
    const dx = e.clientX - down[0];
    const dy = e.clientY - down[1];
    down = null;
    if (dx * dx + dy * dy > 36) return;
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, H.camera);
    const meshes = H.planets.map((p) => p.mesh);
    const hitP = ray.intersectObjects(meshes, false);
    if (hitP.length > 0) {
      select('p', meshes.indexOf(hitP[0].object as THREE.Mesh));
      return;
    }
    ray.params.Points.threshold = Math.max(0.004, H.camera.position.distanceTo(H.controls.target) * 0.0035);
    if (state.showComets) {
      const hitC = ray.intersectObject(H.comets.points);
      if (hitC.length > 0 && hitC[0].index !== undefined) {
        select('c', hitC[0].index);
        return;
      }
    }
    const hitA = ray.intersectObject(H.ast.points);
    if (hitA.length > 0 && hitA[0].index !== undefined) select('a', hitA[0].index);
  });
}

// ---------- deep links ----------

function writeHash(): void {
  if (!D || !H) return;
  const p = new URLSearchParams();
  p.set('jd', state.jd.toFixed(4));
  if (state.sel) {
    const { kind, idx } = state.sel;
    p.set('sel', kind === 'p' ? `p:${D.planets[idx].name}` : `${kind}:${storeFor(kind)!.pdes[idx]}`);
  }
  if (state.follow) p.set('follow', '1');
  if (!state.playing) p.set('play', '0');
  p.set('speed', state.dps.toFixed(3));
  p.set('dir', state.dir < 0 ? '-1' : '1');
  if (state.hl !== 'none') p.set('hl', state.hl);
  p.set('lyr', [state.showComets ? 1 : 0, state.showOrbits ? 1 : 0, state.showLabels ? 1 : 0, H.trueScale ? 1 : 0].join(''));
  const c = H.camera.position;
  const t = H.controls.target;
  const f = (v: number) => +v.toFixed(3);
  p.set('cam', [f(c.x), f(c.y), f(c.z), f(t.x), f(t.y), f(t.z)].join(','));
  history.replaceState(null, '', '#' + p.toString());
}

function applyHash(): void {
  if (!location.hash) return;
  const p = new URLSearchParams(location.hash.slice(1));
  const jd = parseFloat(p.get('jd') ?? '');
  if (Number.isFinite(jd)) state.jd = Math.min(jdMaxView + 400, Math.max(jdMinView - 400, jd));
  const sp = parseFloat(p.get('speed') ?? '');
  if (Number.isFinite(sp) && sp > 0) {
    state.dps = sp;
    ($('speed') as HTMLInputElement).value = String(
      Math.round(((Math.log10(sp) + 2) / (Math.log10(365) + 2)) * 100),
    );
    updateSpeedLabel();
  }
  if (p.get('dir') === '-1') {
    state.dir = -1;
    $('btn-rev').classList.add('active');
  }
  if (p.get('play') === '0') setPlaying(false);
  const hl = p.get('hl');
  if (hl && ['pha', 'upcoming', 'sentry', 'large'].includes(hl)) {
    state.hl = hl;
    (document.querySelector(`input[name="hl"][value="${hl}"]`) as HTMLInputElement).checked = true;
  }
  const lyr = p.get('lyr');
  if (lyr && lyr.length === 4) {
    const set = (id: string, on: boolean) => ((($(id) as HTMLInputElement).checked = on));
    state.showComets = lyr[0] === '1';
    set('l-comets', state.showComets);
    H.comets.points.visible = state.showComets;
    state.showOrbits = lyr[1] === '1';
    set('l-orbits', state.showOrbits);
    H.planets.forEach((pl) => (pl.orbitLine.visible = state.showOrbits));
    state.showLabels = lyr[2] === '1';
    set('l-labels', state.showLabels);
    H.labelLayer.style.display = state.showLabels ? '' : 'none';
    if (lyr[3] === '1') {
      ($('l-true') as HTMLInputElement).checked = true;
      H.setTrueScale(true);
    }
  }
  const cam = (p.get('cam') ?? '').split(',').map(Number);
  if (cam.length === 6 && cam.every(Number.isFinite)) {
    H.camera.position.set(cam[0], cam[1], cam[2]);
    H.controls.target.set(cam[3], cam[4], cam[5]);
  }
  const sel = p.get('sel');
  if (sel) {
    const [kind, key] = sel.split(':');
    if (kind === 'p') {
      const i = D.planets.findIndex((pl) => pl.name === key);
      if (i >= 0) select('p', i);
    } else if ((kind === 'a' || kind === 'c') && key) {
      const st = kind === 'a' ? D.asteroids : D.comets;
      const i = st.byPdes.get(key);
      if (i !== undefined) select(kind, i);
    }
  }
  if (p.get('follow') === '1' && state.sel) {
    state.follow = true;
    updateFollowBtn();
  }
}

// ---------- labels / stats / loop ----------

function updateLabels(): void {
  if (!state.showLabels) return;
  for (const p of H.planets) {
    H.projectToScreen(p.mesh.position, projOut);
    p.label.style.display = projOut.visible ? '' : 'none';
    if (projOut.visible) {
      p.label.style.left = `${projOut.x}px`;
      p.label.style.top = `${projOut.y}px`;
    }
  }
  if (state.sel && selLabelEl && selectedPos(tmpV)) {
    H.projectToScreen(tmpV, projOut);
    selLabelEl.style.display = projOut.visible ? '' : 'none';
    if (projOut.visible) {
      selLabelEl.style.left = `${projOut.x}px`;
      selLabelEl.style.top = `${projOut.y}px`;
      selLabelEl.textContent = selTitle();
    }
  } else if (selLabelEl) {
    selLabelEl.style.display = 'none';
  }
}

function updateStats(): void {
  $('stats').textContent =
    `${D.asteroids.n.toLocaleString()} NEOs · ${D.manifest.pha.toLocaleString()} PHA · ` +
    `${D.comets.n.toLocaleString()} comets · ${D.manifest.closeApproachEvents.toLocaleString()} approaches · ` +
    `${state.matchCount.toLocaleString()} in filter`;
}

let lastT = performance.now();
function frame(): void {
  requestAnimationFrame(frame);
  const now = performance.now();
  const dt = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;
  if (state.playing) state.jd += state.dir * state.dps * dt;
  if (state.jd !== lastPropJd) propagateAll(state.jd);
  syncTimeUI();
  updateLabels();
  H.render();
}

// ---------- boot ----------

async function boot(): Promise<void> {
  const msg = $('load-msg');
  H = createScene($('view'));
  D = await loadDataset((m) => (msg.textContent = m + '…'));
  jdMinView = Math.floor(D.manifest.jdMin);
  jdMaxView = Math.ceil(D.manifest.jdMax);

  for (const pl of D.planets) {
    const pts = orbitPath({ ...pl }, 360)!;
    addPlanet(H, pl.name, pl.radiusKm / AU_KM, pts, PLANET_COLORS[pl.name] ?? 0xffffff);
  }
  const astCap = (H.ast.points.geometry.getAttribute('position') as THREE.BufferAttribute).count;
  const comCap = (H.comets.points.geometry.getAttribute('position') as THREE.BufferAttribute).count;
  if (D.asteroids.n > astCap || D.comets.n > comCap) {
    console.warn('dataset exceeds point-buffer capacity; some bodies will not render');
  }
  H.ast.points.geometry.setDrawRange(0, Math.min(D.asteroids.n, astCap));
  H.comets.points.geometry.setDrawRange(0, Math.min(D.comets.n, comCap));

  wireTime();
  wirePanels();
  wirePicking();
  applyHash();
  setPlaying(state.playing);
  lastPropJd = NaN;
  propagateAll(state.jd);
  recolorAsteroids();
  recolorComets();
  renderUpcoming();
  if (state.sel) fillDetail();
  updateStats();
  writeHash();
  setInterval(writeHash, 2000);

  $('loading').style.display = 'none';
  requestAnimationFrame(frame);
}

boot().catch((err) => {
  $('load-msg').textContent = `Failed to start: ${err instanceof Error ? err.message : err}`;
  console.error(err);
});
