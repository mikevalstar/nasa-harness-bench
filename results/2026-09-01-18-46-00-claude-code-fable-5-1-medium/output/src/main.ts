import './style.css';
import { loadDataset, type Dataset } from './data';
import { applyFilters } from './filter';
import { SolarScene, classColor } from './scene';
import { Store, defaultState, type AppState } from './state';
import { readUrl, writeUrl } from './url';
import { fmtInt, h, toast } from './ui/dom';
import { mountTimebar } from './ui/timebar';
import { mountFilters } from './ui/filters';
import { mountDetails } from './ui/details';
import { mountApproaches } from './ui/approaches';
import { sameBody } from './types';

async function main(): Promise<void> {
  const loadingText = document.getElementById('loading-text')!;
  const data = await loadDataset((label) => { loadingText.textContent = `Loading ${label.replace('./data/', '')}…`; });
  loadingText.textContent = 'Building scene…';
  await new Promise((r) => requestAnimationFrame(r));
  start(data);
  document.getElementById('loading')!.classList.add('hidden');
}

function start(data: Dataset): void {
  const store = new Store(defaultState());
  const viewport = document.getElementById('viewport')!;
  const scene = new SolarScene(viewport, data);

  // restore a deep link before anything renders
  const url = readUrl(data);
  const initial: Partial<AppState> = {};
  if (url.jd !== undefined) initial.jd = url.jd;
  if (url.selected) initial.selected = url.selected;
  if (url.speed !== undefined) initial.speed = url.speed;
  if (url.playing !== undefined) initial.playing = url.playing;
  if (url.follow !== undefined) initial.follow = url.follow;
  store.set(initial);
  if (url.camera) scene.setCamera(url.camera.pos, url.camera.target);

  const share = () => {
    syncUrl();
    const link = location.href;
    navigator.clipboard?.writeText(link).then(() => toast('Link copied to clipboard'), () => toast('Link is in the address bar'));
  };

  // ---- panels
  const left = document.getElementById('left')!;
  mountBrand(left, store);
  mountTimebar(document.getElementById('timebar')!, store, share, () => { store.set({ follow: false }); scene.resetView(); });
  const filterPanel = mountFilters(left, store, data);
  const right = document.getElementById('right')!;
  const details = mountDetails(right, store, data, scene, share);
  const approaches = mountApproaches(right, store, data);

  // ---- filters -> visibility mask
  let mask: Uint8Array = new Uint8Array(data.count);
  let maskJd = NaN;
  const refilter = () => {
    const res = applyFilters(data, store.state.filters, store.state.jd, mask);
    mask = res.mask;
    maskJd = store.state.jd;
    scene.setVisibility(mask);
    scene.setFilteredOrbits(store.state.showFilteredOrbits);
    filterPanel.setCount(res.visible, data.count);
    approaches.tick(store.state.jd, mask, true);
  };
  refilter();
  scene.setColorMode(store.state.colorMode);
  scene.setSelected(store.state.selected);
  if (store.state.selected && url.follow && !url.camera) scene.flyTo(store.state.selected, store.state.jd);

  store.subscribe((changed, s) => {
    if (changed.has('filters')) refilter();
    if (changed.has('showFilteredOrbits')) scene.setFilteredOrbits(s.showFilteredOrbits);
    if (changed.has('colorMode')) scene.setColorMode(s.colorMode);
    if (changed.has('selected')) {
      scene.setSelected(s.selected);
      if (s.selected === null && s.follow) store.set({ follow: false });
      if (s.selected && s.follow) scene.flyTo(s.selected, s.jd);
      approaches.tick(s.jd, mask, true);
    }
    if (changed.has('hovered')) scene.setHovered(s.hovered);
  });

  // ---- picking
  let pointer: { x: number; y: number } | null = null;
  let pointerMoved = false;
  let lastPick = 0;
  let downAt: { x: number; y: number } | null = null;
  const canvas = scene.renderer.domElement;
  canvas.addEventListener('pointermove', (ev) => {
    const r = canvas.getBoundingClientRect();
    pointer = { x: ev.clientX - r.left, y: ev.clientY - r.top };
    pointerMoved = true;
  });
  canvas.addEventListener('pointerleave', () => { pointer = null; store.set({ hovered: null }); viewport.classList.remove('picking'); });
  canvas.addEventListener('pointerdown', (ev) => { downAt = { x: ev.clientX, y: ev.clientY }; });
  canvas.addEventListener('pointerup', (ev) => {
    if (!downAt) return;
    const moved = Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y) > 4;
    downAt = null;
    if (moved || ev.button !== 0) return;
    const r = canvas.getBoundingClientRect();
    const hit = scene.pick(ev.clientX - r.left, ev.clientY - r.top, store.state.jd, store.state.showComets);
    if (hit) {
      const same = sameBody(hit.ref, store.state.selected);
      store.set({ selected: hit.ref });
      if (same || ev.detail === 2) scene.flyTo(hit.ref, store.state.jd);
    } else if (!store.state.follow) {
      store.set({ selected: null });
    }
  });

  // ---- keyboard
  window.addEventListener('keydown', (ev) => {
    if ((ev.target as HTMLElement).matches('input, select, textarea')) return;
    const s = store.state;
    if (ev.key === ' ') { ev.preventDefault(); store.set({ playing: !s.playing }); }
    else if (ev.key === 'Escape') store.set({ selected: null, follow: false });
    else if (ev.key === 'f' && s.selected) { store.set({ follow: !s.follow }); if (!s.follow) scene.flyTo(s.selected, s.jd); }
    else if (ev.key === 'r') { store.set({ follow: false }); scene.resetView(); }
    else if (ev.key === 'ArrowRight') store.set({ jd: s.jd + (ev.shiftKey ? 30 : 1) });
    else if (ev.key === 'ArrowLeft') store.set({ jd: s.jd - (ev.shiftKey ? 30 : 1) });
  });

  // ---- URL sync (throttled)
  let urlDirty = 0;
  const syncUrl = () => {
    const s = store.state;
    writeUrl({
      jd: s.jd, selected: s.selected, speed: Math.abs(s.speed), playing: s.playing, follow: s.follow,
      camera: { pos: scene.camera.position, target: scene.controls.target },
    }, data);
  };
  store.subscribe((changed) => { if (changed.has('selected') || changed.has('playing') || changed.has('speed') || changed.has('follow')) urlDirty = 1; });
  scene.controls.addEventListener('end', () => { urlDirty = 1; });
  window.addEventListener('hashchange', () => {
    const v = readUrl(data);
    const patch: Partial<AppState> = {};
    if (v.jd !== undefined) patch.jd = v.jd;
    if (v.selected !== undefined) patch.selected = v.selected;
    if (v.playing !== undefined) patch.playing = v.playing;
    store.set(patch);
    if (v.camera) scene.setCamera(v.camera.pos, v.camera.target);
  });

  // ---- main loop
  window.addEventListener('resize', () => scene.resize());
  let last = performance.now();
  let lastUrlWrite = 0;
  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const s = store.state;
    if (s.playing) store.set({ jd: s.jd + s.speed * dt });
    const jd = store.state.jd;

    // the approach-window filter depends on time: re-evaluate as time drifts
    if (store.state.filters.approachWindow !== null && Math.abs(jd - maskJd) > 1) refilter();

    // hover picking, throttled
    if (pointer && pointerMoved && now - lastPick > 80) {
      lastPick = now;
      pointerMoved = false;
      const hit = scene.pick(pointer.x, pointer.y, jd, store.state.showComets);
      const ref = hit?.ref ?? null;
      if (!sameBody(ref, store.state.hovered)) store.set({ hovered: ref });
      viewport.classList.toggle('picking', ref !== null);
    }

    scene.update(store.state, dt);
    details.tick(jd);
    approaches.tick(jd, mask, false);

    if ((urlDirty || s.playing) && now - lastUrlWrite > 1500) {
      lastUrlWrite = now;
      urlDirty = 0;
      syncUrl();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function mountBrand(root: HTMLElement, store: Store): void {
  const legend = h('div', { class: 'legend' });
  const renderLegend = () => {
    const mode = store.state.colorMode;
    const classItems: [string, string][] = [['APO', 'Apollo'], ['ATE', 'Aten'], ['AMO', 'Amor'], ['IEO', 'Atira'], ['JFc', 'comet-like']];
    const items: [string, string][] =
      mode === 'hazard' ? [['#73a0d9', 'other NEO'], ['#ff4d52', 'potentially hazardous'], ['#ffb833', 'Sentry-monitored'], ['#8fe9ff', 'comet']]
      : mode === 'class' ? [...classItems.map(([c, l]): [string, string] => [classColor(c), l]), ['#8fe9ff', 'comet']]
      : [['#ffd95a', 'large (H ≈ 12)'], ['#8a9fd0', 'mid'], ['#5980e6', 'tiny (H ≈ 28)'], ['#8fe9ff', 'comet']];
    legend.replaceChildren(...items.map(([c, l]) => h('span', { style: `--c:${c}` }, l)));
  };
  renderLegend();
  store.subscribe((changed) => { if (changed.has('colorMode')) renderLegend(); });

  root.append(
    h('div', { class: 'brand' },
      h('h1', {}, 'NEO Explorer'),
      h('p', {}, `Sun, 8 planets, ${fmtInt(42075)} near-Earth asteroids and ${fmtInt(4068)} comets, propagated from JPL orbital elements. Drag to orbit · scroll to zoom · click a body · Space plays · R resets.`),
      legend,
      h('p', {}, 'Orbits and distances are to scale; the Sun and planets are drawn larger than life.'),
    ),
  );
}

main().catch((err: unknown) => {
  const el = document.getElementById('loading-text');
  if (el) el.textContent = `Failed to load: ${err instanceof Error ? err.message : String(err)}`;
  console.error(err);
});

