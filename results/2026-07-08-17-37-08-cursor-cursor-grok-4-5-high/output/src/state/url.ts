import type { Filters, Selection } from "../data/types";
import { dateToJD, jdToDate } from "../astro/kepler";

export type UrlState = {
  jd: number;
  playing: boolean;
  speed: number;
  selection: Selection;
  follow: boolean;
  showComets: boolean;
  phaOnly: boolean;
  sentryOnly: boolean;
  query: string;
  cam?: { x: number; y: number; z: number; tx: number; ty: number; tz: number };
};

const DEFAULT_JD = dateToJD(new Date("2026-06-19T00:00:00Z"));

export function defaultUrlState(): UrlState {
  return {
    jd: DEFAULT_JD,
    playing: true,
    speed: 1, // days per real second
    selection: null,
    follow: false,
    showComets: false,
    phaOnly: false,
    sentryOnly: false,
    query: "",
  };
}

function encodeSelection(s: Selection): string | null {
  if (!s) return null;
  if (s.kind === "planet") return `p${s.index}`;
  if (s.kind === "asteroid") return `a${s.index}`;
  return `c${s.index}`;
}

function decodeSelection(v: string | null): Selection {
  if (!v) return null;
  const kind = v[0];
  const idx = Number(v.slice(1));
  if (!Number.isFinite(idx)) return null;
  if (kind === "p") return { kind: "planet", index: idx };
  if (kind === "a") return { kind: "asteroid", index: idx };
  if (kind === "c") return { kind: "comet", index: idx };
  return null;
}

export function readUrlState(): UrlState {
  const base = defaultUrlState();
  const params = new URLSearchParams(window.location.search);
  const t = params.get("t");
  if (t) {
    if (/^\d+(\.\d+)?$/.test(t)) base.jd = Number(t);
    else {
      const parsed = Date.parse(t);
      if (!Number.isNaN(parsed)) base.jd = parsed / 86400000 + 2440587.5;
    }
  }
  if (params.get("play") === "0") base.playing = false;
  if (params.get("play") === "1") base.playing = true;
  const speed = params.get("speed");
  if (speed && Number.isFinite(Number(speed))) base.speed = Number(speed);
  base.selection = decodeSelection(params.get("sel"));
  base.follow = params.get("follow") === "1";
  base.showComets = params.get("comets") === "1";
  base.phaOnly = params.get("pha") === "1";
  base.sentryOnly = params.get("sentry") === "1";
  base.query = params.get("q") ?? "";
  const cam = params.get("cam");
  if (cam) {
    const parts = cam.split(",").map(Number);
    if (parts.length === 6 && parts.every(Number.isFinite)) {
      base.cam = {
        x: parts[0],
        y: parts[1],
        z: parts[2],
        tx: parts[3],
        ty: parts[4],
        tz: parts[5],
      };
    }
  }
  return base;
}

export function writeUrlState(state: UrlState, replace = true) {
  const params = new URLSearchParams();
  const d = jdToDate(state.jd);
  const iso = d.toISOString().slice(0, 16);
  params.set("t", iso);
  if (!state.playing) params.set("play", "0");
  if (state.speed !== 1) params.set("speed", String(state.speed));
  const sel = encodeSelection(state.selection);
  if (sel) params.set("sel", sel);
  if (state.follow) params.set("follow", "1");
  if (state.showComets) params.set("comets", "1");
  if (state.phaOnly) params.set("pha", "1");
  if (state.sentryOnly) params.set("sentry", "1");
  if (state.query) params.set("q", state.query);
  if (state.cam) {
    const { x, y, z, tx, ty, tz } = state.cam;
    params.set(
      "cam",
      [x, y, z, tx, ty, tz].map((n) => n.toFixed(3)).join(","),
    );
  }
  const url = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  if (replace) history.replaceState(null, "", url);
  else history.pushState(null, "", url);
}

export function filtersFromUrl(state: UrlState): Filters {
  return {
    query: state.query,
    phaOnly: state.phaOnly,
    sentryOnly: state.sentryOnly,
    classes: new Set(),
    minDiameter: null,
    maxMoid: null,
    showComets: state.showComets,
    showAsteroids: true,
    highlightUpcoming: true,
  };
}
