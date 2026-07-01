import './style.css';
import * as THREE from 'three';
import { loadData, loadDetails, AppData, AST_FLOATS, F_H, F_MOID, F_A, F_E, F_DIAM, FLAG_PHA, FLAG_SENTRY, FLAG_NAMED } from './data';
import { SceneManager, Selection } from './scene';
import { dateToJd, fmtJd, jdToDate, J2000 } from './kepler';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const LD_AU = 0.002569; // 1 lunar distance in au
const JD_MIN = dateToJd(new Date(Date.UTC(1900, 0, 1)));
const JD_MAX = dateToJd(new Date(Date.UTC(2100, 0, 1)));

// ---------------------------------------------------------------- state
interface AppState {
  t: number;            // sim time, JD
  playing: boolean;
  speed: number;        // days per real second (signed)
  selection: Selection | null;
  follow: boolean;
}
const state: AppState = {
  t: dateToJd(new Date()),
  playing: true,
  speed: 2,
  selection: null,
  follow: false,
};

async function boot() {
  const loadingMsg = $('loading-msg');
  let data: AppData;
  try {
    data = await loadData((m) => (loadingMsg.textContent = m));
  } catch (err) {
    loadingMsg.textContent = `Failed to load data: ${err}`;
    return;
  }
  const scene = new SceneManager($('canvas-wrap'), data);
  initApp(data, scene);
  $('loading').classList.add('done');
}

function initApp(data: AppData, scene: SceneManager) {
  const n = data.meta.count;
  $('obj-count').textContent = `${n.toLocaleString()} asteroids · ${data.comets.length.toLocaleString()} comets`;

  const sentryRank = new Map<string, number>(); // pdes -> ps_cum for sorting
  for (const [des, s] of Object.entries(data.sentry)) sentryRank.set(des, s.ps_cum);

  // ============================================================ time
  const elDate = $('t-date');
  const elPlay = $<HTMLButtonElement>('t-play');
  const elSpeed = $<HTMLInputElement>('t-speed');
  const elSpeedVal = $('t-speed-val');
  const elScrub = $<HTMLInputElement>('t-scrub');
  const elPicker = $<HTMLInputElement>('t-picker');
  let dir = 1;

  // slider 0..100 -> days/sec 0.02 .. ~7300 (log scale)
  const sliderToSpeed = (v: number) => 0.02 * Math.pow(10, (v / 100) * 5.56);
  const speedToSlider = (s: number) =>
    Math.round((Math.log10(Math.max(0.02, Math.abs(s)) / 0.02) / 5.56) * 100);
  function fmtSpeed(s: number): string {
    const a = Math.abs(s), sign = s < 0 ? '−' : '';
    if (a < 1) return `${sign}${(a * 24).toFixed(1)} hr/s`;
    if (a < 60) return `${sign}${a.toFixed(1)} days/s`;
    if (a < 365) return `${sign}${(a / 30.44).toFixed(1)} months/s`;
    return `${sign}${(a / 365.25).toFixed(1)} yr/s`;
  }
  function setSpeed(daysPerSec: number) {
    state.speed = daysPerSec;
    dir = daysPerSec < 0 ? -1 : 1;
    elSpeedVal.textContent = fmtSpeed(daysPerSec);
    elSpeed.value = String(speedToSlider(daysPerSec));
  }
  function setTime(jd: number, opts: { scrub?: boolean } = {}) {
    state.t = Math.min(JD_MAX, Math.max(JD_MIN, jd));
    elDate.textContent = fmtJd(state.t);
    if (!opts.scrub) elScrub.value = String((state.t - JD_MIN) / (JD_MAX - JD_MIN));
    const d = jdToDate(state.t);
    elPicker.value = `${d.getUTCFullYear().toString().padStart(4, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}T${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    approachesDirty = true;
    urlDirty = true;
  }
  function setPlaying(p: boolean) {
    state.playing = p;
    elPlay.textContent = p ? '⏸' : '▶';
  }
  elPlay.onclick = () => setPlaying(!state.playing);
  $('t-now').onclick = () => setTime(dateToJd(new Date()));
  elSpeed.oninput = () => setSpeed(dir * sliderToSpeed(Number(elSpeed.value)));
  $('t-rev').onclick = () => setSpeed(-state.speed);
  elScrub.oninput = () => setTime(JD_MIN + Number(elScrub.value) * (JD_MAX - JD_MIN), { scrub: true });
  elPicker.onchange = () => {
    const d = new Date(elPicker.value + 'Z');
    if (!isNaN(d.getTime())) setTime(dateToJd(d));
  };
  window.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); setPlaying(!state.playing); }
    if (e.key === 'Escape') select(null);
  });

  // ============================================================ selection
  const detailPanel = $('detail-panel');
  let liveUpdater: ((t: number) => void) | null = null;

  function selKey(sel: Selection | null): string {
    if (!sel) return '';
    if (sel.type === 'ast') return 'a:' + data.meta.pdes[sel.index];
    if (sel.type === 'comet') return 'c:' + data.comets[sel.index].pdes;
    return 'p:' + data.planets[sel.index].name;
  }
  function selFromKey(key: string): Selection | null {
    const [k, ...rest] = key.split(':');
    const id = rest.join(':');
    if (k === 'a') { const i = data.meta.pdes.indexOf(id); return i >= 0 ? { type: 'ast', index: i } : null; }
    if (k === 'c') { const i = data.comets.findIndex((c) => c.pdes === id); return i >= 0 ? { type: 'comet', index: i } : null; }
    if (k === 'p') { const i = data.planets.findIndex((p) => p.name === id); return i >= 0 ? { type: 'planet', index: i } : null; }
    return null;
  }

  function select(sel: Selection | null, opts: { follow?: boolean } = {}) {
    state.selection = sel;
    scene.setSelection(sel);
    state.follow = !!sel && !!opts.follow;
    $('d-follow').classList.toggle('active', state.follow);
    detailPanel.hidden = !sel;
    liveUpdater = null;
    if (sel) renderDetail(sel);
    urlDirty = true;
  }

  $('d-close').onclick = () => select(null);
  $('d-follow').onclick = () => {
    state.follow = !state.follow;
    $('d-follow').classList.toggle('active', state.follow);
    if (state.follow) flyToSelection();
    urlDirty = true;
  };
  $('d-link').onclick = () => {
    urlDirty = true; syncUrl();
    navigator.clipboard?.writeText(location.href).then(() => toast('Link copied'));
  };
  $('btn-share').onclick = () => {
    urlDirty = true; syncUrl();
    navigator.clipboard?.writeText(location.href).then(() => toast('View link copied'));
  };

  function flyToSelection() {
    if (!state.selection) return;
    const p = new THREE.Vector3();
    if (!scene.getPosition(state.selection, state.t, p)) return;
    const cam = scene.camera, ctl = scene.controls;
    const dist = state.selection.type === 'planet' ? 0.12 : 0.05;
    const dirV = new THREE.Vector3().subVectors(cam.position, ctl.target).normalize();
    const targetPos = p.clone().add(dirV.multiplyScalar(dist));
    // smooth fly
    const t0 = performance.now(), p0 = cam.position.clone(), tg0 = ctl.target.clone();
    const anim = () => {
      const k = Math.min(1, (performance.now() - t0) / 700);
      const s = k * k * (3 - 2 * k);
      // follow moving target
      const pNow = new THREE.Vector3();
      scene.getPosition(state.selection!, state.t, pNow);
      const tpNow = pNow.clone().add(dirV.clone().normalize().multiplyScalar(dist));
      ctl.target.lerpVectors(tg0, pNow, s);
      cam.position.lerpVectors(p0, tpNow, s);
      if (k < 1 && state.follow) requestAnimationFrame(anim);
    };
    anim();
  }

  function fmt(x: number | null | undefined, d = 3, unit = ''): string {
    if (x == null || !isFinite(x)) return '—';
    return x.toFixed(d) + unit;
  }

  async function renderDetail(sel: Selection) {
    const name = $('d-name'), chips = $('d-chips');
    const phys = $<HTMLTableElement>('d-phys'), orbit = $<HTMLTableElement>('d-orbit');
    const caDiv = $('d-ca'), sentryDiv = $('d-sentry'), live = $('d-live');
    chips.innerHTML = ''; sentryDiv.innerHTML = ''; caDiv.innerHTML = ''; live.textContent = '';
    $('d-ca-head').style.display = $('d-ca-hint').style.display = sel.type === 'ast' ? '' : 'none';
    const chip = (txt: string, cls = '') => {
      const s = document.createElement('span');
      s.className = 'chip static ' + cls;
      s.textContent = txt;
      chips.appendChild(s);
    };
    const row = (tbl: HTMLTableElement, k: string, v: string) => {
      const tr = tbl.insertRow();
      tr.insertCell().textContent = k;
      tr.insertCell().textContent = v;
    };
    phys.innerHTML = ''; orbit.innerHTML = '';

    if (sel.type === 'planet') {
      const p = data.planets[sel.index];
      name.textContent = p.name;
      chip('Planet');
      row(phys, 'Mean radius', `${p.radius_km.toLocaleString()} km`);
      row(orbit, 'Semi-major axis', fmt(p.a, 4, ' au'));
      row(orbit, 'Eccentricity', fmt(p.e, 5));
      row(orbit, 'Inclination', fmt(p.i, 3, '°'));
      row(orbit, 'Period', `${(p.per / 365.25).toFixed(2)} yr`);
      liveUpdater = (t) => {
        const v = new THREE.Vector3();
        scene.getPosition(sel, t, v);
        live.textContent = `Heliocentric distance: ${v.length().toFixed(4)} au`;
      };
      return;
    }

    if (sel.type === 'comet') {
      const c = data.comets[sel.index];
      name.textContent = c.label;
      chip('Comet', 'comet');
      chip(c.cls);
      if (c.e >= 1) chip(c.e > 1.0001 ? 'Hyperbolic' : 'Parabolic');
      row(phys, 'Total magnitude M1', fmt(c.M1, 1));
      row(phys, 'Diameter', c.diameter != null ? `${c.diameter} km` : '—');
      row(orbit, 'Eccentricity', fmt(c.e, 4));
      row(orbit, 'Perihelion q', fmt(c.q, 3, ' au'));
      if (c.a != null && c.e < 1) row(orbit, 'Semi-major axis', fmt(c.a, 3, ' au'));
      row(orbit, 'Inclination', fmt(c.i, 2, '°'));
      if (c.per != null) row(orbit, 'Period', c.per > 36525 ? `${(c.per / 365.25).toFixed(0)} yr` : `${(c.per / 365.25).toFixed(1)} yr`);
      row(orbit, 'Perihelion passage', fmtJd(c.tp, false));
      liveUpdater = (t) => {
        const v = new THREE.Vector3();
        if (scene.getPosition(sel, t, v)) live.textContent = `Heliocentric distance: ${v.length().toFixed(3)} au`;
        else live.textContent = 'Beyond plotted range at this date';
      };
      return;
    }

    // asteroid
    const i = sel.index;
    const a = data.ast, o = i * AST_FLOATS;
    const fl = data.flags[i];
    const pdes = data.meta.pdes[i];
    name.textContent = data.meta.label[i];
    chip(data.meta.classes[data.cls[i]] + ' · ' + classLabel(data.meta.classes[data.cls[i]]));
    if (fl & FLAG_PHA) chip('Potentially hazardous', 'pha');
    if (fl & FLAG_SENTRY) chip('Sentry risk list', 'sentry');

    const sent = data.sentry[pdes];
    if (sent) {
      const ipStr = sent.ip >= 1e-3 ? (sent.ip * 100).toFixed(2) + '%' : `1 in ${Math.round(1 / sent.ip).toLocaleString()}`;
      sentryDiv.innerHTML = `<div class="alert">
        <b>CNEOS Sentry:</b> cumulative impact probability <b>${ipStr}</b>
        across ${sent.n_imp} potential impact${sent.n_imp === 1 ? '' : 's'} in <b>${sent.range}</b>.<br/>
        Palermo scale ${sent.ps_cum.toFixed(2)} (max ${sent.ps_max.toFixed(2)}), Torino ${sent.ts_max ?? 0}.
        Encounter v<sub>∞</sub> ${sent.v_inf} km/s.</div>`;
    }

    const H = a[o + F_H], diam = a[o + F_DIAM];
    row(phys, 'Absolute magnitude H', H >= 99 ? '—' : H.toFixed(2));
    row(phys, 'Diameter', diam > 0 ? `${diam < 1 ? (diam * 1000).toFixed(0) + ' m' : diam.toFixed(2) + ' km'}` : estDiameter(H));
    const det = await loadDetails();
    if (state.selection !== sel) return; // stale
    if (det.albedo[i] != null) row(phys, 'Albedo', String(det.albedo[i]));
    if (det.rot[i] != null) row(phys, 'Rotation period', `${det.rot[i]} h`);
    if (det.spec[i]) row(phys, 'Spectral type', det.spec[i]!);
    if (det.firstObs[i]) row(phys, 'First observed', det.firstObs[i]!);

    row(orbit, 'Semi-major axis', fmt(a[o + F_A], 4, ' au'));
    row(orbit, 'Eccentricity', fmt(a[o + F_E], 4));
    row(orbit, 'Inclination', fmt(det.i[i], 2, '°'));
    row(orbit, 'Perihelion / aphelion', `${fmt(det.q[i], 3)} / ${fmt(det.ad[i], 3)} au`);
    row(orbit, 'Period', det.per[i] != null ? `${(det.per[i]! / 365.25).toFixed(2)} yr` : '—');
    const moid = a[o + F_MOID];
    row(orbit, 'Earth MOID', moid >= 0 ? `${moid.toFixed(4)} au (${(moid / LD_AU).toFixed(1)} LD)` : '—');

    // close approaches
    const events = data.caByAst.get(i) ?? [];
    if (!events.length) caDiv.innerHTML = '<div class="hint">No catalogued close approaches (1900–2200).</div>';
    const caF = data.caF;
    let nextIdx = -1, bestDt = Infinity;
    for (const ev of events) {
      const dt = caF[ev * 3] + J2000 - state.t;
      if (dt >= 0 && dt < bestDt) { bestDt = dt; nextIdx = ev; }
    }
    for (const ev of events) {
      const jd = caF[ev * 3] + J2000, dist = caF[ev * 3 + 1], vrel = caF[ev * 3 + 2];
      const div = document.createElement('div');
      div.className = 'ca-row' + (jd < state.t ? ' past' : '') + (ev === nextIdx ? ' next' : '');
      div.innerHTML = `<span>${fmtJd(jd, false)}</span><span class="d">${(dist / LD_AU).toFixed(2)} LD</span><span>${vrel.toFixed(1)} km/s</span>`;
      div.title = `${dist.toFixed(5)} au — click to jump time`;
      div.onclick = () => { setTime(jd); setPlaying(false); };
      caDiv.appendChild(div);
    }
    if (nextIdx >= 0) {
      const el = caDiv.children[events.indexOf(nextIdx)] as HTMLElement;
      setTimeout(() => el?.scrollIntoView({ block: 'nearest' }), 50);
    }
    liveUpdater = (t) => {
      const v = new THREE.Vector3(), ev = new THREE.Vector3();
      scene.getPosition(sel, t, v);
      const earthIdx = data.planets.findIndex((p) => p.name === 'Earth');
      scene.getPosition({ type: 'planet', index: earthIdx }, t, ev);
      const dE = v.distanceTo(ev);
      live.textContent = `Sun: ${v.length().toFixed(3)} au · Earth: ${dE.toFixed(3)} au (${(dE / LD_AU).toFixed(0)} LD)`;
    };
  }

  function estDiameter(H: number): string {
    if (H >= 99) return '—';
    // D(km) = 1329 / sqrt(albedo) * 10^(-H/5), assume albedo 0.14
    const d = (1329 / Math.sqrt(0.14)) * Math.pow(10, -H / 5);
    return d < 1 ? `~${(d * 1000).toFixed(0)} m (est.)` : `~${d.toFixed(1)} km (est.)`;
  }
  function classLabel(code: string): string {
    return ({
      APO: 'Apollo', ATE: 'Aten', AMO: 'Amor', IEO: 'Atira',
      HTC: 'Halley-type', JFC: 'Jupiter-family', JFc: 'Jupiter-family', ETc: 'Encke-type',
      CTc: 'Chiron-type', COM: 'Comet', PAR: 'Parabolic', HYP: 'Hyperbolic',
    } as Record<string, string>)[code] ?? code;
  }

  // ============================================================ picking
  const canvas = scene.renderer.domElement;
  const tooltip = $('tooltip');
  let downXY: [number, number] | null = null;
  canvas.addEventListener('pointerdown', (e) => (downXY = [e.clientX, e.clientY]));
  canvas.addEventListener('pointerup', (e) => {
    if (!downXY) return;
    const dx = e.clientX - downXY[0], dy = e.clientY - downXY[1];
    downXY = null;
    if (dx * dx + dy * dy > 25) return; // was a drag
    const sel = scene.pick(e.clientX, e.clientY);
    if (sel) select(sel);
    else select(null);
  });
  let hoverTimer = 0;
  canvas.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - hoverTimer < 60) return;
    hoverTimer = now;
    const sel = scene.pick(e.clientX, e.clientY);
    scene.setHover(sel, state.t);
    canvas.style.cursor = sel ? 'pointer' : '';
    if (sel) {
      tooltip.hidden = false;
      tooltip.style.left = e.clientX + 14 + 'px';
      tooltip.style.top = e.clientY + 10 + 'px';
      let nm = '', sub = '';
      if (sel.type === 'ast') {
        nm = data.meta.label[sel.index];
        const fl = data.flags[sel.index];
        sub = classLabel(data.meta.classes[data.cls[sel.index]]) +
          ((fl & FLAG_SENTRY) ? ' · Sentry risk' : (fl & FLAG_PHA) ? ' · PHA' : '');
      } else if (sel.type === 'comet') {
        nm = data.comets[sel.index].label; sub = 'Comet · ' + classLabel(data.comets[sel.index].cls);
      } else { nm = data.planets[sel.index].name; sub = 'Planet'; }
      tooltip.innerHTML = `${nm}<div class="sub">${sub}</div>`;
    } else tooltip.hidden = true;
  });
  canvas.addEventListener('pointerleave', () => { tooltip.hidden = true; scene.setHover(null, state.t); });

  // ============================================================ filters
  const fPha = $<HTMLInputElement>('f-pha');
  const fSentry = $<HTMLInputElement>('f-sentry');
  const fNamed = $<HTMLInputElement>('f-named');
  const fH = $<HTMLInputElement>('f-h');
  const fMoid = $<HTMLInputElement>('f-moid');
  const classChips: HTMLElement[] = [];
  const classOn = new Set<number>(data.meta.classes.map((_, i) => i));
  {
    const wrap = $('f-classes');
    data.meta.classes.forEach((c, ci) => {
      const el = document.createElement('span');
      el.className = 'chip on';
      el.textContent = `${c} ${classLabel(c)}`;
      el.onclick = () => {
        if (classOn.has(ci)) classOn.delete(ci); else classOn.add(ci);
        el.classList.toggle('on');
        applyFilters();
      };
      wrap.appendChild(el);
      classChips.push(el);
    });
  }
  const mask = new Uint8Array(n);
  function applyFilters() {
    const pha = fPha.checked, sentry = fSentry.checked, named = fNamed.checked;
    const hMax = Number(fH.value);
    const moidMax = Number(fMoid.value) >= 0 ? Infinity : Math.pow(10, Number(fMoid.value));
    $('f-h-val').textContent = hMax >= 34 ? 'any' : String(hMax);
    $('f-h-hint').textContent = hMax >= 34 ? '' : `(≳ ${estDiameter(hMax).replace('~', '').replace(' (est.)', '')})`;
    $('f-moid-val').textContent = moidMax === Infinity ? 'any' : moidMax < 0.01 ? `${(moidMax / LD_AU).toFixed(1)} LD` : `${moidMax.toFixed(2)} au`;
    const ast = data.ast, flags = data.flags, cls = data.cls;
    let count = 0;
    for (let i = 0; i < n; i++) {
      const o = i * AST_FLOATS;
      let v = 1;
      if (pha && !(flags[i] & FLAG_PHA)) v = 0;
      else if (sentry && !(flags[i] & FLAG_SENTRY)) v = 0;
      else if (named && !(flags[i] & FLAG_NAMED)) v = 0;
      else if (!classOn.has(cls[i])) v = 0;
      else if (hMax < 34 && ast[o + F_H] > hMax) v = 0;
      else if (moidMax !== Infinity && !(ast[o + F_MOID] >= 0 && ast[o + F_MOID] <= moidMax)) v = 0;
      mask[i] = v;
      count += v;
    }
    scene.applyFilter(mask);
    $('filter-count').textContent = `Showing ${count.toLocaleString()} of ${n.toLocaleString()} asteroids`;
  }
  for (const el of [fPha, fSentry, fNamed, fH, fMoid]) el.oninput = applyFilters;
  $('f-reset').onclick = () => {
    fPha.checked = fSentry.checked = fNamed.checked = false;
    fH.value = '34'; fMoid.value = '0';
    classOn.clear();
    data.meta.classes.forEach((_, i) => classOn.add(i));
    classChips.forEach((c) => c.classList.add('on'));
    applyFilters();
  };
  applyFilters();

  $<HTMLInputElement>('v-comets').oninput = (e) =>
    scene.setCometsVisible((e.target as HTMLInputElement).checked);
  $<HTMLInputElement>('v-labels').oninput = (e) => {
    const on = (e.target as HTMLInputElement).checked;
    scene.planetLabels.forEach((l) => (l.visible = on));
  };

  // ============================================================ left panel tabs
  const leftPanel = $('left-panel');
  const panes = { filters: $('filters-pane'), approaches: $('approaches-pane'), risk: $('risk-pane') };
  const tabBtns = { filters: $('btn-filters'), approaches: $('btn-approaches'), risk: $('btn-risk') };
  let activePane: keyof typeof panes | null = null;
  function showPane(which: keyof typeof panes | null) {
    activePane = which;
    leftPanel.hidden = !which;
    (Object.keys(panes) as (keyof typeof panes)[]).forEach((k) => {
      panes[k].hidden = k !== which;
      tabBtns[k].classList.toggle('active', k === which);
    });
    if (which !== 'approaches') scene.setApproachHighlights([]);
    else approachesDirty = true;
    if (which === 'risk') renderRiskList();
  }
  tabBtns.filters.onclick = () => showPane(activePane === 'filters' ? null : 'filters');
  tabBtns.approaches.onclick = () => showPane(activePane === 'approaches' ? null : 'approaches');
  tabBtns.risk.onclick = () => showPane(activePane === 'risk' ? null : 'risk');
  document.querySelectorAll('[data-close="left"]').forEach((b) =>
    ((b as HTMLElement).onclick = () => showPane(null)));

  // ============================================================ approaches pane
  let approachesDirty = true;
  let lastApproachRefresh = 0;
  function bisect(jdOff: number): number {
    const caF = data.caF;
    let lo = 0, hi = caF.length / 3;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (caF[mid * 3] < jdOff) lo = mid + 1; else hi = mid;
    }
    return lo;
  }
  function refreshApproaches() {
    if (activePane !== 'approaches') return;
    const winDays = 15;
    const t0 = state.t - J2000 - winDays, t1 = state.t - J2000 + winDays;
    const caF = data.caF, caIdx = data.caIdx;
    const from = bisect(t0), to = bisect(t1);
    type Ev = { ev: number; jd: number; dist: number; vrel: number; ai: number };
    const evs: Ev[] = [];
    for (let k = from; k < to && evs.length < 400; k++) {
      evs.push({ ev: k, jd: caF[k * 3] + J2000, dist: caF[k * 3 + 1], vrel: caF[k * 3 + 2], ai: caIdx[k] });
    }
    evs.sort((a, b) => a.dist - b.dist);
    const list = $('approach-list');
    list.innerHTML = '';
    if (!evs.length) list.innerHTML = '<div class="hint" style="margin-top:8px">No close approaches in this window. Try playing time forward.</div>';
    for (const e of evs.slice(0, 60)) {
      const div = document.createElement('div');
      div.className = 'ap-row';
      const fl = data.flags[e.ai];
      const tag = (fl & FLAG_SENTRY) ? ' 🔴' : (fl & FLAG_PHA) ? ' 🟠' : '';
      div.innerHTML = `<span class="nm">${data.meta.label[e.ai]}${tag}</span>
        <span class="dist">${(e.dist / LD_AU).toFixed(2)} LD</span>
        <span class="sub">${fmtJd(e.jd)} · ${e.vrel.toFixed(1)} km/s</span>`;
      div.onclick = () => select({ type: 'ast', index: e.ai });
      list.appendChild(div);
    }
    scene.setApproachHighlights(evs.slice(0, 60).map((e) => e.ai));
  }

  // ============================================================ risk pane
  let riskRendered = false;
  function renderRiskList() {
    if (riskRendered) return;
    riskRendered = true;
    const rows = Object.entries(data.sentry)
      .sort((a, b) => b[1].ps_cum - a[1].ps_cum)
      .slice(0, 100);
    const list = $('risk-list');
    const pdesToIdx = new Map(data.meta.pdes.map((p, i) => [p, i]));
    for (const [des, s] of rows) {
      const ai = pdesToIdx.get(des);
      if (ai === undefined) continue;
      const div = document.createElement('div');
      div.className = 'ap-row';
      const ipStr = s.ip >= 1e-3 ? (s.ip * 100).toFixed(2) + '%' : `1:${Math.round(1 / s.ip).toLocaleString()}`;
      div.innerHTML = `<span class="nm">${data.meta.label[ai]}</span>
        <span class="dist">PS ${s.ps_cum.toFixed(2)}</span>
        <span class="sub">impact odds ${ipStr} · ${s.range}${s.diameter ? ` · ~${s.diameter < 1 ? Math.round(s.diameter * 1000) + ' m' : s.diameter + ' km'}` : ''}</span>`;
      div.onclick = () => select({ type: 'ast', index: ai });
      list.appendChild(div);
    }
  }

  // ============================================================ search
  const searchInput = $<HTMLInputElement>('search');
  const searchResults = $('search-results');
  const lcLabels = data.meta.label.map((l) => l.toLowerCase());
  const lcComets = data.comets.map((c) => c.label.toLowerCase());
  function doSearch(q: string) {
    q = q.trim().toLowerCase();
    if (q.length < 2) { searchResults.hidden = true; return; }
    type Hit = { sel: Selection; label: string; sub: string; score: number };
    const hits: Hit[] = [];
    for (let pi = 0; pi < data.planets.length; pi++) {
      const nm = data.planets[pi].name.toLowerCase();
      if (nm.includes(q)) hits.push({ sel: { type: 'planet', index: pi }, label: data.planets[pi].name, sub: 'Planet', score: nm.startsWith(q) ? 0 : 1 });
    }
    for (let i = 0; i < n && hits.length < 400; i++) {
      const idx = lcLabels[i].indexOf(q);
      if (idx >= 0) {
        const fl = data.flags[i];
        hits.push({
          sel: { type: 'ast', index: i }, label: data.meta.label[i],
          sub: (fl & FLAG_SENTRY) ? 'Sentry risk' : (fl & FLAG_PHA) ? 'PHA' : classLabel(data.meta.classes[data.cls[i]]),
          score: (idx === 0 || (fl & FLAG_NAMED && lcLabels[i].includes(' ' + q)) ? 0 : 2) + (fl & FLAG_NAMED ? 0 : 1),
        });
      }
    }
    for (let i = 0; i < data.comets.length && hits.length < 500; i++) {
      const idx = lcComets[i].indexOf(q);
      if (idx >= 0) hits.push({ sel: { type: 'comet', index: i }, label: data.comets[i].label, sub: 'Comet', score: idx === 0 ? 0 : 2 });
    }
    hits.sort((a, b) => a.score - b.score || a.label.length - b.label.length);
    searchResults.innerHTML = '';
    searchResults.hidden = hits.length === 0;
    for (const h of hits.slice(0, 24)) {
      const div = document.createElement('div');
      div.className = 'sr-item';
      div.innerHTML = `<span>${h.label}</span><span class="sub">${h.sub}</span>`;
      div.onclick = () => {
        select(h.sel, { follow: true });
        flyToSelection();
        searchResults.hidden = true;
        searchInput.value = h.label;
      };
      searchResults.appendChild(div);
    }
  }
  let searchDeb = 0;
  searchInput.oninput = () => {
    clearTimeout(searchDeb);
    searchDeb = window.setTimeout(() => doSearch(searchInput.value), 120);
  };
  searchInput.onfocus = () => doSearch(searchInput.value);
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('#search-wrap')) searchResults.hidden = true;
  });

  // ============================================================ help & toast
  $('btn-help').onclick = () => ($('help').hidden = false);
  $('help-close').onclick = () => ($('help').hidden = true);
  $('help').addEventListener('click', (e) => { if (e.target === $('help')) $('help').hidden = true; });
  function toast(msg: string) {
    document.getElementById('toast')?.remove();
    const t = document.createElement('div');
    t.id = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => (t.style.opacity = '0'), 1600);
    setTimeout(() => t.remove(), 2000);
  }

  // ============================================================ deep links
  let urlDirty = false;
  let lastUrlSync = 0;
  function syncUrl() {
    urlDirty = false;
    const p = new URLSearchParams();
    p.set('t', state.t.toFixed(3));
    if (state.selection) p.set('sel', selKey(state.selection));
    if (state.follow) p.set('follow', '1');
    if (!state.playing) p.set('paused', '1');
    p.set('spd', state.speed.toPrecision(3));
    const c = scene.camera.position, g = scene.controls.target;
    p.set('cam', [c.x, c.y, c.z].map((v) => v.toFixed(3)).join(','));
    p.set('tgt', [g.x, g.y, g.z].map((v) => v.toFixed(3)).join(','));
    history.replaceState(null, '', '#' + p.toString());
  }
  function restoreFromUrl(): boolean {
    if (!location.hash || location.hash.length < 2) return false;
    try {
      const p = new URLSearchParams(location.hash.slice(1));
      if (p.get('t')) setTime(Number(p.get('t')));
      if (p.get('spd')) setSpeed(Number(p.get('spd')));
      if (p.get('paused')) setPlaying(false);
      const cam = p.get('cam')?.split(',').map(Number);
      const tgt = p.get('tgt')?.split(',').map(Number);
      if (cam?.length === 3 && cam.every(isFinite)) scene.camera.position.set(cam[0], cam[1], cam[2]);
      if (tgt?.length === 3 && tgt.every(isFinite)) scene.controls.target.set(tgt[0], tgt[1], tgt[2]);
      const sel = p.get('sel') ? selFromKey(p.get('sel')!) : null;
      if (sel) select(sel, { follow: p.get('follow') === '1' });
      return true;
    } catch { return false; }
  }
  scene.controls.addEventListener('change', () => (urlDirty = true));

  // ============================================================ main loop
  setSpeed(state.speed);
  setTime(state.t);
  setPlaying(true);
  restoreFromUrl();

  const followPos = new THREE.Vector3();
  const prevFollowPos = new THREE.Vector3();
  let haveFollowPos = false;
  let lastFrame = performance.now();

  scene.update(state.t);
  function frame(now: number) {
    const dtReal = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    if (state.playing) {
      const nt = state.t + state.speed * dtReal;
      state.t = Math.min(JD_MAX, Math.max(JD_MIN, nt));
      if (state.t !== nt) setPlaying(false); // hit the edge
      elDate.textContent = fmtJd(state.t);
      elScrub.value = String((state.t - JD_MIN) / (JD_MAX - JD_MIN));
      approachesDirty = true;
      urlDirty = true;
    }
    scene.update(state.t);
    const selPos = scene.updateOverlays(state.t);
    liveUpdater?.(state.t);

    // camera follow
    if (state.follow && state.selection && selPos) {
      followPos.copy(selPos);
      if (haveFollowPos) {
        const delta = new THREE.Vector3().subVectors(followPos, prevFollowPos);
        scene.camera.position.add(delta);
        scene.controls.target.add(delta);
      } else {
        scene.controls.target.copy(followPos);
      }
      prevFollowPos.copy(followPos);
      haveFollowPos = true;
    } else haveFollowPos = false;

    // periodic UI refreshes
    if (approachesDirty && now - lastApproachRefresh > 500) {
      lastApproachRefresh = now;
      approachesDirty = false;
      refreshApproaches();
    }
    if (urlDirty && now - lastUrlSync > 800) {
      lastUrlSync = now;
      syncUrl();
    }
    scene.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot();
