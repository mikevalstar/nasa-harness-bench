import type { SimClock } from '../clock';
import type { CloseApproachSet, CometMeta, PlanetElements, AsteroidMeta, SentryByDes } from '../data/types';
import type { AppState, Selection } from '../state/appState';

export interface DetailPanelDeps {
  planets: PlanetElements[];
  asteroidMeta: AsteroidMeta[];
  cometMeta: CometMeta[];
  closeApproaches: CloseApproachSet;
  sentry: SentryByDes;
  clock: SimClock;
}

export function mountDetailPanel(root: HTMLElement, state: AppState, deps: DetailPanelDeps): void {
  const panel = document.createElement('div');
  panel.id = 'detail-panel';
  panel.className = 'panel';
  root.appendChild(panel);

  function render(): void {
    const sel = state.selection;
    if (!sel) {
      panel.classList.remove('visible');
      panel.innerHTML = '';
      return;
    }
    panel.classList.add('visible');
    panel.innerHTML = renderSelection(sel, deps, state);

    const closeBtn = panel.querySelector('#close-detail');
    closeBtn?.addEventListener('click', () => state.setSelection(null));

    const followBtn = panel.querySelector('#follow-btn') as HTMLButtonElement | null;
    if (followBtn) {
      followBtn.classList.toggle('active', state.followSelected);
      followBtn.addEventListener('click', () => state.setFollow(!state.followSelected));
    }
  }

  state.onChange(render);
  render();
}

function renderSelection(sel: Selection, deps: DetailPanelDeps, state: AppState): string {
  if (sel.kind === 'planet') {
    const p = deps.planets[sel.index];
    return `
      <button id="close-detail">✕</button>
      <h2>${p.name}</h2>
      <div class="subtitle">Planet</div>
      ${orbitTable({ a: p.a, e: p.e, i: p.i, om: p.om, w: p.w, per: p.per })}
      <div class="section-title">Physical</div>
      <table><tbody>
        <tr><td class="k">Mean radius</td><td>${p.radius_km.toLocaleString()} km</td></tr>
      </tbody></table>
      <div class="actions">
        <button id="follow-btn">${state.followSelected ? 'Following' : 'Focus & follow'}</button>
      </div>
    `;
  }

  if (sel.kind === 'comet') {
    const c = deps.cometMeta[sel.index];
    const isOpen = c.e >= 1;
    return `
      <button id="close-detail">✕</button>
      <h2>${escapeHtml(c.full_name)}</h2>
      <div class="subtitle">Comet${c.class ? ` · ${c.class}` : ''}${isOpen ? ' · open orbit' : ''}</div>
      <table><tbody>
        <tr><td class="k">Eccentricity</td><td>${c.e.toFixed(4)}</td></tr>
        ${c.a != null ? `<tr><td class="k">Semi-major axis</td><td>${c.a.toFixed(3)} au</td></tr>` : ''}
        ${c.per != null ? `<tr><td class="k">Period</td><td>${(c.per / 365.25).toFixed(1)} yr</td></tr>` : ''}
        ${c.M1 != null ? `<tr><td class="k">Total magnitude (M1)</td><td>${c.M1}</td></tr>` : ''}
        ${c.diameter != null ? `<tr><td class="k">Diameter</td><td>${c.diameter} km</td></tr>` : ''}
      </tbody></table>
      <div class="actions">
        <button id="follow-btn">${state.followSelected ? 'Following' : 'Focus & follow'}</button>
      </div>
    `;
  }

  const a = deps.asteroidMeta[sel.index];
  const sentry = deps.sentry[a.pdes];
  const approaches = deps.closeApproaches.byDes[a.pdes] ?? [];
  const nowJd = deps.clock.julianDate;
  const sortedApproaches = [...approaches]
    .sort((x, y) => Math.abs(x[1] - nowJd) - Math.abs(y[1] - nowJd))
    .slice(0, 8)
    .sort((x, y) => x[1] - y[1]);

  return `
    <button id="close-detail">✕</button>
    <h2>${escapeHtml(a.full_name)}</h2>
    <div class="subtitle">${a.class} · ${a.pdes}</div>
    <div>
      ${a.pha ? '<span class="badge">Potentially Hazardous</span>' : ''}
      ${sentry ? '<span class="badge risk">Sentry monitored</span>' : ''}
    </div>
    <div class="section-title">Orbit</div>
    ${orbitTable({ a: a.q && a.ad ? (a.q + a.ad) / 2 : undefined, e: undefined, i: undefined, om: undefined, w: undefined, per: a.per, q: a.q, moid: a.moid })}
    <div class="section-title">Physical</div>
    <table><tbody>
      <tr><td class="k">Diameter</td><td>${a.diameter != null ? `${a.diameter.toFixed(2)} km (measured)` : `${estimateDiameterLabel(a)}`}</td></tr>
      <tr><td class="k">Absolute magnitude (H)</td><td>${a.H ?? '—'}</td></tr>
      <tr><td class="k">Albedo</td><td>${a.albedo ?? '—'}</td></tr>
      <tr><td class="k">Rotation period</td><td>${a.rot_per != null ? `${a.rot_per} h` : '—'}</td></tr>
      <tr><td class="k">Spectral type</td><td>${a.spec_T ?? '—'}</td></tr>
      <tr><td class="k">First observed</td><td>${a.first_obs}</td></tr>
    </tbody></table>
    ${
      sentry
        ? `<div class="section-title">Impact risk (Sentry)</div>
      <table><tbody>
        <tr><td class="k">Cumulative impact prob.</td><td>${sentry.ip.toExponential(2)}</td></tr>
        <tr><td class="k">Palermo scale (cum / max)</td><td>${sentry.ps_cum.toFixed(2)} / ${sentry.ps_max.toFixed(2)}</td></tr>
        <tr><td class="k">Torino scale (max)</td><td>${sentry.ts_max ?? 0}</td></tr>
        <tr><td class="k">Potential impact window</td><td>${sentry.range}</td></tr>
        <tr><td class="k">Possible impacts tracked</td><td>${sentry.n_imp}</td></tr>
      </tbody></table>`
        : ''
    }
    ${
      sortedApproaches.length > 0
        ? `<div class="section-title">Close approaches to Earth</div>
      ${sortedApproaches
        .map(
          ([cd, , dist, vrel]) =>
            `<div class="approach-row"><span>${cd}</span><span>${(dist * 149597870.7 / 384400).toFixed(1)} LD · ${vrel.toFixed(1)} km/s</span></div>`
        )
        .join('')}`
        : ''
    }
    <div class="actions">
      <button id="follow-btn">${state.followSelected ? 'Following' : 'Focus & follow'}</button>
    </div>
  `;
}

function orbitTable(o: {
  a?: number;
  e?: number;
  i?: number;
  om?: number;
  w?: number;
  per?: number;
  q?: number;
  moid?: number | null;
}): string {
  const rows: string[] = [];
  if (o.a != null) rows.push(`<tr><td class="k">Semi-major axis</td><td>${o.a.toFixed(3)} au</td></tr>`);
  if (o.q != null) rows.push(`<tr><td class="k">Perihelion distance</td><td>${o.q.toFixed(3)} au</td></tr>`);
  if (o.e != null) rows.push(`<tr><td class="k">Eccentricity</td><td>${o.e.toFixed(4)}</td></tr>`);
  if (o.i != null) rows.push(`<tr><td class="k">Inclination</td><td>${o.i.toFixed(2)}°</td></tr>`);
  if (o.per != null) rows.push(`<tr><td class="k">Orbital period</td><td>${(o.per / 365.25).toFixed(2)} yr</td></tr>`);
  if (o.moid != null) rows.push(`<tr><td class="k">Earth MOID</td><td>${o.moid.toFixed(4)} au</td></tr>`);
  return `<table><tbody>${rows.join('')}</tbody></table>`;
}

function estimateDiameterLabel(a: AsteroidMeta): string {
  if (a.H == null) return '— (unknown)';
  const p = a.albedo ?? 0.14;
  const d = (1329 / Math.sqrt(p)) * Math.pow(10, -a.H / 5);
  return `~${d.toFixed(2)} km (estimated from H)`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
