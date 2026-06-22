import { formatDateShort, formatJD, JD_MAX, JD_MIN } from './julian';
import type { AppState, Asteroid, BodyRef, Comet, LoadedData, Planet } from './types';
import { asteroidLabel, getDisplayName } from './types';

export function renderDetailPanel(
  container: HTMLElement,
  data: LoadedData,
  ref: BodyRef | null,
  jd: number,
): void {
  if (!ref) {
    container.innerHTML = '<p class="hint">Click a body in the scene or search to select.</p>';
    return;
  }

  if (ref.kind === 'sun') {
    container.innerHTML = `
      <h3>Sun</h3>
      <dl>
        <dt>Mean radius</dt><dd>696,000 km</dd>
        <dt>Role</dt><dd>Central body — origin of heliocentric frame</dd>
      </dl>`;
    return;
  }

  if (ref.kind === 'planet') {
    const p = data.planets.find((pl) => pl.name === ref.id);
    if (!p) return;
    container.innerHTML = `
      <h3>${p.name}</h3>
      <dl>
        <dt>Semi-major axis</dt><dd>${p.a.toFixed(4)} au</dd>
        <dt>Eccentricity</dt><dd>${p.e.toFixed(5)}</dd>
        <dt>Inclination</dt><dd>${p.i.toFixed(2)}°</dd>
        <dt>Orbital period</dt><dd>${p.per?.toFixed(1) ?? '—'} days</dd>
        <dt>Radius</dt><dd>${p.radius_km.toLocaleString()} km</dd>
      </dl>`;
    return;
  }

  if (ref.kind === 'asteroid' && ref.index != null) {
    const a = data.asteroids[ref.index];
    renderAsteroidDetail(container, data, a, jd);
    return;
  }

  if (ref.kind === 'comet' && ref.index != null) {
    const comets = data.comets.filter((c) => c.e < 1 || (c.tp != null && c.q != null));
    const c = comets[ref.index];
    if (!c) return;
    renderCometDetail(container, c);
  }
}

function renderAsteroidDetail(container: HTMLElement, data: LoadedData, a: Asteroid, jd: number): void {
  const sentry = data.sentryByDes.get(a.pdes);
  const approaches = data.closeByDes.get(a.pdes) ?? [];
  const upcoming = approaches.filter((ca) => ca.jd >= jd).slice(0, 8);
  const past = approaches.filter((ca) => ca.jd < jd).slice(-3);

  const badges = [
    a.neo ? '<span class="badge neo">NEO</span>' : '',
    a.pha ? '<span class="badge pha">PHA</span>' : '',
    a.class ? `<span class="badge class">${a.class}</span>` : '',
    sentry ? '<span class="badge sentry">Sentry</span>' : '',
  ].filter(Boolean).join(' ');

  let sentryHtml = '';
  if (sentry) {
    sentryHtml = `
      <div class="sentry-block">
        <h4>Impact Risk (CNEOS Sentry)</h4>
        <dl>
          <dt>Cumulative probability</dt><dd>${(sentry.ip * 100).toExponential(2)}%</dd>
          <dt>Palermo scale (cum / max)</dt><dd>${sentry.ps_cum.toFixed(2)} / ${sentry.ps_max.toFixed(2)}</dd>
          <dt>Torino scale (max)</dt><dd>${sentry.ts_max}</dd>
          <dt>Impact window</dt><dd>${sentry.range}</dd>
          <dt>Potential impacts</dt><dd>${sentry.n_imp}</dd>
          <dt>Last observation</dt><dd>${sentry.last_obs}</dd>
        </dl>
      </div>`;
  }

  const fmtDist = (d: number) => `${(d * 149597870.7 / 1000).toFixed(0)} km (${d.toFixed(4)} au)`;

  const caRows = [...upcoming, ...past]
    .sort((x, y) => x.jd - y.jd)
    .slice(0, 10)
    .map(
      (ca) =>
        `<tr class="${ca.jd >= jd ? 'upcoming' : ''}">
          <td>${ca.cd}</td>
          <td>${fmtDist(ca.dist)}</td>
          <td>${ca.v_rel.toFixed(1)} km/s</td>
        </tr>`,
    )
    .join('');

  container.innerHTML = `
    <h3>${asteroidLabel(a)}</h3>
    <div class="badges">${badges}</div>
    <dl>
      <dt>Designation</dt><dd>${a.pdes}</dd>
      <dt>Orbit class</dt><dd>${a.class ?? '—'}</dd>
      <dt>Semi-major axis</dt><dd>${a.a.toFixed(4)} au</dd>
      <dt>Eccentricity</dt><dd>${a.e.toFixed(4)}</dd>
      <dt>Perihelion / Aphelion</dt><dd>${a.q.toFixed(3)} / ${a.ad.toFixed(3)} au</dd>
      <dt>Inclination</dt><dd>${a.i.toFixed(2)}°</dd>
      <dt>MOID (Earth)</dt><dd>${a.moid != null ? a.moid.toFixed(4) + ' au' : '—'}</dd>
      <dt>Diameter</dt><dd>${a.diameter != null ? a.diameter.toFixed(2) + ' km' : '—'}</dd>
      <dt>Absolute magnitude (H)</dt><dd>${a.H ?? '—'}</dd>
      <dt>Albedo</dt><dd>${a.albedo ?? '—'}</dd>
      <dt>Rotation period</dt><dd>${a.rot_per != null ? a.rot_per + ' h' : '—'}</dd>
      <dt>Spectral type</dt><dd>${a.spec_T ?? a.spec_B ?? '—'}</dd>
      <dt>First observed</dt><dd>${a.first_obs ?? '—'}</dd>
    </dl>
    ${sentryHtml}
    <h4>Close Approaches to Earth</h4>
    ${
      caRows
        ? `<table class="ca-table"><thead><tr><th>Date</th><th>Distance</th><th>Velocity</th></tr></thead><tbody>${caRows}</tbody></table>`
        : '<p class="hint">No close-approach records.</p>'
    }`;
}

function renderCometDetail(container: HTMLElement, c: Comet): void {
  container.innerHTML = `
    <h3>${c.full_name}</h3>
    <div class="badges"><span class="badge comet">${c.class}</span></div>
    <dl>
      <dt>Designation</dt><dd>${c.pdes}</dd>
      <dt>Eccentricity</dt><dd>${c.e.toFixed(4)}</dd>
      <dt>Semi-major axis</dt><dd>${c.a != null ? c.a.toFixed(2) + ' au' : '—'}</dd>
      <dt>Perihelion</dt><dd>${c.q.toFixed(3)} au</dd>
      <dt>Inclination</dt><dd>${c.i.toFixed(2)}°</dd>
      <dt>Period</dt><dd>${c.per != null ? (c.per / 365.25).toFixed(1) + ' years' : '—'}</dd>
      <dt>Diameter</dt><dd>${c.diameter != null ? c.diameter + ' km' : '—'}</dd>
      <dt>Total magnitude (M1)</dt><dd>${c.M1 ?? '—'}</dd>
    </dl>`;
}

export function updateDateDisplay(el: HTMLElement, jd: number): void {
  el.textContent = formatJD(jd);
}

export function updateStats(el: HTMLElement, visible: number, total: number, comets: number): void {
  el.textContent = `${visible.toLocaleString()} / ${total.toLocaleString()} NEOs visible · ${comets.toLocaleString()} comets loaded`;
}

export function jdToSlider(jd: number): number {
  return ((jd - JD_MIN) / (JD_MAX - JD_MIN)) * 1000;
}

export function sliderToJd(val: number): number {
  return JD_MIN + (val / 1000) * (JD_MAX - JD_MIN);
}

export function populateClassFilter(select: HTMLSelectElement, classes: string[]): void {
  for (const cls of classes) {
    const opt = document.createElement('option');
    opt.value = cls;
    opt.textContent = cls;
    select.appendChild(opt);
  }
}

export interface UrlState {
  jd?: number;
  sel?: string;
  kind?: string;
  idx?: number;
  px?: number;
  py?: number;
  pz?: number;
  tx?: number;
  ty?: number;
  tz?: number;
}

export function encodeUrlState(state: AppState, camera: UrlState): string {
  const params = new URLSearchParams();
  params.set('jd', state.jd.toFixed(2));
  if (state.selected) {
    params.set('kind', state.selected.kind);
    params.set('sel', state.selected.id);
    if (state.selected.index != null) params.set('idx', String(state.selected.index));
  }
  if (camera.px != null) {
    params.set('px', camera.px.toFixed(2));
    params.set('py', camera.py!.toFixed(2));
    params.set('pz', camera.pz!.toFixed(2));
    params.set('tx', camera.tx!.toFixed(2));
    params.set('ty', camera.ty!.toFixed(2));
    params.set('tz', camera.tz!.toFixed(2));
  }
  return `${window.location.pathname}?${params.toString()}`;
}

export function decodeUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);
  const result: UrlState = {};
  const jd = params.get('jd');
  if (jd) result.jd = parseFloat(jd);
  const kind = params.get('kind');
  const sel = params.get('sel');
  const idx = params.get('idx');
  if (kind && sel) {
    result.kind = kind;
    result.sel = sel;
    if (idx) result.idx = parseInt(idx, 10);
  }
  for (const key of ['px', 'py', 'pz', 'tx', 'ty', 'tz'] as const) {
    const v = params.get(key);
    if (v) result[key] = parseFloat(v);
  }
  return result;
}

export function urlToBodyRef(url: UrlState): BodyRef | null {
  if (!url.kind || !url.sel) return null;
  return {
    kind: url.kind as BodyRef['kind'],
    id: url.sel,
    index: url.idx,
  };
}

export { formatDateShort, getDisplayName };
