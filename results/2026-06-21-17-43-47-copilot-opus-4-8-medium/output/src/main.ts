import './style.css';
import * as THREE from 'three';
import { Scene } from './scene';
import { loadAll, loadCloseApproaches, getCloseApproachesSync, type LoadedData } from './data';
import { createAsteroidLayer, CLASS_CODES, CLASS_COLORS } from './asteroids';
import { createSolarSystem } from './planets';
import { createCometLayer } from './comets';
import { TimeController } from './time';
import { propagate, sampleOrbit, dateToJD, jdToDate, jdToISO, jdToDateTimeString, J2000, DEG2RAD, type Elements } from './kepler';
import { asteroidElements, pickAsteroid } from './picking';
import { applyFilters, defaultFilters, searchAsteroids, type FilterState } from './filters';
import { readState, writeState, cameraToArray, type ViewState } from './url';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const JD_MIN = dateToJD(new Date('1900-01-01T00:00:00Z'));
const JD_MAX = dateToJD(new Date('2200-01-01T00:00:00Z'));

interface Selection {
  kind: 'ast' | 'planet' | 'comet';
  index: number;
}

async function main() {
  const loadMsg = $('loadmsg');
  let data: LoadedData;
  try {
    data = await loadAll((m) => (loadMsg.textContent = m));
  } catch (err) {
    loadMsg.textContent = 'Failed to load data: ' + (err as Error).message;
    return;
  }

  const { meta, orbits, planets, comets, sentryByDes, notable } = data;

  // Lookup maps.
  const spkidToIndex = new Map<number, number>();
  const pdesToIndex = new Map<string, number>();
  for (let i = 0; i < meta.count; i++) {
    spkidToIndex.set(meta.spkid[i], i);
    if (meta.pdes[i]) pdesToIndex.set(meta.pdes[i]!, i);
  }
  const sentrySet = new Set<string>(sentryByDes.keys());

  // Scene + layers.
  const sceneObj = new Scene($('app'));
  const { scene, camera, controls, renderer } = sceneObj;

  const solar = createSolarSystem(planets);
  scene.add(solar.group);

  const asteroidLayer = createAsteroidLayer(orbits, meta);
  scene.add(asteroidLayer.points);

  const cometLayer = createCometLayer(comets);
  scene.add(cometLayer.points);

  // Selection visuals.
  const selMarker = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.014, 0.02, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  selMarker.add(ring);
  selMarker.visible = false;
  scene.add(selMarker);

  let selOrbitLine: THREE.Line | null = null;
  const selOrbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

  // State.
  const time = new TimeController();
  let filters: FilterState = defaultFilters();
  let visibleMask: Uint8Array = new Uint8Array(meta.count).fill(1);
  let selection: Selection | null = null;
  let following = false;
  let showAsteroids = true;
  let colorMode = 0;

  // Planet labels (DOM).
  const labelsEl = $('labels');
  const labelEls: { el: HTMLDivElement; getPos: () => THREE.Vector3 }[] = [];
  const mkLabel = (text: string, getPos: () => THREE.Vector3) => {
    const el = document.createElement('div');
    el.className = 'planet-label';
    el.textContent = text;
    labelsEl.appendChild(el);
    labelEls.push({ el, getPos });
  };
  mkLabel('Sun', () => new THREE.Vector3(0, 0, 0));
  for (const b of solar.bodies) mkLabel(b.name, () => b.position);

  // ---- Apply view state from URL (deep link) ----
  const initState = readState();
  const pendingSelection: string | null = applyInitialState(initState);

  // ===================== Filters =====================
  function recomputeFilters() {
    const r = applyFilters(meta, filters, sentrySet);
    visibleMask = r.mask;
    asteroidLayer.setVisibility(visibleMask);
    $('filter-count').textContent = `${r.count.toLocaleString()} shown`;
    scheduleStateWrite();
  }

  // ===================== Selection =====================
  function selectAsteroid(index: number, focus = false) {
    selection = { kind: 'ast', index };
    buildSelectedOrbit();
    showDetailForAsteroid(index);
    if (focus) frameSelection();
    scheduleStateWrite();
  }
  function selectPlanet(index: number, focus = false) {
    selection = { kind: 'planet', index };
    buildSelectedOrbit();
    showDetailForPlanet(index);
    if (focus) frameSelection();
    scheduleStateWrite();
  }
  function clearSelection() {
    selection = null;
    selMarker.visible = false;
    removeSelOrbit();
    following = false;
    updateFollowIndicator();
    $('detail').classList.add('hidden');
    scheduleStateWrite();
  }

  function removeSelOrbit() {
    if (selOrbitLine) {
      scene.remove(selOrbitLine);
      selOrbitLine.geometry.dispose();
      selOrbitLine = null;
    }
  }

  function buildSelectedOrbit() {
    removeSelOrbit();
    if (!selection) return;
    let el: Elements | null = null;
    if (selection.kind === 'ast') el = asteroidElements(orbits, selection.index);
    else if (selection.kind === 'planet') el = solar.bodies[selection.index].el;
    if (!el || el.e >= 1) return;
    const pts = sampleOrbit(el, 360);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    selOrbitLine = new THREE.Line(g, selOrbitMat);
    selOrbitLine.frustumCulled = false;
    scene.add(selOrbitLine);
  }

  const tmpVec3: [number, number, number] = [0, 0, 0];
  function selectedPosition(out: THREE.Vector3): boolean {
    if (!selection) return false;
    if (selection.kind === 'planet') {
      out.copy(solar.bodies[selection.index].position);
      return true;
    }
    let el: Elements;
    if (selection.kind === 'ast') el = asteroidElements(orbits, selection.index);
    else el = cometLayer.elements[selection.index];
    propagate(el, time.jd, tmpVec3);
    out.set(tmpVec3[0], tmpVec3[1], tmpVec3[2]);
    return true;
  }

  const _selPos = new THREE.Vector3();
  function frameSelection() {
    if (!selectedPosition(_selPos)) return;
    controls.target.copy(_selPos);
    const dist = selection?.kind === 'planet' ? Math.max(0.15, solar.bodies[selection.index].visualRadius * 12) : 0.25;
    const dir = new THREE.Vector3().subVectors(camera.position, _selPos).normalize();
    if (dir.lengthSq() < 1e-6) dir.set(0, -1, 0.5).normalize();
    camera.position.copy(_selPos).addScaledVector(dir, dist);
  }

  // ===================== Detail panel =====================
  function showDetailForAsteroid(index: number) {
    const name = meta.full_name[index] ?? meta.name[index] ?? meta.pdes[index] ?? 'Unknown';
    $('d-name').textContent = name.trim();
    const pdes = meta.pdes[index] ?? '';
    const sentry = pdes ? sentryByDes.get(pdes) : undefined;

    let badges = '<div>';
    if (meta.neo[index]) badges += '<span class="badge neo">NEO</span>';
    if (meta.pha[index]) badges += '<span class="badge pha">PHA</span>';
    if (sentry) badges += '<span class="badge sentry">Sentry risk</span>';
    badges += '</div>';

    const rows: [string, string][] = [];
    const cls = meta.class[index];
    if (cls) rows.push(['Orbit class', cls]);
    const num = (v: number | null, d = 3, unit = '') => (v == null ? '—' : v.toFixed(d) + unit);
    rows.push(['Semi-major axis a', num(meta.a[index], 3, ' au')]);
    rows.push(['Eccentricity e', num(meta.e[index], 4)]);
    rows.push(['Inclination i', num(meta.i[index], 2, '°')]);
    rows.push(['Perihelion q', num(meta.q[index], 3, ' au')]);
    rows.push(['Aphelion Q', num(meta.ad[index], 3, ' au')]);
    rows.push(['Period', meta.per[index] == null ? '—' : (meta.per[index]! / 365.25).toFixed(2) + ' yr']);
    rows.push(['Earth MOID', num(meta.moid[index], 4, ' au')]);
    rows.push(['Abs. magnitude H', num(meta.H[index], 2)]);
    rows.push(['Diameter', meta.diameter[index] == null ? 'unknown' : num(meta.diameter[index], 3, ' km')]);
    rows.push(['Albedo', num(meta.albedo[index], 3)]);
    rows.push(['Rotation period', meta.rot_per[index] == null ? '—' : num(meta.rot_per[index], 2, ' h')]);
    if (meta.spec[index]) rows.push(['Spectral type', meta.spec[index]!]);
    if (meta.first_obs[index]) rows.push(['First observed', meta.first_obs[index]!]);

    let html = badges + '<div class="d-grid" style="margin-top:8px">';
    for (const [k, v] of rows) html += `<div class="k">${k}</div><div class="v">${v}</div>`;
    html += '</div>';

    if (sentry) {
      html += '<div class="d-section-title">Impact risk (CNEOS Sentry)</div><div class="d-grid">';
      const s = sentry;
      html += `<div class="k">Impact probability</div><div class="v">${s.ip != null ? s.ip.toExponential(2) : '—'}</div>`;
      html += `<div class="k">Potential impacts</div><div class="v">${s.n_imp}</div>`;
      html += `<div class="k">Window</div><div class="v">${s.range}</div>`;
      html += `<div class="k">Palermo (cum/max)</div><div class="v">${s.ps_cum} / ${s.ps_max}</div>`;
      html += `<div class="k">Torino (max)</div><div class="v">${s.ts_max}</div>`;
      html += `<div class="k">Encounter v∞</div><div class="v">${s.v_inf != null ? s.v_inf.toFixed(2) + ' km/s' : '—'}</div>`;
      html += '</div>';
    }

    html += '<div class="d-section-title">Close approaches to Earth</div>';
    html += '<div id="ca-container" class="muted small">Loading close-approach history…</div>';

    html += `<div class="d-actions">
      <button class="btn" id="d-focus">Focus</button>
      <button class="btn" id="d-follow">${following ? 'Following' : 'Follow'}</button>
    </div>`;

    $('detail-body').innerHTML = html;
    $('detail').classList.remove('hidden');
    wireDetailActions();
    loadCloseApproachTable(pdes);
  }

  async function loadCloseApproachTable(pdes: string) {
    const container = () => document.getElementById('ca-container');
    if (!pdes) {
      const c = container();
      if (c) c.textContent = 'No designation to match.';
      return;
    }
    await loadCloseApproaches();
    const events = getCloseApproachesSync(pdes);
    const c = container();
    if (!c) return;
    if (!events || !events.length) {
      c.textContent = 'No recorded close approaches in dataset.';
      return;
    }
    const nowJd = time.jd;
    // Show a window: a few past + upcoming, nearest in time first by proximity to now.
    const sorted = [...events].sort((a, b) => Math.abs(a.jd - nowJd) - Math.abs(b.jd - nowJd)).slice(0, 12);
    sorted.sort((a, b) => a.jd - b.jd);
    let t = `<table class="ca-table"><thead><tr><th>Date (TDB)</th><th>Dist (au)</th><th>Dist (LD)</th><th>v (km/s)</th></tr></thead><tbody>`;
    for (const e of sorted) {
      const future = e.jd > nowJd;
      const ld = (e.dist / 0.00257).toFixed(1); // lunar distances
      t += `<tr class="${future ? 'future' : ''}"><td>${e.cd}</td><td>${e.dist.toFixed(5)}</td><td>${ld}</td><td>${e.v_rel.toFixed(1)}</td></tr>`;
    }
    t += `</tbody></table><div class="tiny muted" style="margin-top:4px">${events.length} total events · highlighted = after current time</div>`;
    c.innerHTML = t;
  }

  function showDetailForPlanet(index: number) {
    const b = solar.bodies[index];
    const p = planets[index];
    $('d-name').textContent = b.name;
    const rows: [string, string][] = [
      ['Mean radius', b.radiusKm.toLocaleString() + ' km'],
      ['Semi-major axis a', p.a.toFixed(4) + ' au'],
      ['Eccentricity e', p.e.toFixed(4)],
      ['Inclination i', p.i.toFixed(3) + '°'],
      ['Orbital period', (p.per / 365.25).toFixed(2) + ' yr'],
    ];
    let html = '<div><span class="badge neo">Planet</span></div><div class="d-grid" style="margin-top:8px">';
    for (const [k, v] of rows) html += `<div class="k">${k}</div><div class="v">${v}</div>`;
    html += '</div>';
    html += `<div class="d-actions">
      <button class="btn" id="d-focus">Focus</button>
      <button class="btn" id="d-follow">${following ? 'Following' : 'Follow'}</button>
    </div>`;
    $('detail-body').innerHTML = html;
    $('detail').classList.remove('hidden');
    wireDetailActions();
  }

  function wireDetailActions() {
    const f = document.getElementById('d-focus');
    if (f) f.onclick = () => { frameSelection(); };
    const fl = document.getElementById('d-follow');
    if (fl) fl.onclick = () => { following = !following; updateFollowIndicator(); frameSelection(); scheduleStateWrite(); };
  }

  function updateFollowIndicator() {
    const ind = $('follow-indicator');
    if (following && selection) {
      ind.classList.remove('hidden');
      let nm = '';
      if (selection.kind === 'planet') nm = solar.bodies[selection.index].name;
      else if (selection.kind === 'ast') nm = (meta.name[selection.index] || meta.pdes[selection.index] || 'object')!;
      else nm = comets[selection.index].full_name;
      $('follow-name').textContent = nm;
    } else {
      ind.classList.add('hidden');
    }
    const fl = document.getElementById('d-follow');
    if (fl) fl.textContent = following ? 'Following' : 'Follow';
  }

  // ===================== Picking / hover =====================
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points = { threshold: 0.03 };
  const ndc = new THREE.Vector2();
  const tooltip = $('tooltip');

  function screenToNdc(ev: { clientX: number; clientY: number }) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    return rect;
  }

  function pickPlanet(): number {
    // Raycast against planet meshes.
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(solar.bodies.map((b) => b.mesh), false);
    if (hits.length) return solar.bodies.findIndex((b) => b.mesh === hits[0].object);
    return -1;
  }

  let hoverRaf = 0;
  renderer.domElement.addEventListener('pointermove', (ev) => {
    const rect = screenToNdc(ev);
    if (hoverRaf) return;
    hoverRaf = requestAnimationFrame(() => {
      hoverRaf = 0;
      // planets first
      const pl = pickPlanet();
      if (pl >= 0) {
        showTooltip(ev.clientX, ev.clientY, solar.bodies[pl].name, 'Planet');
        return;
      }
      if (showAsteroids) {
        const idx = pickAsteroid(orbits, meta.count, visibleMask, time.jd - J2000, camera, ndc, 8, {
          w: rect.width,
          h: rect.height,
        });
        if (idx >= 0) {
          const nm = (meta.full_name[idx] ?? meta.name[idx] ?? meta.pdes[idx] ?? 'Asteroid')!.trim();
          const sub = `${meta.class[idx] ?? ''}${meta.pha[idx] ? ' · PHA' : ''}`;
          showTooltip(ev.clientX, ev.clientY, nm, sub);
          return;
        }
      }
      tooltip.classList.add('hidden');
    });
  });
  renderer.domElement.addEventListener('pointerleave', () => tooltip.classList.add('hidden'));

  function showTooltip(x: number, y: number, name: string, sub: string) {
    tooltip.innerHTML = `<div class="t-name">${name}</div><div class="t-sub">${sub}</div>`;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.classList.remove('hidden');
  }

  // Click to select (guard against drags).
  let downPos = { x: 0, y: 0 };
  renderer.domElement.addEventListener('pointerdown', (ev) => { downPos = { x: ev.clientX, y: ev.clientY }; });
  renderer.domElement.addEventListener('pointerup', (ev) => {
    const moved = Math.hypot(ev.clientX - downPos.x, ev.clientY - downPos.y);
    if (moved > 5) return;
    const rect = screenToNdc(ev);
    const pl = pickPlanet();
    if (pl >= 0) { selectPlanet(pl); return; }
    if (showAsteroids) {
      const idx = pickAsteroid(orbits, meta.count, visibleMask, time.jd - J2000, camera, ndc, 9, {
        w: rect.width,
        h: rect.height,
      });
      if (idx >= 0) { selectAsteroid(idx); return; }
    }
  });

  // ===================== Controls wiring =====================
  setupTimeBar();
  setupFilterControls();
  setupDisplayControls();
  setupHighlights();
  setupSearch();
  buildClassToggles();
  buildLegend();
  $('dataset-info').innerHTML =
    `${data.manifest.asteroidCount.toLocaleString()} NEOs · ${data.manifest.cometCount.toLocaleString()} comets · ` +
    `${data.manifest.sentryCount.toLocaleString()} Sentry · ${data.manifest.closeApproachCount.toLocaleString()} close approaches.<br/>` +
    `Data: NASA/JPL SBDB, CAD, CNEOS Sentry snapshot.`;

  $('collapse-controls').onclick = () => $('controls').classList.toggle('collapsed');
  $('close-detail').onclick = () => clearSelection();

  // ===================== Time bar =====================
  function speedFromSlider(v: number): number {
    const sign = v < 0 ? -1 : 1;
    const mag = Math.abs(v);
    if (mag < 1) return 0;
    return sign * 0.1 * Math.pow(10, (mag / 100) * 4.56);
  }
  function sliderFromSpeed(dps: number): number {
    if (dps === 0) return 0;
    const sign = dps < 0 ? -1 : 1;
    const mag = Math.abs(dps);
    return sign * (Math.log10(mag / 0.1) / 4.56) * 100;
  }
  function fmtSpeed(dps: number): string {
    const a = Math.abs(dps);
    const sign = dps < 0 ? '−' : '';
    if (a === 0) return '0 / s';
    if (a >= 365) return `${sign}${(a / 365.25).toFixed(2)} yr/s`;
    if (a >= 1) return `${sign}${a.toFixed(1)} d/s`;
    return `${sign}${(a * 24).toFixed(1)} h/s`;
  }

  function setupTimeBar() {
    const playBtn = $('play');
    playBtn.onclick = () => { time.togglePlaying(); playBtn.textContent = time.playing ? '⏸' : '▶'; scheduleStateWrite(); };
    $('step-back').onclick = () => { time.jd -= 30; };
    $('step-fwd').onclick = () => { time.jd += 30; };
    $('now-btn').onclick = () => { time.jd = dateToJD(new Date()); };

    const speed = $<HTMLInputElement>('speed');
    const applySpeed = () => {
      time.daysPerSecond = speedFromSlider(parseFloat(speed.value));
      $('speed-label').textContent = fmtSpeed(time.daysPerSecond);
      scheduleStateWrite();
    };
    speed.oninput = applySpeed;
    applySpeed();

    const dateInput = $<HTMLInputElement>('date-input');
    dateInput.onchange = () => {
      if (dateInput.value) time.jd = dateToJD(new Date(dateInput.value + 'T00:00:00Z'));
    };

    const scrub = $<HTMLInputElement>('scrub');
    scrub.oninput = () => {
      const t = parseFloat(scrub.value) / 1000;
      time.jd = JD_MIN + t * (JD_MAX - JD_MIN);
    };
    $('scrub-range').textContent = '1900 — 2200';

    $('share-btn').onclick = async () => {
      writeStateNow();
      try {
        await navigator.clipboard.writeText(location.href);
        $('share-btn').textContent = 'Copied!';
        setTimeout(() => ($('share-btn').textContent = 'Share view'), 1500);
      } catch {
        $('share-btn').textContent = 'Link in URL';
        setTimeout(() => ($('share-btn').textContent = 'Share view'), 1500);
      }
    };

    $('unfollow').onclick = () => { following = false; updateFollowIndicator(); scheduleStateWrite(); };

    // Initialize widgets from state.
    speed.value = String(sliderFromSpeed(time.daysPerSecond));
    applySpeed();
    playBtn.textContent = time.playing ? '⏸' : '▶';
  }

  // ===================== Filters UI =====================
  function buildClassToggles() {
    const wrap = $('class-toggles');
    wrap.innerHTML = '';
    for (const code of Object.keys(CLASS_CODES)) {
      const chip = document.createElement('div');
      chip.className = 'class-chip';
      chip.textContent = code;
      const col = CLASS_COLORS[CLASS_CODES[code]];
      const rgb = `rgb(${(col[0] * 255) | 0},${(col[1] * 255) | 0},${(col[2] * 255) | 0})`;
      chip.style.borderColor = rgb;
      const refresh = () => {
        const on = filters.classes.includes(code);
        chip.classList.toggle('on', on);
        chip.style.background = on ? rgb : '#0c1019';
        chip.style.color = on ? '#07101e' : rgb;
      };
      chip.onclick = () => {
        if (filters.classes.includes(code)) filters.classes = filters.classes.filter((c) => c !== code);
        else filters.classes = [...filters.classes, code];
        refresh();
        recomputeFilters();
      };
      refresh();
      wrap.appendChild(chip);
    }
  }

  function setupFilterControls() {
    const pha = $<HTMLInputElement>('f-pha');
    pha.checked = filters.phaOnly;
    pha.onchange = () => { filters.phaOnly = pha.checked; recomputeFilters(); };

    const sentry = $<HTMLInputElement>('f-sentry');
    sentry.checked = filters.sentryOnly;
    sentry.onchange = () => { filters.sentryOnly = sentry.checked; recomputeFilters(); };

    const h = $<HTMLInputElement>('f-h');
    const hVal = $('f-h-val');
    const applyH = () => {
      const v = parseFloat(h.value);
      filters.maxH = v >= 33 ? 99 : v;
      hVal.textContent = v >= 33 ? 'all' : '≤ ' + v.toFixed(1);
    };
    h.oninput = () => { applyH(); recomputeFilters(); };
    applyH();

    const moid = $<HTMLInputElement>('f-moid');
    const moidVal = $('f-moid-val');
    const applyMoid = () => {
      const v = parseFloat(moid.value);
      filters.maxMoid = v >= 0.5 ? 9 : v;
      moidVal.textContent = v >= 0.5 ? 'all' : '≤ ' + v.toFixed(3);
    };
    moid.oninput = () => { applyMoid(); recomputeFilters(); };
    applyMoid();

    $('reset-filters').onclick = () => {
      filters = defaultFilters();
      pha.checked = false; sentry.checked = false;
      h.value = '33'; moid.value = '0.5';
      applyH(); applyMoid();
      ($('search') as HTMLInputElement).value = '';
      buildClassToggles();
      recomputeFilters();
    };
  }

  // ===================== Display controls =====================
  function setupDisplayControls() {
    const cm = $<HTMLSelectElement>('color-mode');
    cm.value = String(colorMode);
    cm.onchange = () => { colorMode = parseInt(cm.value, 10); asteroidLayer.setColorMode(colorMode); buildLegend(); scheduleStateWrite(); };
    asteroidLayer.setColorMode(colorMode);

    const ps = $<HTMLInputElement>('psize');
    const psVal = $('psize-val');
    ps.oninput = () => { asteroidLayer.setPointScale(parseFloat(ps.value)); psVal.textContent = ps.value + '×'; };
    asteroidLayer.setPointScale(parseFloat(ps.value));
    psVal.textContent = ps.value + '×';

    const bs = $<HTMLInputElement>('bscale');
    const bsVal = $('bscale-val');
    bs.oninput = () => { solar.setBodyScale(parseFloat(bs.value)); bsVal.textContent = bs.value + '×'; };
    solar.setBodyScale(parseFloat(bs.value));
    bsVal.textContent = bs.value + '×';

    const orb = $<HTMLInputElement>('t-orbits');
    orb.onchange = () => solar.setOrbitsVisible(orb.checked);

    const com = $<HTMLInputElement>('t-comets');
    com.checked = cometLayer.visible;
    com.onchange = () => { cometLayer.setVisible(com.checked); scheduleStateWrite(); };

    const ast = $<HTMLInputElement>('t-asteroids');
    ast.onchange = () => { showAsteroids = ast.checked; asteroidLayer.points.visible = ast.checked; };
  }

  // ===================== Highlights =====================
  function setupHighlights() {
    $('h-pha').onclick = () => {
      filters = defaultFilters(); filters.phaOnly = true;
      syncFilterUI(); recomputeFilters();
      colorMode = 1; $<HTMLSelectElement>('color-mode').value = '1'; asteroidLayer.setColorMode(1); buildLegend();
    };
    $('h-large').onclick = () => {
      filters = defaultFilters(); filters.maxH = 17;
      syncFilterUI(); recomputeFilters();
      colorMode = 2; $<HTMLSelectElement>('color-mode').value = '2'; asteroidLayer.setColorMode(2); buildLegend();
    };
    $('h-close').onclick = () => {
      filters = defaultFilters(); filters.maxMoid = 0.05;
      syncFilterUI(); recomputeFilters();
      colorMode = 3; $<HTMLSelectElement>('color-mode').value = '3'; asteroidLayer.setColorMode(3); buildLegend();
    };
    $('h-approaches').onclick = () => showApproachList();
  }

  function showApproachList() {
    const nowJd = time.jd;
    const upcoming = notable
      .filter((n) => n.jd >= nowJd)
      .sort((a, b) => a.jd - b.jd)
      .slice(0, 25);
    const list = upcoming.length ? upcoming : [...notable].sort((a, b) => a.dist - b.dist).slice(0, 25);
    const c = $('approach-list');
    c.innerHTML = '';
    const heading = document.createElement('div');
    heading.className = 'tiny muted';
    heading.textContent = upcoming.length ? 'Nearest upcoming approaches:' : 'Closest on record:';
    c.appendChild(heading);
    for (const n of list) {
      const idx = pdesToIndex.get(n.des);
      const row = document.createElement('div');
      row.className = 'result';
      const ld = (n.dist / 0.00257).toFixed(1);
      const nm = idx != null ? (meta.name[idx] || meta.full_name[idx] || n.des) : n.des;
      row.innerHTML = `<div><div>${(nm as string).trim()}</div><div class="sub">${n.cd}</div></div><div class="sub">${ld} LD</div>`;
      row.onclick = () => {
        time.jd = n.jd;
        if (idx != null) selectAsteroid(idx, true);
      };
      c.appendChild(row);
    }
  }

  function syncFilterUI() {
    $<HTMLInputElement>('f-pha').checked = filters.phaOnly;
    $<HTMLInputElement>('f-sentry').checked = filters.sentryOnly;
    $<HTMLInputElement>('f-h').value = String(filters.maxH >= 99 ? 33 : filters.maxH);
    $('f-h-val').textContent = filters.maxH >= 99 ? 'all' : '≤ ' + filters.maxH.toFixed(1);
    $<HTMLInputElement>('f-moid').value = String(filters.maxMoid >= 9 ? 0.5 : filters.maxMoid);
    $('f-moid-val').textContent = filters.maxMoid >= 9 ? 'all' : '≤ ' + filters.maxMoid.toFixed(3);
    buildClassToggles();
  }

  // ===================== Search =====================
  function setupSearch() {
    const input = $<HTMLInputElement>('search');
    const results = $('search-results');
    let timer = 0;
    input.oninput = () => {
      filters.search = input.value;
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        recomputeFilters();
        const idxs = searchAsteroids(meta, input.value, 30);
        results.innerHTML = '';
        for (const idx of idxs) {
          const row = document.createElement('div');
          row.className = 'result';
          const nm = (meta.full_name[idx] ?? meta.name[idx] ?? meta.pdes[idx] ?? '')!.trim();
          row.innerHTML = `<div>${nm}</div>${meta.pha[idx] ? '<div class="tag">PHA</div>' : `<div class="sub">${meta.class[idx] ?? ''}</div>`}`;
          row.onclick = () => selectAsteroid(idx, true);
          results.appendChild(row);
        }
      }, 180);
    };
  }

  // ===================== Legend =====================
  function buildLegend() {
    const el = $('legend');
    let html = '';
    if (colorMode === 0) {
      html = '<h4>Orbit class</h4>';
      for (const code of Object.keys(CLASS_CODES)) {
        const c = CLASS_COLORS[CLASS_CODES[code]];
        html += `<div class="li"><span class="sw" style="background:rgb(${(c[0]*255)|0},${(c[1]*255)|0},${(c[2]*255)|0})"></span>${code}</div>`;
      }
    } else if (colorMode === 1) {
      html = '<h4>Hazard</h4>' +
        '<div class="li"><span class="sw" style="background:#ff4545"></span>Potentially hazardous</div>' +
        '<div class="li"><span class="sw" style="background:#738cb3"></span>Other NEO</div>';
    } else if (colorMode === 2) {
      html = '<h4>Size (brighter = larger)</h4>' +
        '<div class="li"><span class="sw" style="background:#ffef80"></span>Large / bright</div>' +
        '<div class="li"><span class="sw" style="background:#66e6e6"></span>Medium</div>' +
        '<div class="li"><span class="sw" style="background:#3359b3"></span>Small / faint</div>';
    } else {
      html = '<h4>Earth MOID</h4>' +
        '<div class="li"><span class="sw" style="background:#ff4033"></span>Very close (≤0.01 au)</div>' +
        '<div class="li"><span class="sw" style="background:#ffcc4d"></span>Close</div>' +
        '<div class="li"><span class="sw" style="background:#5a8ccc"></span>Distant</div>';
    }
    el.innerHTML = html;
  }

  // ===================== Initial state application =====================
  function applyInitialState(st: ViewState): string | null {
    if (st.jd != null) time.jd = st.jd;
    if (st.speed != null) time.daysPerSecond = st.speed;
    if (st.playing != null) time.playing = st.playing;
    if (st.color != null) colorMode = st.color;
    if (st.comets) cometLayer.setVisible(true);
    if (st.cam && st.cam.length === 6) {
      camera.position.set(st.cam[0], st.cam[1], st.cam[2]);
      controls.target.set(st.cam[3], st.cam[4], st.cam[5]);
    }
    if (st.filt) {
      try { filters = { ...defaultFilters(), ...JSON.parse(st.filt) }; } catch { /* ignore */ }
    }
    if (st.follow) following = true;
    return st.sel ?? null;
  }

  // ===================== State writing =====================
  function gatherState(): ViewState {
    const st: ViewState = {
      jd: time.jd,
      speed: time.daysPerSecond,
      playing: time.playing,
      color: colorMode,
      comets: cometLayer.visible,
      follow: following,
      cam: cameraToArray(camera, controls.target),
    };
    if (selection) {
      if (selection.kind === 'planet') st.sel = 'planet:' + solar.bodies[selection.index].name;
      else if (selection.kind === 'ast') st.sel = 'ast:' + meta.spkid[selection.index];
      else st.sel = 'comet:' + comets[selection.index].pdes;
    }
    const f = filters;
    const isDefault = !f.phaOnly && !f.sentryOnly && !f.classes.length && f.maxH >= 99 && f.maxMoid >= 9 && !f.search;
    if (!isDefault) st.filt = JSON.stringify(f);
    return st;
  }
  function scheduleStateWrite() { writeState(gatherState()); }
  function writeStateNow() {
    const st = gatherState();
    const p = new URLSearchParams();
    if (st.jd != null) p.set('jd', st.jd.toFixed(4));
    if (st.sel) p.set('sel', st.sel);
    if (st.follow) p.set('follow', '1');
    if (st.speed != null) p.set('speed', String(st.speed));
    if (st.playing != null) p.set('playing', st.playing ? '1' : '0');
    if (st.color != null) p.set('color', String(st.color));
    if (st.comets) p.set('comets', '1');
    if (st.cam) p.set('cam', st.cam.map((v) => v.toFixed(3)).join(','));
    if (st.filt) p.set('filt', st.filt);
    history.replaceState(null, '', '#' + p.toString());
  }

  // Resolve a pending deep-linked selection now that everything is ready.
  if (pendingSelection) {
    const sel = pendingSelection;
    if (sel.startsWith('ast:')) {
      const idx = spkidToIndex.get(parseInt(sel.slice(4), 10));
      if (idx != null) selectAsteroid(idx, !initState.cam);
    } else if (sel.startsWith('planet:')) {
      const nm = sel.slice(7);
      const idx = solar.bodies.findIndex((b) => b.name === nm);
      if (idx >= 0) selectPlanet(idx, !initState.cam);
    } else if (sel.startsWith('comet:')) {
      const pdes = sel.slice(6);
      const idx = comets.findIndex((c) => c.pdes === pdes);
      if (idx >= 0) { selection = { kind: 'comet', index: idx }; cometLayer.setVisible(true); }
    }
  }

  // Sync filter UI to (possibly deep-linked) filters and compute mask.
  syncFilterUI();
  $<HTMLInputElement>('f-sentry').checked = filters.phaOnly ? $<HTMLInputElement>('f-sentry').checked : filters.sentryOnly;
  ($('search') as HTMLInputElement).value = filters.search;
  recomputeFilters();
  updateFollowIndicator();

  // ===================== Render loop =====================
  const prevTarget = new THREE.Vector3().copy(controls.target);
  const curSelPos = new THREE.Vector3();
  const dateInput = $<HTMLInputElement>('date-input');
  const jdLabel = $('jd-label');
  const scrubEl = $<HTMLInputElement>('scrub');
  let labelTick = 0;

  sceneObj.onUpdate((dt) => {
    time.step(dt);
    if (time.jd < JD_MIN) time.jd = JD_MIN;
    if (time.jd > JD_MAX + 1) time.jd = JD_MAX + 1;

    const days = time.jd - J2000;
    asteroidLayer.setTime(days);
    solar.update(time.jd);
    cometLayer.update(time.jd);

    // Selected marker + follow.
    if (selection && selectedPosition(curSelPos)) {
      selMarker.position.copy(curSelPos);
      selMarker.visible = true;
      // Billboard the ring toward camera.
      selMarker.lookAt(camera.position);
      // Scale ring with distance so it stays visible.
      const d = camera.position.distanceTo(curSelPos);
      selMarker.scale.setScalar(Math.max(0.4, d * 0.06));
      if (following) {
        const delta = new THREE.Vector3().subVectors(curSelPos, prevTarget);
        camera.position.add(delta);
        controls.target.copy(curSelPos);
      }
    } else {
      selMarker.visible = false;
    }
    prevTarget.copy(controls.target);

    // Time bar readouts.
    jdLabel.textContent = `${jdToDateTimeString(time.jd)}  ·  JD ${time.jd.toFixed(2)}`;
    const scrubT = Math.max(0, Math.min(1000, ((time.jd - JD_MIN) / (JD_MAX - JD_MIN)) * 1000));
    scrubEl.value = String(scrubT);
    if (document.activeElement !== dateInput) {
      const iso = jdToISO(time.jd);
      if (dateInput.value !== iso) dateInput.value = iso;
    }

    // Planet labels (throttled).
    if (labelTick++ % 2 === 0) updateLabels();

    // Periodically persist time to URL.
    stateWriteAccum += dt;
    if (stateWriteAccum > 2) { stateWriteAccum = 0; scheduleStateWrite(); }
  });

  let stateWriteAccum = 0;
  const projV = new THREE.Vector3();
  function updateLabels() {
    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;
    for (const l of labelEls) {
      projV.copy(l.getPos()).project(camera);
      if (projV.z > 1 || projV.z < -1 || projV.x < -1.1 || projV.x > 1.1 || projV.y < -1.1 || projV.y > 1.1) {
        l.el.style.display = 'none';
        continue;
      }
      l.el.style.display = 'block';
      l.el.style.left = ((projV.x + 1) / 2) * w + 'px';
      l.el.style.top = ((-projV.y + 1) / 2) * h + 'px';
    }
  }

  // Keyboard shortcuts.
  window.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return;
    if (e.code === 'Space') { e.preventDefault(); time.togglePlaying(); $('play').textContent = time.playing ? '⏸' : '▶'; }
    else if (e.code === 'ArrowRight') time.jd += 30;
    else if (e.code === 'ArrowLeft') time.jd -= 30;
    else if (e.key === 'f' && selection) { following = !following; updateFollowIndicator(); frameSelection(); }
    else if (e.key === 'Escape') clearSelection();
  });

  // Done loading.
  $('loading').classList.add('done');
  setTimeout(() => $('loading').remove(), 600);
}

main();
