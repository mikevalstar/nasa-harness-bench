import "./style.css";
import * as THREE from "three";
import { SceneManager } from "./scene";
import { AsteroidLayer, type ColorMode } from "./asteroids";
import { PlanetSystem } from "./planets";
import { CometLayer } from "./comets";
import { loadCore, loadCloseApproaches } from "./data";
import { UI, type FilterState } from "./ui";
import { J2000, nowJD } from "./jd";
import {
  prepareOrbit,
  propagate,
  type OrbitElements,
  type Vec3,
} from "./kepler";
import type { AsteroidMeta } from "./types";

type Selection =
  | { kind: "asteroid"; index: number }
  | { kind: "comet"; index: number }
  | { kind: "planet"; name: string }
  | null;

const ELEMENTS_PER_AST = 8;

class App {
  private sm: SceneManager;
  private ui: UI;
  private planets!: PlanetSystem;
  private asteroids!: AsteroidLayer;
  private comets!: CometLayer;
  private meta!: AsteroidMeta;
  private elements!: Float32Array;
  private sentryDes = new Set<string>();
  private sentryMap: Record<string, any> = {};

  private jd = nowJD();
  private playing = true;
  private speed = 7; // days per second
  private selection: Selection = null;
  private following = false;
  private followLast = new THREE.Vector3();
  private mask!: Uint8Array;

  private clock = new THREE.Clock();
  private fpsAccum = 0;
  private fpsFrames = 0;
  private tmpVec: Vec3 = { x: 0, y: 0, z: 0 };
  private selectionMarker: THREE.Mesh;
  private planetLabels: HTMLElement[] = [];
  private selLabel: HTMLElement;

  constructor() {
    const canvas = document.getElementById("scene") as HTMLCanvasElement;
    this.sm = new SceneManager(canvas);
    this.ui = new UI(this.makeCallbacks());

    this.selectionMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.0, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      }),
    );
    this.selectionMarker.visible = false;
    this.sm.scene.add(this.selectionMarker);

    this.selLabel = document.createElement("div");
    this.selLabel.className = "label";
    this.selLabel.style.display = "none";
    document.body.appendChild(this.selLabel);
  }

  async start(): Promise<void> {
    const loadingText = document.getElementById("loading-text")!;
    const data = await loadCore((m) => (loadingText.textContent = m));
    this.meta = data.meta;
    this.elements = data.elements;
    this.sentryMap = data.sentry;
    this.sentryDes = new Set(Object.keys(data.sentry));

    const pr = this.sm.renderer.getPixelRatio();

    this.planets = new PlanetSystem(data.planets);
    this.sm.scene.add(this.planets.group);
    this.sm.scene.add(this.planets.orbitsGroup);

    this.asteroids = new AsteroidLayer(this.elements, this.meta, this.sentryDes, pr);
    this.sm.scene.add(this.asteroids.points);

    // pick points share geometry with the asteroid layer
    const pickPoints = new THREE.Points(
      this.asteroids.points.geometry,
      this.asteroids.pickingMaterial,
    );
    pickPoints.frustumCulled = false;
    this.sm.pickScene.add(pickPoints);

    this.comets = new CometLayer(data.comets, pr);
    this.sm.scene.add(this.comets.points);

    // planet labels
    for (const b of this.planets.bodies) {
      const lbl = document.createElement("div");
      lbl.className = "label planet";
      lbl.textContent = b.name;
      document.body.appendChild(lbl);
      this.planetLabels.push(lbl);
    }

    // scrub range: ~1900..2100
    const scrubMin = J2000 - 36525; // ~1900
    const scrubMax = J2000 + 27393; // ~2075
    this.ui.init(this.meta, scrubMin, scrubMax);

    this.mask = new Uint8Array(this.meta.count).fill(1);
    this.onFilters(this.ui.getFilter());

    this.applyDeepLink();

    this.bindPointer();
    document.getElementById("loading")!.classList.add("hidden");
    this.ui.syncSpeedSlider(this.speed);

    this.loop();
  }

  // ---------------- callbacks for UI ----------------
  private makeCallbacks() {
    return {
      togglePlay: () => {
        this.playing = !this.playing;
      },
      setSpeed: (s: number) => {
        this.speed = s;
        if (s !== 0) this.playing = true;
        else this.playing = false;
      },
      setTimeJD: (jd: number) => {
        this.jd = jd;
      },
      stepDays: (d: number) => {
        this.jd += d;
        this.playing = false;
      },
      resetToNow: () => {
        this.jd = nowJD();
      },
      setColorMode: (m: ColorMode) => this.asteroids.setColorMode(m),
      setShowOrbits: (v: boolean) => this.planets.setOrbitsVisible(v),
      setShowComets: (v: boolean) => this.comets.setVisible(v),
      setShowAsteroids: (v: boolean) => (this.asteroids.points.visible = v),
      setSizeScale: (v: number) => this.asteroids.setSizeScale(v),
      setDimFiltered: (v: boolean) => this.asteroids.setDimMode(v),
      onFiltersChanged: (f: FilterState) => this.onFilters(f),
      onSelectResult: (i: number) => this.select({ kind: "asteroid", index: i }, true),
      focusSelected: () => this.focusSelected(),
      toggleFollow: (v: boolean) => this.setFollowing(v),
      clearSelection: () => this.select(null, false),
      copyLink: () => this.copyLink(),
    };
  }

  // ---------------- filters / search ----------------
  private onFilters(f: FilterState): void {
    const m = this.meta;
    const mask = this.mask;
    for (let i = 0; i < m.count; i++) {
      let pass = true;
      if (f.pha && !m.pha[i]) pass = false;
      else if (f.sentry && !(m.pdes[i] && this.sentryDes.has(m.pdes[i]!))) pass = false;
      else if (!f.classes.has(m.cls[i])) pass = false;
      else if (f.maxMoid != null && !(m.moid[i] != null && m.moid[i]! <= f.maxMoid)) pass = false;
      else if (f.minDiameter != null && !(m.diameter[i] != null && m.diameter[i]! >= f.minDiameter)) pass = false;
      mask[i] = pass ? 1 : 0;
    }
    const count = this.asteroids.applyFilter(mask);
    this.ui.setStats(count);
    this.refreshResults();
  }

  private refreshResults(): void {
    const f = this.ui.getFilter ? this.ui.getFilter() : null;
    const m = this.meta;
    const q = (f?.search ?? "").toLowerCase();
    const out: number[] = [];
    for (let i = 0; i < m.count && out.length < 400; i++) {
      if (this.mask[i] === 0) continue;
      if (q) {
        const fn = (m.full_name[i] ?? "").toLowerCase();
        const nm = (m.name[i] ?? "").toLowerCase();
        const pd = (m.pdes[i] ?? "").toLowerCase();
        if (!fn.includes(q) && !nm.includes(q) && !pd.includes(q)) continue;
      }
      out.push(i);
    }
    // Rank: sentry, then PHA, then larger diameter first.
    out.sort((a, b) => {
      const sa = (m.pdes[a] && this.sentryDes.has(m.pdes[a]!)) ? 1 : 0;
      const sb = (m.pdes[b] && this.sentryDes.has(m.pdes[b]!)) ? 1 : 0;
      if (sa !== sb) return sb - sa;
      if (m.pha[a] !== m.pha[b]) return m.pha[b] - m.pha[a];
      return (m.diameter[b] ?? 0) - (m.diameter[a] ?? 0);
    });
    this.ui.setResults(out);
  }

  // ---------------- selection ----------------
  private select(sel: Selection, frame: boolean): void {
    this.selection = sel;
    if (!sel) {
      this.asteroids.setSelected(-1);
      this.selectionMarker.visible = false;
      this.selLabel.style.display = "none";
      this.ui.hideDetail();
      this.setFollowing(false);
      return;
    }
    if (sel.kind === "asteroid") {
      this.asteroids.setSelected(sel.index);
      const des = this.meta.pdes[sel.index];
      const sentry = des && this.sentryMap[des] ? this.sentryMap[des] : null;
      this.ui.showDetail(
        { index: sel.index, meta: this.meta, sentry },
        null,
        this.jd,
      );
      if (des) {
        loadCloseApproaches().then((ca) => {
          if (this.selection?.kind === "asteroid" && this.selection.index === sel.index) {
            this.ui.showDetail(
              { index: sel.index, meta: this.meta, sentry },
              ca[des] ?? [],
              this.jd,
            );
          }
        });
      } else {
        this.ui.showDetail({ index: sel.index, meta: this.meta, sentry }, [], this.jd);
      }
    } else {
      this.asteroids.setSelected(-1);
    }
    if (frame) this.focusSelected();
  }

  private selectionPosition(out: THREE.Vector3): boolean {
    const sel = this.selection;
    if (!sel) return false;
    if (sel.kind === "asteroid") {
      computeAsteroidPosition(this.elements, sel.index, this.jd, this.tmpVec);
      out.set(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
      return true;
    }
    if (sel.kind === "comet") {
      this.comets.getPosition(sel.index, out);
      return true;
    }
    const body = this.planets.getBody(sel.name);
    if (body) {
      out.set(body.pos.x, body.pos.y, body.pos.z);
      return true;
    }
    return false;
  }

  private focusSelected(): void {
    const pos = new THREE.Vector3();
    if (!this.selectionPosition(pos)) return;
    const cam = this.sm.camera;
    const ctrl = this.sm.controls;
    const dir = new THREE.Vector3().subVectors(cam.position, ctrl.target).normalize();
    let dist = 0.6;
    if (this.selection?.kind === "planet") {
      const b = this.planets.getBody(this.selection.name);
      dist = b ? Math.max(b.radiusScene * 12, 0.15) : 0.4;
    }
    ctrl.target.copy(pos);
    cam.position.copy(pos).addScaledVector(dir, dist);
    this.followLast.copy(pos);
  }

  private setFollowing(v: boolean): void {
    this.following = v;
    this.ui.setFollowing(v);
    if (v) {
      const pos = new THREE.Vector3();
      if (this.selectionPosition(pos)) this.followLast.copy(pos);
    }
  }

  // ---------------- pointer ----------------
  private bindPointer(): void {
    const dom = this.sm.renderer.domElement;
    let downX = 0,
      downY = 0,
      moved = false;

    dom.addEventListener("pointerdown", (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      moved = false;
    });
    dom.addEventListener("pointermove", (e: PointerEvent) => {
      if (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4) moved = true;
      this.handleHover(e.clientX, e.clientY);
    });
    dom.addEventListener("pointerup", (e: PointerEvent) => {
      if (moved) return;
      this.handleClick(e.clientX, e.clientY);
    });
    dom.addEventListener("pointerleave", () => this.ui.hideTooltip());
  }

  private raycastPlanet(clientX: number, clientY: number): string | null {
    const rect = this.sm.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const rc = new THREE.Raycaster();
    rc.params.Points = { threshold: 0 };
    rc.setFromCamera(ndc, this.sm.camera);
    const meshes = [this.planets.sun, ...this.planets.bodies.map((b) => b.mesh)];
    const hits = rc.intersectObjects(meshes, false);
    if (hits.length) return hits[0].object.name;
    return null;
  }

  private pickComet(clientX: number, clientY: number): number {
    if (!this.comets.visible) return -1;
    const rect = this.sm.renderer.domElement.getBoundingClientRect();
    const cam = this.sm.camera;
    const v = new THREE.Vector3();
    let best = -1;
    let bestD = 14; // px
    for (let i = 0; i < this.comets.count; i++) {
      this.comets.getPosition(i, v);
      if (v.x > 1e6) continue;
      v.project(cam);
      if (v.z > 1) continue;
      const sx = rect.left + ((v.x + 1) / 2) * rect.width;
      const sy = rect.top + ((1 - v.y) / 2) * rect.height;
      const d = Math.hypot(sx - clientX, sy - clientY);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  private handleClick(x: number, y: number): void {
    const planet = this.raycastPlanet(x, y);
    if (planet) {
      this.select({ kind: "planet", name: planet }, true);
      return;
    }
    this.asteroids.swapToPicking();
    const id = this.sm.pick(x, y);
    this.asteroids.swapToNormal();
    if (id >= 0 && id < this.meta.count) {
      this.select({ kind: "asteroid", index: id }, true);
      return;
    }
    const comet = this.pickComet(x, y);
    if (comet >= 0) {
      this.selectComet(comet);
      return;
    }
    this.select(null, false);
  }

  private selectComet(i: number): void {
    this.selection = { kind: "comet", index: i };
    this.asteroids.setSelected(-1);
    const c = this.comets.data[i];
    // Minimal comet detail reuses the asteroid panel via a synthetic meta-like view.
    this.showCometDetail(i);
    void c;
    this.focusSelected();
  }

  private showCometDetail(i: number): void {
    const c = this.comets.data[i];
    const detail = document.getElementById("detail")!;
    detail.innerHTML = "";
    const head = document.createElement("div");
    head.className = "detail-head";
    head.innerHTML = `<div><div class="title">${c.full_name}</div><div class="sub">Comet · ${c.cls}</div></div>`;
    const x = document.createElement("div");
    x.className = "close-x";
    x.textContent = "✕";
    x.onclick = () => this.select(null, false);
    head.appendChild(x);
    detail.appendChild(head);
    const body = document.createElement("div");
    body.className = "detail-body";
    const orbitType = c.e < 1 ? "Elliptic (periodic)" : c.e > 1 ? "Hyperbolic (unbound)" : "Parabolic";
    body.innerHTML = `
      <div class="prop-grid">
        <div class="prop"><div class="k">Orbit type</div><div class="v">${orbitType}</div></div>
        <div class="prop"><div class="k">Eccentricity</div><div class="v">${c.e.toFixed(4)}</div></div>
        <div class="prop"><div class="k">Perihelion q</div><div class="v">${c.q.toFixed(3)} au</div></div>
        <div class="prop"><div class="k">Inclination</div><div class="v">${c.i.toFixed(2)}°</div></div>
        <div class="prop"><div class="k">Diameter</div><div class="v">${c.diameter != null ? c.diameter + " km" : "—"}</div></div>
        <div class="prop"><div class="k">Total mag M1</div><div class="v">${c.M1 ?? "—"}</div></div>
      </div>`;
    detail.appendChild(body);
    const actions = document.createElement("div");
    actions.className = "detail-actions";
    const focus = document.createElement("button");
    focus.className = "btn primary";
    focus.textContent = "Focus";
    focus.onclick = () => this.focusSelected();
    const follow = document.createElement("button");
    follow.className = "btn";
    follow.textContent = this.following ? "Following ✓" : "Follow";
    follow.onclick = () => this.setFollowing(!this.following);
    actions.append(focus, follow);
    detail.appendChild(actions);
    detail.classList.add("open");
  }

  private handleHover(x: number, y: number): void {
    // planets first
    const planet = this.raycastPlanet(x, y);
    if (planet) {
      this.ui.showTooltip(x, y, planet);
      return;
    }
    this.asteroids.swapToPicking();
    const id = this.sm.pick(x, y);
    this.asteroids.swapToNormal();
    if (id >= 0 && id < this.meta.count) {
      const name = this.meta.full_name[id] ?? this.meta.pdes[id] ?? "Asteroid";
      this.ui.showTooltip(x, y, name + (this.meta.pha[id] ? " ⚠" : ""));
      return;
    }
    const comet = this.pickComet(x, y);
    if (comet >= 0) {
      this.ui.showTooltip(x, y, this.comets.data[comet].full_name);
      return;
    }
    this.ui.hideTooltip();
  }

  // ---------------- deep links ----------------
  private copyLink(): void {
    const cam = this.sm.camera;
    const t = this.sm.controls.target;
    const parts: string[] = [];
    parts.push(`t=${this.jd.toFixed(4)}`);
    if (this.selection) {
      if (this.selection.kind === "asteroid") parts.push(`s=a${this.selection.index}`);
      else if (this.selection.kind === "comet") parts.push(`s=c${this.selection.index}`);
      else parts.push(`s=p${this.selection.name}`);
    }
    const n = (v: number) => v.toFixed(4);
    parts.push(`c=${n(cam.position.x)},${n(cam.position.y)},${n(cam.position.z)}`);
    parts.push(`g=${n(t.x)},${n(t.y)},${n(t.z)}`);
    if (this.following) parts.push("f=1");
    const url = `${location.origin}${location.pathname}${location.search}#${parts.join("&")}`;
    location.hash = parts.join("&");
    navigator.clipboard?.writeText(url).then(
      () => this.flashLinkCopied(),
      () => this.flashLinkCopied(),
    );
  }

  private flashLinkCopied(): void {
    this.ui.showTooltip(window.innerWidth / 2, 70, "Link copied to clipboard");
    setTimeout(() => this.ui.hideTooltip(), 1400);
  }

  private applyDeepLink(): void {
    const hash = location.hash.replace(/^#/, "");
    if (!hash) return;
    const params = new URLSearchParams(hash.replace(/&/g, "&"));
    const t = params.get("t");
    if (t) this.jd = Number(t);
    const c = params.get("c");
    const g = params.get("g");
    if (c) {
      const [x, y, z] = c.split(",").map(Number);
      this.sm.camera.position.set(x, y, z);
    }
    if (g) {
      const [x, y, z] = g.split(",").map(Number);
      this.sm.controls.target.set(x, y, z);
    }
    const s = params.get("s");
    if (s) {
      const kind = s[0];
      const rest = s.slice(1);
      if (kind === "a") this.select({ kind: "asteroid", index: Number(rest) }, false);
      else if (kind === "c") this.selectComet(Number(rest));
      else if (kind === "p") this.select({ kind: "planet", name: rest }, false);
    }
    if (params.get("f") === "1") this.setFollowing(true);
    this.playing = false;
  }

  // ---------------- main loop ----------------
  private loop = (): void => {
    requestAnimationFrame(this.loop);
    const dt = this.clock.getDelta();

    if (this.playing) this.jd += this.speed * dt;

    this.planets.update(this.jd);
    this.comets.update(this.jd);
    this.asteroids.setTime(this.jd - J2000);

    // follow: shift camera + target by the body's motion
    if (this.following && this.selection) {
      const pos = new THREE.Vector3();
      if (this.selectionPosition(pos)) {
        const delta = pos.clone().sub(this.followLast);
        this.sm.camera.position.add(delta);
        this.sm.controls.target.add(delta);
        this.followLast.copy(pos);
      }
    }

    this.sm.controls.update();

    // selection marker
    if (this.selection) {
      const pos = new THREE.Vector3();
      if (this.selectionPosition(pos)) {
        this.selectionMarker.visible = true;
        this.selectionMarker.position.copy(pos);
        const d = this.sm.camera.position.distanceTo(pos);
        const r = d * 0.02;
        this.selectionMarker.scale.setScalar(r);
        this.selectionMarker.quaternion.copy(this.sm.camera.quaternion);
        this.updateSelLabel(pos);
      }
    }

    this.sm.render();
    this.updatePlanetLabels();

    // fps
    this.fpsAccum += dt;
    this.fpsFrames++;
    if (this.fpsAccum >= 0.5) {
      this.ui.setFps(Math.round(this.fpsFrames / this.fpsAccum));
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }
    this.ui.setTimeDisplay(this.jd, this.playing, this.speed);
  };

  private updateSelLabel(pos: THREE.Vector3): void {
    let name = "";
    if (this.selection?.kind === "asteroid")
      name = this.meta.full_name[this.selection.index] ?? "";
    else if (this.selection?.kind === "comet")
      name = this.comets.data[this.selection.index].full_name;
    else if (this.selection?.kind === "planet") name = this.selection.name;
    const p = pos.clone().project(this.sm.camera);
    if (p.z > 1) {
      this.selLabel.style.display = "none";
      return;
    }
    const x = (p.x + 1) / 2 * window.innerWidth;
    const y = (1 - p.y) / 2 * window.innerHeight;
    this.selLabel.style.display = "block";
    this.selLabel.style.left = `${x}px`;
    this.selLabel.style.top = `${y - 18}px`;
    this.selLabel.textContent = name;
  }

  private updatePlanetLabels(): void {
    const cam = this.sm.camera;
    const v = new THREE.Vector3();
    for (let k = 0; k < this.planets.bodies.length; k++) {
      const b = this.planets.bodies[k];
      v.set(b.pos.x, b.pos.y, b.pos.z).project(cam);
      const lbl = this.planetLabels[k];
      if (v.z > 1 || v.x < -1 || v.x > 1 || v.y < -1 || v.y > 1) {
        lbl.style.display = "none";
        continue;
      }
      lbl.style.display = "block";
      lbl.style.left = `${((v.x + 1) / 2) * window.innerWidth}px`;
      lbl.style.top = `${((1 - v.y) / 2) * window.innerHeight - 14}px`;
    }
  }
}

// CPU asteroid position from packed elements (elliptic).
function computeAsteroidPosition(
  elements: Float32Array,
  index: number,
  jd: number,
  out: Vec3,
): void {
  const b = index * ELEMENTS_PER_AST;
  const el: OrbitElements = {
    a: elements[b + 0],
    e: elements[b + 1],
    i: elements[b + 2],
    om: elements[b + 3],
    w: elements[b + 4],
    q: elements[b + 0] * (1 - elements[b + 1]),
    ma: elements[b + 5],
    n: elements[b + 6],
    epoch: elements[b + 7] + J2000,
  };
  const orbit = prepareOrbit(el);
  propagate(orbit, jd, out);
}

const app = new App();
app.start().catch((err) => {
  console.error(err);
  const lt = document.getElementById("loading-text");
  if (lt) lt.textContent = "Failed to load data. See console.";
});
