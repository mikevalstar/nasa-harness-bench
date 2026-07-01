import * as THREE from 'three';
import './style.css';
import { AsteroidField } from './scene/asteroidField';
import { CometField } from './scene/cometField';
import { createPlanetSystem } from './scene/planets';
import { createSceneRig } from './scene/sceneSetup';
import { createSun } from './scene/sun';
import { buildOrbitLineFromPoints } from './scene/orbitLine';
import { pickBody } from './scene/picker';
import { SimClock } from './clock';
import { jdToDate } from './constants';
import { loadAsteroids, loadCloseApproaches, loadComets, loadPlanets, loadSentry } from './data/load';
import { sampleEllipticalOrbit, sampleOrbitPathFromPerihelion } from './orbit';
import { AppState, type Selection } from './state/appState';
import { decodeDeepLink, encodeDeepLink } from './state/deepLink';
import { mountDetailPanel } from './ui/detailPanel';
import { mountFilterPanel } from './ui/filterPanel';
import { mountShareButton } from './ui/shareButton';
import { mountTimePanel } from './ui/timePanel';

async function main(): Promise<void> {
  const uiRoot = document.getElementById('ui-root')!;
  const canvas = document.getElementById('scene') as HTMLCanvasElement;

  const loading = document.createElement('div');
  loading.id = 'loading';
  loading.innerHTML = `<div>Loading solar system data…</div>`;
  uiRoot.appendChild(loading);

  const deepLink = decodeDeepLink(location.search);

  const [planets, asteroids, comets, closeApproaches, sentry] = await Promise.all([
    loadPlanets(),
    loadAsteroids(),
    loadComets(),
    loadCloseApproaches(),
    loadSentry(),
  ]);

  const rig = createSceneRig(canvas);
  rig.scene.add(createSun());

  const planetSystem = createPlanetSystem(planets);
  rig.scene.add(planetSystem.group);

  const asteroidField = new AsteroidField(asteroids);
  rig.scene.add(asteroidField.points);

  const cometField = new CometField(comets);
  rig.scene.add(cometField.points);

  const state = new AppState();
  const clock = new SimClock(deepLink.jd ? jdToDate(deepLink.jd) : new Date());

  // Index lookups for selection / deep-link restore.
  const asteroidIndexByPdes = new Map<string, number>();
  asteroids.meta.forEach((m, idx) => asteroidIndexByPdes.set(m.pdes, idx));
  const cometIndexByPdes = new Map<string, number>();
  comets.meta.forEach((m, idx) => cometIndexByPdes.set(m.pdes, idx));
  const planetIndexByName = new Map<string, number>();
  planets.forEach((p, idx) => planetIndexByName.set(p.name, idx));

  function selectionFor(kind: Selection['kind'], index: number): Selection {
    const id =
      kind === 'planet' ? planets[index].name : kind === 'asteroid' ? asteroids.meta[index].pdes : comets.meta[index].pdes;
    return { kind, index, id };
  }

  // ---- Selection orbit-line highlight ----
  let selectionOrbitLine: THREE.Line | null = null;
  function updateSelectionOrbitLine(): void {
    if (selectionOrbitLine) {
      rig.scene.remove(selectionOrbitLine);
      selectionOrbitLine.geometry.dispose();
      (selectionOrbitLine.material as THREE.Material).dispose();
      selectionOrbitLine = null;
    }
    const sel = state.selection;
    if (!sel || sel.kind === 'planet') return;
    if (sel.kind === 'asteroid') {
      const e = asteroidField.elements(sel.index);
      const pts = sampleEllipticalOrbit(e.a, e.e, e.i, e.om, e.w);
      selectionOrbitLine = buildOrbitLineFromPoints(pts, 0x2bff88, 0.7);
    } else {
      const e = cometField.elements(sel.index);
      const pts = sampleOrbitPathFromPerihelion(e.q, e.e, e.i, e.om, e.w);
      selectionOrbitLine = buildOrbitLineFromPoints(pts, 0x2bff88, 0.7);
    }
    rig.scene.add(selectionOrbitLine);
  }

  state.onChange(() => {
    asteroidField.setSelectedIndex(state.selection?.kind === 'asteroid' ? state.selection.index : null);
    cometField.setSelectedIndex(state.selection?.kind === 'comet' ? state.selection.index : null);
    updateSelectionOrbitLine();
  });

  // ---- Filters -> asteroid visibility mask ----
  const filterHandle = mountFilterPanel(uiRoot, asteroids.meta, state, (idx) => {
    state.setSelection(selectionFor('asteroid', idx));
  });

  function applyVisibilityMask(): void {
    for (let i = 0; i < asteroids.meta.length; i++) {
      asteroidField.visible[i] = filterHandle.matches(i) ? 1 : 0;
    }
    asteroidField.markVisibilityDirty();
  }
  state.onChange(applyVisibilityMask);
  applyVisibilityMask();

  state.onChange(() => {
    cometField.points.visible = state.showComets;
    for (const child of planetSystem.group.children) {
      if ((child as THREE.Line).isLine) child.visible = state.showOrbitLines;
    }
  });

  // ---- Time control UI ----
  mountTimePanel(uiRoot, clock, () => state.setFollow(false));

  const hint = document.createElement('div');
  hint.id = 'hint';
  hint.textContent = 'Click a body to select it · drag to orbit · scroll to zoom';
  uiRoot.appendChild(hint);

  // ---- Detail panel ----
  mountDetailPanel(uiRoot, state, {
    planets,
    asteroidMeta: asteroids.meta,
    cometMeta: comets.meta,
    closeApproaches,
    sentry,
    clock,
  });

  // ---- Share link ----
  mountShareButton(uiRoot, () => encodeDeepLink(clock, state, rig.camera, rig.controls));

  // ---- Restore deep-link selection / camera ----
  if (deepLink.selection) {
    const { kind, id } = deepLink.selection;
    let index: number | undefined;
    if (kind === 'planet') index = planetIndexByName.get(id);
    else if (kind === 'asteroid') index = asteroidIndexByPdes.get(id);
    else index = cometIndexByPdes.get(id);
    if (index != null) {
      state.setSelection(selectionFor(kind, index));
      state.setFollow(!!deepLink.follow);
    }
  }
  if (deepLink.camera) {
    rig.camera.position.copy(deepLink.camera.position);
    rig.controls.target.copy(deepLink.camera.target);
  }

  // ---- Picking ----
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = ((ev.clientY - rect.top) / rect.height) * 2 - 1;
    const jd = clock.julianDate;
    const result = pickBody(
      ndcX,
      ndcY,
      rig.camera,
      rect.width,
      rect.height,
      jd,
      planetSystem,
      asteroidField,
      state.showComets ? cometField : null,
      asteroidField.visible,
      state.showComets ? cometField.visible : null
    );
    if (result) {
      state.setSelection(selectionFor(result.kind, result.index));
    }
  });

  // ---- Focus & follow camera ----
  function currentSelectionScenePosition(jd: number): THREE.Vector3 | null {
    const sel = state.selection;
    if (!sel) return null;
    if (sel.kind === 'planet') return planetSystem.bodies[sel.index].mesh.position.clone();
    if (sel.kind === 'asteroid') return asteroidField.positionScene(sel.index, jd);
    return cometField.positionScene(sel.index, jd);
  }

  loading.classList.add('hidden');

  // ---- Animation loop ----
  let last = performance.now();
  function animate(now: number): void {
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;

    clock.step(dt);
    const jd = clock.julianDate;

    planetSystem.update(jd);
    asteroidField.setJulianDate(jd);
    cometField.setJulianDate(jd);

    if (state.followSelected) {
      const target = currentSelectionScenePosition(jd);
      if (target) {
        const delta = target.clone().sub(rig.controls.target);
        rig.controls.target.copy(target);
        rig.camera.position.add(delta);
      }
    }

    rig.controls.update();
    rig.renderer.render(rig.scene, rig.camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

main().catch((err) => {
  console.error(err);
  const uiRoot = document.getElementById('ui-root');
  if (uiRoot) {
    uiRoot.innerHTML = `<div id="loading">Failed to load: ${String(err?.message ?? err)}</div>`;
  }
});
