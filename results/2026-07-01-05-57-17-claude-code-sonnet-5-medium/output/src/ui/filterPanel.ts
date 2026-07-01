import type { AsteroidMeta } from '../data/types';
import type { AppState, Filters } from '../state/appState';

const ORBIT_CLASSES = ['APO', 'ATE', 'AMO', 'IEO'];
const ORBIT_CLASS_LABELS: Record<string, string> = {
  APO: 'Apollo',
  ATE: 'Aten',
  AMO: 'Amor',
  IEO: 'Interior-Earth',
};

const MAX_RESULTS_SHOWN = 150;

export interface FilterPanelHandle {
  matches: (idx: number) => boolean;
  recompute: () => void;
}

export function mountFilterPanel(
  root: HTMLElement,
  meta: AsteroidMeta[],
  state: AppState,
  onSelect: (idx: number) => void
): FilterPanelHandle {
  const panel = document.createElement('div');
  panel.id = 'filter-panel';
  panel.className = 'panel';
  panel.innerHTML = `
    <h2>Near-Earth Asteroids</h2>
    <div class="field">
      <label>Search name / designation</label>
      <input type="text" id="search-input" placeholder="e.g. Eros, 2020 AB" />
    </div>
    <div class="field row">
      <input type="checkbox" id="pha-only" />
      <label for="pha-only" style="margin:0;">Potentially Hazardous only</label>
    </div>
    <div class="field">
      <label>Orbit class</label>
      <div class="chips" id="class-chips">
        ${ORBIT_CLASSES.map((c) => `<div class="chip" data-class="${c}" title="${ORBIT_CLASS_LABELS[c]}">${c}</div>`).join('')}
      </div>
    </div>
    <div class="field">
      <label>Min diameter (km)</label>
      <input type="text" id="min-diameter" placeholder="any" inputmode="decimal" />
    </div>
    <div class="field">
      <label>Max Earth MOID (au) — closer than</label>
      <input type="text" id="max-moid" placeholder="any" inputmode="decimal" />
    </div>
    <div id="result-count"></div>
    <div id="search-results"></div>
    <div class="section-title" style="margin-top:12px;font-size:11px;color:#7d93b5;text-transform:uppercase;letter-spacing:.04em;border-top:1px solid rgba(140,170,220,0.15);padding-top:8px;">Overlays</div>
    <div class="field row"><input type="checkbox" id="toggle-comets" checked /><label for="toggle-comets" style="margin:0;">Comets</label></div>
    <div class="field row"><input type="checkbox" id="toggle-orbits" checked /><label for="toggle-orbits" style="margin:0;">Planet orbit lines</label></div>
  `;
  root.appendChild(panel);

  const searchInput = panel.querySelector('#search-input') as HTMLInputElement;
  const phaOnly = panel.querySelector('#pha-only') as HTMLInputElement;
  const minDiameter = panel.querySelector('#min-diameter') as HTMLInputElement;
  const maxMoid = panel.querySelector('#max-moid') as HTMLInputElement;
  const resultCount = panel.querySelector('#result-count') as HTMLDivElement;
  const resultsList = panel.querySelector('#search-results') as HTMLDivElement;
  const classChips = panel.querySelectorAll<HTMLDivElement>('#class-chips .chip');

  function currentFilters(): Filters {
    return state.filters;
  }

  function matches(idx: number): boolean {
    const f = currentFilters();
    const m = meta[idx];
    if (f.phaOnly && !m.pha) return false;
    if (f.orbitClasses.size > 0 && !f.orbitClasses.has(m.class)) return false;
    if (f.minDiameterKm != null) {
      const d = m.diameter ?? 0;
      if (d < f.minDiameterKm) return false;
    }
    if (f.maxMoidAu != null) {
      if (m.moid == null || m.moid > f.maxMoidAu) return false;
    }
    if (f.search.trim().length > 0) {
      const q = f.search.trim().toLowerCase();
      const hay = `${m.full_name} ${m.pdes} ${m.name ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  let matchCount = 0;

  function recompute(): void {
    matchCount = 0;
    const rows: number[] = [];
    for (let i = 0; i < meta.length; i++) {
      if (matches(i)) {
        matchCount++;
        if (rows.length < MAX_RESULTS_SHOWN) rows.push(i);
      }
    }
    resultCount.textContent = `${matchCount.toLocaleString()} of ${meta.length.toLocaleString()} shown in scene`;

    const showList = currentFilters().search.trim().length > 0;
    if (!showList) {
      resultsList.innerHTML = '';
      return;
    }
    resultsList.innerHTML = rows
      .map(
        (idx) =>
          `<div class="result-row" data-idx="${idx}"><span>${escapeHtml(meta[idx].full_name)}</span>${
            meta[idx].pha ? '<span class="pha-tag">PHA</span>' : ''
          }</div>`
      )
      .join('');
    if (matchCount > MAX_RESULTS_SHOWN) {
      resultsList.innerHTML += `<div class="result-row" style="opacity:0.6;">+ ${matchCount - MAX_RESULTS_SHOWN} more — refine search</div>`;
    }
    resultsList.querySelectorAll<HTMLDivElement>('.result-row[data-idx]').forEach((el) => {
      el.addEventListener('click', () => onSelect(Number(el.dataset.idx)));
    });
  }

  searchInput.addEventListener('input', () => {
    state.updateFilters({ search: searchInput.value });
  });
  phaOnly.addEventListener('change', () => {
    state.updateFilters({ phaOnly: phaOnly.checked });
  });
  minDiameter.addEventListener('input', () => {
    const v = parseFloat(minDiameter.value);
    state.updateFilters({ minDiameterKm: Number.isFinite(v) ? v : null });
  });
  maxMoid.addEventListener('input', () => {
    const v = parseFloat(maxMoid.value);
    state.updateFilters({ maxMoidAu: Number.isFinite(v) ? v : null });
  });
  classChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const cls = chip.dataset.class!;
      const set = new Set(state.filters.orbitClasses);
      if (set.has(cls)) set.delete(cls);
      else set.add(cls);
      chip.classList.toggle('active');
      state.updateFilters({ orbitClasses: set });
    });
  });

  const toggleComets = panel.querySelector('#toggle-comets') as HTMLInputElement;
  const toggleOrbits = panel.querySelector('#toggle-orbits') as HTMLInputElement;
  toggleComets.checked = state.showComets;
  toggleOrbits.checked = state.showOrbitLines;
  toggleComets.addEventListener('change', () => {
    state.showComets = toggleComets.checked;
    state.emit();
  });
  toggleOrbits.addEventListener('change', () => {
    state.showOrbitLines = toggleOrbits.checked;
    state.emit();
  });

  state.onChange(recompute);
  recompute();

  return { matches, recompute };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
