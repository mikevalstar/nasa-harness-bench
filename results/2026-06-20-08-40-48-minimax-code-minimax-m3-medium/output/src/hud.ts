/**
 * HUD wiring — DOM event handlers for filters, time controls, search,
 * detail panel. Pure DOM glue; the main loop reads state from the returned
 * state object and pushes updates back via callbacks.
 */

import type {
  AsteroidMeta,
  CloseApproach,
  FilterState,
  LoadedData,
  Planet,
} from "./types";
import { findCloseApproaches } from "./data";
import { formatJd } from "./orbit";

export interface HudRefs {
  filterOrbits: HTMLInputElement;
  filterLabels: HTMLInputElement;
  filterComets: HTMLInputElement;
  filterPha: HTMLInputElement;
  filterSentry: HTMLInputElement;
  filterClose: HTMLInputElement;
  filterClass: HTMLSelectElement;
  filterDiameter: HTMLInputElement;
  filterMoid: HTMLInputElement;
  filterSearch: HTMLInputElement;
  filterReset: HTMLButtonElement;
  statsSub: HTMLElement;
  uiDate: HTMLElement;
  uiSpeed: HTMLElement;
  uiShown: HTMLElement;
  timePlay: HTMLButtonElement;
  timeBack: HTMLButtonElement;
  timeFwd: HTMLButtonElement;
  timeSpeed: HTMLSelectElement;
  timeNow: HTMLButtonElement;
  timeJump: HTMLInputElement;
  timeJumpBtn: HTMLButtonElement;
  timeScrub: HTMLInputElement;
  timeStart: HTMLElement;
  timeEnd: HTMLElement;
  panelDetail: HTMLElement;
  detailName: HTMLElement;
  detailDesignation: HTMLElement;
  detailGrid: HTMLElement;
  detailApproaches: HTMLElement;
  detailSentrySection: HTMLElement;
  detailSentryGrid: HTMLElement;
  detailFollow: HTMLButtonElement;
  detailShare: HTMLButtonElement;
  detailClose: HTMLButtonElement;
  tooltip: HTMLElement;
  toast: HTMLElement;
}

export function getHudRefs(): HudRefs {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  return {
    filterOrbits: $("filter-orbits") as HTMLInputElement,
    filterLabels: $("filter-labels") as HTMLInputElement,
    filterComets: $("filter-comets") as HTMLInputElement,
    filterPha: $("filter-pha") as HTMLInputElement,
    filterSentry: $("filter-sentry") as HTMLInputElement,
    filterClose: $("filter-close") as HTMLInputElement,
    filterClass: $("filter-class") as HTMLSelectElement,
    filterDiameter: $("filter-diameter") as HTMLInputElement,
    filterMoid: $("filter-moid") as HTMLInputElement,
    filterSearch: $("filter-search") as HTMLInputElement,
    filterReset: $("filter-reset") as HTMLButtonElement,
    statsSub: $("stats-sub"),
    uiDate: $("ui-date"),
    uiSpeed: $("ui-speed"),
    uiShown: $("ui-shown"),
    timePlay: $("time-play") as HTMLButtonElement,
    timeBack: $("time-back") as HTMLButtonElement,
    timeFwd: $("time-fwd") as HTMLButtonElement,
    timeSpeed: $("time-speed") as HTMLSelectElement,
    timeNow: $("time-now") as HTMLButtonElement,
    timeJump: $("time-jump") as HTMLInputElement,
    timeJumpBtn: $("time-jump-btn") as HTMLButtonElement,
    timeScrub: $("time-scrub") as HTMLInputElement,
    timeStart: $("time-start"),
    timeEnd: $("time-end"),
    panelDetail: $("panel-detail"),
    detailName: $("detail-name"),
    detailDesignation: $("detail-designation"),
    detailGrid: $("detail-grid"),
    detailApproaches: $("detail-approaches"),
    detailSentrySection: $("detail-sentry-section"),
    detailSentryGrid: $("detail-sentry-grid"),
    detailFollow: $("detail-follow") as HTMLButtonElement,
    detailShare: $("detail-share") as HTMLButtonElement,
    detailClose: $("detail-close") as HTMLButtonElement,
    tooltip: $("tooltip"),
    toast: $("toast"),
  };
}

export function defaultFilters(): FilterState {
  return {
    orbits: true,
    labels: false,
    comets: false,
    phaOnly: false,
    sentryOnly: false,
    closeOnly: true,
    classCode: 0,
    minDiameter: 0,
    maxMoid: 0,
    search: "",
  };
}

export function readFilters(h: HudRefs): FilterState {
  return {
    orbits: h.filterOrbits.checked,
    labels: h.filterLabels.checked,
    comets: h.filterComets.checked,
    phaOnly: h.filterPha.checked,
    sentryOnly: h.filterSentry.checked,
    closeOnly: h.filterClose.checked,
    classCode: parseInt(h.filterClass.value || "0", 10),
    minDiameter: parseFloat(h.filterDiameter.value || "0") || 0,
    maxMoid: parseFloat(h.filterMoid.value || "0") || 0,
    search: h.filterSearch.value.trim(),
  };
}

export function writeFilters(h: HudRefs, f: FilterState): void {
  h.filterOrbits.checked = f.orbits;
  h.filterLabels.checked = f.labels;
  h.filterComets.checked = f.comets;
  h.filterPha.checked = f.phaOnly;
  h.filterSentry.checked = f.sentryOnly;
  h.filterClose.checked = f.closeOnly;
  h.filterClass.value = f.classCode ? String(f.classCode) : "";
  h.filterDiameter.value = f.minDiameter ? String(f.minDiameter) : "";
  h.filterMoid.value = f.maxMoid ? String(f.maxMoid) : "";
  h.filterSearch.value = f.search;
}

export function showDetailForPlanet(h: HudRefs, planet: Planet, jd: number) {
  h.panelDetail.classList.remove("hidden");
  h.detailName.textContent = planet.name;
  h.detailDesignation.textContent = "Planet · Heliocentric orbit";
  const rows = [
    ["Semi-major axis", `${planet.a.toFixed(4)} au`],
    ["Eccentricity", planet.e.toFixed(4)],
    ["Inclination", `${planet.i.toFixed(2)}°`],
    ["Long. asc. node", `${planet.om.toFixed(2)}°`],
    ["Arg. perihelion", `${planet.w.toFixed(2)}°`],
    ["Mean motion", `${planet.n.toFixed(4)}°/day`],
    ["Period", `${planet.per.toFixed(2)} d`],
    ["Radius", `${planet.radius_km.toLocaleString()} km`],
    ["Current date", formatJd(jd)],
  ];
  h.detailGrid.innerHTML = rows
    .map((r) => `<div><span>${r[0]}</span><span>${r[1]}</span></div>`)
    .join("");
  // No close approaches / sentry for planets.
  h.detailSentrySection.classList.add("hidden");
  // Empty approaches table.
  const tbody = h.detailApproaches.querySelector("tbody") as HTMLElement;
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--fg-dim)">—</td></tr>`;
}

export function showDetailForAsteroid(
  h: HudRefs,
  data: LoadedData,
  meta: AsteroidMeta,
  jd: number,
) {
  h.panelDetail.classList.remove("hidden");
  h.detailName.textContent = meta.name || meta.fullName;
  h.detailDesignation.textContent = meta.fullName;

  const classStr = ["", "AMO", "APO", "ATE", "IEO"][meta.classCode] || "—";
  const rows: [string, string][] = [
    ["Designation", meta.pdes],
    ["Class", classStr],
    ["Semi-major axis", `${meta.q + meta.ad > 0 ? ((meta.q + meta.ad) / 2).toFixed(3) : "—"} au`],
    ["Perihelion (q)", `${meta.q.toFixed(3)} au`],
    ["Aphelion (ad)", `${meta.ad.toFixed(3)} au`],
    ["Period", `${(meta.per || 0).toFixed(1)} d`],
    ["MOID", `${meta.moid.toFixed(4)} au`],
    ["H magnitude", `${meta.H.toFixed(2)}`],
    ["Diameter", meta.diameter > 0 ? `${meta.diameter.toFixed(2)} km` : "—"],
    ["Albedo", meta.albedo > 0 ? meta.albedo.toFixed(2) : "—"],
    ["Rotation", meta.rotPer > 0 ? `${meta.rotPer.toFixed(2)} h` : "—"],
    ["Flags", formatFlags(meta.flags)],
  ];
  h.detailGrid.innerHTML = rows
    .map((r) => `<div><span>${r[0]}</span><span>${r[1]}</span></div>`)
    .join("");

  // Close approaches.
  const approaches = findCloseApproaches(data, meta.pdes, 200);
  const tbody = h.detailApproaches.querySelector("tbody") as HTMLElement;
  if (approaches.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--fg-dim)">none on record</td></tr>`;
  } else {
    tbody.innerHTML = approaches
      .slice(0, 60)
      .map(
        (a) =>
          `<tr data-jd="${a.jd}" data-dist="${a.dist}" data-vrel="${a.v_rel}">` +
          `<td>${escapeHtml(a.cd)}</td>` +
          `<td>${a.dist.toFixed(4)}</td>` +
          `<td>${a.v_rel.toFixed(2)}</td>` +
          `<td>${a.h != null ? a.h.toFixed(1) : "—"}</td>` +
          `</tr>`,
      )
      .join("");
  }

  // Sentry risk.
  if (meta.sentry) {
    h.detailSentrySection.classList.remove("hidden");
    const s = meta.sentry;
    const sentryRows: [string, string][] = [
      ["Cumulative P", formatProbability(s.ip)],
      ["Cumulative Palermo", s.ps_cum != null ? s.ps_cum.toFixed(2) : "—"],
      ["Max Palermo", s.ps_max != null ? s.ps_max.toFixed(2) : "—"],
      ["Max Torino", s.ts_max != null ? s.ts_max.toFixed(1) : "—"],
      ["Year range", s.range ?? "—"],
      ["Possible impacts", s.n_imp != null ? String(s.n_imp) : "—"],
      ["v_infinity", s.v_inf != null ? `${s.v_inf.toFixed(2)} km/s` : "—"],
    ];
    h.detailSentryGrid.innerHTML = sentryRows
      .map((r) => `<div><span>${r[0]}</span><span>${r[1]}</span></div>`)
      .join("");
  } else {
    h.detailSentrySection.classList.add("hidden");
  }
}

export function hideDetail(h: HudRefs) {
  h.panelDetail.classList.add("hidden");
}

function formatFlags(f: number): string {
  const out: string[] = [];
  if (f & 1) out.push("NEO");
  if (f & 2) out.push("PHA");
  if (f & 4) out.push("Sentry");
  return out.join(", ") || "—";
}

function formatProbability(p: number): string {
  if (p == null) return "—";
  if (p < 1e-6) return p.toExponential(2);
  if (p < 1e-3) return p.toExponential(2);
  return p.toFixed(6);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let toastTimer: number | null = null;
export function showToast(h: HudRefs, msg: string) {
  h.toast.textContent = msg;
  h.toast.classList.remove("hidden");
  if (toastTimer != null) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => h.toast.classList.add("hidden"), 2400);
}

export function showTooltip(h: HudRefs, x: number, y: number, name: string, sub: string) {
  h.tooltip.classList.remove("hidden");
  h.tooltip.style.left = `${x + 14}px`;
  h.tooltip.style.top = `${y + 14}px`;
  h.tooltip.innerHTML = `<div class="tip-name">${escapeHtml(name)}</div><div class="tip-sub">${escapeHtml(sub)}</div>`;
}
export function hideTooltip(h: HudRefs) {
  h.tooltip.classList.add("hidden");
}
