/**
 * Right-hand detail panel: everything the dataset knows about one object.
 */
import { CO, CORB_COLS, O, ORB_COLS, P, PHYS_COLS, type Dataset, type SentryRow } from './data';
import { CLASS_LABEL } from './clouds';
import { formatDate, positionAt, J2000 } from './astro';
import { asteroidElements, cometElements, planetElements } from './data';
import { escapeHtml, fmt, fmtAuKm, fmtDist, fmtInt, fmtProb, fmtSize, torinoColor } from './format';

export type Selection =
  | { kind: 'asteroid'; index: number }
  | { kind: 'comet'; index: number }
  | { kind: 'planet'; index: number }
  | { kind: 'sun' }
  | null;

export function selectionKey(s: Selection): string {
  if (!s) return '';
  if (s.kind === 'sun') return 'sun';
  return `${s.kind[0]}${s.index}`;
}

export function selectionFromKey(d: Dataset, key: string): Selection {
  if (!key) return null;
  if (key === 'sun') return { kind: 'sun' };
  const k = key[0];
  const i = parseInt(key.slice(1), 10);
  if (!Number.isFinite(i)) return null;
  if (k === 'a' && i >= 0 && i < d.ast.count) return { kind: 'asteroid', index: i };
  if (k === 'c' && i >= 0 && i < d.comets.count) return { kind: 'comet', index: i };
  if (k === 'p' && i >= 0 && i < d.planets.length) return { kind: 'planet', index: i };
  return null;
}

export function selectionName(d: Dataset, s: Selection): string {
  if (!s) return '';
  switch (s.kind) {
    case 'sun':
      return 'Sun';
    case 'planet':
      return d.planets[s.index].name;
    case 'comet':
      return d.comets.meta.name[s.index];
    case 'asteroid':
      return d.ast.meta.display[s.index];
  }
}

/** Heliocentric position of a selection at time t. */
export function selectionPosition(d: Dataset, s: Selection, t: number) {
  if (!s || s.kind === 'sun') return { x: 0, y: 0, z: 0 };
  if (s.kind === 'planet') return positionAt(planetElements(d.planets[s.index]), t);
  if (s.kind === 'comet') return positionAt(cometElements(d, s.index), t);
  return positionAt(asteroidElements(d, s.index), t);
}

const kv = (rows: [string, string][]) =>
  `<dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;

export function renderDetail(d: Dataset, sel: Selection, t: number): string {
  if (!sel) return '';
  if (sel.kind === 'sun') return renderSun();
  if (sel.kind === 'planet') return renderPlanet(d, sel.index, t);
  if (sel.kind === 'comet') return renderComet(d, sel.index, t);
  return renderAsteroid(d, sel.index, t);
}

function head(title: string, sub: string) {
  return `<div class="d-head"><div class="d-title">${escapeHtml(title)}</div><div class="d-sub">${escapeHtml(sub)}</div></div>`;
}

function actions(extra = ''): string {
  return `<div class="d-actions">
    <button class="btn small primary" data-act="focus">Focus &amp; follow</button>
    <button class="btn small" data-act="orbit">Toggle orbit</button>
    ${extra}
  </div>`;
}

function renderSun() {
  return (
    head('Sun', 'central body') +
    kv([
      ['Mean radius', '696,000 km'],
      ['Frame origin', 'heliocentric J2000 ecliptic'],
    ]) +
    `<p class="note">Every orbit in this view is referred to the Sun. Body sizes are exaggerated by
     the display slider; at exaggeration 1× the Sun is 0.0047 au across and the planets are
     invisible dots.</p>`
  );
}

function renderPlanet(d: Dataset, k: number, t: number) {
  const p = d.planets[k];
  const pos = positionAt(planetElements(p), t);
  const r = Math.hypot(pos.x, pos.y, pos.z);
  const earth = positionAt(planetElements(d.planets[2]), t);
  const dEarth = Math.hypot(pos.x - earth.x, pos.y - earth.y, pos.z - earth.z);
  return (
    head(p.name, 'planet') +
    actions() +
    `<div class="d-sec"><h3>Position at ${escapeHtml(formatDate(t))}</h3>` +
    kv([
      ['Distance from Sun', `${r.toFixed(4)} au`],
      ['Distance from Earth', k === 2 ? '—' : `${dEarth.toFixed(4)} au`],
      ['Ecliptic X / Y / Z', `${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)}`],
    ]) +
    `</div><div class="d-sec"><h3>Orbit</h3>` +
    kv([
      ['Semi-major axis a', `${fmt(p.a, 4)} au`],
      ['Eccentricity e', fmt(p.e, 4)],
      ['Inclination i', `${fmt(p.i, 3)}°`],
      ['Node Ω', `${fmt(p.om, 3)}°`],
      ['Perihelion ω', `${fmt(p.w, 3)}°`],
      ['Period', `${fmt(p.per / 365.25, 3)} yr`],
      ['Mean radius', `${fmtInt(p.radius_km)} km`],
    ]) +
    `</div>`
  );
}

function renderComet(d: Dataset, k: number, t: number) {
  const m = d.comets.meta;
  const b = k * CORB_COLS;
  const o = d.comets.orb;
  const e = o[b + CO.e];
  const cls = m.classes[d.comets.flags[k]] ?? 'UNK';
  const el = cometElements(d, k);
  const pos = positionAt(el, t);
  const r = Math.hypot(pos.x, pos.y, pos.z);
  const kind = e > 1.001 ? 'hyperbolic' : e >= 0.999 ? 'parabolic' : 'elliptical';
  return (
    head(m.name[k] || m.pdes[k], `comet · ${cls} · ${kind} orbit`) +
    actions() +
    `<div class="d-sec"><h3>Position at ${escapeHtml(formatDate(t))}</h3>` +
    kv([
      ['Distance from Sun', r > 0 && Number.isFinite(r) ? `${r.toFixed(3)} au` : '—'],
      ['Perihelion passage', Number.isFinite(o[b + CO.tp0]) ? formatDate(o[b + CO.tp0]) : '—'],
    ]) +
    `</div><div class="d-sec"><h3>Orbit</h3>` +
    kv([
      ['Eccentricity e', fmt(e, 5)],
      ['Perihelion q', `${fmt(o[b + CO.q], 4)} au`],
      ['Semi-major axis a', Number.isFinite(o[b + CO.a]) ? `${fmt(o[b + CO.a], 4)} au` : '∞ (open)'],
      ['Inclination i', `${fmt(o[b + CO.i], 3)}°`],
      ['Node Ω', `${fmt(o[b + CO.om], 3)}°`],
      ['Arg. perihelion ω', `${fmt(o[b + CO.w], 3)}°`],
      ['Epoch', `JD ${(o[b + CO.epoch0] + J2000).toFixed(1)}`],
      ['Total magnitude M1', fmt(d.comets.mag[k * 2], 2)],
      ['Diameter', fmtSize(d.comets.mag[k * 2 + 1])],
      ['Class', `${cls} — ${CLASS_LABEL[cls] ?? 'comet'}`],
    ]) +
    (e >= 0.999
      ? `<p class="note">Open orbit: propagated from the time of perihelion passage rather than
         from a mean anomaly, so it appears only around its perihelion passage and leaves the
         inner system permanently.</p>`
      : '') +
    `</div>`
  );
}

function renderAsteroid(d: Dataset, k: number, t: number) {
  const meta = d.ast.meta;
  const ob = k * ORB_COLS;
  const pb = k * PHYS_COLS;
  const orb = d.ast.orb;
  const phys = d.ast.phys;
  const cls = meta.classes[d.ast.flags[k * 3 + 1]] ?? 'UNK';
  const pha = d.ast.flags[k * 3] === 1;
  const measured = (d.ast.flags[k * 3 + 2] & 1) !== 0;
  const sentry = d.sentryByRow.get(k);
  const el = asteroidElements(d, k);
  const pos = positionAt(el, t);
  const r = Math.hypot(pos.x, pos.y, pos.z);
  const earth = positionAt(planetElements(d.planets[2]), t);
  const dEarth = Math.hypot(pos.x - earth.x, pos.y - earth.y, pos.z - earth.z);

  const badges: string[] = [`<span class="badge neutral">${escapeHtml(cls)}</span>`];
  if (pha) badges.push('<span class="badge pha">POTENTIALLY HAZARDOUS</span>');
  if (sentry) badges.push('<span class="badge sentry">SENTRY RISK LIST</span>');
  if (!pha && !sentry) badges.push('<span class="badge ok">no hazard flag</span>');

  let html =
    head(meta.display[k], `${meta.pdes[k]}${meta.name[k] ? ` · ${meta.name[k]}` : ''}`) +
    `<div class="badges">${badges.join('')}</div>` +
    actions(`<button class="btn small" data-act="next-ca">Next approach</button>`) +
    `<div class="d-sec"><h3>Now — ${escapeHtml(formatDate(t))}</h3>` +
    kv([
      ['Distance from Sun', `${r.toFixed(4)} au`],
      ['Distance from Earth', `${dEarth.toFixed(4)} au`],
      ['', `<span class="dim">${fmtAuKm(dEarth)}</span>`],
    ]) +
    `</div>`;

  html +=
    `<div class="d-sec"><h3>Physical</h3>` +
    kv([
      ['Diameter', `${fmtSize(phys[pb + P.diameter])}${measured ? '' : ' <span class="dim">(est.)</span>'}`],
      ['Absolute magnitude H', fmt(phys[pb + P.H], 2)],
      ['Albedo', fmt(phys[pb + P.albedo], 3)],
      ['Spectral type', meta.spec[k] || '—'],
      ['First observed', meta.first_obs[k] || '—'],
    ]) +
    (measured ? '' : `<p class="note">Diameter estimated from H with an assumed albedo of 0.14 — the standard fallback when no measurement exists.</p>`) +
    `</div>`;

  html +=
    `<div class="d-sec"><h3>Orbit</h3>` +
    kv([
      ['Semi-major axis a', `${fmt(orb[ob + O.a], 4)} au`],
      ['Eccentricity e', fmt(orb[ob + O.e], 4)],
      ['Inclination i', `${fmt(orb[ob + O.i], 3)}°`],
      ['Node Ω', `${fmt(orb[ob + O.om], 3)}°`],
      ['Arg. perihelion ω', `${fmt(orb[ob + O.w], 3)}°`],
      ['Perihelion q', `${fmt(phys[pb + P.q], 4)} au`],
      ['Aphelion Q', `${fmt(phys[pb + P.ad], 4)} au`],
      ['Period', `${fmt(phys[pb + P.per] / 365.25, 3)} yr`],
      ['Earth MOID', `${fmt(phys[pb + P.moid], 5)} au`],
      ['Epoch', `JD ${(orb[ob + O.epoch0] + J2000).toFixed(1)}`],
    ]) +
    `<p class="note">${escapeHtml(CLASS_LABEL[cls] ?? 'Orbit class ' + cls)}.</p>` +
    `</div>`;

  if (sentry) html += renderSentry(sentry);

  html += renderApproaches(d, k, t);
  return html;
}

function renderSentry(s: SentryRow): string {
  // Palermo scale is logarithmic; map -8..+2 onto the bar
  const ps = s.ps_cum ?? -8;
  const frac = Math.max(0, Math.min(1, (ps + 8) / 10));
  return (
    `<div class="d-sec"><h3>Impact risk — CNEOS Sentry</h3>` +
    `<div class="risk-bar"><i style="width:${(frac * 100).toFixed(1)}%"></i></div>` +
    kv([
      ['Impact probability', fmtProb(s.ip)],
      ['Palermo scale (cum.)', fmt(s.ps_cum, 2)],
      ['Palermo scale (max)', fmt(s.ps_max, 2)],
      [
        'Torino scale',
        `<span style="color:${torinoColor(s.ts_max)}">${s.ts_max ?? '—'}</span>`,
      ],
      ['Potential impacts', fmtInt(s.n_imp)],
      ['Impact window', s.range ? escapeHtml(s.range) : '—'],
      ['Encounter velocity', `${fmt(s.v_inf, 2)} km/s`],
      ['Last observed', s.last_obs ? escapeHtml(s.last_obs) : '—'],
    ]) +
    `<p class="note">A Palermo value below −2 means the hazard is far below the background risk from
     objects of the same size. Torino 0 means no unusual level of danger.</p></div>`
  );
}

function renderApproaches(d: Dataset, k: number, t: number): string {
  const off = d.ast.caOffset[k];
  const n = d.ast.caCount[k];
  if (n === 0)
    return `<div class="d-sec"><h3>Close approaches to Earth</h3><p class="note">No approach events for this object in the dataset.</p></div>`;

  let nextIdx = -1;
  let closestIdx = off;
  for (let j = off; j < off + n; j++) {
    if (nextIdx < 0 && d.ca.jd[j] >= t) nextIdx = j;
    if (d.ca.data[j * 3] < d.ca.data[closestIdx * 3]) closestIdx = j;
  }

  // show a window around "now" so the table stays short but relevant
  const start = Math.max(off, (nextIdx < 0 ? off + n : nextIdx) - 8);
  const end = Math.min(off + n, start + 24);

  const rows: string[] = [];
  for (let j = start; j < end; j++) {
    const dist = d.ca.data[j * 3];
    const v = d.ca.data[j * 3 + 2];
    rows.push(
      `<tr class="${j === nextIdx ? 'next' : ''}" data-jd="${d.ca.jd[j]}">
        <td>${escapeHtml(formatDate(d.ca.jd[j], true).replace(' UTC', ''))}</td>
        <td>${dist.toFixed(5)}</td>
        <td>${(dist / 0.00256955529).toFixed(1)}</td>
        <td>${v.toFixed(1)}</td>
      </tr>`
    );
  }

  const closest = d.ca.data[closestIdx * 3];
  return (
    `<div class="d-sec"><h3>Close approaches to Earth</h3>` +
    kv([
      ['Events on record', fmtInt(n)],
      ['Closest of all', `${fmtDist(closest)}`],
      ['— on', formatDate(d.ca.jd[closestIdx])],
      ['Next after now', nextIdx < 0 ? '—' : formatDate(d.ca.jd[nextIdx])],
    ]) +
    `<table class="ca"><thead><tr><th>Date (TDB)</th><th>au</th><th>LD</th><th>km/s</th></tr></thead>
     <tbody>${rows.join('')}</tbody></table>
     <p class="note">Click a row to jump the clock to that encounter. LD = lunar distance (384,400 km).</p></div>`
  );
}
