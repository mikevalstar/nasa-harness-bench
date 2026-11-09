/** Visual encodings of the asteroid cloud: one colour scheme per mode, and dot size from diameter. */
import { GROUP_INFO, ORBIT_GROUPS, type Catalog } from "./data/catalog.ts";
import type { ColorMode } from "./state.ts";

export type Legend =
  | { kind: "categories"; items: Array<{ color: string; label: string; count: number }> }
  | { kind: "ramp"; stops: string[]; low: string; high: string; rest?: { color: string; label: string } };

export interface Encoding {
  /** RGBA bytes per asteroid. */
  rgba: Uint8Array;
  /** Higher draws later, so it ends up on top where dots overlap. */
  priority: Uint8Array;
  legend: Legend;
}

export const MODE_LABELS: Record<ColorMode, string> = {
  hazard: "Hazard status",
  class: "Orbit class",
  size: "Diameter",
  moid: "Orbit distance to Earth (MOID)",
  risk: "Impact risk (Palermo scale)",
};

const HAZARD = { other: "#7f8ea8", pha: "#ff6b4a", sentry: "#ffd166" };
const GROUP_COLORS = ["#4d96f0", "#e8703f", "#1fb886", "#e0669a", "#9085e9"];
const SIZE_RAMP = ["#1c4f8f", "#3987e5", "#86b6ef", "#e6f1ff"];
const MOID_RAMP = ["#fff0c2", "#ffb35c", "#d95926", "#5c2a1a"];
const RISK_RAMP = ["#4a2a5e", "#b0489a", "#ff7a6b", "#ffe08a"];
const REST = "#56607a";

export const COMET_COLOR = "#7ee8d6";

type Rgb = [number, number, number];
const rgb = (hex: string): Rgb => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16)) as Rgb;

function rampColor(stops: Rgb[], t: number): Rgb {
  const x = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
  const k = Math.min(Math.floor(x), stops.length - 2);
  const f = x - k;
  return stops[k].map((c, j) => Math.round(c + (stops[k + 1][j] - c) * f)) as Rgb;
}

/** Dot diameter in CSS pixels. Log scale: each tenfold step in size adds one pixel. */
export function dotSize(diameterKm: number): number {
  if (Number.isNaN(diameterKm)) return 2;
  return Math.min(Math.max(1.4 + Math.log10(diameterKm * 1000), 1.6), 6.5);
}

export function encode(catalog: Catalog, mode: ColorMode): Encoding {
  const { asteroids, group, diameterKm, sentryRow, sentry } = catalog;
  const count = asteroids.count;
  const rgba = new Uint8Array(count * 4);
  const priority = new Uint8Array(count);
  const put = (i: number, color: Rgb, alpha: number, rank: number): void => {
    rgba.set(color, i * 4);
    rgba[i * 4 + 3] = alpha;
    priority[i] = rank;
  };

  switch (mode) {
    case "hazard": {
      const colors = { other: rgb(HAZARD.other), pha: rgb(HAZARD.pha), sentry: rgb(HAZARD.sentry) };
      const counts = { other: 0, pha: 0, sentry: 0 };
      for (let i = 0; i < count; i++) {
        const key = sentryRow[i] >= 0 ? "sentry" : asteroids.pha[i] ? "pha" : "other";
        counts[key]++;
        put(i, colors[key], key === "other" ? 120 : 255, key === "other" ? 0 : key === "pha" ? 1 : 2);
      }
      return {
        rgba,
        priority,
        legend: {
          kind: "categories",
          items: [
            { color: HAZARD.pha, label: "Potentially hazardous", count: counts.pha },
            { color: HAZARD.sentry, label: "On the Sentry risk list", count: counts.sentry },
            { color: HAZARD.other, label: "Other near-Earth objects", count: counts.other },
          ],
        },
      };
    }
    case "class": {
      const colors = GROUP_COLORS.map(rgb);
      const counts = ORBIT_GROUPS.map(() => 0);
      for (let i = 0; i < count; i++) {
        counts[group[i]]++;
        put(i, colors[group[i]], 215, group[i] >= 3 ? 1 : 0);
      }
      return {
        rgba,
        priority,
        legend: {
          kind: "categories",
          items: ORBIT_GROUPS.map((g, k) => ({ color: GROUP_COLORS[k], label: GROUP_INFO[g].label, count: counts[k] })),
        },
      };
    }
    case "size": {
      const stops = SIZE_RAMP.map(rgb);
      const rest = rgb(REST);
      for (let i = 0; i < count; i++) {
        const km = diameterKm[i];
        if (Number.isNaN(km)) {
          put(i, rest, 110, 0);
          continue;
        }
        const t = (Math.log10(km * 1000) - 1) / 3; // 10 m .. 10 km
        put(i, rampColor(stops, t), 150 + Math.round(105 * Math.min(Math.max(t, 0), 1)), Math.round(255 * Math.min(Math.max(t, 0), 1)));
      }
      return {
        rgba,
        priority,
        legend: { kind: "ramp", stops: SIZE_RAMP, low: "10 m", high: "10 km", rest: { color: REST, label: "Size unknown" } },
      };
    }
    case "moid": {
      const stops = MOID_RAMP.map(rgb);
      const rest = rgb(REST);
      for (let i = 0; i < count; i++) {
        const moid = asteroids.moid[i];
        if (moid === null) {
          put(i, rest, 110, 0);
          continue;
        }
        const t = Math.min(Math.max((Math.log10(Math.max(moid, 1e-5)) + 4) / 3.5, 0), 1); // 0.0001 .. 0.3 au
        put(i, rampColor(stops, t), 255 - Math.round(140 * t), Math.round(255 * (1 - t)));
      }
      return {
        rgba,
        priority,
        legend: { kind: "ramp", stops: MOID_RAMP, low: "0.0001 au", high: "0.3 au", rest: { color: REST, label: "MOID unknown" } },
      };
    }
    case "risk": {
      const stops = RISK_RAMP.map(rgb);
      const rest = rgb(REST);
      for (let i = 0; i < count; i++) {
        const row = sentryRow[i];
        if (row < 0) {
          put(i, rest, 60, 0);
          continue;
        }
        const t = Math.min(Math.max((sentry[row].psCum + 10) / 9, 0), 1); // Palermo -10 .. -1
        put(i, rampColor(stops, t), 255, 1 + Math.round(254 * t));
      }
      return {
        rgba,
        priority,
        legend: { kind: "ramp", stops: RISK_RAMP, low: "−10", high: "−1", rest: { color: REST, label: "Not on the Sentry list" } },
      };
    }
  }
}
