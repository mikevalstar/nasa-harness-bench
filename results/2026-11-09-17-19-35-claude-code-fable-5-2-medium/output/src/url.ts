/** Deep links: the clock, selection, camera and colour mode live in the URL hash. */
import type { BodyKind, BodyRef, Ephemeris } from "./bodies.ts";
import type { Vec3 } from "./orbit.ts";
import type { CameraPose } from "./scene/stage.ts";
import { COLOR_MODES, type AppState, type ColorMode } from "./state.ts";
import { JD_MAX, JD_MIN } from "./time.ts";

export interface Link {
  jd?: number;
  selected?: BodyRef;
  follow?: boolean;
  pose?: CameraPose;
  colorMode?: ColorMode;
}

const round = (value: number): string => String(Number(value.toPrecision(7)));

export function writeLink(state: AppState, pose: CameraPose, eph: Ephemeris): string {
  const params = new URLSearchParams();
  params.set("t", state.jd.toFixed(4));
  const selected = state.selected;
  if (selected) {
    const { planets, asteroids, comets } = eph.catalog;
    const id =
      selected.kind === "asteroid"
        ? asteroids.pdes[selected.index]
        : selected.kind === "comet"
          ? comets.pdes[selected.index]
          : selected.kind === "planet"
            ? planets[selected.index].name
            : "Sun";
    params.set("sel", `${selected.kind}:${id}`);
    if (state.follow) params.set("follow", "1");
  }
  params.set("cam", [...pose.offset, ...pose.target].map(round).join(","));
  params.set("color", state.colorMode);
  return params.toString();
}

function findBody(value: string, eph: Ephemeris): BodyRef | undefined {
  const split = value.indexOf(":");
  const kind = value.slice(0, split) as BodyKind;
  const id = value.slice(split + 1);
  const { planets, asteroidByDes, cometByDes } = eph.catalog;
  const index =
    kind === "sun"
      ? 0
      : kind === "planet"
        ? planets.findIndex((p) => p.name === id)
        : kind === "asteroid"
          ? asteroidByDes.get(id)
          : kind === "comet"
            ? cometByDes.get(id)
            : undefined;
  return index === undefined || index < 0 ? undefined : { kind, index };
}

export function readLink(hash: string, eph: Ephemeris): Link {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const link: Link = {};

  const jd = Number(params.get("t"));
  if (params.has("t") && Number.isFinite(jd)) link.jd = Math.min(Math.max(jd, JD_MIN), JD_MAX);

  const sel = params.get("sel");
  if (sel) {
    link.selected = findBody(sel, eph);
    link.follow = link.selected !== undefined && params.get("follow") === "1";
  }

  const cam = params.get("cam")?.split(",").map(Number);
  if (cam && cam.length === 6 && cam.every(Number.isFinite)) {
    link.pose = { offset: cam.slice(0, 3) as Vec3, target: cam.slice(3) as Vec3 };
  }

  const color = params.get("color");
  if (color && (COLOR_MODES as readonly string[]).includes(color)) link.colorMode = color as ColorMode;
  return link;
}
