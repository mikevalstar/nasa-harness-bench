// Filters and visual encoding: decides which asteroids are drawn, and in what colour and size.
import { firstApproachAfter, type Catalog } from "./data.ts";

export const CLASS_GROUPS = {
  IEO: { label: "Atira", color: "#c78cff" },
  ATE: { label: "Aten", color: "#ffcf5c" },
  APO: { label: "Apollo", color: "#5cb8ff" },
  AMO: { label: "Amor", color: "#6fdc8c" },
  CMT: { label: "Comet-like", color: "#ff8fcf" },
} as const;
export type ClassGroup = keyof typeof CLASS_GROUPS;

export const classGroup = (cls: string): ClassGroup =>
  cls === "IEO" || cls === "ATE" || cls === "APO" || cls === "AMO" ? cls : "CMT";

export const COLOR_MODES = {
  hazard: "Hazard",
  class: "Orbit class",
  size: "Size",
  moid: "Earth MOID",
  risk: "Impact risk (Palermo)",
} as const;
export type ColorMode = keyof typeof COLOR_MODES;

export type Filters = {
  hazard: "all" | "pha" | "sentry";
  classes: Record<ClassGroup, boolean>;
  /** Minimum (measured or estimated) diameter in metres; 0 = no limit. */
  minDiameterM: number;
  /** Maximum Earth MOID in au; null = no limit. */
  maxMoid: number | null;
  /** "window": only objects with a recorded Earth approach within ±windowDays of the current time. */
  approach: "any" | "recorded" | "window";
  windowDays: number;
};

export const defaultFilters = (): Filters => ({
  hazard: "all",
  classes: { IEO: true, ATE: true, APO: true, AMO: true, CMT: true },
  minDiameterM: 0,
  maxMoid: null,
  approach: "any",
  windowDays: 30,
});

type RGB = [number, number, number];
type Stop = [at: number, color: string];

const hex = (h: string): RGB => {
  const v = parseInt(h.slice(1), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};

type ParsedRamp = (readonly [number, RGB])[];
const parse = (stops: Stop[]): ParsedRamp => stops.map(([at, c]) => [at, hex(c)] as const);

function ramp(s: ParsedRamp, t: number): RGB {
  if (t <= s[0]![0]) return s[0]![1];
  for (let k = 1; k < s.length; k++) {
    const [a0, c0] = s[k - 1]!;
    const [a1, c1] = s[k]!;
    if (t <= a1) {
      const u = (t - a0) / (a1 - a0);
      return [c0[0] + (c1[0] - c0[0]) * u, c0[1] + (c1[1] - c0[1]) * u, c0[2] + (c1[2] - c0[2]) * u];
    }
  }
  return s[s.length - 1]![1];
}

// Ramps are expressed over the legend's domain so the legend can render them directly.
const SIZE_STOPS: Stop[] = [[0, "#3b4cc0"], [0.35, "#4fa3d8"], [0.6, "#9ad86a"], [0.8, "#ffd04a"], [1, "#ff6a3d"]];
const MOID_STOPS: Stop[] = [[0, "#ff4a3d"], [0.15, "#ffae3d"], [0.4, "#e8e0a0"], [1, "#3e6dcc"]];
const RISK_STOPS: Stop[] = [[0, "#7b5cff"], [0.5, "#ff7a3d"], [1, "#ff2050"]];

const SIZE_RAMP = parse(SIZE_STOPS);
const MOID_RAMP = parse(MOID_STOPS);
const RISK_RAMP = parse(RISK_STOPS);
const CLASS_RGB = Object.fromEntries(
  Object.entries(CLASS_GROUPS).map(([k, g]) => [k, hex(g.color)]),
) as Record<ClassGroup, RGB>;

const HAZARD = {
  normal: hex("#5d7fa8"),
  pha: hex("#ffa23d"),
  sentry: hex("#ff3355"),
};
const DIM = hex("#3a4a60");

/** log10 diameter in metres mapped to 0..1 over 10 m – 10 km. */
const sizeT = (dKm: number) => (Math.log10(dKm * 1000) - 1) / 3;
/** Palermo scale mapped to 0..1 over -10 – -2. */
const paleT = (ps: number) => (ps + 10) / 8;

export type Legend =
  | { type: "swatches"; items: { color: string; label: string }[] }
  | { type: "ramp"; stops: Stop[]; left: string; right: string; note?: string };

export function legendFor(mode: ColorMode): Legend {
  switch (mode) {
    case "hazard":
      return {
        type: "swatches",
        items: [
          { color: "#5d7fa8", label: "Near-Earth asteroid" },
          { color: "#ffa23d", label: "Potentially hazardous (PHA)" },
          { color: "#ff3355", label: "On Sentry impact-risk list" },
        ],
      };
    case "class":
      return {
        type: "swatches",
        items: Object.values(CLASS_GROUPS).map((g) => ({ color: g.color, label: g.label })),
      };
    case "size":
      return { type: "ramp", stops: SIZE_STOPS, left: "10 m", right: "10 km+", note: "Estimated from H when unmeasured" };
    case "moid":
      return { type: "ramp", stops: MOID_STOPS, left: "0 au", right: "≥ 0.5 au", note: "Closest possible distance to Earth's orbit" };
    case "risk":
      return { type: "ramp", stops: RISK_STOPS, left: "Palermo −10", right: "−2", note: "Sentry objects only; others dimmed" };
  }
}

/**
 * Fills per-point colour (rgb) and size (px, 0 = hidden) for every asteroid.
 * Returns the number of visible objects.
 */
export function encodeAsteroids(
  cat: Catalog,
  filters: Filters,
  mode: ColorMode,
  jd: number,
  colors: Float32Array,
  sizes: Float32Array,
): number {
  const A = cat.asteroids;
  const inWindow = filters.approach === "window" ? approachWindow(cat, jd, filters.windowDays) : null;
  let visible = 0;

  for (let j = 0; j < A.count; j++) {
    const sentry = cat.sentryByIdx.get(j);
    const pha = A.pha[j]!;
    const dKm = cat.diameterKm[j]!;
    const moid = A.moid[j];

    const shown =
      filters.classes[classGroup(A.cls[j]!)] &&
      (filters.hazard === "all" || (filters.hazard === "pha" ? pha : sentry !== undefined)) &&
      (filters.minDiameterM === 0 || dKm * 1000 >= filters.minDiameterM) &&
      (filters.maxMoid === null || (moid != null && moid <= filters.maxMoid)) &&
      (filters.approach !== "recorded" || cat.approachesByIdx.has(j)) &&
      (inWindow === null || inWindow.has(j));

    if (!shown) {
      sizes[j] = 0;
      continue;
    }
    visible++;

    let size = Number.isFinite(dKm) ? 1.6 + 1.4 * Math.max(0, Math.log10(dKm * 1000) - 1) : 1.6;
    let c: RGB;
    switch (mode) {
      case "hazard":
        c = sentry ? HAZARD.sentry : pha ? HAZARD.pha : HAZARD.normal;
        if (pha) size += 0.8;
        if (sentry) size += 0.8;
        break;
      case "class":
        c = CLASS_RGB[classGroup(A.cls[j]!)];
        break;
      case "size":
        c = Number.isFinite(dKm) ? ramp(SIZE_RAMP, sizeT(dKm)) : DIM;
        break;
      case "moid":
        c = moid != null ? ramp(MOID_RAMP, Math.min(1, moid / 0.5)) : DIM;
        break;
      case "risk":
        if (sentry) {
          c = ramp(RISK_RAMP, paleT(sentry.ps_cum));
          size += 1.5;
        } else {
          c = DIM;
          size = 1.2;
        }
        break;
    }
    colors.set(c, j * 3);
    sizes[j] = Math.min(size, 7);
  }
  return visible;
}

/** Asteroids with a recorded Earth approach within ±days of `jd`. */
export function approachWindow(cat: Catalog, jd: number, days: number): Set<number> {
  const set = new Set<number>();
  const ap = cat.approaches;
  for (let r = firstApproachAfter(cat, jd - days); r < ap.count && ap.jd[r]! <= jd + days; r++) {
    set.add(ap.idx[r]!);
  }
  return set;
}
