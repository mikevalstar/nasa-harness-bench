/** Left panel: object search and filters, upcoming close approaches, and the Sentry risk table. */
import { lowerBound, type App } from "../app.ts";
import { SUN, type BodyRef } from "../bodies.ts";
import { GROUP_INFO, ORBIT_GROUPS } from "../data/catalog.ts";
import { isDefaultFilters } from "../filters.ts";
import { formatDiameter, formatDistance, formatOdds, sig } from "../format.ts";
import { LD_AU } from "../orbit.ts";
import { defaultFilters, type Filters } from "../state.ts";
import { formatDate } from "../time.ts";
import { h, replace, select } from "./dom.ts";

const LIST_LIMIT = 150;
const APPROACH_ROWS = 60;

type Tab = "objects" | "flybys" | "risk";
type Sort = "size" | "moid" | "name";
type RiskSort = "palermo" | "odds" | "size";

export interface Sidebar {
  el: HTMLElement;
  /** Called a few times a second with the clock, to keep the approaches list current. */
  tick(jd: number): void;
}

export function createSidebar(app: App): Sidebar {
  const { store, catalog, eph } = app;
  const { asteroids, comets, planets, approaches, sentry } = catalog;
  const filters = store.state.filters;

  let tab: Tab = "objects";
  let query = "";
  let sort: Sort = "size";
  let approachMaxLd: number | null = null;
  let riskSort: RiskSort = "palermo";
  let shownApproachStart = -1;

  const lowerNames = asteroids.fullName.map((name) => name.toLowerCase());
  const lowerComets = comets.fullName.map((name) => name.toLowerCase());

  const changed = (): void => store.emit("filters");
  const patch = (update: Partial<Filters>): void => {
    Object.assign(filters, update);
    changed();
  };

  // ---------- Objects tab ----------
  const search = h("input", { type: "search", placeholder: "Search asteroids, comets, planets", ariaLabel: "Search objects" });
  search.addEventListener("input", () => {
    query = search.value.trim().toLowerCase();
    renderList();
  });

  const check = (label: string, read: () => boolean, write: (on: boolean) => void, title = ""): HTMLLabelElement => {
    const input = h("input", { type: "checkbox", checked: read() });
    input.addEventListener("change", () => write(input.checked));
    store.on("filters", () => (input.checked = read()));
    return h("label", { class: "check", title }, input, label);
  };

  const yearInput = (key: "approachFromYear" | "approachToYear", placeholder: string): HTMLInputElement => {
    const input = h("input", { type: "number", min: "1900", max: "2199", placeholder, ariaLabel: key === "approachFromYear" ? "Close approach from year" : "Close approach to year" });
    input.addEventListener("change", () => {
      const year = Math.round(Number(input.value));
      patch({ [key]: input.value === "" || !Number.isFinite(year) ? null : Math.min(Math.max(year, 1900), 2199) });
    });
    store.on("filters", () => (input.value = filters[key] === null ? "" : String(filters[key])));
    return input;
  };

  const sizeSelect = select<number>(
    [
      { value: 0, label: "Any size" },
      { value: 10, label: "≥ 10 m" },
      { value: 50, label: "≥ 50 m" },
      { value: 140, label: "≥ 140 m" },
      { value: 300, label: "≥ 300 m" },
      { value: 1000, label: "≥ 1 km" },
    ],
    filters.minDiameterM,
    (value) => patch({ minDiameterM: value }),
    "Minimum diameter",
  );
  const moidSelect = select<number | null>(
    [
      { value: null, label: "Any orbit distance" },
      { value: 0.05, label: "MOID ≤ 0.05 au" },
      { value: 0.01, label: "MOID ≤ 0.01 au" },
      { value: LD_AU, label: "MOID ≤ 1 lunar distance" },
    ],
    filters.maxMoidAu,
    (value) => patch({ maxMoidAu: value }),
    "Maximum orbit distance to Earth",
  );
  const approachDistSelect = select<number | null>(
    [
      { value: null, label: "Passes at any recorded distance (≤ 0.05 au)" },
      { value: 10, label: "Passes within 10 lunar distances" },
      { value: 5, label: "Passes within 5 lunar distances" },
      { value: 1, label: "Passes closer than the Moon" },
    ],
    filters.approachMaxLd,
    (value) => patch({ approachMaxLd: value }),
    "Close approach distance",
  );
  store.on("filters", () => {
    sizeSelect.selectedIndex = [0, 10, 50, 140, 300, 1000].indexOf(filters.minDiameterM);
    moidSelect.selectedIndex = [null, 0.05, 0.01, LD_AU].indexOf(filters.maxMoidAu);
    approachDistSelect.selectedIndex = [null, 10, 5, 1].indexOf(filters.approachMaxLd);
  });

  const reset = h("button", { class: "link", type: "button" }, "Reset");
  reset.addEventListener("click", () => patch(defaultFilters()));

  const filterBox = h(
    "details",
    { class: "filters", open: true },
    h("summary", {}, "Filters", reset),
    h(
      "div",
      { class: "filter-row" },
      check("Potentially hazardous", () => filters.phaOnly, (on) => patch({ phaOnly: on }), "Diameter above roughly 140 m and orbit within 0.05 au of Earth's"),
      check("On Sentry risk list", () => filters.sentryOnly, (on) => patch({ sentryOnly: on }), "Objects with a non-zero computed impact probability"),
    ),
    h(
      "div",
      { class: "filter-row" },
      ...ORBIT_GROUPS.map((g) =>
        check(
          GROUP_INFO[g].label,
          () => filters.groups[g],
          (on) => {
            filters.groups[g] = on;
            changed();
          },
          GROUP_INFO[g].blurb,
        ),
      ),
    ),
    h("div", { class: "filter-row" }, sizeSelect, moidSelect),
    h(
      "div",
      { class: "filter-row approach-filter" },
      h("span", {}, "Passes Earth from"),
      yearInput("approachFromYear", "1900"),
      h("span", {}, "to"),
      yearInput("approachToYear", "2199"),
    ),
    h("div", { class: "filter-row" }, approachDistSelect),
  );

  const countLine = h("div", { class: "count" });
  const sortSelect = select<Sort>(
    [
      { value: "size", label: "Largest first" },
      { value: "moid", label: "Closest orbit first" },
      { value: "name", label: "By designation" },
    ],
    sort,
    (value) => {
      sort = value;
      renderList();
    },
    "Sort order",
  );
  const list = h("div", { class: "list", role: "list" });

  const dotColor = (i: number): string => {
    const c = app.encoding.rgba;
    return `rgb(${c[i * 4]}, ${c[i * 4 + 1]}, ${c[i * 4 + 2]})`;
  };

  const row = (ref: BodyRef, title: string, meta: string, color: string, badges: string[] = [], dim = false): HTMLElement => {
    const el = h(
      "button",
      { class: `row${dim ? " dim" : ""}`, type: "button" },
      h("span", { class: "dot", style: `background:${color}` }),
      h("span", { class: "row-title" }, title),
      ...badges.map((b) => h("span", { class: `badge ${b.toLowerCase()}` }, b)),
      h("span", { class: "row-meta" }, meta),
    );
    el.addEventListener("click", () => app.inspect(ref));
    return el;
  };

  const asteroidRow = (i: number): HTMLElement => {
    const moid = asteroids.moid[i];
    const badges = [asteroids.pha[i] ? "PHA" : "", catalog.sentryRow[i] >= 0 ? "Risk" : ""].filter(Boolean);
    const meta = `${formatDiameter(catalog.diameterKm[i])}${moid === null ? "" : ` · MOID ${formatDistance(moid)}`}`;
    return row({ kind: "asteroid", index: i }, eph.shortName({ kind: "asteroid", index: i }), meta, dotColor(i), badges, !app.visible[i]);
  };

  function renderList(): void {
    const rows: HTMLElement[] = [];
    let total: number;
    if (query) {
      // Search looks at everything, whatever the filters say.
      total = 0;
      if ("sun".includes(query)) rows.push(row(SUN, "Sun", "star", "#ffe9b0"));
      planets.forEach((p, index) => {
        if (p.name.toLowerCase().includes(query)) rows.push(row({ kind: "planet", index }, p.name, "planet", "#b8c4d8"));
      });
      total = rows.length;
      for (let i = 0; i < lowerNames.length; i++) {
        if (!lowerNames[i].includes(query)) continue;
        if (rows.length < LIST_LIMIT) rows.push(asteroidRow(i));
        total++;
      }
      for (let i = 0; i < lowerComets.length; i++) {
        if (!lowerComets[i].includes(query)) continue;
        if (rows.length < LIST_LIMIT) rows.push(row({ kind: "comet", index: i }, comets.fullName[i], "comet", "#7ee8d6"));
        total++;
      }
      countLine.textContent = `${total.toLocaleString("en-US")} matches`;
    } else {
      const indices: number[] = [];
      for (let i = 0; i < app.visible.length; i++) if (app.visible[i]) indices.push(i);
      total = indices.length;
      const size = (i: number): number => (Number.isNaN(catalog.diameterKm[i]) ? -1 : catalog.diameterKm[i]);
      if (sort === "size") indices.sort((x, y) => size(y) - size(x));
      else if (sort === "moid") indices.sort((x, y) => (asteroids.moid[x] ?? Infinity) - (asteroids.moid[y] ?? Infinity));
      for (const i of indices.slice(0, LIST_LIMIT)) rows.push(asteroidRow(i));
      countLine.textContent = `${total.toLocaleString("en-US")} of ${asteroids.count.toLocaleString("en-US")} asteroids shown`;
    }
    if (total > rows.length) {
      rows.push(h("div", { class: "more" }, `Showing the first ${rows.length}. Narrow the ${query ? "search" : "filters"} to see the rest.`));
    }
    if (rows.length === 0) rows.push(h("div", { class: "more" }, "Nothing matches."));
    replace(list, ...rows);
    reset.hidden = isDefaultFilters(filters);
  }

  const objectsPane = h("div", { class: "pane" }, search, filterBox, h("div", { class: "list-head" }, countLine, sortSelect), list);

  // ---------- Flybys tab ----------
  const flybyHead = h("div", { class: "pane-note" });
  const flybyList = h("div", { class: "list", role: "list" });
  const flybyDist = select<number | null>(
    [
      { value: null, label: "Within 0.05 au" },
      { value: 5, label: "Within 5 LD" },
      { value: 1, label: "Closer than the Moon" },
    ],
    approachMaxLd,
    (value) => {
      approachMaxLd = value;
      shownApproachStart = -1;
    },
    "Approach distance",
  );

  function renderFlybys(jd: number): void {
    const start = lowerBound(approaches.jd, jd);
    if (start === shownApproachStart) return;
    shownApproachStart = start;
    const limit = approachMaxLd === null ? Infinity : approachMaxLd * LD_AU;
    const rows: HTMLElement[] = [];
    for (let k = start; k < approaches.count && rows.length < APPROACH_ROWS; k++) {
      const i = approaches.ast[k];
      if (!app.visible[i] || approaches.dist[k] > limit) continue;
      const el = h(
        "button",
        { class: "row", type: "button" },
        h("span", { class: "dot", style: `background:${dotColor(i)}` }),
        h("span", { class: "row-title" }, eph.shortName({ kind: "asteroid", index: i })),
        asteroids.pha[i] ? h("span", { class: "badge pha" }, "PHA") : null,
        h("span", { class: "row-meta" }, `${formatDate(approaches.jd[k])} · ${formatDistance(approaches.dist[k])} · ${sig(approaches.vRel[k])} km/s`),
      );
      el.addEventListener("click", () => app.goToApproach(k));
      rows.push(el);
    }
    if (rows.length === 0) rows.push(h("div", { class: "more" }, "No recorded approaches after this date match."));
    flybyHead.textContent = `Earth close approaches after ${formatDate(jd)}, for asteroids passing the filters. Pick one to jump to that moment.`;
    replace(flybyList, ...rows);
  }

  const flybysPane = h("div", { class: "pane" }, flybyHead, h("div", { class: "list-head" }, flybyDist), flybyList);

  // ---------- Risk tab ----------
  const riskList = h("div", { class: "list", role: "list" });
  const riskSelect = select<RiskSort>(
    [
      { value: "palermo", label: "Highest Palermo scale" },
      { value: "odds", label: "Highest impact probability" },
      { value: "size", label: "Largest first" },
    ],
    riskSort,
    (value) => {
      riskSort = value;
      renderRisk();
    },
    "Sort order",
  );

  function renderRisk(): void {
    const key = { palermo: "psCum", odds: "ip", size: "diameter" } as const;
    const field = key[riskSort];
    const rows = [...sentry].sort((x, y) => y[field] - x[field]);
    replace(
      riskList,
      ...rows.map((r) => {
        const ref: BodyRef = { kind: "asteroid", index: r.ast };
        const el = h(
          "button",
          { class: "row", type: "button" },
          h("span", { class: "dot", style: `background:${dotColor(r.ast)}` }),
          h("span", { class: "row-title" }, eph.shortName(ref)),
          h("span", { class: "row-figure" }, formatOdds(r.ip)),
          h("span", { class: "row-meta" }, `Palermo ${r.psCum.toFixed(2)} · ${formatDiameter(r.diameter)} · ${r.range.replace("-", " to ")}`),
        );
        el.addEventListener("click", () => app.inspect(ref));
        return el;
      }),
    );
  }

  const riskPane = h(
    "div",
    { class: "pane" },
    h(
      "div",
      { class: "pane-note" },
      `${sentry.length.toLocaleString("en-US")} objects have a computed chance of hitting Earth. The figure is the cumulative probability over the listed years. No object here rates above 0 on the Torino scale.`,
    ),
    h("div", { class: "list-head" }, riskSelect),
    riskList,
  );

  // ---------- Shell ----------
  const panes: Record<Tab, HTMLElement> = { objects: objectsPane, flybys: flybysPane, risk: riskPane };
  const labels: Record<Tab, string> = { objects: "Objects", flybys: "Flybys", risk: "Impact risk" };
  const tabButtons = (Object.keys(panes) as Tab[]).map((name) => {
    const button = h("button", { type: "button", role: "tab" }, labels[name]);
    button.addEventListener("click", () => showTab(name));
    return { name, button };
  });
  let riskBuilt = false;

  function showTab(name: Tab): void {
    tab = name;
    for (const t of tabButtons) {
      t.button.ariaSelected = String(t.name === name);
      panes[t.name].hidden = t.name !== name;
    }
    if (name === "risk" && !riskBuilt) {
      riskBuilt = true;
      renderRisk();
    }
    if (name === "flybys") {
      shownApproachStart = -1;
      renderFlybys(store.state.jd);
    }
  }

  const el = h(
    "aside",
    { class: "panel sidebar" },
    h("div", { class: "tabs", role: "tablist" }, ...tabButtons.map((t) => t.button)),
    objectsPane,
    flybysPane,
    riskPane,
  );
  showTab("objects");

  store.on("filters", () => {
    renderList();
    shownApproachStart = -1;
  });
  store.on("colorMode", () => {
    renderList();
    shownApproachStart = -1;
    if (riskBuilt) renderRisk();
  });
  renderList();

  return {
    el,
    tick(jd) {
      if (tab === "flybys" && !el.hidden) renderFlybys(jd);
    },
  };
}
