import type { Dataset } from '../data';
import { LD_AU, formatJd } from '../orbits';
import { lowerBound } from '../scene';
import type { Store } from '../state';
import { h } from './dom';

const LOOKBACK = 3;
const LOOKAHEAD = 60;
const MAX_ROWS = 40;

export interface ApproachPanel {
  /** Rebuild the list if time moved enough or filters changed. */
  tick(jd: number, mask: Uint8Array, force: boolean): void;
}

/** "Coming up" list: close approaches to Earth around the current time. */
export function mountApproaches(root: HTMLElement, store: Store, data: Dataset): ApproachPanel {
  const body = h('div', {});
  let collapsed = false;
  const toggleBtn = h('button', { class: 'small', onClick: () => { collapsed = !collapsed; body.style.display = collapsed ? 'none' : ''; toggleBtn.textContent = collapsed ? 'show' : 'hide'; } }, 'hide');
  const title = h('h2', {}, 'Close approaches near this date', toggleBtn);
  root.append(h('div', { class: 'panel' }, title, body));

  let lastJd = NaN;
  return {
    tick(jd, mask, force) {
      if (!force && Math.abs(jd - lastJd) < 0.5) return;
      lastJd = jd;
      const a = data.approaches;
      const lo = lowerBound(a.jd, jd - LOOKBACK), hi = lowerBound(a.jd, jd + LOOKAHEAD);
      const rows: HTMLElement[] = [];
      let shown = 0;
      for (let r = lo; r < hi && shown < MAX_ROWS; r++) {
        const ai = a.idx[r]!;
        if (mask[ai] === 0) continue;
        shown++;
        const dist = a.dist[r]!;
        const sel = store.state.selected;
        const isSel = sel?.kind === 'asteroid' && sel.index === ai;
        rows.push(h('tr', { class: `click${isSel ? ' now' : ''}`, onClick: () => store.set({ selected: { kind: 'asteroid', index: ai }, jd: a.jd[r]!, playing: false }) },
          h('td', {}, formatJd(a.jd[r]!, false)),
          h('td', { class: 'name', title: data.meta.full_name[ai] }, data.meta.full_name[ai]!),
          h('td', { class: dist < 0.01 ? 'close' : '' }, `${(dist / LD_AU).toFixed(1)} LD`),
        ));
      }
      body.replaceChildren(
        rows.length
          ? h('div', { style: 'padding:0 8px 8px; max-height: 260px; overflow:auto' },
              h('table', { class: 'list' }, h('thead', {}, h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Object'), h('th', {}, 'Miss'))), h('tbody', {}, ...rows)))
          : h('div', { class: 'empty' }, `No approaches within 0.05 au in the next ${LOOKAHEAD} days (for the current filters).`),
        h('div', { class: 'hint', style: 'padding:0 14px 10px' }, `−${LOOKBACK} to +${LOOKAHEAD} days · click to jump · red < 0.01 au`),
      );
    },
  };
}
