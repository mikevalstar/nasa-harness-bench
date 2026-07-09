import "./style.css";
import { SpaceScene } from "./scene";
import {
  dateToJulian,
  formatDate,
  isoDate,
  julianToDate,
} from "./orbits";
import type {
  Asteroid,
  AsteroidFilter,
  CameraState,
  CloseApproach,
  Comet,
  DataSet,
  Planet,
  Selection,
  SentryRisk,
} from "./types";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Application root not found");

const icons = {
  search:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z"/></svg>',
  pause:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>',
  target:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  reset:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8"/><path d="M4 3v5h5"/></svg>',
  share:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></svg>',
  sliders:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  chevron:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
};

app.innerHTML = `
  <main class="atlas-shell">
    <section class="space-stage" id="space-stage" aria-label="Interactive 3D solar system">
      <div class="loading-screen" id="loading-screen">
        <div class="loader-orbit"><span></span><i></i></div>
        <p class="eyebrow">JPL DATASET · LOCAL</p>
        <h1>Charting near space</h1>
        <p id="loading-status">Loading orbital elements…</p>
        <div class="loading-bar"><i></i></div>
      </div>
    </section>

    <header class="topbar">
      <div class="brand">
        <div class="brand-mark"><span></span></div>
        <div><strong>NEAR SPACE</strong><small>ORBITAL ATLAS</small></div>
      </div>
      <div class="topbar-status">
        <span class="status-dot"></span>
        <span id="epoch-label">SIMULATION READY</span>
      </div>
      <div class="topbar-actions">
        <button class="icon-button mobile-filter" id="mobile-filter" title="Open filters" aria-label="Open filters">${icons.sliders}</button>
        <button class="text-button" id="reset-view">${icons.reset}<span>Reset view</span></button>
        <button class="icon-button" id="share-view" title="Copy a link to this view" aria-label="Share view">${icons.share}</button>
      </div>
    </header>

    <aside class="explorer-panel" id="explorer-panel" aria-label="Object explorer">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">OBJECT EXPLORER</p>
          <h2>Near-Earth field</h2>
        </div>
        <button class="icon-button panel-close" id="panel-close" aria-label="Close filters">${icons.close}</button>
      </div>

      <div class="search-wrap">
        ${icons.search}
        <input id="search-input" type="search" autocomplete="off" placeholder="Search name or designation" aria-label="Search objects" />
        <kbd>⌘ K</kbd>
        <div class="search-results" id="search-results" hidden></div>
      </div>

      <div class="field-summary">
        <button class="summary-stat" id="all-preset">
          <strong id="visible-count">—</strong><span>visible</span>
        </button>
        <button class="summary-stat hazard-stat" id="hazard-preset">
          <strong id="hazard-count">—</strong><span>potentially hazardous</span>
        </button>
        <button class="summary-stat risk-stat" id="risk-preset">
          <strong id="risk-count">—</strong><span>on Sentry</span>
        </button>
      </div>

      <div class="filter-section">
        <div class="section-title"><span>Visibility</span><button id="clear-filters">Clear</button></div>
        <label class="toggle-row">
          <span><i class="legend-dot asteroid-dot"></i>Near-Earth asteroids</span>
          <input type="checkbox" id="asteroids-toggle" checked /><i class="toggle"></i>
        </label>
        <label class="toggle-row">
          <span><i class="legend-dot comet-dot"></i>Comets <em>4K</em></span>
          <input type="checkbox" id="comets-toggle" /><i class="toggle"></i>
        </label>
        <label class="toggle-row">
          <span><i class="legend-line"></i>Orbital paths</span>
          <input type="checkbox" id="orbits-toggle" checked /><i class="toggle"></i>
        </label>
      </div>

      <div class="filter-section">
        <div class="section-title"><span>Risk & class</span></div>
        <div class="chip-row">
          <label class="filter-chip"><input type="checkbox" id="hazard-filter" /><span>PHA only</span></label>
          <label class="filter-chip"><input type="checkbox" id="sentry-filter" /><span>Sentry watch</span></label>
        </div>
        <label class="select-label" for="class-filter">Orbit class</label>
        <select id="class-filter">
          <option value="">All classes</option>
        </select>
      </div>

      <div class="filter-section range-section">
        <div class="range-heading">
          <label for="diameter-filter">Minimum known diameter</label>
          <output id="diameter-output">Any</output>
        </div>
        <input type="range" id="diameter-filter" min="0" max="5" step="0.1" value="0" />
        <div class="range-heading">
          <label for="moid-filter">Maximum Earth MOID</label>
          <output id="moid-output">Any</output>
        </div>
        <input type="range" id="moid-filter" min="0.005" max="0.3" step="0.005" value="0.3" />
      </div>

      <div class="filter-section">
        <div class="section-title"><span>Upcoming approaches</span></div>
        <div class="segmented" id="approach-filter">
          <button class="active" data-days="0">Any</button>
          <button data-days="30">30d</button>
          <button data-days="365">1y</button>
          <button data-days="3650">10y</button>
        </div>
      </div>

      <div class="dataset-note">
        <span>DATASET</span>
        <p>NASA/JPL snapshot · Heliocentric J2000</p>
        <i>Local</i>
      </div>
    </aside>

    <div class="view-hud">
      <div><span>VIEW</span><strong id="view-scale">INNER SYSTEM</strong></div>
      <div class="hud-separator"></div>
      <div><span>FRAME</span><strong>J2000 ECLIPTIC</strong></div>
      <div class="interaction-hint">DRAG TO ORBIT · SCROLL TO ZOOM · SELECT A POINT</div>
    </div>

    <aside class="detail-panel" id="detail-panel" aria-live="polite"></aside>

    <section class="time-console" aria-label="Simulation time controls">
      <button class="play-button" id="play-button" aria-label="Pause simulation">${icons.pause}</button>
      <div class="date-block">
        <span>SIMULATION DATE · UTC</span>
        <strong id="date-display">—</strong>
      </div>
      <div class="timeline-wrap">
        <input id="timeline" type="range" min="2451544.5" max="2469807.5" step="0.1" />
        <div class="timeline-ticks"><span>2000</span><span>2010</span><span>2020</span><span>2030</span><span>2040</span><span>2050</span></div>
      </div>
      <div class="time-actions">
        <label class="date-input-label">JUMP TO<input type="date" id="date-input" /></label>
        <button class="today-button" id="today-button">Today</button>
        <label class="speed-control"><span>SPEED</span>
          <select id="speed-select" aria-label="Simulation speed">
            <option value="-30">−30 d/s</option>
            <option value="-5">−5 d/s</option>
            <option value="1">1 d/s</option>
            <option value="5" selected>5 d/s</option>
            <option value="30">30 d/s</option>
            <option value="365">1 y/s</option>
          </select>
        </label>
      </div>
    </section>

    <div class="toast" id="toast" role="status"></div>
  </main>
`;

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing UI element: ${selector}`);
  return element;
}

const stage = query<HTMLElement>("#space-stage");
const loadingScreen = query<HTMLElement>("#loading-screen");
const loadingStatus = query<HTMLElement>("#loading-status");
const explorerPanel = query<HTMLElement>("#explorer-panel");
const detailPanel = query<HTMLElement>("#detail-panel");
const searchInput = query<HTMLInputElement>("#search-input");
const searchResults = query<HTMLElement>("#search-results");
const visibleCount = query<HTMLElement>("#visible-count");
const dateDisplay = query<HTMLElement>("#date-display");
const dateInput = query<HTMLInputElement>("#date-input");
const timeline = query<HTMLInputElement>("#timeline");
const playButton = query<HTMLButtonElement>("#play-button");
const speedSelect = query<HTMLSelectElement>("#speed-select");
const toast = query<HTMLElement>("#toast");

const initialParams = new URLSearchParams(window.location.search);
const initialDate = initialParams.get("date");
let julianDate = initialDate
  ? dateToJulian(new Date(`${initialDate}T12:00:00Z`))
  : dateToJulian(new Date());
if (!Number.isFinite(julianDate)) julianDate = dateToJulian(new Date());
let playing = initialParams.get("paused") !== "1";
let daysPerSecond = Number(initialParams.get("speed") ?? 5);
if (!Number.isFinite(daysPerSecond)) daysPerSecond = 5;
let selection: Selection = null;
let tracking = initialParams.get("follow") === "1";
let showAsteroids = true;
let showComets = initialParams.get("comets") === "1";
let scene: SpaceScene | null = null;
let data: DataSet | null = null;
let approachMap = new Map<string, CloseApproach[]>();
let sentryMap = new Map<string, SentryRisk>();
let visibleMask = new Uint8Array();
let lastFilterDay = Math.floor(julianDate);
let cameraState: CameraState | null = parseCamera(initialParams);
let cameraUrlTimer = 0;
let toastTimer = 0;

const filters: AsteroidFilter = {
  hazardousOnly: false,
  sentryOnly: false,
  orbitClass: "",
  minDiameter: 0,
  maxMoid: 0.3,
  approachWindowDays: 0,
  search: "",
};

function parseCamera(params: URLSearchParams): CameraState | null {
  const position = params.get("cp")?.split(",").map(Number);
  const target = params.get("ct")?.split(",").map(Number);
  if (position?.length !== 3 || target?.length !== 3) return null;
  return {
    position: position as [number, number, number],
    target: target as [number, number, number],
  };
}

async function fetchJson<T>(file: string): Promise<T> {
  const response = await fetch(`./${file}`);
  if (!response.ok) throw new Error(`Could not load ${file}`);
  return response.json() as Promise<T>;
}

async function loadData(): Promise<DataSet> {
  loadingStatus.textContent = "Loading 42,000 asteroid orbits…";
  const [planets, asteroids, comets, approaches, sentry] = await Promise.all([
    fetchJson<Planet[]>("planets.json"),
    fetchJson<Asteroid[]>("asteroids.json"),
    fetchJson<Comet[]>("comets.json"),
    fetchJson<CloseApproach[]>("close-approaches.json"),
    fetchJson<SentryRisk[]>("sentry.json"),
  ]);
  return { planets, asteroids, comets, approaches, sentry };
}

function buildIndexes(dataset: DataSet): void {
  approachMap = new Map();
  dataset.approaches.forEach((approach) => {
    const existing = approachMap.get(approach.des);
    if (existing) existing.push(approach);
    else approachMap.set(approach.des, [approach]);
  });
  sentryMap = new Map(dataset.sentry.map((risk) => [risk.des, risk]));
}

function populateClasses(dataset: DataSet): void {
  const select = query<HTMLSelectElement>("#class-filter");
  const classes = [...new Set(dataset.asteroids.map((asteroid) => asteroid.class))]
    .filter(Boolean)
    .sort();
  classes.forEach((orbitClass) => {
    const option = document.createElement("option");
    option.value = orbitClass;
    option.textContent = `${orbitClass} · ${className(orbitClass)}`;
    select.append(option);
  });
}

function className(code: string): string {
  const names: Record<string, string> = {
    APO: "Apollo",
    ATE: "Aten",
    AMO: "Amor",
    IEO: "Atira",
    MCA: "Mars-crosser",
  };
  return names[code] ?? code;
}

function applyFilters(): void {
  if (!data || !scene) return;
  visibleMask = new Uint8Array(data.asteroids.length);
  const queryText = filters.search.trim().toLowerCase();
  const windowEnd = julianDate + filters.approachWindowDays;
  let count = 0;

  data.asteroids.forEach((asteroid, index) => {
    let visible = showAsteroids;
    if (visible && filters.hazardousOnly) visible = asteroid.pha;
    if (visible && filters.sentryOnly) visible = sentryMap.has(asteroid.pdes);
    if (visible && filters.orbitClass) {
      visible = asteroid.class === filters.orbitClass;
    }
    if (visible && filters.minDiameter > 0) {
      visible =
        asteroid.diameter !== null &&
        asteroid.diameter >= filters.minDiameter;
    }
    if (visible && filters.maxMoid < 0.3) {
      visible = asteroid.moid !== null && asteroid.moid <= filters.maxMoid;
    }
    if (visible && filters.approachWindowDays > 0) {
      visible =
        approachMap
          .get(asteroid.pdes)
          ?.some(
            (approach) =>
              approach.jd >= julianDate && approach.jd <= windowEnd,
          ) ?? false;
    }
    if (visible && queryText) {
      visible =
        asteroid.full_name.toLowerCase().includes(queryText) ||
        asteroid.pdes.toLowerCase().includes(queryText);
    }
    visibleMask[index] = visible ? 1 : 0;
    if (visible) count += 1;
  });

  scene.setAsteroidVisibility(visibleMask);
  visibleCount.textContent = count.toLocaleString();
  query<HTMLElement>("#epoch-label").textContent =
    `${count.toLocaleString()} OBJECTS PROPAGATED`;
}

function updateTimeUi(): void {
  const date = julianToDate(julianDate);
  dateDisplay.textContent = formatDate(julianDate).toUpperCase();
  dateInput.value = date.toISOString().slice(0, 10);
  timeline.value = String(
    Math.min(Number(timeline.max), Math.max(Number(timeline.min), julianDate)),
  );
  playButton.innerHTML = playing ? icons.pause : icons.play;
  playButton.setAttribute(
    "aria-label",
    playing ? "Pause simulation" : "Play simulation",
  );
}

function syncUrl(includeCamera = true): void {
  const params = new URLSearchParams();
  params.set("date", isoDate(julianDate));
  if (!playing) params.set("paused", "1");
  if (daysPerSecond !== 5) params.set("speed", String(daysPerSecond));
  if (showComets) params.set("comets", "1");
  if (selection) {
    if (selection.kind === "asteroid" && data) {
      params.set("object", data.asteroids[selection.index].pdes);
    } else if (selection.kind === "comet" && data) {
      params.set("comet", data.comets[selection.index].pdes);
    } else if (selection.kind === "planet" && data) {
      params.set("planet", data.planets[selection.index].name);
    }
  }
  if (tracking) params.set("follow", "1");
  const currentCamera = includeCamera ? (cameraState ?? scene?.getCameraState()) : null;
  if (currentCamera) {
    const compact = (values: [number, number, number]) =>
      values.map((value) => value.toFixed(3)).join(",");
    params.set("cp", compact(currentCamera.position));
    params.set("ct", compact(currentCamera.target));
  }
  window.history.replaceState(null, "", `?${params.toString()}`);
}

function restoreSelection(dataset: DataSet): void {
  const object = initialParams.get("object");
  const comet = initialParams.get("comet");
  const planet = initialParams.get("planet");
  if (object) {
    const index = dataset.asteroids.findIndex(
      (asteroid) => asteroid.pdes === object,
    );
    if (index >= 0) selectObject({ kind: "asteroid", index }, false);
  } else if (comet) {
    const index = dataset.comets.findIndex((item) => item.pdes === comet);
    if (index >= 0) selectObject({ kind: "comet", index }, false);
  } else if (planet) {
    const index = dataset.planets.findIndex((item) => item.name === planet);
    if (index >= 0) selectObject({ kind: "planet", index }, false);
  }
}

function selectObject(nextSelection: Selection, frame = true): void {
  selection = nextSelection;
  scene?.setSelection(selection, frame);
  scene?.setTracking(tracking);
  renderDetail();
  syncUrl();
}

function renderDetail(): void {
  if (!data || !selection) {
    detailPanel.classList.remove("open");
    detailPanel.innerHTML = "";
    return;
  }

  if (selection.kind === "asteroid") {
    renderAsteroidDetail(data.asteroids[selection.index]);
  } else if (selection.kind === "planet") {
    renderPlanetDetail(data.planets[selection.index]);
  } else {
    renderCometDetail(data.comets[selection.index]);
  }
  detailPanel.classList.add("open");
  bindDetailActions();
}

function renderAsteroidDetail(asteroid: Asteroid): void {
  const approaches = [...(approachMap.get(asteroid.pdes) ?? [])]
    .sort(
      (first, second) =>
        Math.abs(first.jd - julianDate) - Math.abs(second.jd - julianDate),
    )
    .slice(0, 5);
  const risk = sentryMap.get(asteroid.pdes);
  const tags = [
    `<span class="tag">${escapeHtml(className(asteroid.class))}</span>`,
    asteroid.pha ? '<span class="tag hazard">Potentially hazardous</span>' : "",
    risk ? '<span class="tag risk">Sentry monitored</span>' : "",
  ].join("");

  detailPanel.innerHTML = `
    <div class="detail-header">
      <div><p class="eyebrow">ASTEROID · ${escapeHtml(asteroid.pdes)}</p><h2>${escapeHtml(asteroid.name ?? asteroid.full_name)}</h2></div>
      <button class="icon-button" data-action="close">${icons.close}</button>
    </div>
    <div class="tag-row">${tags}</div>
    <div class="detail-actions">
      <button data-action="frame">${icons.target}<span>Focus</span></button>
      <button data-action="follow" class="${tracking ? "active" : ""}"><span class="follow-dot"></span>${tracking ? "Following" : "Follow in time"}</button>
    </div>
    <div class="object-metrics">
      ${metric("DIAMETER", asteroid.diameter ? formatSize(asteroid.diameter) : "Unknown")}
      ${metric("EARTH MOID", asteroid.moid !== null ? `${asteroid.moid.toFixed(4)} au` : "Unknown")}
      ${metric("ABS. MAG.", asteroid.H !== null ? asteroid.H.toFixed(2) : "Unknown")}
      ${metric("ORBIT PERIOD", asteroid.per ? formatPeriod(asteroid.per) : "Unknown")}
    </div>
    <section class="detail-section">
      <div class="section-title"><span>Orbit profile</span><small>EPOCH JD ${asteroid.epoch?.toFixed(1) ?? "—"}</small></div>
      <div class="orbit-bars">
        ${orbitBar("PERIHELION", asteroid.q, 4)}
        ${orbitBar("SEMI-MAJOR", asteroid.a, 4)}
        ${orbitBar("APHELION", asteroid.ad, 4)}
      </div>
      <div class="inline-facts">
        <span>e <strong>${asteroid.e.toFixed(4)}</strong></span>
        <span>i <strong>${asteroid.i.toFixed(2)}°</strong></span>
        <span>Ω <strong>${asteroid.om.toFixed(2)}°</strong></span>
      </div>
    </section>
    ${
      risk
        ? `<section class="detail-section risk-card">
            <div class="risk-card-title"><span>SENTRY RISK PROFILE</span><i>ACTIVE DATA</i></div>
            <div class="risk-grid">
              ${metric("CUMULATIVE IP", formatProbability(risk.ip))}
              ${metric("TORINO MAX", String(risk.ts_max))}
              ${metric("PALERMO CUM.", risk.ps_cum.toFixed(2))}
              ${metric("IMPACT WINDOW", escapeHtml(risk.range))}
            </div>
            <p>${risk.n_imp.toLocaleString()} modeled potential impact solution${risk.n_imp === 1 ? "" : "s"}. A Sentry listing is not a prediction of impact.</p>
          </section>`
        : ""
    }
    <section class="detail-section">
      <div class="section-title"><span>Nearest close approaches</span><small>RELATIVE TO VIEW DATE</small></div>
      ${
        approaches.length
          ? `<div class="approach-list">${approaches
              .map(
                (approach) => `
                <button class="approach-row" data-jd="${approach.jd}">
                  <span><strong>${formatDate(approach.jd)}</strong><small>${approach.v_rel.toFixed(1)} km/s</small></span>
                  <span><strong>${(approach.dist * 389.17).toFixed(1)} LD</strong><small>${approach.dist.toFixed(4)} au</small></span>
                  ${icons.chevron}
                </button>`,
              )
              .join("")}</div>`
          : '<p class="empty-note">No Earth approaches in this dataset.</p>'
      }
    </section>
    <div class="source-foot">Source: NASA/JPL Small-Body Database</div>
  `;
}

function renderPlanetDetail(planet: Planet): void {
  detailPanel.innerHTML = `
    <div class="detail-header">
      <div><p class="eyebrow">PLANET · J2000 ELEMENTS</p><h2>${escapeHtml(planet.name)}</h2></div>
      <button class="icon-button" data-action="close">${icons.close}</button>
    </div>
    <div class="tag-row"><span class="tag">Solar system planet</span></div>
    <div class="detail-actions">
      <button data-action="frame">${icons.target}<span>Focus</span></button>
      <button data-action="follow" class="${tracking ? "active" : ""}"><span class="follow-dot"></span>${tracking ? "Following" : "Follow in time"}</button>
    </div>
    <div class="object-metrics">
      ${metric("MEAN RADIUS", `${planet.radius_km.toLocaleString()} km`)}
      ${metric("SOLAR DISTANCE", `${planet.a?.toFixed(3)} au`)}
      ${metric("ORBIT PERIOD", planet.per ? formatPeriod(planet.per) : "—")}
      ${metric("INCLINATION", `${planet.i.toFixed(2)}°`)}
    </div>
    <section class="detail-section">
      <div class="section-title"><span>Orbital elements</span><small>EPOCH J2000</small></div>
      <div class="inline-facts wide">
        <span>eccentricity <strong>${planet.e.toFixed(6)}</strong></span>
        <span>ascending node <strong>${planet.om.toFixed(2)}°</strong></span>
        <span>perihelion arg. <strong>${planet.w.toFixed(2)}°</strong></span>
        <span>mean motion <strong>${planet.n?.toFixed(4)}°/day</strong></span>
      </div>
    </section>
    <div class="source-foot">Source: JPL approximate planetary elements</div>
  `;
}

function renderCometDetail(comet: Comet): void {
  detailPanel.innerHTML = `
    <div class="detail-header">
      <div><p class="eyebrow">COMET · ${escapeHtml(comet.pdes)}</p><h2>${escapeHtml(comet.full_name)}</h2></div>
      <button class="icon-button" data-action="close">${icons.close}</button>
    </div>
    <div class="tag-row"><span class="tag comet">Comet</span><span class="tag">${escapeHtml(comet.class)}</span>${comet.e >= 1 ? '<span class="tag risk">Open orbit</span>' : ""}</div>
    <div class="detail-actions">
      <button data-action="frame">${icons.target}<span>Focus</span></button>
      <button data-action="follow" class="${tracking ? "active" : ""}"><span class="follow-dot"></span>${tracking ? "Following" : "Follow in time"}</button>
    </div>
    <div class="object-metrics">
      ${metric("DIAMETER", comet.diameter ? formatSize(comet.diameter) : "Unknown")}
      ${metric("PERIHELION", comet.q ? `${comet.q.toFixed(3)} au` : "Unknown")}
      ${metric("ECCENTRICITY", comet.e.toFixed(4))}
      ${metric("INCLINATION", `${comet.i.toFixed(2)}°`)}
    </div>
    <section class="detail-section">
      <div class="section-title"><span>Propagation method</span></div>
      <p class="method-note">${comet.e < 0.9995 ? "Elliptic Kepler solution advanced from the object's epoch." : comet.e > 1.0005 ? "Hyperbolic Kepler solution propagated from perihelion passage." : "Near-parabolic Barker equation propagated from perihelion passage."}</p>
    </section>
    <div class="source-foot">Source: NASA/JPL Small-Body Database</div>
  `;
}

function metric(label: string, value: string): string {
  return `<div><span>${label}</span><strong>${value}</strong></div>`;
}

function orbitBar(label: string, value: number | null | undefined, max: number): string {
  const width = value ? Math.min(100, (value / max) * 100) : 0;
  return `<div><span>${label}<strong>${value ? `${value.toFixed(3)} au` : "—"}</strong></span><i><b style="width:${width}%"></b></i></div>`;
}

function formatSize(kilometers: number): string {
  return kilometers < 1
    ? `${Math.round(kilometers * 1000).toLocaleString()} m`
    : `${kilometers.toFixed(kilometers < 10 ? 2 : 1)} km`;
}

function formatPeriod(days: number): string {
  return days > 730 ? `${(days / 365.25).toFixed(1)} years` : `${Math.round(days)} days`;
}

function formatProbability(probability: number): string {
  if (probability === 0) return "0";
  if (probability < 0.001) return probability.toExponential(2);
  return `${(probability * 100).toFixed(3)}%`;
}

function escapeHtml(value: string): string {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

function bindDetailActions(): void {
  detailPanel.querySelector('[data-action="close"]')?.addEventListener("click", () => {
    tracking = false;
    scene?.setTracking(false);
    selectObject(null);
  });
  detailPanel.querySelector('[data-action="frame"]')?.addEventListener("click", () => {
    scene?.frameSelection();
  });
  detailPanel.querySelector('[data-action="follow"]')?.addEventListener("click", () => {
    tracking = !tracking;
    scene?.setTracking(tracking);
    renderDetail();
    syncUrl();
  });
  detailPanel.querySelectorAll<HTMLElement>("[data-jd]").forEach((row) => {
    row.addEventListener("click", () => {
      julianDate = Number(row.dataset.jd);
      scene?.setJulianDate(julianDate, true);
      updateTimeUi();
      applyFilters();
      renderDetail();
      syncUrl();
    });
  });
}

function updateSearchResults(): void {
  if (!data) return;
  const term = searchInput.value.trim().toLowerCase();
  if (term.length < 1) {
    searchResults.hidden = true;
    return;
  }
  const asteroidMatches = data.asteroids
    .map((asteroid, index) => ({ asteroid, index }))
    .filter(
      ({ asteroid }) =>
        asteroid.pdes.toLowerCase().includes(term) ||
        asteroid.full_name.toLowerCase().includes(term),
    )
    .slice(0, 7);
  const planetMatches = data.planets
    .map((planet, index) => ({ planet, index }))
    .filter(({ planet }) => planet.name.toLowerCase().includes(term));

  const rows = [
    ...planetMatches.map(
      ({ planet, index }) =>
        `<button data-kind="planet" data-index="${index}"><i class="result-orb planet"></i><span><strong>${escapeHtml(planet.name)}</strong><small>PLANET</small></span>${icons.chevron}</button>`,
    ),
    ...asteroidMatches.map(
      ({ asteroid, index }) =>
        `<button data-kind="asteroid" data-index="${index}"><i class="result-orb ${asteroid.pha ? "hazard" : ""}"></i><span><strong>${escapeHtml(asteroid.name ?? asteroid.full_name)}</strong><small>${escapeHtml(asteroid.pdes)} · ${escapeHtml(asteroid.class)}</small></span>${icons.chevron}</button>`,
    ),
  ];
  searchResults.innerHTML = rows.length
    ? rows.join("")
    : '<p class="empty-note">No matching object</p>';
  searchResults.hidden = false;
  searchResults.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    button.addEventListener("click", () => {
      const kind = button.dataset.kind as "asteroid" | "planet";
      const index = Number(button.dataset.index);
      filters.search = "";
      searchInput.value = "";
      searchResults.hidden = true;
      applyFilters();
      selectObject({ kind, index });
      explorerPanel.classList.remove("mobile-open");
    });
  });
}

function showToast(message: string): void {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function clearFilters(): void {
  filters.hazardousOnly = false;
  filters.sentryOnly = false;
  filters.orbitClass = "";
  filters.minDiameter = 0;
  filters.maxMoid = 0.3;
  filters.approachWindowDays = 0;
  filters.search = "";
  searchInput.value = "";
  query<HTMLInputElement>("#hazard-filter").checked = false;
  query<HTMLInputElement>("#sentry-filter").checked = false;
  query<HTMLSelectElement>("#class-filter").value = "";
  query<HTMLInputElement>("#diameter-filter").value = "0";
  query<HTMLElement>("#diameter-output").textContent = "Any";
  query<HTMLInputElement>("#moid-filter").value = "0.3";
  query<HTMLElement>("#moid-output").textContent = "Any";
  document.querySelectorAll("#approach-filter button").forEach((button) => {
    button.classList.toggle(
      "active",
      (button as HTMLElement).dataset.days === "0",
    );
  });
  applyFilters();
}

function bindUi(): void {
  playButton.addEventListener("click", () => {
    playing = !playing;
    updateTimeUi();
    syncUrl();
  });
  speedSelect.value = String(daysPerSecond);
  speedSelect.addEventListener("change", () => {
    daysPerSecond = Number(speedSelect.value);
    if (!playing) playing = true;
    updateTimeUi();
    syncUrl();
  });
  timeline.addEventListener("input", () => {
    playing = false;
    julianDate = Number(timeline.value);
    scene?.setJulianDate(julianDate, true);
    updateTimeUi();
    applyFilters();
    renderDetail();
  });
  timeline.addEventListener("change", () => syncUrl());
  dateInput.addEventListener("change", () => {
    julianDate = dateToJulian(new Date(`${dateInput.value}T12:00:00Z`));
    playing = false;
    scene?.setJulianDate(julianDate, true);
    updateTimeUi();
    applyFilters();
    renderDetail();
    syncUrl();
  });
  query("#today-button").addEventListener("click", () => {
    julianDate = dateToJulian(new Date());
    scene?.setJulianDate(julianDate, true);
    updateTimeUi();
    applyFilters();
    renderDetail();
    syncUrl();
  });

  searchInput.addEventListener("input", updateSearchResults);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      filters.search = searchInput.value;
      searchResults.hidden = true;
      applyFilters();
    }
    if (event.key === "Escape") searchResults.hidden = true;
  });
  document.addEventListener("pointerdown", (event) => {
    if (!(event.target as Element).closest(".search-wrap")) {
      searchResults.hidden = true;
    }
  });

  query<HTMLInputElement>("#asteroids-toggle").addEventListener("change", (event) => {
    showAsteroids = (event.currentTarget as HTMLInputElement).checked;
    applyFilters();
  });
  const cometsToggle = query<HTMLInputElement>("#comets-toggle");
  cometsToggle.checked = showComets;
  cometsToggle.addEventListener("change", () => {
    showComets = cometsToggle.checked;
    scene?.setCometsVisible(showComets);
    syncUrl();
  });
  query<HTMLInputElement>("#orbits-toggle").addEventListener("change", (event) => {
    scene?.setOrbitsVisible((event.currentTarget as HTMLInputElement).checked);
  });
  query<HTMLInputElement>("#hazard-filter").addEventListener("change", (event) => {
    filters.hazardousOnly = (event.currentTarget as HTMLInputElement).checked;
    applyFilters();
  });
  query<HTMLInputElement>("#sentry-filter").addEventListener("change", (event) => {
    filters.sentryOnly = (event.currentTarget as HTMLInputElement).checked;
    applyFilters();
  });
  query<HTMLSelectElement>("#class-filter").addEventListener("change", (event) => {
    filters.orbitClass = (event.currentTarget as HTMLSelectElement).value;
    applyFilters();
  });
  query<HTMLInputElement>("#diameter-filter").addEventListener("input", (event) => {
    filters.minDiameter = Number((event.currentTarget as HTMLInputElement).value);
    query<HTMLElement>("#diameter-output").textContent =
      filters.minDiameter === 0 ? "Any" : `≥ ${filters.minDiameter.toFixed(1)} km`;
    applyFilters();
  });
  query<HTMLInputElement>("#moid-filter").addEventListener("input", (event) => {
    filters.maxMoid = Number((event.currentTarget as HTMLInputElement).value);
    query<HTMLElement>("#moid-output").textContent =
      filters.maxMoid >= 0.3 ? "Any" : `≤ ${filters.maxMoid.toFixed(3)} au`;
    applyFilters();
  });
  document.querySelectorAll<HTMLButtonElement>("#approach-filter button").forEach((button) => {
    button.addEventListener("click", () => {
      filters.approachWindowDays = Number(button.dataset.days);
      document
        .querySelectorAll("#approach-filter button")
        .forEach((item) => item.classList.toggle("active", item === button));
      applyFilters();
    });
  });
  query("#clear-filters").addEventListener("click", clearFilters);
  query("#all-preset").addEventListener("click", clearFilters);
  query("#hazard-preset").addEventListener("click", () => {
    clearFilters();
    filters.hazardousOnly = true;
    query<HTMLInputElement>("#hazard-filter").checked = true;
    applyFilters();
  });
  query("#risk-preset").addEventListener("click", () => {
    clearFilters();
    filters.sentryOnly = true;
    query<HTMLInputElement>("#sentry-filter").checked = true;
    applyFilters();
  });

  query("#reset-view").addEventListener("click", () => {
    tracking = false;
    scene?.setTracking(false);
    scene?.resetCamera();
    cameraState = scene?.getCameraState() ?? null;
    renderDetail();
    syncUrl();
  });
  query("#share-view").addEventListener("click", async () => {
    syncUrl();
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("View link copied");
    } catch {
      showToast("Link is ready in the address bar");
    }
  });
  query("#mobile-filter").addEventListener("click", () => {
    explorerPanel.classList.add("mobile-open");
  });
  query("#panel-close").addEventListener("click", () => {
    explorerPanel.classList.remove("mobile-open");
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.code === "Space" &&
      !(event.target instanceof HTMLInputElement) &&
      !(event.target instanceof HTMLSelectElement)
    ) {
      event.preventDefault();
      playing = !playing;
      updateTimeUi();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "[") {
      julianDate -= 1;
      scene?.setJulianDate(julianDate, true);
      updateTimeUi();
    }
    if (event.key === "]") {
      julianDate += 1;
      scene?.setJulianDate(julianDate, true);
      updateTimeUi();
    }
  });
}

let previousFrame = performance.now();
let lastSceneUpdate = 0;
function animateTime(now: number): void {
  const deltaSeconds = Math.min(0.1, (now - previousFrame) / 1000);
  previousFrame = now;
  if (playing && scene) {
    julianDate += deltaSeconds * daysPerSecond;
    if (now - lastSceneUpdate > 45) {
      scene.setJulianDate(julianDate);
      updateTimeUi();
      lastSceneUpdate = now;
      if (
        filters.approachWindowDays > 0 &&
        Math.floor(julianDate) !== lastFilterDay
      ) {
        lastFilterDay = Math.floor(julianDate);
        applyFilters();
      }
    }
  }
  requestAnimationFrame(animateTime);
}

async function initialize(): Promise<void> {
  bindUi();
  updateTimeUi();
  try {
    data = await loadData();
    loadingStatus.textContent = "Solving orbital state vectors…";
    buildIndexes(data);
    populateClasses(data);
    query("#hazard-count").textContent = data.asteroids
      .filter((asteroid) => asteroid.pha)
      .length.toLocaleString();
    query("#risk-count").textContent = data.sentry.length.toLocaleString();

    scene = new SpaceScene(stage, data, julianDate, {
      onSelect: (nextSelection) => selectObject(nextSelection),
      onCameraChange: (nextCamera) => {
        cameraState = nextCamera;
        window.clearTimeout(cameraUrlTimer);
        cameraUrlTimer = window.setTimeout(() => syncUrl(), 250);
      },
    });
    scene.setCometsVisible(showComets);
    if (cameraState) scene.setCameraState(cameraState);
    applyFilters();
    restoreSelection(data);
    loadingScreen.classList.add("complete");
    window.setTimeout(() => loadingScreen.remove(), 700);
    requestAnimationFrame(animateTime);
  } catch (error) {
    console.error(error);
    loadingScreen.classList.add("error");
    loadingStatus.textContent =
      error instanceof Error
        ? error.message
        : "The orbital dataset could not be loaded.";
  }
}

void initialize();
