import type { Dataset } from '../data';
import { searchAsteroids, searchComets } from '../filter';
import { diameterFromH } from '../orbits';
import { ASTEROID_CLASSES, H_RANGE, defaultFilters, type ColorMode, type HazardFilter, type Store } from '../state';
import { classColor } from '../scene';
import { clear, fmtInt, h } from './dom';

export const CLASS_NAMES: Record<string, string> = {
  APO: 'Apollo — Earth-crossing, a > 1 au',
  ATE: 'Aten — Earth-crossing, a < 1 au',
  AMO: 'Amor — approaches Earth from outside',
  IEO: 'Atira — orbit entirely inside Earth\'s',
  HTC: 'Halley-type comet',
  ETc: 'Encke-type comet',
  JFc: 'Jupiter-family comet',
  JFC: 'Jupiter-family comet (classical)',
  CTc: 'Chiron-type comet',
  COM: 'Comet (unclassified)',
  PAR: 'Parabolic comet',
  HYP: 'Hyperbolic comet',
};

export interface FilterPanel {
  setCount(visible: number, total: number): void;
}

export function mountFilters(root: HTMLElement, store: Store, data: Dataset): FilterPanel {
  const count = h('div', { class: 'count' });

  // --- search
  const results = h('div', { class: 'results' });
  const search = h('input', { type: 'text', placeholder: 'Search name or designation (e.g. Apophis, 2024 YR4)' });
  const runSearch = () => {
    clear(results);
    const q = search.value;
    for (const k of searchAsteroids(data, q, 12)) {
      const flags = data.sentryByAsteroid.has(k) ? 'Sentry' : '';
      results.append(h('div', { onClick: () => { store.set({ selected: { kind: 'asteroid', index: k } }); search.value = ''; clear(results); } },
        data.meta.full_name[k]!, h('small', {}, [data.meta.class[k], flags].filter(Boolean).join(' · '))));
    }
    for (const k of searchComets(data, q, 5)) {
      results.append(h('div', { onClick: () => { store.set({ selected: { kind: 'comet', index: k } }); search.value = ''; clear(results); } },
        data.comets[k]!.full_name, h('small', {}, 'comet')));
    }
    if (q && !results.firstChild) results.append(h('div', {}, h('small', {}, 'no matches')));
  };
  search.addEventListener('input', runSearch);
  search.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') (results.firstElementChild as HTMLElement | null)?.click();
    if (ev.key === 'Escape') { search.value = ''; clear(results); }
  });
  search.addEventListener('blur', () => setTimeout(() => clear(results), 150));

  // --- hazard segment
  const hazardBtns: Record<HazardFilter, HTMLButtonElement> = {
    all: h('button', { onClick: () => store.setFilters({ hazard: 'all' }) }, 'All NEOs'),
    pha: h('button', { onClick: () => store.setFilters({ hazard: 'pha' }) }, 'Hazardous'),
    sentry: h('button', { onClick: () => store.setFilters({ hazard: 'sentry' }) }, 'Sentry risk'),
  };

  // --- classes
  const chips = new Map<string, HTMLButtonElement>();
  const chipRow = h('div', { class: 'chips' });
  for (const c of ASTEROID_CLASSES) {
    const chip = h('button', { class: 'chip', style: `--c:${classColor(c)}`, title: CLASS_NAMES[c] ?? c, onClick: () => {
      const set = new Set(store.state.filters.classes);
      if (set.has(c)) set.delete(c); else set.add(c);
      store.setFilters({ classes: set });
    } }, c);
    chips.set(c, chip);
    chipRow.append(chip);
  }

  // --- size (H)
  const hMin = h('input', { type: 'range', min: H_RANGE.min, max: H_RANGE.max, step: 0.5 });
  const hMax = h('input', { type: 'range', min: H_RANGE.min, max: H_RANGE.max, step: 0.5 });
  const hOut = h('output');
  const hDesc = h('div', { class: 'hint' });
  const onH = () => {
    let lo = Number(hMin.value), hi = Number(hMax.value);
    if (lo > hi) [lo, hi] = [hi, lo];
    store.setFilters({ hMin: lo, hMax: hi });
  };
  hMin.addEventListener('input', onH);
  hMax.addEventListener('input', onH);

  // --- MOID
  const moid = h('input', { type: 'range', min: 0, max: 100, step: 1 });
  const moidOut = h('output');
  moid.addEventListener('input', () => {
    const v = Number(moid.value);
    store.setFilters({ moidMax: v >= 100 ? null : Math.pow(10, -4 + (v / 100) * 3.7) });
  });

  // --- approach window
  const approachChk = h('input', { type: 'checkbox' });
  const approachDays = h('input', { type: 'range', min: 1, max: 365, step: 1, value: 30 });
  const approachOut = h('output');
  const onApproach = () => store.setFilters({ approachWindow: approachChk.checked ? Number(approachDays.value) : null });
  approachChk.addEventListener('change', onApproach);
  approachDays.addEventListener('input', onApproach);

  const measured = h('input', { type: 'checkbox', onChange: () => store.setFilters({ onlyMeasured: measured.checked }) });

  // --- colour mode
  const colorBtns: Record<ColorMode, HTMLButtonElement> = {
    hazard: h('button', { onClick: () => store.set({ colorMode: 'hazard' }) }, 'Hazard'),
    class: h('button', { onClick: () => store.set({ colorMode: 'class' }) }, 'Orbit class'),
    size: h('button', { onClick: () => store.set({ colorMode: 'size' }) }, 'Size'),
  };

  const toggle = (key: 'showComets' | 'showCometTails' | 'showPlanetOrbits' | 'showFilteredOrbits' | 'showApproachLines' | 'showGrid' | 'showLabels', label: string) => {
    const cb = h('input', { type: 'checkbox', onChange: () => store.set({ [key]: cb.checked }) });
    store.subscribe((changed) => { if (changed.has(key)) cb.checked = store.state[key]; });
    cb.checked = store.state[key];
    return h('label', { class: 'row', style: 'margin:3px 0' }, cb, h('span', { style: 'flex:1' }, label));
  };

  const resetBtn = h('button', { class: 'small', onClick: () => store.set({ filters: defaultFilters() }) }, 'Reset');

  root.append(
    h('div', { class: 'panel' },
      h('h2', {}, 'Find & filter', resetBtn),
      h('div', { class: 'body' },
        h('div', { class: 'search' }, search, results),
        h('div', { class: 'row', style: 'margin-top:10px' }, h('div', { class: 'seg', style: 'flex:1' }, hazardBtns.all, hazardBtns.pha, hazardBtns.sentry)),
        h('div', { class: 'row' }, h('label', {}, 'Orbit class')), chipRow,
        h('div', { class: 'row', style: 'margin-top:10px' }, h('label', {}, 'Absolute magnitude H'), hOut),
        h('div', { class: 'row', style: 'margin:0' }, hMin, hMax),
        hDesc,
        h('div', { class: 'row', style: 'margin-top:10px' }, h('label', {}, 'Max Earth MOID'), moid, moidOut),
        h('div', { class: 'row' }, h('label', {}, approachChk, ' Close approach within'), approachDays, approachOut),
        h('div', { class: 'row' }, h('label', {}, measured, ' Only measured diameters')),
      ),
      count,
    ),
    h('div', { class: 'panel' },
      h('h2', {}, 'Display'),
      h('div', { class: 'body' },
        h('div', { class: 'row' }, h('label', {}, 'Colour by'), h('div', { class: 'seg', style: 'flex:2' }, colorBtns.hazard, colorBtns.class, colorBtns.size)),
        toggle('showComets', 'Comets'),
        toggle('showCometTails', 'Comet tails'),
        toggle('showPlanetOrbits', 'Planet orbits'),
        toggle('showFilteredOrbits', 'Orbits of filtered asteroids (first 400)'),
        toggle('showApproachLines', 'Earth ↔ asteroid lines during approaches (±5 d)'),
        toggle('showGrid', 'Distance grid'),
        toggle('showLabels', 'Labels'),
      ),
    ),
  );

  const render = () => {
    const f = store.state.filters;
    for (const [k, b] of Object.entries(hazardBtns)) b.classList.toggle('active', f.hazard === k);
    for (const [c, chip] of chips) chip.classList.toggle('on', f.classes.has(c));
    hMin.value = String(f.hMin);
    hMax.value = String(f.hMax);
    hOut.textContent = `${f.hMin} – ${f.hMax}`;
    hDesc.textContent = `≈ ${fmtDiameter(diameterFromH(f.hMax))} – ${fmtDiameter(diameterFromH(f.hMin))} across (albedo 0.14)`;
    if (f.moidMax === null) { moid.value = '100'; moidOut.textContent = 'any'; }
    else { moid.value = String(Math.round(((Math.log10(f.moidMax) + 4) / 3.7) * 100)); moidOut.textContent = f.moidMax < 0.01 ? f.moidMax.toExponential(1) + ' au' : f.moidMax.toFixed(3) + ' au'; }
    approachChk.checked = f.approachWindow !== null;
    if (f.approachWindow !== null) approachDays.value = String(f.approachWindow);
    approachOut.textContent = `±${approachDays.value} d`;
    measured.checked = f.onlyMeasured;
    for (const [k, b] of Object.entries(colorBtns)) b.classList.toggle('active', store.state.colorMode === k);
  };
  render();
  store.subscribe((changed) => { if (changed.has('filters') || changed.has('colorMode')) render(); });

  return {
    setCount(visible, total) {
      count.replaceChildren('showing ', h('b', {}, fmtInt(visible)), ` of ${fmtInt(total)} asteroids`);
    },
  };
}

export function fmtDiameter(km: number): string {
  if (km >= 1) return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
  return `${Math.round(km * 1000)} m`;
}
