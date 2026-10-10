// Deep links: the current view lives in the URL hash so a moment can be shared and reopened.
import type { BodyRef, Catalog } from "./data.ts";
import { COLOR_MODES, type ColorMode, type Filters } from "./encoding.ts";
import type { CameraState } from "./scene.ts";

export type ViewLink = {
  jd?: number;
  selected?: BodyRef;
  follow?: boolean;
  camera?: CameraState;
  colorMode?: ColorMode;
  hazard?: Filters["hazard"];
  rate?: number;
  playing?: boolean;
};

const KIND_CODE = { asteroid: "a", comet: "c", planet: "p" } as const;

function refToken(cat: Catalog, ref: BodyRef): string {
  const id = ref.kind === "planet" ? cat.planets[ref.idx]!.name : ref.kind === "asteroid" ? cat.asteroids.pdes[ref.idx]! : cat.comets.pdes[ref.idx]!;
  return `${KIND_CODE[ref.kind]}:${id}`;
}

function parseRef(cat: Catalog, token: string): BodyRef | undefined {
  const [code, ...rest] = token.split(":");
  const id = rest.join(":");
  const find = (list: readonly string[]) => list.indexOf(id);
  const idx = code === "p" ? cat.planets.findIndex((p) => p.name === id) : code === "a" ? find(cat.asteroids.pdes) : code === "c" ? find(cat.comets.pdes) : -1;
  if (idx < 0) return undefined;
  return { kind: code === "p" ? "planet" : code === "a" ? "asteroid" : "comet", idx };
}

export function writeLink(cat: Catalog, v: Required<Omit<ViewLink, "selected">> & { selected: BodyRef | null }) {
  const p = new URLSearchParams();
  p.set("t", v.jd.toFixed(4));
  if (v.selected) p.set("sel", refToken(cat, v.selected));
  if (v.follow) p.set("follow", "1");
  const c = v.camera;
  p.set("cam", [...c.target.map((x) => x.toPrecision(7)), c.dist.toPrecision(5), c.az.toFixed(4), c.el.toFixed(4)].join(","));
  p.set("color", v.colorMode);
  if (v.hazard !== "all") p.set("show", v.hazard);
  p.set("rate", String(v.rate));
  if (!v.playing) p.set("paused", "1");
  history.replaceState(null, "", `#${p.toString()}`);
}

export function readLink(cat: Catalog): ViewLink {
  const p = new URLSearchParams(location.hash.slice(1));
  const out: ViewLink = {};
  const num = (k: string) => {
    const v = Number(p.get(k));
    return p.has(k) && Number.isFinite(v) ? v : undefined;
  };
  out.jd = num("t");
  const sel = p.get("sel");
  if (sel) out.selected = parseRef(cat, sel);
  out.follow = p.get("follow") === "1";
  const cam = p.get("cam")?.split(",").map(Number);
  if (cam?.length === 6 && cam.every(Number.isFinite)) {
    const [x, y, z, dist, az, el] = cam as [number, number, number, number, number, number];
    out.camera = { target: [x, y, z], dist, az, el };
  }
  const color = p.get("color");
  if (color && color in COLOR_MODES) out.colorMode = color as ColorMode;
  const show = p.get("show");
  if (show === "pha" || show === "sentry") out.hazard = show;
  out.rate = num("rate");
  out.playing = p.has("t") ? p.get("paused") !== "1" : undefined;
  return out;
}
