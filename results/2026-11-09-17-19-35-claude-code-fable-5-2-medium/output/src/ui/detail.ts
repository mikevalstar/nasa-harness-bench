/** Right panel: everything known about the selected body, with its close approaches and impact risk. */
import type { App } from "../app.ts";
import type { BodyRef } from "../bodies.ts";
import { ASSUMED_ALBEDO, CLASS_NAMES, diameterFromH, GROUP_INFO, ORBIT_GROUPS } from "../data/catalog.ts";
import { formatDiameter, formatDistance, formatKm, formatOdds, formatPeriod, sig } from "../format.ts";
import { AU_KM, GAUSS_K, LD_AU, orbitalSpeedKmS, SUN_RADIUS_KM, TAU, type Vec3 } from "../orbit.ts";
import { formatDate, formatDateTime, JD_MAX, JD_MIN } from "../time.ts";
import { h, replace } from "./dom.ts";

export interface Detail {
  el: HTMLElement;
  /** Called a few times a second to refresh the live distance and speed readouts. */
  tick(jd: number): void;
}

type Field = [label: string, value: string | null, title?: string];

const SVG = "http://www.w3.org/2000/svg";
function svg(tag: string, attrs: Record<string, string | number>, text?: string): SVGElement {
  const el = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  if (text !== undefined) el.textContent = text;
  return el;
}

const fields = (rows: Field[]): HTMLElement =>
  h(
    "dl",
    { class: "fields" },
    ...rows
      .filter((r) => r[1] !== null)
      .flatMap(([label, value, title]) => [h("dt", { title: title ?? "" }, label), h("dd", {}, value)]),
  );

const section = (title: string, ...children: Array<Node | null>): HTMLElement =>
  h("section", {}, h("h3", {}, title), ...children);

/** Where a diameter falls between a metre and a hundred kilometres, against impactors people have heard of. */
function sizeScale(km: number): HTMLElement {
  const position = (metres: number): number => (Math.min(Math.max(Math.log10(metres), 0), 5) / 5) * 100;
  const marks: Array<[number, string]> = [
    [20, "Chelyabinsk 2013"],
    [140, "PHA threshold"],
    [10_000, "Chicxulub"],
  ];
  return h(
    "div",
    { class: "size-scale", title: "Log scale from 1 m to 100 km" },
    ...marks.map(([m, label], k) =>
      h("div", { class: `size-mark${k % 2 ? " below" : ""}`, style: `left:${position(m)}%` }, h("span", {}, label)),
    ),
    h("div", { class: "size-here", style: `left:${position(km * 1000)}%` }),
    h("div", { class: "size-ends" }, h("span", {}, "1 m"), h("span", {}, "100 km")),
  );
}

export function createDetail(app: App): Detail {
  const { store, catalog, eph, stage } = app;
  const { asteroids, comets, planets, approaches, sentry } = catalog;
  const el = h("aside", { class: "panel detail", hidden: true });
  const position: Vec3 = [0, 0, 0];
  const earthPosition: Vec3 = [0, 0, 0];

  let live: HTMLElement | null = null;
  let nowLine: SVGElement | null = null;
  let chartX: ((jd: number) => number) | null = null;

  function approachChart(rows: number[]): HTMLElement {
    const width = 316;
    const height = 132;
    const left = 34;
    const right = 8;
    const top = 8;
    const bottom = 20;
    const x = (jd: number): number => left + ((jd - JD_MIN) / (JD_MAX - JD_MIN)) * (width - left - right);
    // Log distance, 0.01 to 20 lunar distances. The table only records passes inside 0.05 au (19.5 LD).
    const y = (au: number): number => {
      const t = (Math.log10(Math.min(Math.max(au / LD_AU, 0.01), 20)) + 2) / (Math.log10(20) + 2);
      return height - bottom - t * (height - top - bottom);
    };
    chartX = x;

    const root = svg("svg", { viewBox: `0 0 ${width} ${height}`, class: "chart", role: "img", "aria-label": "Close approach distance over time" });
    for (const ld of [0.01, 0.1, 1, 10]) {
      root.append(
        svg("line", { x1: left, x2: width - right, y1: y(ld * LD_AU), y2: y(ld * LD_AU), class: ld === 1 ? "moon" : "grid" }),
        svg("text", { x: left - 4, y: y(ld * LD_AU) + 3, class: "tick", "text-anchor": "end" }, ld === 1 ? "Moon" : `${ld}`),
      );
    }
    for (const year of [1900, 1950, 2000, 2050, 2100, 2150, 2200]) {
      const px = left + ((year - 1900) / 300) * (width - left - right);
      root.append(svg("text", { x: px, y: height - 5, class: "tick", "text-anchor": year === 1900 ? "start" : year === 2200 ? "end" : "middle" }, String(year)));
    }
    nowLine = svg("line", { y1: top, y2: height - bottom, class: "now" });
    root.append(nowLine);

    const readout = h("div", { class: "chart-readout" }, "Distance in lunar distances (LD), log scale. Hover or pick a pass.");
    for (const k of rows) {
      const cx = x(approaches.jd[k]);
      root.append(svg("line", { x1: cx, x2: cx, y1: y(approaches.distMax[k]), y2: y(approaches.distMin[k]), class: "range" }));
      const mark = svg("circle", { cx, cy: y(approaches.dist[k]), r: 3.5, class: "pass" });
      const hit = svg("circle", { cx, cy: y(approaches.dist[k]), r: 9, class: "hit" });
      hit.addEventListener("mouseenter", () => {
        mark.classList.add("hover");
        readout.textContent = `${formatDateTime(approaches.jd[k])} · ${formatDistance(approaches.dist[k])} (${formatKm(approaches.dist[k])}) · ${sig(approaches.vRel[k])} km/s`;
      });
      hit.addEventListener("mouseleave", () => mark.classList.remove("hover"));
      hit.addEventListener("click", () => app.goToApproach(k));
      root.append(mark, hit);
    }
    return h("div", {}, root as unknown as Node, readout);
  }

  function approachSection(index: number): HTMLElement | null {
    const rows = Array.from(catalog.approachList.subarray(catalog.approachStart[index], catalog.approachStart[index + 1]));
    if (rows.length === 0) {
      return section("Close approaches", h("p", { class: "note" }, "No passes within 0.05 au of Earth are on record between 1900 and 2200."));
    }
    const table = h(
      "div",
      { class: "approach-table" },
      ...rows.map((k) => {
        const row = h(
          "button",
          { class: "approach-row", type: "button", title: "Jump to this pass" },
          h("span", {}, formatDate(approaches.jd[k])),
          h("span", {}, formatDistance(approaches.dist[k])),
          h("span", {}, `${sig(approaches.vRel[k])} km/s`),
        );
        row.addEventListener("click", () => app.goToApproach(k));
        return row;
      }),
    );
    return section(`Close approaches (${rows.length})`, approachChart(rows), table);
  }

  function riskSection(index: number): HTMLElement | null {
    const row = sentry[catalog.sentryRow[index]];
    if (!row) return null;
    const [from, to] = row.range.split("-");
    const span = from === to ? `in ${from}` : `between ${from} and ${to}`;
    return section(
      "Impact risk",
      h(
        "p",
        { class: "risk-headline" },
        h("strong", {}, formatOdds(row.ip)),
        ` chance of impact ${span}, summed over ${row.nImp.toLocaleString("en-US")} possible impact date${row.nImp === 1 ? "" : "s"}.`,
      ),
      fields([
        ["Palermo scale", `${row.psCum.toFixed(2)} cumulative, ${row.psMax.toFixed(2)} max`, "Log of the risk relative to the background impact rate. Below −2 is no cause for concern."],
        ["Torino scale", row.tsMax === null ? "not rated" : String(row.tsMax), "0 to 10 public hazard scale. 0 means no hazard."],
        ["Impact speed", row.vInf === null ? null : `${sig(row.vInf)} km/s`, "Velocity at infinity relative to Earth"],
        ["Sentry diameter", formatDiameter(row.diameter)],
        ["Last observed", row.lastObs],
      ]),
    );
  }

  function asteroidBody(index: number): Array<HTMLElement | null> {
    const a = asteroids.a[index];
    const e = asteroids.e[index];
    const H = asteroids.H[index];
    const measured = catalog.measuredDiameter.get(index);
    const km = catalog.diameterKm[index];
    const moid = asteroids.moid[index];
    const group = ORBIT_GROUPS[catalog.group[index]];
    const spectral = [catalog.specB.get(index), catalog.specT.get(index)].filter(Boolean);

    let diameter = "unknown";
    if (measured !== undefined) diameter = `${formatDiameter(measured)} (measured)`;
    else if (H !== null) diameter = `${formatDiameter(diameterFromH(H, 0.25))} to ${formatDiameter(diameterFromH(H, 0.05))}`;

    return [
      h(
        "div",
        { class: "badges" },
        h("span", { class: "badge", title: GROUP_INFO[group].blurb }, CLASS_NAMES[asteroids.classes[asteroids.cls[index]]] ?? "NEO"),
        asteroids.pha[index] ? h("span", { class: "badge pha", title: "Potentially Hazardous Asteroid" }, "PHA") : null,
        catalog.sentryRow[index] >= 0 ? h("span", { class: "badge risk" }, "Risk list") : null,
      ),
      h("p", { class: "note" }, GROUP_INFO[group].blurb + "."),
      riskSection(index),
      section(
        "Size and surface",
        Number.isNaN(km) ? null : sizeScale(km),
        fields([
          ["Diameter", diameter, measured === undefined ? `Estimated from brightness for albedos of 0.25 to 0.05. The dot size uses ${ASSUMED_ALBEDO}.` : ""],
          ["Absolute magnitude H", H === null ? null : String(H)],
          ["Albedo", catalog.albedo.get(index)?.toString() ?? null],
          ["Rotation period", catalog.rotPer.has(index) ? `${sig(catalog.rotPer.get(index) as number)} h` : null],
          ["Spectral type", spectral.length ? spectral.join(" / ") : null],
          ["First observed", asteroids.firstObs[index]],
        ]),
      ),
      section(
        "Orbit",
        fields([
          ["Earth MOID", moid === null ? null : `${sig(moid)} au (${sig(moid / LD_AU)} LD)`, "Smallest distance between this orbit and Earth's orbit"],
          ["Semi-major axis a", `${sig(a, 4)} au`],
          ["Eccentricity e", String(e)],
          ["Inclination i", `${asteroids.i[index]}°`],
          ["Perihelion / aphelion", `${sig(a * (1 - e))} / ${sig(a * (1 + e))} au`],
          ["Period", formatPeriod(360 / asteroids.n[index])],
          ["Node Ω / perihelion ω", `${asteroids.om[index]}° / ${asteroids.w[index]}°`],
          ["Mean anomaly", `${asteroids.ma[index]}° at ${formatDate(asteroids.epoch[index])}`],
        ]),
      ),
      approachSection(index),
    ];
  }

  function cometBody(index: number): Array<HTMLElement | null> {
    const e = comets.e[index];
    const q = comets.q[index];
    const code = comets.classes[comets.cls[index]];
    const shape = e < 1 ? "Closed orbit, it returns." : e === 1 ? "Parabolic orbit as catalogued, a single pass." : "Hyperbolic orbit, it leaves the solar system.";
    const km = catalog.cometDiameter.get(index);
    return [
      h("div", { class: "badges" }, h("span", { class: "badge comet" }, CLASS_NAMES[code] ?? code)),
      h("p", { class: "note" }, shape),
      section(
        "Orbit",
        fields([
          ["Perihelion distance q", `${sig(q)} au`],
          ["Eccentricity e", String(e)],
          ["Inclination i", `${comets.i[index]}°`],
          ["Perihelion passage", formatDate(comets.tp[index])],
          ["Period", e < 1 ? formatPeriod(TAU / (GAUSS_K * Math.pow((1 - e) / q, 1.5))) : null],
          ["Aphelion", e < 1 ? `${sig((q * (1 + e)) / (1 - e))} au` : null],
          ["Node Ω / perihelion ω", `${comets.om[index]}° / ${comets.w[index]}°`],
        ]),
      ),
      section(
        "Physical",
        fields([
          ["Nucleus diameter", km === undefined ? "unknown" : formatDiameter(km)],
          ["Total magnitude M1", comets.M1[index]?.toString() ?? null],
        ]),
      ),
    ];
  }

  function planetBody(index: number): Array<HTMLElement | null> {
    const p = planets[index];
    return [
      h("div", { class: "badges" }, h("span", { class: "badge" }, "Planet")),
      section(
        "Orbit",
        fields([
          ["Semi-major axis a", `${sig(p.a, 4)} au`],
          ["Eccentricity e", sig(p.e)],
          ["Inclination i", `${sig(p.i)}°`],
          ["Period", formatPeriod(p.per)],
        ]),
      ),
      section("Physical", fields([["Mean radius", `${p.radius_km.toLocaleString("en-US")} km`]])),
    ];
  }

  /** A viewing distance that frames the body: a few radii for planets, the neighbourhood for small bodies. */
  function closeUpDistance(ref: BodyRef): number {
    if (ref.kind === "planet") return (planets[ref.index].radius_km / AU_KM) * 8;
    if (ref.kind === "sun") return (SUN_RADIUS_KM / AU_KM) * 8;
    return 0.05;
  }

  function render(): void {
    const ref = store.state.selected;
    el.hidden = ref === null;
    live = nowLine = chartX = null;
    if (!ref) return;

    const follow = h("button", { type: "button", class: "action" });
    const syncFollow = (): void => {
      follow.textContent = store.state.follow ? "Following" : "Follow";
      follow.ariaPressed = String(store.state.follow);
    };
    follow.addEventListener("click", () => store.setFollow(!store.state.follow));
    syncFollow();
    followSync = syncFollow;

    const zoom = h("button", { type: "button", class: "action" }, "Zoom in");
    zoom.addEventListener("click", () => {
      stage.flyToSelection();
      stage.zoomTo(closeUpDistance(ref));
    });
    const close = h("button", { type: "button", class: "icon", ariaLabel: "Close details" }, "×");
    close.addEventListener("click", () => store.select(null));

    live = h("dl", { class: "fields live" });
    const body =
      ref.kind === "asteroid"
        ? asteroidBody(ref.index)
        : ref.kind === "comet"
          ? cometBody(ref.index)
          : ref.kind === "planet"
            ? planetBody(ref.index)
            : [section("Physical", fields([["Mean radius", `${SUN_RADIUS_KM.toLocaleString("en-US")} km`]]))];

    // Badges and the one-line orbit description lead; the live readout follows them.
    const intro = body.findIndex((node) => node?.tagName === "SECTION");
    replace(
      el,
      h("header", {}, h("h2", {}, eph.name(ref)), close),
      h("div", { class: "actions" }, follow, zoom),
      h(
        "div",
        { class: "detail-scroll" },
        ...body.slice(0, intro),
        ref.kind === "sun" ? null : section("Right now", live),
        ...body.slice(intro),
      ),
    );
    lastTick = -1;
    tick(store.state.jd);
  }

  let followSync: (() => void) | null = null;
  let lastTick = -1;

  function tick(jd: number): void {
    const ref = store.state.selected;
    if (!ref || jd === lastTick) return;
    lastTick = jd;
    if (nowLine && chartX) {
      nowLine.setAttribute("x1", String(chartX(jd)));
      nowLine.setAttribute("x2", String(chartX(jd)));
    }
    if (!live) return;
    const conic = eph.conic(ref);
    if (!conic) return;
    eph.position(ref, jd, position);
    eph.position(eph.earth, jd, earthPosition);
    const r = Math.hypot(position[0], position[1], position[2]);
    const toEarth = Math.hypot(position[0] - earthPosition[0], position[1] - earthPosition[1], position[2] - earthPosition[2]);
    const isEarth = ref.kind === "planet" && ref.index === eph.earth.index;
    replace(
      live,
      h("dt", {}, "From the Sun"),
      h("dd", {}, `${sig(r, 4)} au`),
      isEarth ? null : h("dt", {}, "From Earth"),
      isEarth ? null : h("dd", {}, toEarth < 0.1 ? `${formatDistance(toEarth)} (${formatKm(toEarth)})` : `${sig(toEarth, 4)} au`),
      h("dt", {}, "Speed around the Sun"),
      h("dd", {}, `${sig(orbitalSpeedKmS(r, conic.q, conic.e))} km/s`),
    );
  }

  store.on("selection", render);
  store.on("follow", () => followSync?.());
  return { el, tick };
}
