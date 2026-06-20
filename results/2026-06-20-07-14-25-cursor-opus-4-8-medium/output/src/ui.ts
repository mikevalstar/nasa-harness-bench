import type { ColorMode } from "./asteroids";
import { formatJD, jdToInputDate, inputDateToJD } from "./jd";
import type { AsteroidMeta, SentryEntry, CloseApproach } from "./types";

export interface FilterState {
  search: string;
  pha: boolean;
  sentry: boolean;
  classes: Set<string>;
  maxMoid: number | null;
  minDiameter: number | null;
}

export interface DetailInfo {
  index: number;
  meta: AsteroidMeta;
  sentry: SentryEntry | null;
}

export interface UICallbacks {
  togglePlay(): void;
  setSpeed(daysPerSec: number): void;
  setTimeJD(jd: number): void;
  stepDays(days: number): void;
  resetToNow(): void;
  setColorMode(mode: ColorMode): void;
  setShowOrbits(v: boolean): void;
  setShowComets(v: boolean): void;
  setShowAsteroids(v: boolean): void;
  setSizeScale(v: number): void;
  setDimFiltered(v: boolean): void;
  onFiltersChanged(f: FilterState): void;
  onSelectResult(index: number): void;
  focusSelected(): void;
  toggleFollow(v: boolean): void;
  clearSelection(): void;
  copyLink(): void;
}

const ALL_CLASSES = ["IEO", "ATE", "APO", "AMO"];
const CLASS_LABEL: Record<string, string> = {
  IEO: "Atira (IEO)",
  ATE: "Aten (ATE)",
  APO: "Apollo (APO)",
  AMO: "Amor (AMO)",
};
const CLASS_COLOR: Record<string, string> = {
  IEO: "#9e66f2",
  ATE: "#4cc7ff",
  APO: "#73f2a6",
  AMO: "#ffd159",
};

// Speed presets in days per second of real time.
const SPEEDS = [-3650, -365, -30, -7, -1, 0, 1, 7, 30, 365, 3650];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  html?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

function fmt(v: number | null | undefined, digits = 3, unit = ""): string {
  if (v == null || !isFinite(v)) return "—";
  const s =
    Math.abs(v) >= 1000 ? v.toLocaleString(undefined, { maximumFractionDigits: 0 }) : v.toFixed(digits);
  return unit ? `${s} ${unit}` : s;
}

export class UI {
  private cb: UICallbacks;
  private meta!: AsteroidMeta;

  // elements
  private statTotal!: HTMLElement;
  private statVisible!: HTMLElement;
  private statFps!: HTMLElement;
  private timeDate!: HTMLElement;
  private timeSpeed!: HTMLElement;
  private playBtn!: HTMLElement;
  private scrubber!: HTMLInputElement;
  private dateInput!: HTMLInputElement;
  private speedRange!: HTMLInputElement;
  private results!: HTMLElement;
  private searchInput!: HTMLInputElement;
  private detail!: HTMLElement;
  private tooltip!: HTMLElement;
  private followBtn!: HTMLButtonElement;

  private filter: FilterState = {
    search: "",
    pha: false,
    sentry: false,
    classes: new Set(ALL_CLASSES),
    maxMoid: null,
    minDiameter: null,
  };

  // scrub range in JD
  private scrubMin = 0;
  private scrubMax = 1;
  private following = false;

  constructor(cb: UICallbacks) {
    this.cb = cb;
  }

  init(meta: AsteroidMeta, scrubMinJD: number, scrubMaxJD: number): void {
    this.meta = meta;
    this.scrubMin = scrubMinJD;
    this.scrubMax = scrubMaxJD;
    this.buildLeft();
    this.buildRight();
    this.buildTimebar();
    this.buildDetail();
    this.buildTooltip();
    this.buildHint();
    this.statTotal.textContent = meta.count.toLocaleString();
  }

  // ---------------- Left panel ----------------
  private buildLeft(): void {
    const p = el("div", "panel");
    p.id = "left-panel";

    p.appendChild(el("h1", undefined, "Inner Solar System"));
    p.appendChild(
      el(
        "div",
        "subtitle",
        "Near-Earth objects propagated from orbital elements. Drag to orbit, scroll to zoom, click a body to inspect.",
      ),
    );

    // stats
    const stats = el("div", "stats");
    const s1 = el("div", "stat");
    this.statTotal = el("div", "v", "—");
    s1.append(this.statTotal, el("div", "l", "Asteroids"));
    const s2 = el("div", "stat");
    this.statVisible = el("div", "v", "—");
    s2.append(this.statVisible, el("div", "l", "In view"));
    stats.append(s1, s2);
    p.appendChild(this.section("Catalog", stats));

    // FPS
    const fpsWrap = el("div", "control");
    fpsWrap.append(el("span", undefined, "Performance"));
    this.statFps = el("span", undefined, "—");
    this.statFps.style.color = "var(--accent)";
    fpsWrap.append(this.statFps);
    p.appendChild(fpsWrap);

    // color mode
    const colorSel = el("select") as HTMLSelectElement;
    for (const [v, label] of [
      ["class", "Orbit class"],
      ["pha", "Hazardous (PHA)"],
      ["sentry", "Impact risk (Sentry)"],
      ["size", "Size (diameter)"],
    ] as const) {
      const o = el("option");
      o.value = v;
      o.textContent = label;
      colorSel.appendChild(o);
    }
    colorSel.onchange = () => {
      this.cb.setColorMode(colorSel.value as ColorMode);
      this.updateLegend(colorSel.value as ColorMode);
    };
    const colorField = el("div", "field");
    const cl = el("label");
    cl.textContent = "Color asteroids by";
    colorField.append(cl, colorSel);
    p.appendChild(this.section("Encoding", colorField));

    // legend
    this.legendEl = el("div", "legend");
    p.appendChild(this.legendEl);
    this.updateLegend("class");

    // layers
    const layers = el("div");
    layers.append(
      this.toggle("Asteroids", true, (v) => this.cb.setShowAsteroids(v)),
      this.toggle("Planet orbits", true, (v) => this.cb.setShowOrbits(v)),
      this.toggle("Comets", false, (v) => this.cb.setShowComets(v)),
      this.toggle("Dim filtered (vs hide)", true, (v) => this.cb.setDimFiltered(v)),
    );
    p.appendChild(this.section("Layers", layers));

    // size slider
    const sizeField = el("div", "field");
    const sl = el("label");
    sl.textContent = "Asteroid point size";
    const sr = el("input") as HTMLInputElement;
    sr.type = "range";
    sr.min = "3";
    sr.max = "60";
    sr.value = "10";
    sr.oninput = () => this.cb.setSizeScale(Number(sr.value));
    sizeField.append(sl, sr);
    p.appendChild(sizeField);

    document.body.appendChild(p);
  }

  private legendEl!: HTMLElement;
  private updateLegend(mode: ColorMode): void {
    this.legendEl.innerHTML = "";
    const rows: [string, string][] = [];
    if (mode === "class") {
      for (const c of ALL_CLASSES) rows.push([CLASS_COLOR[c], CLASS_LABEL[c]]);
    } else if (mode === "pha") {
      rows.push(["#ff4545", "Potentially hazardous"]);
      rows.push(["#737f99", "Other NEOs"]);
    } else if (mode === "sentry") {
      rows.push(["#ff4d80", "On Sentry risk list"]);
      rows.push(["#666b80", "Not monitored"]);
    } else {
      rows.push(["#ffd633", "Larger"]);
      rows.push(["#3373cc", "Smaller / unknown"]);
    }
    for (const [color, label] of rows) {
      const r = el("div", "legend-row");
      const d = el("span", "dot");
      d.style.color = color;
      d.style.background = color;
      r.append(d, el("span", undefined, label));
      this.legendEl.appendChild(r);
    }
  }

  // ---------------- Right panel (filters/search) ----------------
  private buildRight(): void {
    const p = el("div", "panel");
    p.id = "right-panel";
    p.appendChild(el("div", "section-title", "Search & Filter"));

    // search
    const sf = el("div", "field");
    this.searchInput = el("input") as HTMLInputElement;
    this.searchInput.type = "text";
    this.searchInput.placeholder = "Name or designation (e.g. Eros, 433, Apophis)";
    this.searchInput.oninput = () => {
      this.filter.search = this.searchInput.value.trim();
      this.renderResults();
      this.emitFilters();
    };
    sf.appendChild(this.searchInput);
    p.appendChild(sf);

    this.results = el("div", "results");
    p.appendChild(this.results);

    // toggles
    const tg = el("div");
    tg.append(
      this.toggle("Hazardous only (PHA)", false, (v) => {
        this.filter.pha = v;
        this.emitFilters();
      }),
      this.toggle("On Sentry risk list", false, (v) => {
        this.filter.sentry = v;
        this.emitFilters();
      }),
    );
    p.appendChild(this.section("Flags", tg));

    // class chips
    const chips = el("div", "chips");
    for (const c of ALL_CLASSES) {
      const chip = el("div", "chip");
      const dot = el("span", "dot");
      dot.style.background = CLASS_COLOR[c];
      dot.style.color = CLASS_COLOR[c];
      chip.append(dot, document.createTextNode(CLASS_LABEL[c]));
      chip.onclick = () => {
        if (this.filter.classes.has(c)) this.filter.classes.delete(c);
        else this.filter.classes.add(c);
        chip.classList.toggle("off", !this.filter.classes.has(c));
        this.emitFilters();
      };
      chips.appendChild(chip);
    }
    p.appendChild(this.section("Orbit class", chips));

    // MOID slider
    p.appendChild(
      this.rangeField("Max MOID", 0.005, 0.5, 0.005, 0.5, " au", (v) => {
        this.filter.maxMoid = v >= 0.5 ? null : v;
        this.emitFilters();
      }),
    );

    // diameter slider
    p.appendChild(
      this.rangeField("Min diameter", 0, 20, 0.1, 0, " km", (v) => {
        this.filter.minDiameter = v <= 0 ? null : v;
        this.emitFilters();
      }),
    );

    const reset = el("button", "btn", "Reset filters") as HTMLButtonElement;
    reset.style.width = "100%";
    reset.style.marginTop = "6px";
    reset.onclick = () => this.resetFilters();
    p.appendChild(reset);

    document.body.appendChild(p);
  }

  private rangeField(
    label: string,
    min: number,
    max: number,
    step: number,
    value: number,
    unit: string,
    onChange: (v: number) => void,
  ): HTMLElement {
    const field = el("div", "field");
    const lab = el("label");
    lab.textContent = label;
    const row = el("div", "range-row");
    const input = el("input") as HTMLInputElement;
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    const val = el("span", "val");
    const setLabel = () => {
      const v = Number(input.value);
      val.textContent =
        (label.startsWith("Max") && v >= max) || (label.startsWith("Min") && v <= min)
          ? "Any"
          : v + unit;
    };
    setLabel();
    input.oninput = () => {
      setLabel();
      onChange(Number(input.value));
    };
    row.append(input, val);
    field.append(lab, row);
    return field;
  }

  // ---------------- Time bar ----------------
  private buildTimebar(): void {
    const p = el("div", "panel");
    p.id = "timebar";

    const top = el("div", "time-top");
    this.timeDate = el("div", "time-date", "—");
    this.timeSpeed = el("div", "time-speed", "");
    top.append(this.timeDate, this.timeSpeed);
    p.appendChild(top);

    // scrubber
    this.scrubber = el("input") as HTMLInputElement;
    this.scrubber.type = "range";
    this.scrubber.id = "scrubber";
    this.scrubber.min = "0";
    this.scrubber.max = "1000";
    this.scrubber.value = "500";
    this.scrubber.oninput = () => {
      const t = Number(this.scrubber.value) / 1000;
      this.cb.setTimeJD(this.scrubMin + t * (this.scrubMax - this.scrubMin));
    };

    const controls = el("div", "time-controls");
    const mk = (html: string, title: string, fn: () => void) => {
      const b = el("button", "btn icon-btn", html) as HTMLButtonElement;
      b.title = title;
      b.onclick = fn;
      return b;
    };
    controls.append(
      mk("⏮", "Back 30 days", () => this.cb.stepDays(-30)),
      mk("◀", "Back 1 day", () => this.cb.stepDays(-1)),
    );
    this.playBtn = mk("▶", "Play / pause", () => this.cb.togglePlay());
    controls.append(this.playBtn);
    controls.append(
      mk("▶|", "Forward 1 day", () => this.cb.stepDays(1)),
      mk("⏭", "Forward 30 days", () => this.cb.stepDays(30)),
    );
    controls.appendChild(this.scrubber);
    p.appendChild(controls);

    // bottom: speed + date jump
    const bottom = el("div", "time-bottom");
    this.speedRange = el("input") as HTMLInputElement;
    this.speedRange.type = "range";
    this.speedRange.min = "0";
    this.speedRange.max = String(SPEEDS.length - 1);
    this.speedRange.step = "1";
    this.speedRange.value = String(SPEEDS.indexOf(1));
    this.speedRange.style.flex = "1";
    this.speedRange.oninput = () => {
      const sp = SPEEDS[Number(this.speedRange.value)];
      this.cb.setSpeed(sp);
    };

    this.dateInput = el("input") as HTMLInputElement;
    this.dateInput.type = "date";
    this.dateInput.style.width = "150px";
    this.dateInput.onchange = () => {
      const jd = inputDateToJD(this.dateInput.value);
      if (jd != null) this.cb.setTimeJD(jd);
    };

    const nowBtn = el("button", "btn", "Now") as HTMLButtonElement;
    nowBtn.onclick = () => this.cb.resetToNow();

    const speedLab = el("span", undefined, "Speed");
    speedLab.style.fontSize = "11.5px";
    speedLab.style.color = "var(--muted)";

    bottom.append(speedLab, this.speedRange, this.dateInput, nowBtn);
    p.appendChild(bottom);

    document.body.appendChild(p);
  }

  // ---------------- Detail ----------------
  private buildDetail(): void {
    this.detail = el("div", "panel");
    this.detail.id = "detail";
    document.body.appendChild(this.detail);
  }

  private buildTooltip(): void {
    this.tooltip = el("div");
    this.tooltip.id = "tooltip";
    document.body.appendChild(this.tooltip);
  }

  private buildHint(): void {
    const h = el(
      "div",
      "hint",
      "Drag: orbit · Scroll: zoom · Click: select<br/>Hover a point for its name",
    );
    document.body.appendChild(h);
  }

  // ---------------- helpers ----------------
  private section(title: string, content: HTMLElement): HTMLElement {
    const s = el("div", "section");
    s.appendChild(el("div", "section-title", title));
    s.appendChild(content);
    return s;
  }

  private toggle(
    label: string,
    checked: boolean,
    onChange: (v: boolean) => void,
  ): HTMLElement {
    const l = el("label", "toggle");
    const span = el("span", undefined, label);
    const input = el("input") as HTMLInputElement;
    input.type = "checkbox";
    input.checked = checked;
    input.onchange = () => onChange(input.checked);
    l.append(span, input);
    return l;
  }

  private emitFilters(): void {
    this.cb.onFiltersChanged(this.filter);
  }

  private resetFilters(): void {
    this.filter = {
      search: "",
      pha: false,
      sentry: false,
      classes: new Set(ALL_CLASSES),
      maxMoid: null,
      minDiameter: null,
    };
    // rebuild right panel inputs by reloading the page section is heavy; simplest
    // is to reset the DOM controls we know about.
    this.searchInput.value = "";
    document.querySelectorAll("#right-panel input[type=checkbox]").forEach((c) => {
      (c as HTMLInputElement).checked = false;
    });
    document.querySelectorAll("#right-panel .chip").forEach((c) =>
      c.classList.remove("off"),
    );
    document.querySelectorAll("#right-panel input[type=range]").forEach((r) => {
      const input = r as HTMLInputElement;
      input.value = input.max;
      input.dispatchEvent(new Event("input"));
    });
    this.renderResults();
    this.emitFilters();
  }

  // ---------------- public update API ----------------
  setStats(visible: number): void {
    this.statVisible.textContent = visible.toLocaleString();
  }
  setFps(fps: number): void {
    this.statFps.textContent = `${fps} fps`;
  }

  setTimeDisplay(jd: number, playing: boolean, speedDaysPerSec: number): void {
    this.timeDate.textContent = formatJD(jd);
    this.playBtn.textContent = playing ? "⏸" : "▶";
    const abs = Math.abs(speedDaysPerSec);
    let label: string;
    if (speedDaysPerSec === 0) label = "Paused";
    else {
      const dir = speedDaysPerSec < 0 ? "−" : "";
      if (abs >= 365) label = `${dir}${(abs / 365).toFixed(abs % 365 ? 1 : 0)} yr/s`;
      else label = `${dir}${abs} day/s`;
    }
    this.timeSpeed.textContent = label;
    if (document.activeElement !== this.scrubber) {
      const t = (jd - this.scrubMin) / (this.scrubMax - this.scrubMin);
      this.scrubber.value = String(Math.round(THREEclamp(t, 0, 1) * 1000));
    }
    if (document.activeElement !== this.dateInput) {
      this.dateInput.value = jdToInputDate(jd);
    }
  }

  syncSpeedSlider(speed: number): void {
    const idx = SPEEDS.indexOf(speed);
    if (idx >= 0) this.speedRange.value = String(idx);
  }

  showTooltip(x: number, y: number, text: string): void {
    this.tooltip.style.display = "block";
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
    this.tooltip.textContent = text;
  }
  hideTooltip(): void {
    this.tooltip.style.display = "none";
  }

  setFollowing(v: boolean): void {
    this.following = v;
    if (this.followBtn) {
      this.followBtn.classList.toggle("active", v);
      this.followBtn.textContent = v ? "Following ✓" : "Follow";
    }
  }

  // Render search/browse results given a sorted list of indices.
  private resultIndices: number[] = [];
  setResults(indices: number[]): void {
    this.resultIndices = indices;
    this.renderResults();
  }
  private renderResults(): void {
    this.results.innerHTML = "";
    const list = this.resultIndices.slice(0, 60);
    if (list.length === 0) {
      this.results.appendChild(
        el("div", "result", '<span style="color:var(--muted)">No matches</span>'),
      );
      return;
    }
    for (const idx of list) {
      const row = el("div", "result");
      const name = this.meta.full_name[idx] ?? this.meta.pdes[idx] ?? "?";
      const left = el("span", undefined, name);
      const tag = el("span", this.meta.pha[idx] ? "tag pha" : "tag");
      tag.textContent = this.meta.pha[idx] ? "PHA" : this.meta.cls[idx];
      row.append(left, tag);
      row.onclick = () => this.cb.onSelectResult(idx);
      this.results.appendChild(row);
    }
  }

  getFilter(): FilterState {
    return this.filter;
  }

  // ---------------- Detail view ----------------
  showDetail(
    info: DetailInfo,
    approaches: CloseApproach[] | null,
    nowJD: number,
  ): void {
    const { index: i, meta: m, sentry } = info;
    this.detail.innerHTML = "";

    const head = el("div", "detail-head");
    const titleWrap = el("div");
    titleWrap.appendChild(
      el("div", "title", m.full_name[i] ?? m.pdes[i] ?? "Unknown"),
    );
    const sub: string[] = [];
    if (m.pdes[i]) sub.push(`Designation ${m.pdes[i]}`);
    sub.push(CLASS_LABEL[m.cls[i]] ?? m.cls[i]);
    titleWrap.appendChild(el("div", "sub", sub.join(" · ")));
    const x = el("div", "close-x", "✕");
    x.onclick = () => this.cb.clearSelection();
    head.append(titleWrap, x);
    this.detail.appendChild(head);

    const body = el("div", "detail-body");

    const badges = el("div", "badges");
    if (m.pha[i]) badges.appendChild(el("span", "badge pha", "Potentially Hazardous"));
    if (sentry) badges.appendChild(el("span", "badge sentry", "Sentry Risk"));
    badges.appendChild(el("span", "badge class", CLASS_LABEL[m.cls[i]] ?? m.cls[i]));
    if (badges.children.length) body.appendChild(badges);

    const grid = el("div", "prop-grid");
    const prop = (k: string, v: string) => {
      const d = el("div", "prop");
      d.append(el("div", "k", k), el("div", "v", v));
      grid.appendChild(d);
    };
    prop("Semi-major axis", fmt(m.a[i], 3, "au"));
    prop("Eccentricity", fmt(m.e[i], 4));
    prop("Inclination", fmt(m.i[i], 2, "°"));
    prop("Perihelion", fmt(m.q[i], 3, "au"));
    prop("Aphelion", fmt(m.ad[i], 3, "au"));
    prop("Period", m.per[i] != null ? fmt(m.per[i]! / 365.25, 2, "yr") : "—");
    prop("MOID", fmt(m.moid[i], 4, "au"));
    prop("Diameter", m.diameter[i] != null ? fmt(m.diameter[i], 3, "km") : "—");
    prop("Abs. magnitude H", fmt(m.H[i], 2));
    prop("Albedo", fmt(m.albedo[i], 3));
    body.appendChild(grid);

    if (sentry) {
      body.appendChild(el("div", "detail-section-title", "Impact risk (CNEOS Sentry)"));
      const box = el("div", "sentry-box");
      const sgrid = el("div", "prop-grid");
      const sp = (k: string, v: string) => {
        const d = el("div", "prop");
        d.append(el("div", "k", k), el("div", "v", v));
        sgrid.appendChild(d);
      };
      sp("Impact probability", sentry.ip != null ? sentry.ip.toExponential(2) : "—");
      sp("Palermo (cum.)", fmt(sentry.ps_cum, 2));
      sp("Palermo (max)", fmt(sentry.ps_max, 2));
      sp("Torino (max)", fmt(sentry.ts_max, 0));
      sp("Potential impacts", fmt(sentry.n_imp, 0));
      sp("Window", sentry.range ?? "—");
      sp("Encounter vel.", fmt(sentry.v_inf, 2, "km/s"));
      box.appendChild(sgrid);
      body.appendChild(box);
    }

    // close approaches
    body.appendChild(el("div", "detail-section-title", "Earth close approaches"));
    if (approaches === null) {
      body.appendChild(el("div", "ca-list", '<div style="color:var(--muted);font-size:12px">Loading…</div>'));
    } else if (approaches.length === 0) {
      body.appendChild(
        el("div", "ca-list", '<div style="color:var(--muted);font-size:12px">No recorded close approaches within 0.05 au.</div>'),
      );
    } else {
      const caList = el("div", "ca-list");
      const head2 = el("div", "ca-row ca-head");
      head2.append(
        el("span", undefined, "Date"),
        el("span", undefined, "Distance"),
        el("span", undefined, "Rel. vel."),
      );
      caList.appendChild(head2);
      // nearest upcoming-ish: show closest 8 by distance
      const sorted = [...approaches].sort((a, b) => (a.dist ?? 9) - (b.dist ?? 9)).slice(0, 8);
      for (const ca of sorted) {
        const row = el("div", "ca-row");
        const lunar = ca.dist != null ? ca.dist * 389.2 : null; // au -> lunar distances
        if (lunar != null && lunar < 5) row.classList.add("near");
        row.append(
          el("span", undefined, ca.cd ?? "—"),
          el(
            "span",
            undefined,
            lunar != null ? `${lunar.toFixed(1)} LD` : "—",
          ),
          el("span", undefined, ca.v_rel != null ? `${ca.v_rel.toFixed(1)} km/s` : "—"),
        );
        caList.appendChild(row);
      }
      body.appendChild(caList);
      void nowJD;
    }

    this.detail.appendChild(body);

    const actions = el("div", "detail-actions");
    const focus = el("button", "btn primary", "Focus") as HTMLButtonElement;
    focus.onclick = () => this.cb.focusSelected();
    this.followBtn = el("button", "btn", "Follow") as HTMLButtonElement;
    this.followBtn.onclick = () => {
      this.following = !this.following;
      this.cb.toggleFollow(this.following);
    };
    this.followBtn.classList.toggle("active", this.following);
    this.followBtn.textContent = this.following ? "Following ✓" : "Follow";
    const link = el("button", "btn", "Copy link") as HTMLButtonElement;
    link.onclick = () => this.cb.copyLink();
    actions.append(focus, this.followBtn, link);
    this.detail.appendChild(actions);

    this.detail.classList.add("open");
  }

  hideDetail(): void {
    this.detail.classList.remove("open");
  }
}

function THREEclamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}
