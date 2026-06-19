// Shareable deep links: encode time, selection, camera, color mode and filter
// into the URL hash so a particular view can be linked and reopened.

import * as THREE from "three";

export interface ViewState {
  jd?: number;
  rate?: number;
  playing?: boolean;
  sel?: string; // "a:<idx>" asteroid or "c:<idx>" comet
  follow?: boolean;
  color?: number;
  cam?: number[]; // [px,py,pz, tx,ty,tz]
}

export function readState(): ViewState {
  const h = location.hash.replace(/^#/, "");
  if (!h) return {};
  const p = new URLSearchParams(h);
  const num = (k: string) => (p.has(k) ? Number(p.get(k)) : undefined);
  const cam = p.get("cam");
  return {
    jd: num("jd"),
    rate: num("rate"),
    playing: p.has("play") ? p.get("play") === "1" : undefined,
    sel: p.get("sel") ?? undefined,
    follow: p.has("follow") ? p.get("follow") === "1" : undefined,
    color: num("color"),
    cam: cam ? cam.split(",").map(Number) : undefined,
  };
}

let writeTimer: number | undefined;
export function writeState(s: ViewState) {
  // throttle to avoid hammering history on camera moves
  clearTimeout(writeTimer);
  writeTimer = window.setTimeout(() => {
    const p = new URLSearchParams();
    if (s.jd != null) p.set("jd", s.jd.toFixed(3));
    if (s.rate != null) p.set("rate", String(s.rate));
    if (s.playing != null) p.set("play", s.playing ? "1" : "0");
    if (s.sel) p.set("sel", s.sel);
    if (s.follow) p.set("follow", "1");
    if (s.color != null) p.set("color", String(s.color));
    if (s.cam) p.set("cam", s.cam.map((n) => n.toFixed(2)).join(","));
    history.replaceState(null, "", "#" + p.toString());
  }, 250);
}

export function cameraArray(
  cam: THREE.PerspectiveCamera,
  target: THREE.Vector3
): number[] {
  return [
    cam.position.x,
    cam.position.y,
    cam.position.z,
    target.x,
    target.y,
    target.z,
  ];
}
