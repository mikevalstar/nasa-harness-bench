// App wiring: state, the frame loop and the DOM controls around the 3D view.
import { bodyName, loadCatalog, type BodyRef, type Catalog } from "./data.ts";
import {
  CLASS_GROUPS,
  COLOR_MODES,
  defaultFilters,
  encodeAsteroids,
  legendFor,
  type ClassGroup,
  type ColorMode,
  type Filters,
} from "./encoding.ts";
import { AU_PER_LD, escapeHtml, fmtDiameter } from "./format.ts";
import { formatJd, jdFromMs, KM_PER_AU, OrbitKind } from "./orbit.ts";
import { detailHtml, liveHtml, parseSelToken, staticHighlightsHtml, upcomingHtml } from "./panels.ts";
import { sameRef, SceneView } from "./scene.ts";
import { readLink, writeLink } from "./url.ts";

const JD_MIN = 2415020.5; // 1900-01-01
const JD_MAX = 2488069.5; // 2200-01-01
const EARTH: BodyRef = { kind: "planet", idx: 2 };
const MAX_FILTERED_ORBITS = 1500;

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const clampJd = (jd: number) => Math.min(JD_MAX, Math.max(JD_MIN, jd));

type State = {
  jd: number;
  playing: boolean;
  /** Simulated days per real second; negative runs backwards. */
  rate: number;
  filters: Filters;
  colorMode: ColorMode;
  comets: "off" | "periodic" | "all";
  showOrbits: boolean;
  selected: BodyRef | null;
};

async function main() {
  const loadingText = $("#loading span");
  const cat = await loadCatalog((msg) => (loadingText.textContent = msg));
  const link = readLink(cat);

  const state: State = {
    jd: clampJd(link.jd ?? jdFromMs(Date.now())),
    playing: link.playing ?? true,
    rate: link.rate ?? 7,
    filters: { ...defaultFilters(), hazard: link.hazard ?? "all" },
    colorMode: link.colorMode ?? "hazard",
    comets: "off",
    showOrbits: false,
    selected: null,
  };

  const view = new SceneView($("#view"), cat, (ref) => select(ref));
  let lastEncodedJd = state.jd;

  // ---------------------------------------------------------------- encoding

  function applyEncoding() {
    const visible = encodeAsteroids(cat, state.filters, state.colorMode, state.jd, view.asteroids.colors, view.asteroids.sizes);
    for (let j = 0; j < cat.comets.count; j++) {
      const show = state.comets === "all" || (state.comets === "periodic" && cat.cometOrbits.kind[j] === OrbitKind.Elliptic);
      view.comets.sizes[j] = show ? 2.6 : 0;
    }
    view.encodingChanged();
    view.showFilteredOrbits(state.showOrbits ? MAX_FILTERED_ORBITS : 0);
    lastEncodedJd = state.jd;
    $("#stats").textContent = `${cat.asteroids.count.toLocaleString()} near-Earth asteroids · ${visible.toLocaleString()} shown`;
    renderControls();
  }

  // ---------------------------------------------------------------- selection

  function select(ref: BodyRef | null) {
    state.selected = ref;
    view.setSelected(ref);
    view.setDynamicLabel("selected", ref, ref ? bodyName(cat, ref) : "");
    renderDetail();
    renderTicks();
  }

  function renderDetail() {
    const panel = $("#detail");
    const ref = state.selected;
    document.body.classList.toggle("has-detail", ref !== null);
    panel.hidden = ref === null;
    if (!ref) return;
    panel.innerHTML = detailHtml(cat, ref, state.jd, sameRef(view.following, ref));
    panel.scrollTop = 0;
    panel.classList.add("detail");
    renderLive();
  }

  function renderLive() {
    const el = document.getElementById("live");
    if (el && state.selected) el.innerHTML = liveHtml(cat, state.selected, state.jd);
  }

  /** Jump to a moment and frame Earth together with `ref` (used for close approaches). */
  function showApproach(ref: BodyRef, jd: number) {
    setTime(jd);
    select(ref);
    const d = view.positionOf(ref, jd).distanceTo(view.positionOf(EARTH, jd));
    state.playing = false;
    view.focus(EARTH, true, Math.min(1, Math.max(0.004, d * 3)));
    renderControls();
  }

  // ---------------------------------------------------------------- time

  function setTime(jd: number) {
    state.jd = clampJd(jd);
    view.setTime(state.jd);
  }

  const rateSelect = $<HTMLSelectElement>("#rate");
  const scrub = $<HTMLInputElement>("#scrub");
  const dateLabel = $("#date");
  const dateInput = $<HTMLInputElement>("#date-input");

  $("#play").addEventListener("click", () => {
    state.playing = !state.playing;
    renderControls();
  });
  $("#reverse").addEventListener("click", () => {
    state.rate = -state.rate;
    renderControls();
  });
  rateSelect.addEventListener("change", () => {
    state.rate = Math.sign(state.rate || 1) * Number(rateSelect.value);
    renderControls();
  });
  scrub.addEventListener("input", () => setTime(JD_MIN + Number(scrub.value) * (JD_MAX - JD_MIN)));
  dateInput.addEventListener("change", () => {
    const ms = Date.parse(`${dateInput.value}T00:00:00Z`);
    if (Number.isFinite(ms)) setTime(jdFromMs(ms));
  });
  $("#today").addEventListener("click", () => setTime(jdFromMs(Date.now())));

  function stepRate(dir: 1 | -1) {
    const i = Math.min(rateSelect.options.length - 1, Math.max(0, rateSelect.selectedIndex + dir));
    rateSelect.selectedIndex = i;
    rateSelect.dispatchEvent(new Event("change"));
  }

  function renderTicks() {
    const ticks = $("#ticks");
    const ref = state.selected;
    const rows = ref?.kind === "asteroid" ? (cat.approachesByIdx.get(ref.idx) ?? []) : [];
    ticks.innerHTML = rows
      .map((r) => {
        const jd = cat.approaches.jd[r]!;
        return `<i style="left:${((jd - JD_MIN) / (JD_MAX - JD_MIN)) * 100}%" title="Close approach ${formatJd(jd, false)}"></i>`;
      })
      .join("");
  }

  // ---------------------------------------------------------------- filter controls

  const colorSeg = $("#color-mode");
  colorSeg.innerHTML = Object.entries(COLOR_MODES)
    .map(([k, label]) => `<button data-v="${k}">${label}</button>`)
    .join("");
  colorSeg.addEventListener("click", (ev) => {
    const v = (ev.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (v && v in COLOR_MODES) {
      state.colorMode = v as ColorMode;
      applyEncoding();
    }
  });

  const segment = <K extends "hazard" | "approach">(id: string, key: K, values: readonly Filters[K][]) =>
    $(id).addEventListener("click", (ev) => {
      const v = (ev.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
      const match = values.find((x) => x === v);
      if (match === undefined) return;
      state.filters[key] = match;
      applyEncoding();
    });
  segment("#hazard", "hazard", ["all", "pha", "sentry"]);
  segment("#approach", "approach", ["any", "recorded", "window"]);

  const classes = $("#classes");
  classes.innerHTML = (Object.keys(CLASS_GROUPS) as ClassGroup[])
    .map((k) => `<span class="chip" data-v="${k}"><i class="dot" style="background:${CLASS_GROUPS[k].color}"></i>${CLASS_GROUPS[k].label}</span>`)
    .join("");
  classes.addEventListener("click", (ev) => {
    const v = (ev.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (v && v in CLASS_GROUPS) {
      const k = v as ClassGroup;
      state.filters.classes[k] = !state.filters.classes[k];
      applyEncoding();
    }
  });

  const minSize = $<HTMLInputElement>("#min-size");
  const maxMoid = $<HTMLInputElement>("#max-moid");
  minSize.addEventListener("input", () => {
    const k = Number(minSize.value);
    state.filters.minDiameterM = k === 0 ? 0 : 10 ** (k / 10);
    applyEncoding();
  });
  maxMoid.addEventListener("input", () => {
    const k = Number(maxMoid.value);
    state.filters.maxMoid = k >= 50 ? null : k / 100;
    applyEncoding();
  });
  $<HTMLSelectElement>("#window-days").addEventListener("change", (ev) => {
    state.filters.windowDays = Number((ev.target as HTMLSelectElement).value);
    applyEncoding();
  });

  const cometBox = $<HTMLInputElement>("#show-comets");
  const cometScope = $<HTMLSelectElement>("#comet-scope");
  const updateComets = () => {
    state.comets = !cometBox.checked ? "off" : cometScope.value === "all" ? "all" : "periodic";
    applyEncoding();
  };
  cometBox.addEventListener("change", updateComets);
  cometScope.addEventListener("change", () => {
    cometBox.checked = true;
    updateComets();
  });
  $<HTMLInputElement>("#show-orbits").addEventListener("change", (ev) => {
    state.showOrbits = (ev.target as HTMLInputElement).checked;
    view.showFilteredOrbits(state.showOrbits ? MAX_FILTERED_ORBITS : 0);
  });
  const layerBoxes = ["#show-planet-orbits", "#show-grid", "#show-labels"].map((id) => $<HTMLInputElement>(id));
  const updateLayers = () => {
    const [planetOrbits, grid, labels] = layerBoxes.map((b) => b.checked) as [boolean, boolean, boolean];
    view.setLayers({ planetOrbits, grid, labels });
  };
  layerBoxes.forEach((b) => b.addEventListener("change", updateLayers));

  $("#reset-filters").addEventListener("click", () => {
    state.filters = defaultFilters();
    minSize.value = "0";
    maxMoid.value = "50";
    applyEncoding();
  });

  function renderControls() {
    const mark = (container: string, value: string) =>
      $(container).querySelectorAll<HTMLElement>("[data-v]").forEach((b) => b.classList.toggle("active", b.dataset.v === value));
    mark("#color-mode", state.colorMode);
    mark("#hazard", state.filters.hazard);
    mark("#approach", state.filters.approach);
    $("#window-row").hidden = state.filters.approach !== "window";
    classes.querySelectorAll<HTMLElement>("[data-v]").forEach((c) => c.classList.toggle("off", !state.filters.classes[c.dataset.v as ClassGroup]));

    const f = state.filters;
    $("#min-size-out").textContent = f.minDiameterM === 0 ? "any" : fmtDiameter(f.minDiameterM / 1000);
    $("#max-moid-out").textContent = f.maxMoid === null ? "any" : `${f.maxMoid.toFixed(2)} au (${(f.maxMoid / AU_PER_LD).toFixed(0)} LD)`;

    const legend = legendFor(state.colorMode);
    $("#legend").innerHTML =
      legend.type === "swatches"
        ? legend.items.map((it) => `<div class="item"><i class="dot" style="background:${it.color}"></i>${it.label}</div>`).join("")
        : `<div class="ramp" style="background:linear-gradient(90deg, ${legend.stops.map(([at, c]) => `${c} ${at * 100}%`).join(", ")})"></div>
           <div class="ends"><span>${legend.left}</span><span>${legend.right}</span></div>
           ${legend.note ? `<div class="muted">${legend.note}</div>` : ""}`;

    const play = $("#play");
    play.textContent = state.playing ? "❚❚" : "▶";
    $("#reverse").classList.toggle("on", state.rate < 0);
    const abs = Math.abs(state.rate);
    const option = [...rateSelect.options].find((o) => Math.abs(Number(o.value) - abs) < 1e-6);
    if (option) rateSelect.value = option.value;
    $("#rate-label").textContent = state.playing ? (state.rate < 0 ? "◀ rewinding" : "playing") : "paused";
  }

  // ---------------------------------------------------------------- highlights & tabs

  $("#highlights").innerHTML = `<div id="upcoming"></div>${staticHighlightsHtml(cat)}`;
  let upcomingJd = NaN;
  function renderUpcoming() {
    if (Math.abs(state.jd - upcomingJd) < 0.25) return;
    upcomingJd = state.jd;
    $("#upcoming").innerHTML = upcomingHtml(cat, state.jd);
  }

  document.querySelectorAll<HTMLButtonElement>(".tabs button").forEach((tab) =>
    tab.addEventListener("click", () => {
      document.querySelectorAll<HTMLButtonElement>(".tabs button").forEach((t) => t.classList.toggle("active", t === tab));
      document.querySelectorAll<HTMLElement>("[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== tab.dataset.tab));
    }),
  );

  // Rows with data-sel select a body; with data-jd they also jump to that moment.
  function onRowClick(ev: MouseEvent) {
    const row = (ev.target as HTMLElement).closest<HTMLElement>("[data-sel], [data-jd]");
    if (!row) return;
    const ref = row.dataset.sel ? parseSelToken(row.dataset.sel) : state.selected;
    if (!ref) return;
    if (row.dataset.jd) showApproach(ref, Number(row.dataset.jd));
    else {
      select(ref);
      view.focus(ref, true);
      renderFollowButton();
    }
  }
  $("#highlights").addEventListener("click", onRowClick);

  $("#detail").addEventListener("click", (ev) => {
    const action = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]")?.dataset.action;
    const ref = state.selected;
    if (!action) return onRowClick(ev);
    if (!ref) return;
    if (action === "close") select(null);
    else if (action === "follow") toggleFollow();
    else if (action === "center") {
      view.focus(ref, false);
      renderFollowButton();
    }
    else if (action === "earth") {
      const d = view.positionOf(ref).distanceTo(view.positionOf(EARTH));
      view.focus(EARTH, true, Math.min(20, Math.max(0.004, d * 2.5)));
      renderFollowButton();
    }
  });

  function toggleFollow() {
    const ref = state.selected;
    if (!ref) return;
    if (sameRef(view.following, ref)) view.stopFollow();
    else view.focus(ref, true);
    renderFollowButton();
  }

  function renderFollowButton() {
    const btn = document.querySelector<HTMLElement>('#detail [data-action="follow"]');
    if (!btn) return;
    const on = sameRef(view.following, state.selected);
    btn.classList.toggle("on", on);
    btn.textContent = on ? "Following" : "Follow";
  }

  // ---------------------------------------------------------------- search

  const searchInput = $<HTMLInputElement>("#search");
  const results = $<HTMLUListElement>("#search-results");
  const index: { ref: BodyRef; name: string; key: string; kind: string }[] = [
    ...cat.planets.map((p, idx) => ({ ref: { kind: "planet", idx } as BodyRef, name: p.name, kind: "planet" })),
    ...cat.asteroids.name.map((name, idx) => ({ ref: { kind: "asteroid", idx } as BodyRef, name, kind: cat.asteroids.cls[idx]! })),
    ...cat.comets.name.map((name, idx) => ({ ref: { kind: "comet", idx } as BodyRef, name, kind: "comet" })),
  ].map((e) => ({ ...e, key: e.name.toLowerCase() }));
  let hits: typeof index = [];
  let active = 0;

  function runSearch() {
    const q = searchInput.value.trim().toLowerCase();
    if (q.length < 2) {
      results.hidden = true;
      return;
    }
    const starts: typeof index = [];
    const contains: typeof index = [];
    for (const e of index) {
      // Names look like "433 Eros (A898 PA)" or "(2024 YR4)": match at word starts first.
      if (e.key.startsWith(q) || e.key.includes(` ${q}`) || e.key.includes(`(${q}`)) starts.push(e);
      else if (e.key.includes(q)) contains.push(e);
      if (starts.length >= 40) break;
    }
    hits = [...starts, ...contains].slice(0, 40);
    active = 0;
    results.hidden = false;
    results.innerHTML = hits.length
      ? hits.map((h, k) => `<li data-k="${k}" class="${k === 0 ? "active" : ""}"><span>${escapeHtml(h.name)}</span><span class="kind">${h.kind}</span></li>`).join("")
      : `<li class="muted">No matches</li>`;
  }

  function choose(k: number) {
    const hit = hits[k];
    if (!hit) return;
    results.hidden = true;
    searchInput.value = "";
    searchInput.blur();
    if (hit.ref.kind === "comet" && state.comets === "off") {
      cometBox.checked = true;
      cometScope.value = "all";
      updateComets();
    }
    select(hit.ref);
    view.focus(hit.ref, true);
    renderFollowButton();
  }

  searchInput.addEventListener("input", runSearch);
  searchInput.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      active = Math.max(0, Math.min(hits.length - 1, active + (ev.key === "ArrowDown" ? 1 : -1)));
      results.querySelectorAll("li").forEach((li, k) => li.classList.toggle("active", k === active));
      results.querySelector(".active")?.scrollIntoView({ block: "nearest" });
    } else if (ev.key === "Enter") choose(active);
    else if (ev.key === "Escape") {
      results.hidden = true;
      searchInput.blur();
    }
  });
  results.addEventListener("mousedown", (ev) => {
    const li = (ev.target as HTMLElement).closest<HTMLElement>("[data-k]");
    if (li) choose(Number(li.dataset.k));
  });
  searchInput.addEventListener("blur", () => setTimeout(() => (results.hidden = true), 150));

  // ---------------------------------------------------------------- pointer & keys

  const canvas = view.renderer.domElement;
  const tooltip = $("#tooltip");
  let mouse: { x: number; y: number } | null = null;
  let mouseDirty = false;
  let down: { x: number; y: number } | null = null;

  canvas.addEventListener("pointermove", (ev) => {
    mouse = { x: ev.clientX, y: ev.clientY };
    mouseDirty = true;
  });
  canvas.addEventListener("pointerleave", () => {
    mouse = null;
    mouseDirty = true;
  });
  canvas.addEventListener("pointerdown", (ev) => (down = { x: ev.clientX, y: ev.clientY }));
  canvas.addEventListener("pointerup", (ev) => {
    if (!down || Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 5) return;
    const ref = view.pick(ev.clientX, ev.clientY);
    if (ref) select(ref);
  });
  canvas.addEventListener("dblclick", (ev) => {
    const ref = view.pick(ev.clientX, ev.clientY);
    if (!ref) return;
    select(ref);
    view.focus(ref, true);
    renderFollowButton();
  });
  view.controls.addEventListener("start", () => (tooltip.hidden = true));

  function updateHover() {
    if (!mouseDirty) return;
    mouseDirty = false;
    const ref = mouse && !down ? view.pick(mouse.x, mouse.y) : null;
    view.setHovered(ref);
    view.setDynamicLabel("hovered", ref && !sameRef(ref, state.selected) ? ref : null, ref ? bodyName(cat, ref) : "");
    canvas.style.cursor = ref ? "pointer" : "";
    if (!ref || !mouse) {
      tooltip.hidden = true;
      return;
    }
    tooltip.hidden = false;
    tooltip.innerHTML = tooltipHtml(cat, ref);
    tooltip.style.left = `${mouse.x + 14}px`;
    tooltip.style.top = `${mouse.y + 14}px`;
  }
  window.addEventListener("pointerup", () => {
    down = null;
    mouseDirty = true;
  });

  window.addEventListener("keydown", (ev) => {
    const typing = ev.target instanceof HTMLInputElement || ev.target instanceof HTMLSelectElement;
    if (typing && ev.key !== "Escape") return;
    if (ev.key === " ") {
      ev.preventDefault();
      state.playing = !state.playing;
      renderControls();
    } else if (ev.key === "[") stepRate(-1);
    else if (ev.key === "]") stepRate(1);
    else if (ev.key === "f" || ev.key === "F") toggleFollow();
    else if (ev.key === "/") {
      ev.preventDefault();
      searchInput.focus();
    } else if (ev.key === "Escape") {
      if (!$("#help").hidden) $("#help").hidden = true;
      else select(null);
    }
  });

  // ---------------------------------------------------------------- help & links

  $("#help-btn").addEventListener("click", () => ($("#help").hidden = false));
  $("#help-close").addEventListener("click", () => ($("#help").hidden = true));
  $("#help").addEventListener("click", (ev) => {
    if (ev.target === ev.currentTarget) $("#help").hidden = true;
  });

  function saveLink() {
    writeLink(cat, {
      jd: state.jd,
      selected: state.selected,
      follow: view.following !== null,
      camera: view.getCameraState(),
      colorMode: state.colorMode,
      hazard: state.filters.hazard,
      rate: state.rate,
      playing: state.playing,
    });
  }
  $("#copy-link").addEventListener("click", async () => {
    saveLink();
    const btn = $("#copy-link");
    try {
      await navigator.clipboard.writeText(location.href);
      btn.textContent = "Copied ✓";
    } catch {
      window.prompt("Copy this link:", location.href);
    }
    setTimeout(() => (btn.textContent = "Copy link"), 1500);
  });

  // ---------------------------------------------------------------- scale bar

  const scaleBar = $("#scalebar .bar");
  const scaleText = $("#scalebar span");
  function renderScale() {
    const auPerPx = view.auPerPixel();
    const target = auPerPx * 110;
    // Pick a round length in au, or in km once the view is smaller than ~0.01 au.
    const useKm = target < 0.02;
    const unit = useKm ? KM_PER_AU : 1;
    const raw = target * unit;
    const pow = 10 ** Math.floor(Math.log10(raw));
    const nice = [1, 2, 5, 10].map((m) => m * pow).filter((v) => v <= raw).pop() ?? pow;
    scaleBar.style.width = `${nice / unit / auPerPx}px`;
    const ld = nice / unit / AU_PER_LD;
    scaleText.textContent = useKm
      ? `${nice >= 1e6 ? `${nice / 1e6}M` : nice.toLocaleString()} km${ld >= 0.5 ? ` · ${ld.toFixed(1)} LD` : ""}`
      : `${nice} au`;
  }

  // ---------------------------------------------------------------- initial view

  if (link.camera) view.setCameraState(link.camera);
  setTime(state.jd);
  applyEncoding();
  if (link.selected) {
    select(link.selected);
    if (link.follow) view.focus(link.selected, true, link.camera?.dist);
    renderFollowButton();
  }
  renderControls();
  $("#loading").remove();

  // ---------------------------------------------------------------- frame loop

  let last = performance.now();
  let lastSlow = 0;
  function frame(now: number) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    if (state.playing) {
      const next = state.jd + state.rate * dt;
      if (next <= JD_MIN || next >= JD_MAX) {
        state.playing = false;
        renderControls();
      }
      setTime(next);
    }
    if (state.filters.approach === "window" && Math.abs(state.jd - lastEncodedJd) > 0.5) applyEncoding();

    updateHover();
    view.render();

    dateLabel.textContent = `${formatJd(state.jd)} UTC`;
    if (document.activeElement !== scrub) scrub.value = String((state.jd - JD_MIN) / (JD_MAX - JD_MIN));
    renderScale();

    if (now - lastSlow > 300) {
      lastSlow = now;
      renderLive();
      renderUpcoming();
      if (document.activeElement !== dateInput) dateInput.value = formatJd(state.jd, false);
      saveLink();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function tooltipHtml(cat: Catalog, ref: BodyRef): string {
  const name = escapeHtml(bodyName(cat, ref));
  if (ref.kind === "planet") return `<b>${name}</b>`;
  if (ref.kind === "comet") return `<b>${name}</b><br><span class="muted">Comet · q = ${cat.comets.q[ref.idx]} au</span>`;
  const j = ref.idx;
  const A = cat.asteroids;
  const sentry = cat.sentryByIdx.get(j);
  const tags = [A.cls[j], A.pha[j] ? "PHA" : "", sentry ? `Sentry PS ${sentry.ps_cum.toFixed(1)}` : ""].filter(Boolean).join(" · ");
  return `<b>${name}</b><br><span class="muted">${tags} · ~${fmtDiameter(cat.diameterKm[j]!)}</span>`;
}

main().catch((err: unknown) => {
  console.error(err);
  const el = document.querySelector("#loading span");
  if (el) el.textContent = `Failed to start: ${err instanceof Error ? err.message : String(err)}`;
});
