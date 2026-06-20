/**
 * DOM overlay helpers — planet labels projected from 3D world position
 * into screen space each frame, plus a scale-bar indicator showing what
 * "1 au" looks like at the current zoom.
 */

import * as THREE from "three";
import type { SceneRefs } from "./scene";

const PLANET_NAMES = [
  "Mercury", "Venus", "Earth", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune",
];

const PLANET_LABEL_COLORS: Record<string, string> = {
  Mercury: "#b0a090",
  Venus: "#e6c187",
  Earth: "#6cb4ff",
  Mars: "#d56b4a",
  Jupiter: "#d9b284",
  Saturn: "#e6cf9b",
  Uranus: "#9bd9e6",
  Neptune: "#6c8eff",
};

export class Overlay {
  private labelLayer: HTMLDivElement;
  private scaleBar: HTMLDivElement;
  private scaleText: HTMLDivElement;
  private labels: Map<string, HTMLDivElement> = new Map();

  constructor() {
    // Layer for planet labels.
    this.labelLayer = document.createElement("div");
    this.labelLayer.style.position = "fixed";
    this.labelLayer.style.inset = "0";
    this.labelLayer.style.pointerEvents = "none";
    this.labelLayer.style.zIndex = "5";
    this.labelLayer.style.overflow = "hidden";
    document.body.appendChild(this.labelLayer);

    // Scale bar at bottom-center.
    this.scaleBar = document.createElement("div");
    this.scaleBar.style.position = "fixed";
    this.scaleBar.style.left = "50%";
    this.scaleBar.style.bottom = "180px";
    this.scaleBar.style.transform = "translateX(-50%)";
    this.scaleBar.style.padding = "4px 10px";
    this.scaleBar.style.background = "rgba(8, 12, 24, 0.78)";
    this.scaleBar.style.border = "1px solid rgba(120, 160, 220, 0.18)";
    this.scaleBar.style.borderRadius = "4px";
    this.scaleBar.style.fontFamily =
      'ui-monospace, "SF Mono", "JetBrains Mono", monospace';
    this.scaleBar.style.fontSize = "10px";
    this.scaleBar.style.color = "#95a3b8";
    this.scaleBar.style.display = "flex";
    this.scaleBar.style.alignItems = "center";
    this.scaleBar.style.gap = "8px";
    this.scaleBar.style.zIndex = "6";
    this.scaleBar.style.pointerEvents = "none";
    this.scaleBar.innerHTML = `
      <span id="ov-scale-line" style="display:inline-block;height:2px;background:#6cc4ff;width:80px;"></span>
      <span id="ov-scale-text">1.0 au</span>
    `;
    document.body.appendChild(this.scaleBar);
    this.scaleText = this.scaleBar.querySelector("#ov-scale-text") as HTMLDivElement;

    for (const name of PLANET_NAMES) {
      const el = document.createElement("div");
      el.style.position = "absolute";
      el.style.transform = "translate(-50%, -100%)";
      el.style.padding = "1px 6px";
      el.style.fontSize = "10px";
      el.style.fontFamily =
        'ui-monospace, "SF Mono", "JetBrains Mono", monospace';
      el.style.fontWeight = "600";
      el.style.letterSpacing = "0.04em";
      el.style.color = PLANET_LABEL_COLORS[name] || "#e6ecf5";
      el.style.background = "rgba(8, 12, 24, 0.7)";
      el.style.border = `1px solid ${PLANET_LABEL_COLORS[name] || "#6cc4ff"}55`;
      el.style.borderRadius = "3px";
      el.style.textShadow = "0 0 4px rgba(0,0,0,0.7)";
      el.textContent = name;
      el.dataset.name = name;
      this.labelLayer.appendChild(el);
      this.labels.set(name, el);
    }
  }

  update(refs: SceneRefs, showLabels: boolean): void {
    // Update planet labels.
    for (let i = 0; i < refs.planetMeshes.length; i++) {
      const mesh = refs.planetMeshes[i];
      const name = (mesh.userData as any).name as string;
      const el = this.labels.get(name);
      if (!el) continue;
      const v = mesh.position.clone();
      // Offset label above the planet.
      v.y += 0.15;
      v.project(refs.camera);
      const x = (v.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
      const visible = v.z < 1;
      const display = showLabels && visible ? "block" : "none";
      el.style.display = display;
      if (visible) {
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
      }
    }

    // Update scale bar: show how many screen pixels correspond to 1 au at the
    // current camera distance / orientation.
    const dist = refs.camera.position.length();
    // Use a fixed reference: 1 au at the camera's target distance.
    // (Approximate: camera distance ≈ distance to target when looking at origin.)
    const fov = (refs.camera.fov * Math.PI) / 180;
    const heightWorld =
      2 * Math.tan(fov / 2) * dist; // world height visible at target distance
    const pxPerAu = window.innerHeight / heightWorld;
    // Find a "round" au value: target 80-120 px width.
    let auLabel = 1;
    if (pxPerAu > 250) auLabel = 0.1;
    else if (pxPerAu > 100) auLabel = 0.25;
    else if (pxPerAu > 50) auLabel = 1;
    else if (pxPerAu > 20) auLabel = 2;
    else if (pxPerAu > 8) auLabel = 5;
    else if (pxPerAu > 4) auLabel = 10;
    else if (pxPerAu > 1.5) auLabel = 20;
    else if (pxPerAu > 0.8) auLabel = 50;
    else auLabel = 100;
    const width = Math.max(20, Math.min(160, pxPerAu * auLabel));
    const lineEl = this.scaleBar.querySelector("#ov-scale-line") as HTMLDivElement;
    lineEl.style.width = `${width}px`;
    this.scaleText.textContent =
      auLabel >= 1 ? `${auLabel} au` : `${(auLabel * 149597870.7).toFixed(0)} km`;
  }

  dispose() {
    this.labelLayer.remove();
    this.scaleBar.remove();
  }
}
