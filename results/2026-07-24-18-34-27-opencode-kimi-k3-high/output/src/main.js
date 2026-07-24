// NEO System — interactive 3D near-Earth asteroid explorer.
// Glue: scene setup, time loop, picking, selection/detail, filters, deep links.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  loadCore, loadDetails, loadSentry, loadCloseApproaches, sentryByDes,
  CLASS_NAMES, FLAG_PHA, FLAG_SENTRY,
} from './data.js';
import { AsteroidCloud } from './asteroids.js';
import {
  createSun, createPlanets, createScaleRings, createStarfield, CometCloud, PLANET_COLORS,
} from './bodies.js';
import {
  positionElliptic, sampleOrbitPath, formatJd, dateToJd, jdToDate, LD_AU,
} from './orbit.js';
import {
  CLASS_COLORS, PHA_COLOR, buildClassFilters, renderLegend, detailHtml, approachRowHtml,
  fmtKm, fmtAu, fmtProb,
} from './ui.js';

const $ = (id) => document.getElementById(id);

// ---------- state ------------------------------------------------------------
const state = {
  jd: dateToJd(new Date()),
  playing: true,
  speed: 1, // days per wall-clock second
  dir: 1,
  colorMode: 'class', // 'class' | 'risk' | 'size'
  classes: [true, true, true, true, true],
  phaOnly: false,
  sentryOnly: false,
  minDiam: 0,
  cometsOn: false,
  orbitsOn: true,
  labelsOn: true,
  sizeScale: 1,
  selected: null, // { kind: 'asteroid'|'comet'|'planet', index }
  follow: false,
};

let core, cloud, planetSys, cometCloud, sun;
let renderer, scene, camera, controls;
let selMarker = null, selOrbitLine = null;
let tween = null;
const followPrev = new THREE.Vector3();
const labelDivs = new Map(); // key -> div
let sentryRows = null;

// ---------- URL hash (deep links) --------------------------------------------
function serializeHash() {
  const p = new URLSearchParams();
  p.set('t', state.jd.toFixed(2));
  p.set('spd', state.speed);
  if (state.dir < 0) p.set('dir', '-1');
  if (!state.playing) p.set('pause', '1');
  if (state.colorMode !== 'class') p.set('mode', state.colorMode);
  if (state.cometsOn) p.set('comets', '1');
  if (state.selected) {
    const id =
      state.selected.kind === 'asteroid' ? `a:${core.pdes[state.selected.index]}`
      : state.selected.kind === 'comet' ? `c:${core.comets[state.selected.index].pdes}`
      : `p:${core.planets[state.selected.index].name}`;
    p.set('sel', id);
  }
  if (state.follow) p.set('fol', '1');
  const c = camera.position, t = controls.target;
  p.set('cam', [c.x, c.y, c.z, t.x, t.y, t.z].map((v) => +v.toFixed(3)).join(','));
  const f =
    state.classes.map((b) => (b ? '1' : '0')).join('') +
    (state.phaOnly ? '1' : '0') + (state.sentryOnly ? '1' : '0') + '.' + state.minDiam;
  p.set('f', f);
  return '#' + p.toString();
}

let hashTimer = null;
function pushHash() {
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => history.replaceState(null, '', serializeHash()), 400);
}

function parseHash() {
  // reset link-controlled fields so a bare hash also means "defaults"
  state.playing = true;
  state.dir = 1;
  state.colorMode = 'class';
  state.cometsOn = false;
  state.follow = false;
  state.classes = [true, true, true, true, true];
  state.phaOnly = false;
  state.sentryOnly = false;
  state.minDiam = 0;
  state._pendingCam = null;
  state._pendingSel = null;
  if (!location.hash) return;
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.has('t')) state.jd = +p.get('t') || state.jd;
  if (p.has('spd')) state.speed = +p.get('spd') || state.speed;
  if (p.get('dir') === '-1') state.dir = -1;
  if (p.get('pause') === '1') state.playing = false;
  if (p.has('mode')) state.colorMode = p.get('mode');
  if (p.get('comets') === '1') state.cometsOn = true;
  if (p.get('fol') === '1') state.follow = true;
  if (p.has('f')) {
    const [bits, diam] = p.get('f').split('.');
    for (let i = 0; i < 5 && i < bits.length; i++) state.classes[i] = bits[i] === '1';
    state.phaOnly = bits[5] === '1';
    state.sentryOnly = bits[6] === '1';
    state.minDiam = +diam || 0;
  }
  // camera + selection applied after scene exists
  state._pendingCam = p.get('cam');
  state._pendingSel = p.get('sel');
}

// ---------- scene ------------------------------------------------------------
function initScene() {
  const canvas = $('scene');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.001, 1200);
  camera.position.set(0, 2.2, 4.5);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.005;
  controls.maxDistance = 300;
  controls.addEventListener('start', () => { tween = null; });

  scene.add(createStarfield());
  scene.add(createScaleRings());

  sun = createSun();
  scene.add(sun);

  planetSys = createPlanets(core.planets);
  scene.add(planetSys.group);

  cloud = new AsteroidCloud(core);
  scene.add(cloud.points);

  cometCloud = new CometCloud(core.comets);
  scene.add(cometCloud.points);

  // selection marker
  selMarker = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        g.strokeStyle = '#ffd166';
        g.lineWidth = 3;
        g.beginPath();
        g.arc(32, 32, 22, 0, Math.PI * 2);
        g.stroke();
        return new THREE.CanvasTexture(c);
      })(),
      depthWrite: false,
      depthTest: false,
      transparent: true,
    })
  );
  selMarker.visible = false;
  selMarker.renderOrder = 5;
  scene.add(selMarker);

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  canvas.addEventListener('pointerdown', (e) => { canvas._downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    const d = canvas._downAt;
    if (d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) < 5) handlePick(e.clientX, e.clientY);
  });
}

// ---------- colors / filters ---------------------------------------------------
const CLASS_RGB = CLASS_COLORS.map((c) => new THREE.Color(c));
const PHA_RGB = new THREE.Color(PHA_COLOR);
const RISK_HI = new THREE.Color('#ff2d78');
const RISK_PHA = new THREE.Color('#ff8c42');
const RISK_DIM = new THREE.Color('#3a4a5c');
const SIZE_RAMP = ['#46586c', '#4cc9f0', '#ffd166', '#ffffff'].map((c) => new THREE.Color(c));

function applyColors() {
  const { bin, stride, count } = core;
  const col = cloud.attrColor.array;
  const alp = cloud.attrAlpha.array;
  let shown = 0;
  let sentryMap = sentryByDes();
  for (let k = 0; k < count; k++) {
    const b = k * stride;
    const flags = bin[b + 10];
    const cls = bin[b + 11];
    const diam = bin[b + 9];
    const pha = (flags & FLAG_PHA) !== 0;
    const isSentry = (flags & FLAG_SENTRY) !== 0;
    let vis =
      state.classes[cls] &&
      (!state.phaOnly || pha) &&
      (!state.sentryOnly || isSentry) &&
      diam >= state.minDiam;
    let c, a;
    if (state.colorMode === 'class') {
      c = pha ? PHA_RGB : CLASS_RGB[cls];
      a = vis ? (pha ? 0.95 : 0.8) : 0;
    } else if (state.colorMode === 'risk') {
      if (isSentry && sentryMap) {
        const s = sentryMap.get(core.pdes[k]);
        const t = s ? Math.min(1, Math.max(0.25, (s.ps_cum + 8) / 7)) : 0.5;
        c = RISK_HI.clone().multiplyScalar(0.6 + 0.7 * t);
        a = vis ? 1 : 0;
      } else if (pha) {
        c = RISK_PHA;
        a = vis ? 0.65 : 0;
      } else {
        c = RISK_DIM;
        a = vis ? 0.28 : 0;
      }
    } else {
      // size
      c = diam < 0.05 ? SIZE_RAMP[0] : diam < 0.3 ? SIZE_RAMP[1] : diam < 1 ? SIZE_RAMP[2] : SIZE_RAMP[3];
      a = vis ? 0.35 + 0.65 * Math.min(1, Math.log10(diam * 10 + 1)) : 0;
    }
    if (a > 0) shown++;
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    alp[k] = a;
  }
  cloud.flagColorDirty();
  $('stats').textContent = `${count.toLocaleString()} asteroids · ${shown.toLocaleString()} shown`;
  renderLegend($('legend'), state.colorMode);
  pushHash();
}

// ---------- selection ----------------------------------------------------------
function bodyPosition(sel, jd, out = new THREE.Vector3()) {
  if (sel.kind === 'asteroid') return cloud.positionAt(sel.index, jd, out);
  if (sel.kind === 'comet') return cometCloud.positionAt(sel.index, jd, out);
  const v = positionElliptic(core.planets[sel.index], jd, {});
  return out.set(v.x, v.y, v.z);
}

function selectedName(sel) {
  if (sel.kind === 'asteroid') return core.names[sel.index];
  if (sel.kind === 'comet') return core.comets[sel.index].full_name;
  return core.planets[sel.index].name;
}

function setOrbitLine(sel) {
  if (selOrbitLine) {
    scene.remove(selOrbitLine);
    selOrbitLine.geometry.dispose();
    selOrbitLine.material.dispose();
    selOrbitLine = null;
  }
  if (!sel || sel.kind === 'planet') return;
  const el = sel.kind === 'asteroid' ? cloud.elementsAt(sel.index) : core.comets[sel.index];
  const pts = sampleOrbitPath(el, 360, 35).map((v) => new THREE.Vector3(v.x, v.y, v.z));
  selOrbitLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.55 })
  );
  scene.add(selOrbitLine);
}

function focusOn(sel, instant = false) {
  const pos = bodyPosition(sel, state.jd);
  const dist = sel.kind === 'planet'
    ? Math.max(planetSys.bodies[sel.index].rAu * 40, 0.05)
    : 0.12;
  const dirV = camera.position.clone().sub(controls.target).normalize();
  const toPos = pos.clone().add(dirV.multiplyScalar(dist));
  if (instant) {
    camera.position.copy(toPos);
    controls.target.copy(pos);
    tween = null;
  } else {
    tween = {
      t: 0, dur: 0.8,
      fromPos: camera.position.clone(), toPos,
      fromTgt: controls.target.clone(), toTgt: pos.clone(),
    };
  }
  if (state.follow) followPrev.copy(pos);
}

async function select(sel, { focus = true, fromHash = false } = {}) {
  state.selected = sel;
  if (sel?.kind === 'comet' && !state.cometsOn) {
    state.cometsOn = true;
    $('l-comets').checked = true;
    cometCloud.points.visible = true;
    cometCloud.update(state.jd);
  }
  setOrbitLine(sel);
  selMarker.visible = !!sel;
  if (sel && focus) focusOn(sel, fromHash);
  if (!sel) state.follow = false;
  await renderDetail();
  pushHash();
}

async function renderDetail() {
  const panel = $('detail');
  const body = $('detail-body');
  const sel = state.selected;
  if (!sel) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  const info = { showFollow: true, following: state.follow, badges: [] };

  if (sel.kind === 'planet') {
    const p = core.planets[sel.index];
    info.title = p.name;
    info.subtitle = 'planet';
    info.showFollow = true;
    info.orbitRows = [
      ['Semi-major axis', fmtAu(p.a)],
      ['Eccentricity', p.e.toFixed(5)],
      ['Inclination', `${p.i.toFixed(3)}°`],
      ['Orbital period', `${p.per.toFixed(1)} days`],
    ];
    info.physRows = [['Mean radius', `${p.radius_km.toLocaleString()} km`]];
  } else if (sel.kind === 'comet') {
    const c = core.comets[sel.index];
    info.title = c.full_name;
    info.subtitle = `comet · class ${c.class}`;
    info.badges.push({ cls: 'cls', text: c.class });
    info.orbitRows = [
      ['Eccentricity', c.e?.toFixed(4)],
      ['Perihelion', c.q != null ? fmtAu(c.q) : '—'],
      ['Semi-major axis', c.a != null ? fmtAu(c.a) : 'open orbit'],
      ['Inclination', c.i != null ? `${c.i.toFixed(2)}°` : '—'],
      ['Orbital period', c.per != null ? `${(c.per / 365.25).toFixed(1)} yr` : '— (single pass)'],
      ['Perihelion date', c.tp != null ? formatJd(c.tp) : '—'],
    ];
    info.physRows = [
      ['Total magnitude M1', c.M1 ?? '—'],
      ['Diameter', fmtKm(c.diameter)],
    ];
  } else {
    const idx = sel.index;
    const el = cloud.elementsAt(idx);
    const det = (await loadDetails())[idx];
    const pdes = core.pdes[idx];
    const pha = (el.flags & FLAG_PHA) !== 0;
    const isSentry = (el.flags & FLAG_SENTRY) !== 0;
    const clsName = el.classIdx === 4 ? det.class : CLASS_NAMES[el.classIdx];
    info.title = core.names[idx];
    info.subtitle = `near-Earth asteroid · ${clsName}`;
    info.badges.push({ cls: 'cls', text: clsName });
    if (pha) info.badges.push({ cls: 'pha', text: 'PHA' });
    if (isSentry) info.badges.push({ cls: 'sentry', text: 'SENTRY RISK' });
    info.orbitRows = [
      ['Semi-major axis', fmtAu(el.a)],
      ['Eccentricity', el.e.toFixed(4)],
      ['Inclination', `${el.i.toFixed(2)}°`],
      ['Perihelion q', fmtAu(det.q)],
      ['Aphelion Q', fmtAu(det.ad)],
      ['Orbital period', det.per != null ? `${det.per.toFixed(1)} days` : '—'],
      ['Earth MOID', det.moid != null ? `${fmtAu(det.moid)} (${(det.moid / LD_AU).toFixed(1)} LD)` : '—'],
    ];
    info.physRows = [
      ['Diameter', fmtKm(det.diameter ?? el.diam) + (det.diameter == null ? ' (est.)' : '')],
      ['Absolute magnitude H', el.H === 99 ? '—' : el.H.toFixed(2)],
      ['Albedo', det.albedo ?? '—'],
      ['Rotation period', det.rot_per != null ? `${det.rot_per} h` : '—'],
      ['Spectral type', det.spec_B || det.spec_T || '—'],
      ['First observed', det.first_obs ?? '—'],
    ];
    if (isSentry) {
      await loadSentry();
      info.risk = sentryByDes().get(pdes);
    }
    // close approaches for this object
    try {
      const ca = await loadCloseApproaches();
      const idxs = ca.byDes[pdes] || [];
      // nearest 8 events around the current time
      const sorted = idxs
        .map((i) => ca.events[i])
        .sort((x, y) => Math.abs(x[0] - state.jd) - Math.abs(y[0] - state.jd))
        .slice(0, 8)
        .sort((x, y) => x[0] - y[0]);
      info.approaches = sorted.map((e) => ({ jd: e[0], dist: e[2], v_rel: e[5] }));
    } catch {
      info.approaches = [];
    }
  }

  body.innerHTML = detailHtml(info);
  $('act-follow')?.addEventListener('click', () => {
    state.follow = !state.follow;
    if (state.follow && state.selected) followPrev.copy(bodyPosition(state.selected, state.jd));
    renderDetail();
    pushHash();
  });
  $('act-link')?.addEventListener('click', async () => {
    history.replaceState(null, '', serializeHash());
    try {
      await navigator.clipboard.writeText(location.href);
      $('act-link').textContent = 'Copied!';
      setTimeout(() => { if ($('act-link')) $('act-link').textContent = 'Copy link'; }, 1200);
    } catch { /* clipboard unavailable */ }
  });
  body.querySelectorAll('.ca-row .d').forEach((el) =>
    el.addEventListener('click', () => {
      state.jd = +el.dataset.jd;
      state.playing = false;
      syncTimeUi();
      pushHash();
    })
  );
}

// ---------- picking -------------------------------------------------------------
function handlePick(mx, my) {
  const w = innerWidth, h = innerHeight;
  // planets first (screen-space distance)
  let best = null, bestD = 14;
  const v = new THREE.Vector3();
  planetSys.bodies.forEach((b, i) => {
    v.copy(b.mesh.position).project(camera);
    if (v.z > 1) return;
    const d = Math.hypot((v.x * 0.5 + 0.5) * w - mx, (-v.y * 0.5 + 0.5) * h - my);
    if (d < bestD) { bestD = d; best = { kind: 'planet', index: i }; }
  });
  if (!best) {
    const ai = cloud.pick(state.jd, camera, mx, my, w, h, 9);
    if (ai >= 0) best = { kind: 'asteroid', index: ai };
  }
  if (!best && cometCloud.points.visible) {
    bestD = 9;
    const pos = cometCloud.positions;
    for (let k = 0; k < core.comets.length; k++) {
      if (cometCloud.alpha[k] < 0.05) continue;
      v.set(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]).project(camera);
      if (v.z > 1) continue;
      const d = Math.hypot((v.x * 0.5 + 0.5) * w - mx, (-v.y * 0.5 + 0.5) * h - my);
      if (d < bestD) { bestD = d; best = { kind: 'comet', index: k }; }
    }
  }
  select(best);
}

// ---------- labels ---------------------------------------------------------------
function getLabel(key, cls = '') {
  if (!labelDivs.has(key)) {
    const div = document.createElement('div');
    div.className = 'body-label ' + cls;
    $('labels').appendChild(div);
    labelDivs.set(key, div);
  }
  return labelDivs.get(key);
}

function updateLabels() {
  const v = new THREE.Vector3();
  const place = (key, name, pos, visible, cls = '') => {
    const div = getLabel(key, cls);
    if (!visible) { div.style.display = 'none'; return; }
    v.copy(pos).project(camera);
    if (v.z > 1) { div.style.display = 'none'; return; }
    div.style.display = 'block';
    div.textContent = name;
    div.style.left = `${(v.x * 0.5 + 0.5) * innerWidth}px`;
    div.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
  };
  place('sun', 'Sun', sun.position, state.labelsOn);
  planetSys.bodies.forEach((b, i) => place(`p${i}`, b.def.name, b.mesh.position, state.labelsOn));
  if (state.selected) {
    place('sel', selectedName(state.selected), bodyPosition(state.selected, state.jd, v.clone()), true, 'selected');
  } else if (labelDivs.has('sel')) {
    labelDivs.get('sel').style.display = 'none';
  }
}

// ---------- time UI ---------------------------------------------------------------
function syncTimeUi() {
  $('date-display').textContent = formatJd(state.jd);
  const d = jdToDate(state.jd);
  if (document.activeElement !== $('date-input')) {
    $('date-input').value = d.toISOString().slice(0, 10);
  }
  $('jd-display').textContent = `JD ${state.jd.toFixed(1)} · ${state.dir < 0 ? '−' : ''}${speedLabel()} ${state.playing ? '' : '· paused'}`;
  $('btn-play').innerHTML = state.playing ? '&#10074;&#10074;' : '&#9654;';
  $('btn-rev').classList.toggle('reversed', state.dir < 0);
}
function speedLabel() {
  const s = $('speed');
  return s.options[s.selectedIndex]?.text.replace(' / s', '/s') ?? `${state.speed} d/s`;
}

// ---------- approaches panel -------------------------------------------------------
let caData = null;
async function ensureApproaches() {
  if (!caData) {
    $('approaches').innerHTML = '<p class="dim">loading…</p>';
    caData = await loadCloseApproaches();
  }
  renderApproachesList();
}

function renderApproachesList() {
  if (!caData) return;
  const { events } = caData;
  // binary search: first event >= current jd
  let lo = 0, hi = events.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid][0] < state.jd) lo = mid + 1; else hi = mid;
  }
  const rows = [];
  for (let k = lo; k < Math.min(lo + 12, events.length); k++) {
    const e = events[k];
    const idx = core.pdesToIdx.get(e[1]);
    const name = idx != null ? core.names[idx] : e[1];
    rows.push(approachRowHtml({ jd: e[0], des: e[1], dist: e[2] }, name));
  }
  $('approaches').innerHTML = rows.join('') || '<p class="dim">No catalogued approaches after this date.</p>';
  $('approaches').querySelectorAll('.approach-row').forEach((el) =>
    el.addEventListener('click', () => {
      state.jd = +el.dataset.jd;
      state.playing = false;
      const idx = core.pdesToIdx.get(el.dataset.des);
      syncTimeUi();
      if (idx != null) select({ kind: 'asteroid', index: idx });
      pushHash();
    })
  );
}

// ---------- search ------------------------------------------------------------------
function initSearch() {
  const input = $('search');
  const results = $('search-results');
  let t = null;
  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { results.innerHTML = ''; return; }
      const hits = [];
      for (let i = 0; i < core.count && hits.length < 8; i++) {
        if (core.names[i].toLowerCase().includes(q) || core.pdes[i].toLowerCase() === q) {
          hits.push({ kind: 'asteroid', index: i, label: core.names[i], tag: 'asteroid' });
        }
      }
      core.comets.forEach((c, i) => {
        if (hits.length < 12 && c.full_name.toLowerCase().includes(q)) {
          hits.push({ kind: 'comet', index: i, label: c.full_name, tag: 'comet' });
        }
      });
      core.planets.forEach((p, i) => {
        if (p.name.toLowerCase().includes(q)) hits.push({ kind: 'planet', index: i, label: p.name, tag: 'planet' });
      });
      results.innerHTML = hits.length
        ? hits.map((h, i) => `<div class="search-hit" data-i="${i}">${h.label}<span class="tag">${h.tag}</span></div>`).join('')
        : '<div class="dim" style="padding:4px 6px">no matches</div>';
      results.querySelectorAll('.search-hit').forEach((el) =>
        el.addEventListener('click', () => {
          const h = hits[+el.dataset.i];
          results.innerHTML = '';
          input.value = '';
          select({ kind: h.kind, index: h.index });
        })
      );
    }, 150);
  });
}

// Apply parsed hash state to the live app (used on load and on hashchange).
async function applyHashState() {
  $('speed').value = String(state.speed);
  $('f-pha').checked = state.phaOnly;
  $('f-sentry').checked = state.sentryOnly;
  $('f-diam').value = String(state.minDiam);
  $('f-diam-val').textContent = `${state.minDiam} km`;
  document.querySelectorAll('#color-modes button').forEach((b) =>
    b.classList.toggle('on', b.dataset.mode === state.colorMode)
  );
  document.querySelectorAll('#class-filters input').forEach((inp) => {
    inp.checked = state.classes[+inp.dataset.i];
  });
  cometCloud.points.visible = state.cometsOn;
  $('l-comets').checked = state.cometsOn;
  if (state._pendingCam) {
    const [px, py, pz, tx, ty, tz] = state._pendingCam.split(',').map(Number);
    if ([px, py, pz, tx, ty, tz].every(isFinite)) {
      camera.position.set(px, py, pz);
      controls.target.set(tx, ty, tz);
    }
    state._pendingCam = null;
  }
  applyColors();
  syncTimeUi();
  if (state._pendingSel) {
    const raw = state._pendingSel;
    state._pendingSel = null;
    const kind = raw[0], id = raw.slice(2);
    if (kind === 'a') {
      const idx = core.pdesToIdx.get(id);
      await select(idx != null ? { kind: 'asteroid', index: idx } : null, { focus: idx != null, fromHash: true });
    } else if (kind === 'c') {
      const idx = core.comets.findIndex((c) => c.pdes === id);
      await select(idx >= 0 ? { kind: 'comet', index: idx } : null, { focus: idx >= 0, fromHash: true });
    } else if (kind === 'p') {
      const idx = core.planets.findIndex((p) => p.name === id);
      await select(idx >= 0 ? { kind: 'planet', index: idx } : null, { focus: idx >= 0, fromHash: true });
    }
  } else if (state.selected) {
    await select(null);
  }
}

// ---------- boot ----------------------------------------------------------------------
function setLoad(pct, msg) {
  $('load-fill').style.width = `${pct}%`;
  $('load-msg').textContent = msg;
}

async function boot() {
  parseHash();
  setLoad(15, 'fetching orbital elements…');
  core = await loadCore();
  setLoad(55, 'building scene…');
  initScene();

  // restore UI state from hash
  setLoad(80, 'coloring 42,000 orbits…');
  await loadSentry(); // small; needed for risk coloring & flags
  wireControls();
  initSearch();
  await applyHashState();

  // live deep links: react when the hash changes while the app is open
  addEventListener('hashchange', () => {
    parseHash();
    applyHashState();
  });

  setLoad(100, 'ready');
  document.body.classList.add('loaded');
  $('loading').classList.add('done');
  requestAnimationFrame(loop);
}

function wireControls() {
  $('btn-play').addEventListener('click', () => { state.playing = !state.playing; syncTimeUi(); pushHash(); });
  $('btn-rev').addEventListener('click', () => { state.dir *= -1; syncTimeUi(); pushHash(); });
  $('speed').addEventListener('change', (e) => { state.speed = +e.target.value; syncTimeUi(); pushHash(); });
  $('date-input').addEventListener('change', (e) => {
    if (!e.target.value) return;
    state.jd = dateToJd(new Date(e.target.value + 'T00:00:00Z'));
    syncTimeUi();
    pushHash();
    renderApproachesList();
  });
  $('btn-now').addEventListener('click', () => { state.jd = dateToJd(new Date()); syncTimeUi(); pushHash(); });

  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') { e.preventDefault(); state.playing = !state.playing; syncTimeUi(); pushHash(); }
    else if (e.code === 'ArrowRight') { state.jd += e.shiftKey ? 30 : 1; state.playing = false; syncTimeUi(); pushHash(); }
    else if (e.code === 'ArrowLeft') { state.jd -= e.shiftKey ? 30 : 1; state.playing = false; syncTimeUi(); pushHash(); }
  });

  buildClassFilters($('class-filters'), state.classes, (i, on) => {
    state.classes[i] = on;
    applyColors();
  });
  $('f-pha').addEventListener('change', (e) => { state.phaOnly = e.target.checked; applyColors(); });
  $('f-sentry').addEventListener('change', (e) => { state.sentryOnly = e.target.checked; applyColors(); });
  $('f-diam').addEventListener('input', (e) => {
    state.minDiam = +e.target.value;
    $('f-diam-val').textContent = `${state.minDiam} km`;
    applyColors();
  });
  document.querySelectorAll('#color-modes button').forEach((b) =>
    b.addEventListener('click', () => {
      state.colorMode = b.dataset.mode;
      document.querySelectorAll('#color-modes button').forEach((x) => x.classList.toggle('on', x === b));
      applyColors();
    })
  );
  $('l-comets').addEventListener('change', (e) => {
    state.cometsOn = e.target.checked;
    cometCloud.points.visible = state.cometsOn;
    if (state.cometsOn) cometCloud.update(state.jd);
    pushHash();
  });
  $('l-orbits').addEventListener('change', (e) => {
    state.orbitsOn = e.target.checked;
    planetSys.group.children.forEach((c) => { if (c.type === 'Line') c.visible = state.orbitsOn; });
  });
  $('l-labels').addEventListener('change', (e) => { state.labelsOn = e.target.checked; });
  $('size-scale').addEventListener('input', (e) => {
    state.sizeScale = +e.target.value / 100;
    $('size-val').textContent = `${state.sizeScale.toFixed(1)}×`;
    sun.scale.setScalar(state.sizeScale);
    planetSys.bodies.forEach((b) => b.mesh.scale.setScalar(state.sizeScale));
    cloud.setPxScale(Math.min(devicePixelRatio, 2) * state.sizeScale);
    cometCloud.points.material.uniforms.uPx.value = Math.min(devicePixelRatio, 2) * state.sizeScale;
  });
  cloud.setPxScale(Math.min(devicePixelRatio, 2));
  cometCloud.points.material.uniforms.uPx.value = Math.min(devicePixelRatio, 2);

  $('detail-close').addEventListener('click', () => select(null));
  $('approaches-load').addEventListener('click', () => {
    $('approaches-load').remove();
    ensureApproaches();
  });
}

// ---------- main loop -------------------------------------------------------------------
const clock = new THREE.Clock();
let caRefreshTimer = 0;

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.1);

  if (state.playing) {
    state.jd += state.dir * state.speed * dt;
  }

  // camera tween
  if (tween) {
    tween.t += dt / tween.dur;
    const k = tween.t >= 1 ? 1 : 1 - Math.pow(1 - tween.t, 3);
    camera.position.lerpVectors(tween.fromPos, tween.toPos, k);
    controls.target.lerpVectors(tween.fromTgt, tween.toTgt, k);
    if (tween.t >= 1) tween = null;
  }

  // follow selected body
  if (state.follow && state.selected && !tween) {
    const pos = bodyPosition(state.selected, state.jd);
    const delta = pos.clone().sub(followPrev);
    camera.position.add(delta);
    controls.target.copy(pos);
    followPrev.copy(pos);
  }

  controls.update();

  // propagate
  cloud.setTime(state.jd);
  planetSys.update(state.jd);
  if (cometCloud.points.visible) cometCloud.update(state.jd);

  // selection marker
  if (state.selected) {
    const pos = bodyPosition(state.selected, state.jd);
    selMarker.position.copy(pos);
    const d = camera.position.distanceTo(pos);
    selMarker.scale.setScalar(Math.max(d * 0.05, 0.004));
  }

  syncTimeUi();
  updateLabels();

  // keep the approaches list in sync with time while visible
  if (caData) {
    caRefreshTimer += dt;
    if (caRefreshTimer > 1.5) {
      caRefreshTimer = 0;
      renderApproachesList();
    }
  }

  renderer.render(scene, camera);
}

boot().catch((err) => {
  console.error(err);
  setLoad(100, `failed to start: ${err.message}`);
});
