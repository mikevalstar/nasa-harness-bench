import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./styles.css";

const AU_SCALE = 42;
const SUN_RADIUS_AU = 0.00465047;
const J2000 = 2451545;
const DAY_MS = 86400000;
const RAD = Math.PI / 180;
const PLANET_COLORS = {
  Mercury: 0xb6aaa0,
  Venus: 0xd6b36a,
  Earth: 0x4b9cff,
  Mars: 0xd46642,
  Jupiter: 0xd7b083,
  Saturn: 0xcbb172,
  Uranus: 0x82d6e3,
  Neptune: 0x4169d8,
};
const CLASS_COLORS = {
  APO: 0xf3be52,
  ATE: 0x5ec6e8,
  AMO: 0x90d45b,
  IEO: 0xc988ff,
  AST: 0xb9b7aa,
};

const state = {
  jd: dateToJulian(new Date()),
  speed: 8,
  playing: true,
  filter: "all",
  query: "",
  selectedKey: null,
  showComets: true,
  follow: false,
  asteroidLimit: 42075,
};

const app = document.querySelector("#app");
app.innerHTML = `
  <main class="shell">
    <section class="viewport" aria-label="3D solar system view">
      <canvas id="scene"></canvas>
      <div class="hud top">
        <div>
          <strong>Inner Solar System</strong>
          <span id="status">Loading data...</span>
        </div>
        <div class="stats" id="stats"></div>
      </div>
      <div class="hud legend" id="legend"></div>
    </section>
    <aside class="panel">
      <div class="brand">
        <h1>Near-Earth Object Explorer</h1>
        <p id="dateLabel"></p>
      </div>
      <div class="controls">
        <button class="primary" id="playBtn" type="button">Pause</button>
        <label>Date <input id="dateInput" type="date"></label>
        <label>Speed
          <select id="speedInput">
            <option value="-365">-1 yr/s</option>
            <option value="-30">-30 d/s</option>
            <option value="0">Still</option>
            <option value="1">1 d/s</option>
            <option value="8" selected>8 d/s</option>
            <option value="30">30 d/s</option>
            <option value="365">1 yr/s</option>
          </select>
        </label>
        <input id="timeScrub" type="range" min="-3650" max="3650" value="0" step="1" aria-label="Scrub ten years around today">
      </div>
      <div class="filters">
        <input id="search" type="search" placeholder="Search designation or name">
        <select id="filter">
          <option value="all">All asteroids</option>
          <option value="pha">Potentially hazardous</option>
          <option value="sentry">Sentry risk list</option>
          <option value="approach">Close approach ±180d</option>
          <option value="large">Known diameter ≥ 1 km</option>
          <option value="lowmoid">MOID ≤ 0.05 au</option>
        </select>
        <label class="check"><input id="cometToggle" type="checkbox" checked> Closed-orbit comets</label>
      </div>
      <div class="results" id="results"></div>
      <div class="details" id="details"></div>
    </aside>
  </main>
`;

const el = {
  canvas: document.querySelector("#scene"),
  status: document.querySelector("#status"),
  stats: document.querySelector("#stats"),
  legend: document.querySelector("#legend"),
  dateLabel: document.querySelector("#dateLabel"),
  dateInput: document.querySelector("#dateInput"),
  playBtn: document.querySelector("#playBtn"),
  speedInput: document.querySelector("#speedInput"),
  timeScrub: document.querySelector("#timeScrub"),
  search: document.querySelector("#search"),
  filter: document.querySelector("#filter"),
  cometToggle: document.querySelector("#cometToggle"),
  results: document.querySelector("#results"),
  details: document.querySelector("#details"),
};

const renderer = new THREE.WebGLRenderer({ canvas: el.canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x07090d, 1);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07090d, 0.0022);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 5000);
camera.position.set(0, 115, 175);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxDistance = 850;
controls.minDistance = 12;

scene.add(new THREE.AmbientLight(0x9fb6ff, 0.5));
const sunLight = new THREE.PointLight(0xfff1c8, 3.4, 0, 1.5);
scene.add(sunLight);
const grid = new THREE.GridHelper(360, 36, 0x253347, 0x172130);
grid.rotation.x = Math.PI / 2;
scene.add(grid);
const ecliptic = makeCircle(1 * AU_SCALE, 0x29577a, 0.45);
scene.add(ecliptic);
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(Math.max(SUN_RADIUS_AU * AU_SCALE * 6, 1.8), 32, 16),
  new THREE.MeshBasicMaterial({ color: 0xffcf58 })
);
scene.add(sun);

let data = null;
let asteroids = null;
let comets = null;
let planetMeshes = [];
let planetLabels = [];
let asteroidMesh = null;
let cometMesh = null;
let selectedOrbit = null;
let selectedMarker = null;
let earthPosition = new THREE.Vector3();
let visibleKeys = [];
let lastTick = performance.now();
let needsFullUpdate = true;
const tmpMatrix = new THREE.Matrix4();
const tmpPosition = new THREE.Vector3();
const tmpScale = new THREE.Vector3();
const baseQuat = new THREE.Quaternion();

init().catch((error) => {
  console.error(error);
  el.status.textContent = "Failed to load data";
  el.details.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
});

async function init() {
  readUrlState();
  const [planets, asteroidRows, closeRows, sentryRows, cometRows] = await Promise.all([
    fetchJson("data/planets.json"),
    fetchJson("data/asteroids.json"),
    fetchJson("data/close-approaches.json"),
    fetchJson("data/sentry.json"),
    fetchJson("data/comets.json"),
  ]);
  const closeByDes = indexCloseApproaches(closeRows);
  const sentryByDes = new Map(sentryRows.map((row) => [row.des, row]));
  asteroids = packBodies(asteroidRows, sentryByDes, closeByDes, "asteroid");
  comets = packBodies(cometRows.filter((row) => Number.isFinite(row.e) && row.e < 1 && Number.isFinite(row.a)), new Map(), new Map(), "comet");
  data = { planets, asteroidRows, closeRows, sentryRows, sentryByDes, closeByDes, cometRows };

  makePlanets(planets);
  makeAsteroids(asteroidRows.length);
  makeComets(comets.count);
  makeStars();
  bindEvents();
  applyFilter();
  selectBody(getInitialSelection());
  updateDateControls();
  updateLegend();
  resize();
  animate();
}

function fetchJson(path) {
  return fetch(path).then((response) => {
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.json();
  });
}

function packBodies(rows, sentryByDes, closeByDes, type) {
  const count = rows.length;
  const packed = {
    type,
    count,
    a: new Float64Array(count),
    e: new Float64Array(count),
    inc: new Float64Array(count),
    om: new Float64Array(count),
    w: new Float64Array(count),
    ma: new Float64Array(count),
    epoch: new Float64Array(count),
    n: new Float64Array(count),
    dia: new Float32Array(count),
    moid: new Float32Array(count),
    h: new Float32Array(count),
    pha: new Uint8Array(count),
    sentry: new Uint8Array(count),
    classCode: new Array(count),
    rows,
    keyToIndex: new Map(),
    text: new Array(count),
  };
  rows.forEach((row, i) => {
    packed.a[i] = number(row.a);
    packed.e[i] = number(row.e);
    packed.inc[i] = number(row.i) * RAD;
    packed.om[i] = number(row.om) * RAD;
    packed.w[i] = number(row.w) * RAD;
    packed.ma[i] = number(row.ma) * RAD;
    packed.epoch[i] = number(row.epoch);
    packed.n[i] = number(row.n || (row.per ? 360 / row.per : 0)) * RAD;
    packed.dia[i] = number(row.diameter);
    packed.moid[i] = number(row.moid);
    packed.h[i] = number(row.H ?? row.M1);
    packed.pha[i] = row.pha ? 1 : 0;
    packed.sentry[i] = sentryByDes.has(row.pdes) ? 1 : 0;
    packed.classCode[i] = row.class || "AST";
    const key = bodyKey(type, row.pdes || row.full_name || String(i));
    packed.keyToIndex.set(key, i);
    packed.text[i] = `${row.full_name || ""} ${row.name || ""} ${row.pdes || ""}`.toLowerCase();
    row._key = key;
    row._sentry = sentryByDes.get(row.pdes) || null;
    row._approaches = closeByDes.get(row.pdes) || [];
  });
  return packed;
}

function makePlanets(planets) {
  const scaleRadii = { Mercury: 0.52, Venus: 0.78, Earth: 0.82, Mars: 0.62, Jupiter: 1.9, Saturn: 1.65, Uranus: 1.25, Neptune: 1.2 };
  planets.forEach((planet) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(scaleRadii[planet.name] || 0.7, 24, 12),
      new THREE.MeshStandardMaterial({ color: PLANET_COLORS[planet.name] || 0xffffff, roughness: 0.65 })
    );
    mesh.userData = { row: planet, type: "planet", key: bodyKey("planet", planet.name) };
    planetMeshes.push(mesh);
    scene.add(mesh);
    scene.add(makeOrbitLine(planet, PLANET_COLORS[planet.name] || 0xffffff, 0.38));
    if (["Mercury", "Venus", "Earth", "Mars"].includes(planet.name)) {
      const label = makeLabel(planet.name);
      planetLabels.push({ label, mesh });
      document.body.appendChild(label);
    }
  });
}

function makeAsteroids(count) {
  asteroidMesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.12, 0),
    new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.86 }),
    count
  );
  asteroidMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  asteroidMesh.frustumCulled = false;
  for (let i = 0; i < count; i++) asteroidMesh.setColorAt(i, new THREE.Color(colorForAsteroid(i)));
  asteroidMesh.instanceColor.needsUpdate = true;
  scene.add(asteroidMesh);
}

function makeComets(count) {
  cometMesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.16, 0.48, 5),
    new THREE.MeshBasicMaterial({ color: 0x72e0ff, transparent: true, opacity: 0.68 }),
    count
  );
  cometMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  cometMesh.frustumCulled = false;
  scene.add(cometMesh);
}

function makeStars() {
  const geometry = new THREE.BufferGeometry();
  const coords = new Float32Array(1800 * 3);
  for (let i = 0; i < coords.length; i += 3) {
    const r = 1000 + Math.random() * 650;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    coords[i] = r * Math.sin(phi) * Math.cos(theta);
    coords[i + 1] = r * Math.cos(phi);
    coords[i + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(coords, 3));
  scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xbfd7ff, size: 1.4, sizeAttenuation: false })));
}

function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTick) / 1000, 0.08);
  lastTick = now;
  if (state.playing && state.speed !== 0) {
    state.jd += state.speed * dt;
    needsFullUpdate = true;
  }
  if (needsFullUpdate) {
    updateBodies();
    updateDateControls();
    updateSelected();
    updateUrlStateThrottled();
    needsFullUpdate = false;
  }
  if (state.follow && state.selectedKey) followSelected();
  controls.update();
  renderer.render(scene, camera);
  updateLabels();
}

function updateBodies() {
  for (const mesh of planetMeshes) {
    const pos = positionFromElements(mesh.userData.row, state.jd);
    mesh.position.copy(pos);
    if (mesh.userData.row.name === "Earth") earthPosition.copy(pos);
  }
  updateInstances(asteroids, asteroidMesh, true);
  updateInstances(comets, cometMesh, state.showComets);
  el.status.textContent = `${formatCalendar(state.jd)} TDB`;
}

function updateInstances(pack, mesh, enabled) {
  if (!mesh || !pack) return;
  for (let i = 0; i < pack.count; i++) {
    const visible = enabled && isVisible(pack, i);
    if (visible) {
      const pos = positionFromPacked(pack, i, state.jd);
      const scale = instanceScale(pack, i);
      tmpPosition.set(pos.x, pos.y, pos.z);
      tmpScale.setScalar(scale);
    } else {
      tmpPosition.set(0, 0, 0);
      tmpScale.setScalar(0);
    }
    tmpMatrix.compose(tmpPosition, baseQuat, tmpScale);
    mesh.setMatrixAt(i, tmpMatrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function isVisible(pack, i) {
  if (pack.type === "comet") return true;
  if (state.query && !pack.text[i].includes(state.query)) return false;
  const row = pack.rows[i];
  if (state.filter === "pha") return pack.pha[i] === 1;
  if (state.filter === "sentry") return pack.sentry[i] === 1;
  if (state.filter === "large") return pack.dia[i] >= 1;
  if (state.filter === "lowmoid") return pack.moid[i] <= 0.05;
  if (state.filter === "approach") return row._approaches.some((a) => Math.abs(a.jd - state.jd) <= 180);
  return true;
}

function applyFilter() {
  visibleKeys = [];
  const matches = [];
  for (let i = 0; i < asteroids.count; i++) {
    if (!isVisible(asteroids, i)) continue;
    visibleKeys.push(asteroids.rows[i]._key);
    if (matches.length < 80) matches.push(asteroids.rows[i]);
  }
  renderResults(matches);
  el.stats.textContent = `${visibleKeys.length.toLocaleString()} asteroids visible | ${data?.sentryRows.length.toLocaleString() || 0} Sentry | ${comets?.count.toLocaleString() || 0} comets`;
  needsFullUpdate = true;
}

function renderResults(rows) {
  if (!rows.length) {
    el.results.innerHTML = `<p class="empty">No asteroid matches.</p>`;
    return;
  }
  el.results.innerHTML = rows.map((row) => `
    <button class="result ${row._key === state.selectedKey ? "active" : ""}" type="button" data-key="${row._key}">
      <span><strong>${escapeHtml(displayName(row))}</strong><small>${escapeHtml(row.class || "NEO")} ${row.pha ? "PHA" : ""} ${row._sentry ? "Sentry" : ""}</small></span>
      <span>${formatAu(row.moid)} MOID</span>
    </button>
  `).join("");
}

function selectBody(key) {
  state.selectedKey = key;
  renderResults(visibleKeys.slice(0, 80).map((k) => asteroids.rows[asteroids.keyToIndex.get(k)]).filter(Boolean));
  renderDetails();
  updateSelected();
  updateUrlState();
}

function renderDetails() {
  const selected = getSelected();
  if (!selected) {
    el.details.innerHTML = `<p class="empty">Select an asteroid from search results to inspect its orbit, risk, and close approaches.</p>`;
    return;
  }
  const { row, type } = selected;
  const sentry = row._sentry;
  const approaches = (row._approaches || []).slice().sort((a, b) => Math.abs(a.jd - state.jd) - Math.abs(b.jd - state.jd)).slice(0, 5);
  el.details.innerHTML = `
    <div class="detailHead">
      <h2>${escapeHtml(displayName(row))}</h2>
      <button id="followBtn" type="button">${state.follow ? "Unfollow" : "Follow"}</button>
    </div>
    <dl>
      <div><dt>Type</dt><dd>${type === "comet" ? "Comet" : escapeHtml(row.class || "Asteroid")}</dd></div>
      <div><dt>Orbit</dt><dd>a ${formatNumber(row.a, 3)} au, e ${formatNumber(row.e, 3)}, i ${formatNumber(row.i, 2)} deg</dd></div>
      <div><dt>Size</dt><dd>${row.diameter ? `${formatNumber(row.diameter, 3)} km` : `H ${formatNumber(row.H ?? row.M1, 2)}`}</dd></div>
      <div><dt>MOID</dt><dd>${formatAu(row.moid)}</dd></div>
      <div><dt>Hazard</dt><dd>${row.pha ? "Potentially hazardous" : "Not flagged as PHA"}</dd></div>
    </dl>
    ${sentry ? `<section class="risk"><h3>Impact Risk</h3><p>Probability ${formatProbability(sentry.ip)} | Palermo ${formatNumber(sentry.ps_cum, 2)} | Torino ${sentry.ts_max} | ${escapeHtml(sentry.range)}</p></section>` : ""}
    <section><h3>Closest Listed Approaches</h3>${approaches.length ? approaches.map((a) => `<p class="approach">${escapeHtml(a.cd)}: ${formatAu(a.dist)} at ${formatNumber(a.v_rel, 2)} km/s</p>`).join("") : `<p class="empty">No close-approach rows for this object.</p>`}</section>
  `;
  document.querySelector("#followBtn")?.addEventListener("click", () => {
    state.follow = !state.follow;
    renderDetails();
  });
}

function updateSelected() {
  if (selectedOrbit) scene.remove(selectedOrbit);
  if (selectedMarker) scene.remove(selectedMarker);
  selectedOrbit = null;
  selectedMarker = null;
  const selected = getSelected();
  if (!selected) return;
  selectedOrbit = makeOrbitLine(selected.row, selected.row.pha ? 0xff6767 : 0xffffff, 0.9);
  scene.add(selectedOrbit);
  const pos = selected.type === "planet" ? positionFromElements(selected.row, state.jd) : positionFromElements(selected.row, state.jd);
  selectedMarker = new THREE.Mesh(
    new THREE.SphereGeometry(selected.row.pha ? 0.78 : 0.58, 18, 8),
    new THREE.MeshBasicMaterial({ color: selected.row.pha ? 0xff4d4d : 0xffffff, wireframe: true })
  );
  selectedMarker.position.copy(pos);
  scene.add(selectedMarker);
}

function followSelected() {
  const selected = getSelected();
  if (!selected) return;
  const pos = positionFromElements(selected.row, state.jd);
  const delta = pos.clone().sub(controls.target);
  controls.target.copy(pos);
  camera.position.add(delta);
}

function getSelected() {
  if (!state.selectedKey || !data) return null;
  if (state.selectedKey.startsWith("asteroid:")) {
    const index = asteroids.keyToIndex.get(state.selectedKey);
    return index == null ? null : { type: "asteroid", row: asteroids.rows[index], index };
  }
  if (state.selectedKey.startsWith("comet:")) {
    const index = comets.keyToIndex.get(state.selectedKey);
    return index == null ? null : { type: "comet", row: comets.rows[index], index };
  }
  return null;
}

function getInitialSelection() {
  if (state.selectedKey && asteroids.keyToIndex.has(state.selectedKey)) return state.selectedKey;
  const eros = asteroids.keyToIndex.get("asteroid:433");
  return eros == null ? asteroids.rows[0]._key : "asteroid:433";
}

function bindEvents() {
  el.playBtn.addEventListener("click", () => {
    state.playing = !state.playing;
    el.playBtn.textContent = state.playing ? "Pause" : "Play";
  });
  el.speedInput.addEventListener("change", () => {
    state.speed = Number(el.speedInput.value);
  });
  el.dateInput.addEventListener("change", () => {
    state.jd = dateToJulian(new Date(`${el.dateInput.value}T12:00:00Z`));
    state.playing = false;
    el.playBtn.textContent = "Play";
    needsFullUpdate = true;
  });
  el.timeScrub.addEventListener("input", () => {
    state.jd = dateToJulian(new Date()) + Number(el.timeScrub.value);
    state.playing = false;
    el.playBtn.textContent = "Play";
    applyFilter();
  });
  el.search.addEventListener("input", () => {
    state.query = el.search.value.trim().toLowerCase();
    applyFilter();
  });
  el.filter.addEventListener("change", () => {
    state.filter = el.filter.value;
    applyFilter();
  });
  el.cometToggle.addEventListener("change", () => {
    state.showComets = el.cometToggle.checked;
    needsFullUpdate = true;
  });
  el.results.addEventListener("click", (event) => {
    const button = event.target.closest("[data-key]");
    if (button) selectBody(button.dataset.key);
  });
  window.addEventListener("resize", resize);
}

function updateDateControls() {
  const date = julianToDate(state.jd);
  el.dateLabel.textContent = `${formatCalendar(state.jd)} | ${state.playing ? `${Math.abs(state.speed)} day/s ${state.speed < 0 ? "reverse" : "forward"}` : "paused"}`;
  el.dateInput.value = date.toISOString().slice(0, 10);
  el.timeScrub.value = String(Math.max(-3650, Math.min(3650, Math.round(state.jd - dateToJulian(new Date())))));
}

function updateLegend() {
  el.legend.innerHTML = `
    <span><i style="background:#f3be52"></i>Apollo</span>
    <span><i style="background:#5ec6e8"></i>Aten</span>
    <span><i style="background:#90d45b"></i>Amor</span>
    <span><i style="background:#ff6767"></i>PHA</span>
    <span><i style="background:#ffffff"></i>Sentry</span>
  `;
}

function updateLabels() {
  for (const { label, mesh } of planetLabels) {
    const p = mesh.position.clone().project(camera);
    const x = (p.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const y = (-p.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
    const rect = renderer.domElement.getBoundingClientRect();
    label.style.transform = `translate(${rect.left + x}px, ${rect.top + y}px)`;
    label.style.opacity = p.z < 1 ? "1" : "0";
  }
}

function resize() {
  const rect = el.canvas.parentElement.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

function positionFromPacked(pack, i, jd) {
  return positionFromElements({
    a: pack.a[i],
    e: pack.e[i],
    i: pack.inc[i] / RAD,
    om: pack.om[i] / RAD,
    w: pack.w[i] / RAD,
    ma: pack.ma[i] / RAD,
    epoch: pack.epoch[i],
    n: pack.n[i] / RAD,
  }, jd);
}

function positionFromElements(body, jd) {
  const a = number(body.a);
  const e = number(body.e);
  const inc = number(body.i) * RAD;
  const om = number(body.om) * RAD;
  const w = number(body.w) * RAD;
  const epoch = number(body.epoch) || J2000;
  const n = number(body.n || (body.per ? 360 / body.per : 0)) * RAD;
  let mean = (number(body.ma) * RAD + n * (jd - epoch)) % (Math.PI * 2);
  if (mean < 0) mean += Math.PI * 2;
  const E = solveKepler(mean, Math.min(e, 0.999));
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const xOrb = a * (cosE - e);
  const yOrb = a * Math.sqrt(1 - e * e) * sinE;
  const cosO = Math.cos(om), sinO = Math.sin(om);
  const cosI = Math.cos(inc), sinI = Math.sin(inc);
  const cosW = Math.cos(w), sinW = Math.sin(w);
  const x1 = cosW * xOrb - sinW * yOrb;
  const y1 = sinW * xOrb + cosW * yOrb;
  const x = (cosO * x1 - sinO * y1 * cosI) * AU_SCALE;
  const y = (sinO * x1 + cosO * y1 * cosI) * AU_SCALE;
  const z = (y1 * sinI) * AU_SCALE;
  return new THREE.Vector3(x, z, -y);
}

function solveKepler(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 6; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

function makeOrbitLine(body, color, opacity = 0.35) {
  const points = [];
  const period = number(body.per || (body.n ? 360 / body.n : 365));
  const base = number(body.epoch) || J2000;
  for (let i = 0; i <= 240; i++) points.push(positionFromElements(body, base + (period * i) / 240));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
}

function makeCircle(radius, color, opacity) {
  const points = [];
  for (let i = 0; i <= 256; i++) {
    const a = (i / 256) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

function makeLabel(text) {
  const label = document.createElement("div");
  label.className = "planetLabel";
  label.textContent = text;
  return label;
}

function instanceScale(pack, i) {
  if (pack.type === "comet") return 1.3;
  if (pack.pha[i]) return 1.9;
  if (pack.sentry[i]) return 1.75;
  const d = pack.dia[i];
  return d > 1 ? 1.65 : d > 0.2 ? 1.25 : 1;
}

function colorForAsteroid(i) {
  if (asteroids?.pha?.[i]) return 0xff6767;
  if (asteroids?.sentry?.[i]) return 0xffffff;
  return CLASS_COLORS[asteroids?.classCode?.[i]] || CLASS_COLORS.AST;
}

function indexCloseApproaches(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.des)) map.set(row.des, []);
    map.get(row.des).push(row);
  }
  return map;
}

let urlTimer = 0;
function updateUrlStateThrottled() {
  if (performance.now() - urlTimer < 1200) return;
  urlTimer = performance.now();
  updateUrlState();
}

function updateUrlState() {
  const params = new URLSearchParams();
  params.set("jd", state.jd.toFixed(2));
  if (state.selectedKey) params.set("selected", state.selectedKey);
  params.set("filter", state.filter);
  const url = `${location.pathname}?${params.toString()}${location.hash}`;
  history.replaceState(null, "", url);
}

function readUrlState() {
  const params = new URLSearchParams(location.search);
  if (params.has("jd")) state.jd = Number(params.get("jd"));
  if (params.has("selected")) state.selectedKey = params.get("selected");
  if (params.has("filter")) state.filter = params.get("filter");
}

function dateToJulian(date) {
  return date.getTime() / DAY_MS + 2440587.5;
}

function julianToDate(jd) {
  return new Date((jd - 2440587.5) * DAY_MS);
}

function formatCalendar(jd) {
  return julianToDate(jd).toISOString().slice(0, 10);
}

function bodyKey(type, id) {
  return `${type}:${String(id).trim()}`;
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function displayName(row) {
  return row.name ? `${row.name} (${row.pdes})` : row.full_name || row.pdes || "Unnamed object";
}

function formatNumber(value, digits = 2) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: digits }) : "unknown";
}

function formatAu(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0 ? `${formatNumber(value, 5)} au` : "unknown";
}

function formatProbability(value) {
  return Number(value).toExponential(2);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}
