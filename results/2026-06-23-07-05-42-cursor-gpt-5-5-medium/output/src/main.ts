import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadData } from "./data";
import {
  dateToJulianDate,
  formatDate,
  julianDateToDate,
  orbitPath,
  parseDateInput,
  positionFromElements,
  type Vec3,
} from "./orbit";
import "./styles.css";
import type { Asteroid, CloseApproach, Comet, LoadedData, Planet, Selection, SentryRisk } from "./types";

const AU_SCALE = 5;
const EARTH_CLOSE_DAYS_DEFAULT = 365;
const TODAY_JD = dateToJulianDate(new Date());
const PLANET_COLORS: Record<string, number> = {
  Mercury: 0xb8a79a,
  Venus: 0xffd18a,
  Earth: 0x65a6ff,
  Mars: 0xff795c,
  Jupiter: 0xffc48a,
  Saturn: 0xeed39a,
  Uranus: 0xa7f1ff,
  Neptune: 0x6d7dff,
};

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="app">
    <div class="viewport" id="viewport"></div>
    <div class="loading" id="loading">
      <p class="eyebrow">Loading NASA/JPL snapshot</p>
      <h2>Building the solar system</h2>
      <p class="subtle">Fetching orbital elements, close approaches, comet paths, and impact-risk summaries from local data files.</p>
    </div>
    <div class="toast hidden" id="toast"></div>
    <div class="hud hidden" id="hud">
      <aside class="panel panel-left">
        <div class="panel-header">
          <p class="eyebrow">Inner Solar System</p>
          <h1>Near-Earth Object Explorer</h1>
          <p class="subtle">All positions are propagated from each object's own orbital epoch. Drag to orbit, scroll to zoom, click a body to inspect it.</p>
        </div>
        <div class="panel-body">
          <div class="stats" id="stats"></div>
          <div class="field">
            <label for="search">Search designation or name</label>
            <input id="search" placeholder="Eros, Apophis, 2024..." autocomplete="off" />
          </div>
          <div class="grid">
            <div class="field">
              <label for="classFilter">Orbit class</label>
              <select id="classFilter"><option value="">All classes</option></select>
            </div>
            <div class="field">
              <label for="closeDays">Approach window</label>
              <select id="closeDays">
                <option value="30">30 days</option>
                <option value="365" selected>1 year</option>
                <option value="3650">10 years</option>
              </select>
            </div>
          </div>
          <label class="check"><input type="checkbox" id="phaOnly" /> Potentially hazardous only</label>
          <label class="check"><input type="checkbox" id="riskOnly" /> Sentry impact-risk objects only</label>
          <label class="check"><input type="checkbox" id="closeOnly" /> Close approaches in window</label>
          <label class="check"><input type="checkbox" id="showComets" checked /> Show comets, including open-orbit paths</label>
          <div class="legend">
            <div class="legend-row"><span class="swatch" style="color:#8fb6ff;background:#8fb6ff"></span> NEO asteroid</div>
            <div class="legend-row"><span class="swatch" style="color:#ff6b6b;background:#ff6b6b"></span> Potentially hazardous</div>
            <div class="legend-row"><span class="swatch" style="color:#d977ff;background:#d977ff"></span> Sentry impact-risk list</div>
            <div class="legend-row"><span class="swatch" style="color:#ffd166;background:#ffd166"></span> Upcoming close approach</div>
            <div class="legend-row"><span class="swatch" style="color:#80fff2;background:#80fff2"></span> Comet overlay</div>
          </div>
          <div class="results" id="results"></div>
        </div>
      </aside>
      <aside class="panel panel-right">
        <div class="panel-header">
          <p class="eyebrow">Selected Body</p>
          <h2 id="detailTitle">Nothing selected</h2>
          <p class="subtle" id="detailSubtitle">Click a planet, asteroid, or comet point to inspect orbit and risk data.</p>
        </div>
        <div class="panel-body" id="details"></div>
      </aside>
      <div class="timebar">
        <button id="playButton" class="primary">Pause</button>
        <input type="date" id="dateInput" />
        <input type="range" id="dateRange" min="-36525" max="36525" step="1" />
        <select id="speedSelect">
          <option value="-365">-1 year/sec</option>
          <option value="-30">-30 days/sec</option>
          <option value="-1">-1 day/sec</option>
          <option value="1">1 day/sec</option>
          <option value="30" selected>30 days/sec</option>
          <option value="365">1 year/sec</option>
        </select>
        <div class="date-readout" id="dateReadout"></div>
      </div>
    </div>
  </div>
`;

const viewport = element<HTMLDivElement>("viewport");
const loading = element<HTMLDivElement>("loading");
const hud = element<HTMLDivElement>("hud");
const toast = element<HTMLDivElement>("toast");
const stats = element<HTMLDivElement>("stats");
const searchInput = element<HTMLInputElement>("search");
const classFilter = element<HTMLSelectElement>("classFilter");
const closeDaysSelect = element<HTMLSelectElement>("closeDays");
const phaOnly = element<HTMLInputElement>("phaOnly");
const riskOnly = element<HTMLInputElement>("riskOnly");
const closeOnly = element<HTMLInputElement>("closeOnly");
const showComets = element<HTMLInputElement>("showComets");
const results = element<HTMLDivElement>("results");
const playButton = element<HTMLButtonElement>("playButton");
const dateInput = element<HTMLInputElement>("dateInput");
const dateRange = element<HTMLInputElement>("dateRange");
const speedSelect = element<HTMLSelectElement>("speedSelect");
const dateReadout = element<HTMLDivElement>("dateReadout");
const detailTitle = element<HTMLHeadingElement>("detailTitle");
const detailSubtitle = element<HTMLParagraphElement>("detailSubtitle");
const details = element<HTMLDivElement>("details");

let data: LoadedData;
let currentJd = readInitialJd();
let centerJd = TODAY_JD;
let playing = true;
let speedDaysPerSecond = Number(speedSelect.value);
let selection: Selection | null = readInitialSelection();
let followSelection = false;
let visibleAsteroidIndexes: number[] = [];
let visibleCometIndexes: number[] = [];
let asteroidPositions = new Float32Array();
let cometPositions = new Float32Array();
let asteroidColors = new Float32Array();
let cometColors = new Float32Array();
let urlUpdateTimer = 0;
let previousFrameTime = 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050711);
scene.fog = new THREE.FogExp2(0x050711, 0.006);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.02, 3000);
camera.position.set(0, 58, 96);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 0, 0);
controls.maxDistance = 900;

const raycaster = new THREE.Raycaster();
raycaster.params.Points!.threshold = 0.18;
const pointer = new THREE.Vector2();

const planetGroup = new THREE.Group();
const planetOrbitGroup = new THREE.Group();
const labelGroup = new THREE.Group();
const selectedOrbitGroup = new THREE.Group();
scene.add(planetOrbitGroup, planetGroup, labelGroup, selectedOrbitGroup);

const ambient = new THREE.AmbientLight(0xaec6ff, 0.24);
const sunLight = new THREE.PointLight(0xfff1c8, 3.8, 0, 1.4);
scene.add(ambient, sunLight);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.82, 48, 24),
  new THREE.MeshBasicMaterial({ color: 0xffd27d }),
);
scene.add(sun);

const sunGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: makeRadialTexture("#fff1a6", "#ff8a00"),
    color: 0xffc36d,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
sunGlow.scale.set(8, 8, 1);
scene.add(sunGlow);

const asteroidGeometry = new THREE.BufferGeometry();
const asteroidMaterial = new THREE.PointsMaterial({
  size: 0.045,
  sizeAttenuation: true,
  vertexColors: true,
  transparent: true,
  opacity: 0.88,
  depthWrite: false,
});
const asteroidPoints = new THREE.Points(asteroidGeometry, asteroidMaterial);
asteroidPoints.userData.kind = "asteroids";
scene.add(asteroidPoints);

const cometGeometry = new THREE.BufferGeometry();
const cometMaterial = new THREE.PointsMaterial({
  size: 0.06,
  sizeAttenuation: true,
  vertexColors: true,
  transparent: true,
  opacity: 0.76,
  depthWrite: false,
});
const cometPoints = new THREE.Points(cometGeometry, cometMaterial);
cometPoints.userData.kind = "comets";
scene.add(cometPoints);

const selectedMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 24, 12),
  new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
);
selectedMarker.visible = false;
scene.add(selectedMarker);

const planetMeshes = new Map<string, THREE.Mesh>();
const planetLabels = new Map<string, THREE.Sprite>();

void bootstrap();

async function bootstrap(): Promise<void> {
  try {
    data = await loadData();
    populateClassFilter();
    buildPlanets();
    applyFilters();
    restoreCameraFromUrl();
    syncTimeControls();
    updateScene(true);
    updateDetails();
    wireEvents();
    loading.classList.add("hidden");
    hud.classList.remove("hidden");
    requestAnimationFrame(animate);
  } catch (error) {
    loading.innerHTML = `<h2>Unable to load visualization</h2><p class="subtle">${String(error)}</p>`;
  }
}

function wireEvents(): void {
  window.addEventListener("resize", onResize);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  controls.addEventListener("end", scheduleUrlUpdate);

  searchInput.addEventListener("input", () => {
    applyFilters();
    renderSearchResults();
    scheduleUrlUpdate();
  });
  classFilter.addEventListener("change", () => {
    applyFilters();
    scheduleUrlUpdate();
  });
  closeDaysSelect.addEventListener("change", () => {
    applyFilters();
    scheduleUrlUpdate();
  });
  for (const input of [phaOnly, riskOnly, closeOnly, showComets]) {
    input.addEventListener("change", () => {
      applyFilters();
      scheduleUrlUpdate();
    });
  }

  playButton.addEventListener("click", () => {
    playing = !playing;
    playButton.textContent = playing ? "Pause" : "Play";
  });
  speedSelect.addEventListener("change", () => {
    speedDaysPerSecond = Number(speedSelect.value);
  });
  dateInput.addEventListener("change", () => {
    const parsed = parseDateInput(dateInput.value);
    if (parsed !== null) {
      currentJd = parsed;
      syncTimeControls();
      updateScene(true);
      scheduleUrlUpdate();
    }
  });
  dateRange.addEventListener("input", () => {
    currentJd = centerJd + Number(dateRange.value);
    syncTimeControls();
    updateScene(true);
    scheduleUrlUpdate();
  });
}

function buildPlanets(): void {
  for (const planet of data.planets) {
    const radius = visualPlanetRadius(planet);
    const color = PLANET_COLORS[planet.name] ?? 0xffffff;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 16),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.72,
        metalness: 0.02,
        emissive: color,
        emissiveIntensity: planet.name === "Earth" ? 0.08 : 0.03,
      }),
    );
    mesh.userData.selection = { kind: "planet", id: planet.name } satisfies Selection;
    planetMeshes.set(planet.name, mesh);
    planetGroup.add(mesh);

    const label = makeTextSprite(planet.name, color);
    planetLabels.set(planet.name, label);
    labelGroup.add(label);

    const path = orbitPath(planet, 360);
    const line = makeLine(path, color, 0.32);
    planetOrbitGroup.add(line);
  }
}

function applyFilters(): void {
  const query = normalized(searchInput.value);
  const orbitClass = classFilter.value;
  const closeDays = Number(closeDaysSelect.value) || EARTH_CLOSE_DAYS_DEFAULT;
  visibleAsteroidIndexes = [];

  for (let index = 0; index < data.asteroids.length; index += 1) {
    const asteroid = data.asteroids[index];
    if (orbitClass && asteroid.class !== orbitClass) continue;
    if (phaOnly.checked && !asteroid.pha) continue;
    if (riskOnly.checked && !data.sentryByDes.has(asteroid.pdes)) continue;
    if (closeOnly.checked && !hasCloseApproach(asteroid.pdes, currentJd, closeDays)) continue;
    if (query && !matchesAsteroid(asteroid, query)) continue;
    visibleAsteroidIndexes.push(index);
  }

  visibleCometIndexes = showComets.checked
    ? data.comets.map((_, index) => index).filter((index) => positionFromElements(data.comets[index], currentJd))
    : [];

  asteroidPositions = new Float32Array(visibleAsteroidIndexes.length * 3);
  asteroidColors = new Float32Array(visibleAsteroidIndexes.length * 3);
  cometPositions = new Float32Array(visibleCometIndexes.length * 3);
  cometColors = new Float32Array(visibleCometIndexes.length * 3);

  asteroidGeometry.setAttribute("position", new THREE.BufferAttribute(asteroidPositions, 3));
  asteroidGeometry.setAttribute("color", new THREE.BufferAttribute(asteroidColors, 3));
  cometGeometry.setAttribute("position", new THREE.BufferAttribute(cometPositions, 3));
  cometGeometry.setAttribute("color", new THREE.BufferAttribute(cometColors, 3));

  updatePointClouds();
  renderStats();
  renderSearchResults();
}

function updateScene(forcePointUpdate = false): void {
  updatePlanets();
  if (forcePointUpdate) {
    updatePointClouds();
  }
  updateSelectedMarker();
  syncTimeControls();
}

function updatePlanets(): void {
  for (const planet of data.planets) {
    const position = positionFromElements(planet, currentJd);
    const mesh = planetMeshes.get(planet.name);
    const label = planetLabels.get(planet.name);
    if (!position || !mesh || !label) continue;
    const scaled = scaleVec(position);
    mesh.position.set(...scaled);
    label.position.set(scaled[0], scaled[1] + visualPlanetRadius(planet) + 0.28, scaled[2]);
  }
}

function updatePointClouds(): void {
  const closeDays = Number(closeDaysSelect.value) || EARTH_CLOSE_DAYS_DEFAULT;
  const asteroidColor = new THREE.Color();
  for (let visibleIndex = 0; visibleIndex < visibleAsteroidIndexes.length; visibleIndex += 1) {
    const asteroid = data.asteroids[visibleAsteroidIndexes[visibleIndex]];
    const position = positionFromElements(asteroid, currentJd);
    const offset = visibleIndex * 3;
    if (position) {
      const scaled = scaleVec(position);
      asteroidPositions[offset] = scaled[0];
      asteroidPositions[offset + 1] = scaled[1];
      asteroidPositions[offset + 2] = scaled[2];
    } else {
      asteroidPositions[offset] = 9999;
      asteroidPositions[offset + 1] = 9999;
      asteroidPositions[offset + 2] = 9999;
    }
    asteroidColor.set(asteroidColorFor(asteroid, closeDays));
    asteroidColors[offset] = asteroidColor.r;
    asteroidColors[offset + 1] = asteroidColor.g;
    asteroidColors[offset + 2] = asteroidColor.b;
  }

  for (let visibleIndex = 0; visibleIndex < visibleCometIndexes.length; visibleIndex += 1) {
    const comet = data.comets[visibleCometIndexes[visibleIndex]];
    const position = positionFromElements(comet, currentJd);
    const offset = visibleIndex * 3;
    if (position) {
      const scaled = scaleVec(position);
      cometPositions[offset] = scaled[0];
      cometPositions[offset + 1] = scaled[1];
      cometPositions[offset + 2] = scaled[2];
    } else {
      cometPositions[offset] = 9999;
      cometPositions[offset + 1] = 9999;
      cometPositions[offset + 2] = 9999;
    }
    const color = comet.e !== null && comet.e >= 1 ? [0.5, 1, 0.95] : [0.45, 0.82, 1];
    cometColors[offset] = color[0];
    cometColors[offset + 1] = color[1];
    cometColors[offset + 2] = color[2];
  }

  markAttributesDirty(asteroidGeometry);
  markAttributesDirty(cometGeometry);
}

function updateSelectedMarker(): void {
  if (!selection) {
    selectedMarker.visible = false;
    return;
  }

  const position = selectedPosition(selection);
  if (!position) {
    selectedMarker.visible = false;
    return;
  }

  selectedMarker.visible = true;
  selectedMarker.position.set(...scaleVec(position));
  if (followSelection) {
    controls.target.copy(selectedMarker.position);
  }
}

function selectBody(next: Selection | null): void {
  selection = next;
  followSelection = false;
  updateSelectedOrbit();
  updateSelectedMarker();
  updateDetails();
  scheduleUrlUpdate();
}

function updateSelectedOrbit(): void {
  selectedOrbitGroup.clear();
  if (!selection) return;
  const body = selectedBody();
  if (!body) return;
  const path = orbitPath(body, selection.kind === "planet" ? 360 : 260);
  if (path.length) {
    selectedOrbitGroup.add(makeLine(path, selection.kind === "comet" ? 0x80fff2 : 0xffffff, 0.86));
  }
}

function selectedBody(): Planet | Asteroid | Comet | null {
  if (!selection) return null;
  if (selection.kind === "planet") return data.planets.find((planet) => planet.name === selection?.id) ?? null;
  if (selection.kind === "asteroid") return data.asteroids.find((asteroid) => asteroid.pdes === selection?.id) ?? null;
  return data.comets.find((comet) => comet.pdes === selection?.id) ?? null;
}

function selectedPosition(item: Selection): Vec3 | null {
  const body =
    item.kind === "planet"
      ? data.planets.find((planet) => planet.name === item.id)
      : item.kind === "asteroid"
        ? data.asteroids.find((asteroid) => asteroid.pdes === item.id)
        : data.comets.find((comet) => comet.pdes === item.id);
  return body ? positionFromElements(body, currentJd) : null;
}

function updateDetails(): void {
  const body = selectedBody();
  if (!selection || !body) {
    detailTitle.textContent = "Nothing selected";
    detailSubtitle.textContent = "Click a planet, asteroid, or comet point to inspect orbit and risk data.";
    details.innerHTML = `<p class="subtle">Use search or click directly in the cloud. The highlighted orbit will appear here with close approaches and Sentry data when available.</p>`;
    return;
  }

  const isAsteroid = selection.kind === "asteroid";
  const isComet = selection.kind === "comet";
  const name = "name" in body && body.name ? body.name : "full_name" in body ? body.full_name : body.name;
  const designation = "pdes" in body ? body.pdes : body.name;
  const sentry = isAsteroid ? data.sentryByDes.get((body as Asteroid).pdes) : undefined;
  const approaches = isAsteroid ? nearestApproaches((body as Asteroid).pdes, currentJd) : [];

  detailTitle.textContent = String(name);
  detailSubtitle.textContent =
    selection.kind === "planet"
      ? "Planetary orbit from the J2000 elements in the local dataset."
      : `${isComet ? "Comet" : "Near-Earth object"} ${designation}`;

  details.innerHTML = `
    <div class="grid">
      <button id="focusButton" class="primary">${followSelection ? "Following" : "Focus & follow"}</button>
      <button id="clearButton">Clear selection</button>
    </div>
    ${sentry ? riskMarkup(sentry) : ""}
    <div class="details-grid">
      ${kv("Class", "class" in body ? body.class ?? "Unknown" : "Planet")}
      ${kv("a", formatAu(body.a))}
      ${kv("e", formatValue(body.e, 4))}
      ${kv("Inclination", `${formatValue(body.i, 2)} deg`)}
      ${kv("Perihelion", formatAu(body.q))}
      ${kv("Aphelion", formatAu(body.ad))}
      ${kv("Diameter", "diameter" in body ? formatKm(body.diameter) : formatKm((body as Planet).radius_km * 2))}
      ${kv("Epoch", formatValue(body.epoch, 1))}
      ${
        isAsteroid
          ? `${kv("PHA", (body as Asteroid).pha ? "Yes" : "No")}${kv("MOID", formatAu((body as Asteroid).moid))}`
          : ""
      }
      ${isComet ? kv("Open orbit", body.e !== null && body.e >= 1 ? "Yes" : "No") : ""}
    </div>
    <h3>Close Approaches</h3>
    <div class="approach-list">
      ${
        approaches.length
          ? approaches.map(approachMarkup).join("")
          : `<p class="subtle">No Earth close-approach rows are available for this body.</p>`
      }
    </div>
  `;

  element<HTMLButtonElement>("focusButton").addEventListener("click", () => {
    followSelection = !followSelection;
    const position = selection ? selectedPosition(selection) : null;
    if (position) {
      const scaled = scaleVec(position);
      controls.target.set(...scaled);
      camera.position.lerp(new THREE.Vector3(scaled[0] + 8, scaled[1] + 5, scaled[2] + 8), 0.65);
    }
    updateDetails();
    scheduleUrlUpdate();
  });
  element<HTMLButtonElement>("clearButton").addEventListener("click", () => selectBody(null));
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);

  const planetHits = raycaster.intersectObjects([...planetMeshes.values()], false);
  if (planetHits.length) {
    selectBody(planetHits[0].object.userData.selection as Selection);
    return;
  }

  const asteroidHits = raycaster.intersectObject(asteroidPoints, false);
  if (asteroidHits.length && asteroidHits[0].index !== undefined) {
    const asteroid = data.asteroids[visibleAsteroidIndexes[asteroidHits[0].index]];
    if (asteroid) selectBody({ kind: "asteroid", id: asteroid.pdes });
    return;
  }

  const cometHits = raycaster.intersectObject(cometPoints, false);
  if (cometHits.length && cometHits[0].index !== undefined) {
    const comet = data.comets[visibleCometIndexes[cometHits[0].index]];
    if (comet) selectBody({ kind: "comet", id: comet.pdes });
  }
}

function animate(time: number): void {
  requestAnimationFrame(animate);
  const previous = previousFrameTime || time;
  const deltaSeconds = Math.min(0.08, (time - previous) / 1000);
  previousFrameTime = time;

  if (playing) {
    currentJd += speedDaysPerSecond * deltaSeconds;
    updateScene(true);
  } else {
    updateSelectedMarker();
  }

  controls.update();
  renderer.render(scene, camera);
}

function renderStats(): void {
  const riskCount = visibleAsteroidIndexes.filter((index) => data.sentryByDes.has(data.asteroids[index].pdes)).length;
  const phaCount = visibleAsteroidIndexes.filter((index) => data.asteroids[index].pha).length;
  stats.innerHTML = `
    <div class="stat"><strong>${visibleAsteroidIndexes.length.toLocaleString()}</strong><span>Visible NEOs</span></div>
    <div class="stat"><strong>${phaCount.toLocaleString()}</strong><span>Potentially hazardous</span></div>
    <div class="stat"><strong>${riskCount.toLocaleString()}</strong><span>Sentry listed</span></div>
    <div class="stat"><strong>${visibleCometIndexes.length.toLocaleString()}</strong><span>Comets</span></div>
  `;
}

function renderSearchResults(): void {
  const query = normalized(searchInput.value);
  if (!query) {
    results.innerHTML = `<p class="subtle">Tip: try "Apophis", "Eros", or an object designation. Filters update both the list and the 3D cloud.</p>`;
    return;
  }

  const matches = visibleAsteroidIndexes
    .map((index) => data.asteroids[index])
    .filter((asteroid) => matchesAsteroid(asteroid, query))
    .slice(0, 14);

  results.innerHTML = matches.length
    ? matches
        .map(
          (asteroid) => `
            <button class="result" data-id="${escapeHtml(asteroid.pdes)}">
              <strong>${escapeHtml(asteroid.name || asteroid.full_name)}</strong>
              <span>${escapeHtml(asteroid.pdes)} · ${asteroid.class} · ${asteroid.pha ? "PHA" : "NEO"}</span>
            </button>
          `,
        )
        .join("")
    : `<p class="subtle">No objects match the current search and filters.</p>`;

  for (const button of results.querySelectorAll<HTMLButtonElement>(".result")) {
    button.addEventListener("click", () => selectBody({ kind: "asteroid", id: button.dataset.id! }));
  }
}

function populateClassFilter(): void {
  const classes = [...new Set(data.asteroids.map((asteroid) => asteroid.class).filter(Boolean))].sort();
  for (const orbitClass of classes) {
    const option = document.createElement("option");
    option.value = orbitClass;
    option.textContent = orbitClass;
    classFilter.appendChild(option);
  }

  const params = new URLSearchParams(location.search);
  classFilter.value = params.get("class") ?? "";
  searchInput.value = params.get("q") ?? "";
  phaOnly.checked = params.get("pha") === "1";
  riskOnly.checked = params.get("risk") === "1";
  closeOnly.checked = params.get("close") === "1";
  showComets.checked = params.get("comets") !== "0";
}

function syncTimeControls(): void {
  dateInput.value = formatDate(currentJd);
  dateReadout.textContent = formatDate(currentJd);
  const offset = Math.round(currentJd - centerJd);
  if (offset < Number(dateRange.min) || offset > Number(dateRange.max)) {
    centerJd = currentJd;
    dateRange.value = "0";
  } else {
    dateRange.value = String(offset);
  }
}

function hasCloseApproach(des: string, jd: number, days: number): boolean {
  const approaches = data.approachesByDes.get(des);
  if (!approaches) return false;
  return approaches.some((approach) => approach.jd >= jd && approach.jd <= jd + days);
}

function nearestApproaches(des: string, jd: number): CloseApproach[] {
  const approaches = data.approachesByDes.get(des) ?? [];
  return [...approaches]
    .sort((a, b) => Math.abs(a.jd - jd) - Math.abs(b.jd - jd))
    .slice(0, 5)
    .sort((a, b) => a.jd - b.jd);
}

function asteroidColorFor(asteroid: Asteroid, closeDays: number): number {
  if (hasCloseApproach(asteroid.pdes, currentJd, closeDays)) return 0xffd166;
  if (data.sentryByDes.has(asteroid.pdes)) return 0xd977ff;
  if (asteroid.pha) return 0xff6b6b;
  if (asteroid.class === "ATE" || asteroid.class === "IEO") return 0x73fff4;
  if (asteroid.class === "APO") return 0x9fb6ff;
  return 0x7d8fb8;
}

function matchesAsteroid(asteroid: Asteroid, query: string): boolean {
  return [asteroid.full_name, asteroid.pdes, asteroid.name, asteroid.class]
    .filter(Boolean)
    .some((value) => normalized(String(value)).includes(query));
}

function riskMarkup(risk: SentryRisk): string {
  return `
    <div class="risk-card">
      <h3>Impact Risk</h3>
      <div class="details-grid">
        ${kv("Impact probability", risk.ip.toExponential(2))}
        ${kv("Torino max", String(risk.ts_max))}
        ${kv("Palermo max", formatValue(risk.ps_max, 2))}
        ${kv("Window", risk.range)}
        ${kv("Possible impacts", String(risk.n_imp))}
        ${kv("v∞", `${formatValue(risk.v_inf, 2)} km/s`)}
      </div>
    </div>
  `;
}

function approachMarkup(approach: CloseApproach): string {
  const days = Math.round(approach.jd - currentJd);
  const relative = days === 0 ? "today" : days > 0 ? `in ${days.toLocaleString()} days` : `${Math.abs(days).toLocaleString()} days ago`;
  return `
    <div class="approach">
      <strong>${escapeHtml(approach.cd)}</strong> (${relative})<br />
      Distance ${formatAu(approach.dist)} · vᵣ ${formatValue(approach.v_rel, 2)} km/s
    </div>
  `;
}

function makeLine(points: Vec3[], color: number, opacity: number): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map((point) => new THREE.Vector3(...scaleVec(point))),
  );
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  return new THREE.Line(geometry, material);
}

function makeTextSprite(text: string, color: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext("2d")!;
  ctx.font = "600 30px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(4.2, 1.32, 1);
  return sprite;
}

function makeRadialTexture(inner: string, outer: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.35, outer);
  gradient.addColorStop(1, "rgba(255, 136, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function markAttributesDirty(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute("position");
  const color = geometry.getAttribute("color");
  if (position) position.needsUpdate = true;
  if (color) color.needsUpdate = true;
  geometry.computeBoundingSphere();
}

function onResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function scheduleUrlUpdate(): void {
  window.clearTimeout(urlUpdateTimer);
  urlUpdateTimer = window.setTimeout(() => {
    const params = new URLSearchParams();
    params.set("jd", currentJd.toFixed(2));
    if (searchInput.value) params.set("q", searchInput.value);
    if (classFilter.value) params.set("class", classFilter.value);
    if (phaOnly.checked) params.set("pha", "1");
    if (riskOnly.checked) params.set("risk", "1");
    if (closeOnly.checked) params.set("close", "1");
    if (!showComets.checked) params.set("comets", "0");
    if (selection) params.set("sel", `${selection.kind}:${selection.id}`);
    params.set(
      "cam",
      [...camera.position.toArray(), ...controls.target.toArray()].map((value) => value.toFixed(2)).join(","),
    );
    history.replaceState(null, "", `${location.pathname}?${params.toString()}${location.hash}`);
  }, 180);
}

function readInitialJd(): number {
  const jd = Number(new URLSearchParams(location.search).get("jd"));
  return Number.isFinite(jd) ? jd : TODAY_JD;
}

function readInitialSelection(): Selection | null {
  const raw = new URLSearchParams(location.search).get("sel");
  if (!raw) return null;
  const [kind, ...rest] = raw.split(":");
  const id = rest.join(":");
  return kind === "planet" || kind === "asteroid" || kind === "comet" ? { kind, id } : null;
}

function restoreCameraFromUrl(): void {
  const raw = new URLSearchParams(location.search).get("cam");
  if (!raw) return;
  const values = raw.split(",").map(Number);
  if (values.length === 6 && values.every(Number.isFinite)) {
    camera.position.set(values[0], values[1], values[2]);
    controls.target.set(values[3], values[4], values[5]);
  }
}

function scaleVec([x, y, z]: Vec3): Vec3 {
  return [x * AU_SCALE, y * AU_SCALE, z * AU_SCALE];
}

function visualPlanetRadius(planet: Planet): number {
  if (planet.name === "Jupiter") return 0.52;
  if (planet.name === "Saturn") return 0.46;
  if (planet.name === "Uranus" || planet.name === "Neptune") return 0.34;
  if (planet.name === "Earth" || planet.name === "Venus") return 0.22;
  if (planet.name === "Mars") return 0.18;
  return 0.14;
}

function kv(label: string, value: string | number | null | undefined): string {
  return `<div class="kv"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value ?? "Unknown"))}</strong></div>`;
}

function formatAu(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(value < 0.1 ? 4 : 3)} au` : "Unknown";
}

function formatKm(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} km` : "Unknown";
}

function formatValue(value: number | null | undefined, digits: number): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "Unknown";
}

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[char];
  });
}

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) {
    toast.textContent = `Missing UI element: ${id}`;
    toast.classList.remove("hidden");
    throw new Error(`Missing UI element: ${id}`);
  }
  return node as T;
}
