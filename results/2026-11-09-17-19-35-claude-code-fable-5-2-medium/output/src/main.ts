import "./style.css";
import { lowerBound, type App } from "./app.ts";
import { Ephemeris, sameBody, type BodyRef } from "./bodies.ts";
import { loadCatalog } from "./data/catalog.ts";
import { encode } from "./encoding.ts";
import { applyFilters } from "./filters.ts";
import { formatDistance, sig } from "./format.ts";
import { AU_KM, LD_AU, type Vec3 } from "./orbit.ts";
import { pick } from "./picking.ts";
import { Overlay } from "./scene/overlay.ts";
import { GRID_RINGS, Stage, type ScreenPoint } from "./scene/stage.ts";
import { defaultFilters, SPEEDS, Store } from "./state.ts";
import { JD_MAX, JD_MIN, jdFromDate } from "./time.ts";
import { createDetail } from "./ui/detail.ts";
import { h } from "./ui/dom.ts";
import { createSidebar } from "./ui/sidebar.ts";
import { createTimebar } from "./ui/timebar.ts";
import { createViewbar } from "./ui/viewbar.ts";
import { readLink, writeLink, type Link } from "./url.ts";

/** Half-width of the window around the clock in which a recorded close approach gets a marker, in days. */
const FLYBY_WINDOW_DAYS = 1.5;
const MAX_FLYBY_MARKERS = 8;

const byId = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;
const clampJd = (jd: number): number => Math.min(Math.max(jd, JD_MIN), JD_MAX);

/** A round length (1, 2 or 5 times a power of ten) no longer than `max`. */
function niceLength(max: number): number {
  const power = Math.pow(10, Math.floor(Math.log10(max)));
  const lead = max / power;
  return (lead >= 5 ? 5 : lead >= 2 ? 2 : 1) * power;
}

async function boot(): Promise<void> {
  const catalog = await loadCatalog((done, total) => {
    byId("loading-fill").style.width = `${(done / total) * 100}%`;
  });
  const eph = new Ephemeris(catalog);

  const store = new Store({
    jd: clampJd(jdFromDate(new Date())),
    playing: true,
    speedIndex: 1,
    direction: 1,
    selected: null,
    follow: false,
    colorMode: "hazard",
    filters: defaultFilters(),
    layers: { comets: true, orbits: true, labels: true, grid: true, flybys: true },
  });
  const state = store.state;
  const stage = new Stage(byId("stage"), eph);
  const overlay = new Overlay(byId("overlay"));

  const app: App = {
    store,
    catalog,
    eph,
    stage,
    visible: new Uint8Array(catalog.asteroids.count),
    visibleCount: 0,
    encoding: encode(catalog, state.colorMode),
    inspect(ref) {
      store.select(ref);
      if (stage.viewDistance < 0.5) stage.zoomTo(1.5);
    },
    goToApproach(row) {
      store.jumpTo(catalog.approaches.jd[row]);
      store.select({ kind: "asteroid", index: catalog.approaches.ast[row] });
      // Frame the encounter: the asteroid in the middle, Earth a comfortable distance off.
      stage.zoomTo(Math.min(Math.max(catalog.approaches.dist[row] * 6, 0.004), 0.5));
    },
  };

  // These listeners are registered before the panels are built, so the panels always see fresh results.
  const selectedAsteroid = (): number => (state.selected?.kind === "asteroid" ? state.selected.index : -1);
  const refilter = (): void => {
    app.visibleCount = applyFilters(catalog, state.filters, app.visible);
    stage.asteroids.setVisible(app.visible, selectedAsteroid());
  };
  const recolor = (): void => {
    app.encoding = encode(catalog, state.colorMode);
    stage.asteroids.setEncoding(app.encoding);
  };
  store.on("filters", refilter);
  store.on("colorMode", recolor);
  store.on("layers", () => stage.setLayers(state.layers));
  store.on("selection", () => {
    stage.showOrbit(state.selected);
    stage.asteroids.setVisible(app.visible, selectedAsteroid());
    if (state.selected) stage.flyToSelection();
  });
  // A date jump moves the selected body; keep it in the middle of the view.
  store.on("time", () => {
    if (state.selected) stage.flyToSelection();
  });
  refilter();
  recolor();
  stage.setLayers(state.layers);

  const currentLink = (): string => writeLink(state, stage.pose, eph);
  const sidebar = createSidebar(app);
  const detail = createDetail(app);
  const timebar = createTimebar(store);
  const viewbar = createViewbar(
    app,
    () => {
      sidebar.el.hidden = !sidebar.el.hidden;
      document.body.classList.toggle("no-sidebar", sidebar.el.hidden);
    },
    () => `${location.href.split("#")[0]}#${currentLink()}`,
  );
  const scaleLine = h("div", { class: "scale-line" });
  const scaleText = h("div", { class: "scale-text" });
  const hint = h("div", { class: "hint" }, "Drag to orbit, scroll to zoom, right-drag to pan, click a body to inspect it.");
  byId("ui").append(h("div", { class: "left" }, viewbar, sidebar.el), detail.el, timebar.el, h("div", { class: "scale" }, scaleText, scaleLine), hint);
  if (window.innerWidth < 900) {
    sidebar.el.hidden = true;
    document.body.classList.add("no-sidebar");
  }
  store.on("selection", () => document.body.classList.toggle("has-detail", state.selected !== null));

  function applyLink(link: Link): void {
    if (link.colorMode && link.colorMode !== state.colorMode) {
      state.colorMode = link.colorMode;
      store.emit("colorMode");
    }
    if (link.jd !== undefined) store.jumpTo(link.jd);
    if (link.selected || state.selected) store.select(link.selected ?? null, link.follow);
    if (link.pose) stage.pose = link.pose;
  }
  if (location.hash.length > 1) applyLink(readLink(location.hash, eph));
  window.addEventListener("hashchange", () => applyLink(readLink(location.hash, eph)));

  // ---------- Pointer: hover and click-to-select ----------
  const pointer = { x: 0, y: 0, inside: false, dirty: false, downX: 0, downY: 0 };
  let hovered: BodyRef | null = null;
  const canvas = stage.canvas;
  const pickAt = (x: number, y: number): BodyRef | null =>
    pick(stage, eph, state.jd, x, y, app.visible, state.layers.comets);

  canvas.addEventListener("pointermove", (event) => {
    pointer.x = event.offsetX;
    pointer.y = event.offsetY;
    pointer.inside = event.buttons === 0;
    pointer.dirty = true;
  });
  canvas.addEventListener("pointerleave", () => {
    pointer.inside = false;
    pointer.dirty = true;
  });
  canvas.addEventListener("pointerdown", (event) => {
    pointer.downX = event.offsetX;
    pointer.downY = event.offsetY;
    hint.hidden = true;
  });
  canvas.addEventListener("pointerup", (event) => {
    if (event.button !== 0) return;
    if (Math.hypot(event.offsetX - pointer.downX, event.offsetY - pointer.downY) > 4) return;
    const ref = pickAt(event.offsetX, event.offsetY);
    if (!sameBody(ref, state.selected)) store.select(ref);
  });
  canvas.addEventListener("wheel", () => (hint.hidden = true), { passive: true });

  // ---------- Overlay ----------
  const screen: ScreenPoint = { x: 0, y: 0, visible: false };
  const sunScreen: ScreenPoint = { x: 0, y: 0, visible: false };
  const scratch: Vec3 = [0, 0, 0];
  const { approaches, asteroids, planets } = catalog;

  function drawOverlay(): void {
    const jd = state.jd;
    overlay.begin();
    stage.toScreen([0, 0, 0], sunScreen);

    if (state.layers.labels) {
      planets.forEach((planet, index) => {
        stage.toScreen(stage.planetPositions[index], screen);
        if (!screen.visible) return;
        // Zoomed far out, the inner planets pile up on the Sun; drop their labels rather than stack them.
        const crowded = Math.hypot(screen.x - sunScreen.x, screen.y - sunScreen.y) < 22;
        const isSelected = state.selected?.kind === "planet" && state.selected.index === index;
        if (!crowded || isSelected) overlay.put(`planet-${index}`, "label planet", planet.name, screen.x, screen.y);
      });
    }
    if (state.layers.grid) {
      for (const radius of GRID_RINGS) {
        stage.toScreen([radius * 0.819, -radius * 0.574, 0], screen);
        if (screen.visible) overlay.put(`ring-${radius}`, "label ring", `${radius} au`, screen.x, screen.y);
      }
    }

    if (state.layers.flybys && !(state.playing && SPEEDS[state.speedIndex].daysPerSecond > 7)) {
      const from = lowerBound(approaches.jd, jd - FLYBY_WINDOW_DAYS);
      const to = lowerBound(approaches.jd, jd + FLYBY_WINDOW_DAYS);
      const rows: number[] = [];
      for (let k = from; k < to; k++) if (app.visible[approaches.ast[k]]) rows.push(k);
      rows.sort((x, y) => approaches.dist[x] - approaches.dist[y]);
      // Zoomed out, every flyby sits on top of Earth. Markers that would overlap share one label.
      const groups: Array<{ x: number; y: number; index: number; text: string; extra: number }> = [];
      for (const k of rows) {
        const index = approaches.ast[k];
        if (selectedAsteroid() === index) continue;
        stage.toScreen(eph.asteroidPosition(index, jd, scratch), screen);
        if (!screen.visible) continue;
        const { x, y } = screen;
        const group = groups.find((g) => Math.abs(g.x - x) < 150 && Math.abs(g.y - y) < 16);
        if (group) group.extra++;
        else if (groups.length < MAX_FLYBY_MARKERS) {
          const text = `${eph.shortName({ kind: "asteroid", index })} · ${formatDistance(approaches.dist[k])}`;
          groups.push({ x, y, index, text, extra: 0 });
        }
      }
      for (const g of groups) {
        overlay.put(`flyby-${g.index}-ring`, "marker flyby", "", g.x, g.y);
        overlay.put(`flyby-${g.index}`, "label flyby", g.extra ? `${g.text} +${g.extra} more` : g.text, g.x, g.y);
      }
    }

    const selected = state.selected;
    if (selected) {
      stage.toScreen(eph.position(selected, jd, scratch), screen);
      const disc = selected.kind === "sun" || selected.kind === "planet" ? stage.discRadiusPx(selected) : 0;
      if (screen.visible && disc < 40) {
        overlay.put("selected-ring", "marker selected", "", screen.x, screen.y);
        if (selected.kind !== "planet" || !state.layers.labels) {
          overlay.put("selected", "label selected", eph.shortName(selected), screen.x, screen.y);
        }
      }
    }
    if (hovered && !sameBody(hovered, selected)) {
      const text =
        hovered.kind === "asteroid" && asteroids.pha[hovered.index]
          ? `${eph.shortName(hovered)} · potentially hazardous`
          : eph.shortName(hovered);
      overlay.put("hover", "label hover", text, pointer.x, pointer.y);
    }
    overlay.end();
  }

  let scaleShown = "";
  function drawScale(): void {
    const auPerPixel = stage.auPerPixel;
    const maxAu = auPerPixel * 130;
    let length: number;
    let text: string;
    if (maxAu >= 0.02) {
      length = niceLength(maxAu);
      text = `${sig(length)} au`;
    } else {
      const km = niceLength(maxAu * AU_KM);
      length = km / AU_KM;
      text = `${km.toLocaleString("en-US")} km${length > LD_AU / 4 ? ` · ${sig(length / LD_AU, 2)} LD` : ""}`;
    }
    const key = `${text}|${(length / auPerPixel).toFixed(0)}`;
    if (key === scaleShown) return;
    scaleShown = key;
    scaleText.textContent = text;
    scaleLine.style.width = `${length / auPerPixel}px`;
  }

  // ---------- Frame loop ----------
  let last = performance.now();
  let lastSlow = 0;
  let lastLink = 0;
  let frames = 0;
  let lastHash = "";

  function frame(now: number): void {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    frames++;

    if (state.playing) {
      const next = state.jd + state.direction * SPEEDS[state.speedIndex].daysPerSecond * dt;
      state.jd = clampJd(next);
      if (state.jd !== next) {
        state.playing = false;
        store.emit("transport");
      }
    }

    stage.render(state.jd, dt, state.selected, state.follow);

    if (pointer.dirty || (state.playing && pointer.inside && frames % 6 === 0)) {
      pointer.dirty = false;
      hovered = pointer.inside ? pickAt(pointer.x, pointer.y) : null;
      canvas.style.cursor = hovered ? "pointer" : "";
    }
    drawOverlay();
    timebar.tick(state.jd);

    if (now - lastSlow > 250) {
      lastSlow = now;
      sidebar.tick(state.jd);
      detail.tick(state.jd);
      drawScale();
    }
    // Browsers rate-limit history updates (Safari allows about 100 per 30 s), so write the link once a second.
    if (now - lastLink > 1000) {
      lastLink = now;
      const hash = currentLink();
      if (hash !== lastHash) {
        lastHash = hash;
        try {
          history.replaceState(null, "", `#${hash}`);
        } catch {
          // Some embedders forbid history changes; the Copy link button still works.
        }
      }
    }
    requestAnimationFrame(frame);
  }

  byId("loading").remove();
  requestAnimationFrame(frame);
}

boot().catch((error: unknown) => {
  console.error(error);
  byId("loading-text").textContent = `Could not start: ${error instanceof Error ? error.message : String(error)}`;
});
