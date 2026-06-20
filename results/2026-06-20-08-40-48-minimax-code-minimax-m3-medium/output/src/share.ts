/**
 * URL deep-linking — encode current view state (time, selected body,
 * follow target, filters, camera) into the location hash and read it back
 * on load. Hash-based so it survives server restarts and doesn't require
 * a hash router.
 */

import type { AppState, CameraState } from "./types";
import { dateToJd } from "./orbit";

export function encodeStateToHash(state: AppState): string {
  const params = new URLSearchParams();
  if (state.time) params.set("t", state.time.toFixed(3));
  if (state.selected) params.set("s", state.selected);
  if (state.follow) params.set("f", state.follow);
  if (state.speed !== 1) params.set("sp", String(state.speed));

  // Filters (only set if non-default).
  const f = state.filters;
  if (!f.orbits) params.set("fo", "0");
  if (f.labels) params.set("fl", "1");
  if (f.comets) params.set("fc", "1");
  if (f.phaOnly) params.set("fp", "1");
  if (f.sentryOnly) params.set("fs", "1");
  if (f.closeOnly) params.set("fcl", "1");
  if (f.classCode) params.set("fclc", String(f.classCode));
  if (f.minDiameter > 0) params.set("fd", String(f.minDiameter));
  if (f.maxMoid > 0) params.set("fm", String(f.maxMoid));
  if (f.search) params.set("fq", f.search);

  // Camera.
  const c = state.camera;
  params.set("cx", c.x.toFixed(2));
  params.set("cy", c.y.toFixed(2));
  params.set("cz", c.z.toFixed(2));
  params.set("ctx", c.tx.toFixed(2));
  params.set("cty", c.ty.toFixed(2));
  params.set("ctz", c.tz.toFixed(2));
  return params.toString();
}

export function decodeStateFromHash(defaultTime: number): Partial<AppState> | null {
  if (!location.hash || location.hash.length < 2) return null;
  const params = new URLSearchParams(location.hash.slice(1));
  const out: Partial<AppState> = {};
  const t = params.get("t");
  if (t) out.time = parseFloat(t);
  const s = params.get("s");
  if (s) out.selected = s;
  const f = params.get("f");
  if (f) out.follow = f;
  const sp = params.get("sp");
  if (sp) out.speed = parseFloat(sp);

  const filt: any = {};
  if (params.has("fo")) filt.orbits = params.get("fo") !== "0";
  if (params.has("fl")) filt.labels = params.get("fl") === "1";
  if (params.has("fc")) filt.comets = params.get("fc") === "1";
  if (params.has("fp")) filt.phaOnly = params.get("fp") === "1";
  if (params.has("fs")) filt.sentryOnly = params.get("fs") === "1";
  if (params.has("fcl")) filt.closeOnly = params.get("fcl") === "1";
  if (params.has("fclc")) filt.classCode = parseInt(params.get("fclc") ?? "0", 10);
  if (params.has("fd")) filt.minDiameter = parseFloat(params.get("fd") ?? "0");
  if (params.has("fm")) filt.maxMoid = parseFloat(params.get("fm") ?? "0");
  if (params.has("fq")) filt.search = params.get("fq") ?? "";
  if (Object.keys(filt).length > 0) out.filters = filt;

  if (params.has("cx")) {
    const cam: CameraState = {
      x: parseFloat(params.get("cx") ?? "0"),
      y: parseFloat(params.get("cy") ?? "0"),
      z: parseFloat(params.get("cz") ?? "0"),
      tx: parseFloat(params.get("ctx") ?? "0"),
      ty: parseFloat(params.get("cty") ?? "0"),
      tz: parseFloat(params.get("ctz") ?? "0"),
    };
    out.camera = cam;
  }
  return out;
}

export function updateHash(state: AppState) {
  const hash = encodeStateToHash(state);
  if (location.hash.slice(1) !== hash) {
    history.replaceState(null, "", "#" + hash);
  }
}

/** Convert a user-friendly date (ISO) into a JD for "now" defaults. */
export function nowJd(): number {
  return dateToJd(new Date());
}
