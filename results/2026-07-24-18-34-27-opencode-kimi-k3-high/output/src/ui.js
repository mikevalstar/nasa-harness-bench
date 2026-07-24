// DOM rendering helpers: filter widgets, legend, detail panel, approach lists.
import { CLASS_NAMES } from './data.js';
import { formatJd, AU_KM, LD_AU } from './orbit.js';

export const CLASS_COLORS = ['#4cc9f0', '#06d6a0', '#b388ff', '#ffd166', '#8a99a8'];
export const PHA_COLOR = '#ff5544';

export function fmtKm(d) {
  if (d == null) return '—';
  if (d >= 100) return `${d.toFixed(0)} km`;
  if (d >= 1) return `${d.toFixed(2)} km`;
  return `${(d * 1000).toFixed(0)} m`;
}
export function fmtAu(x) {
  if (x == null) return '—';
  return `${x.toFixed(4)} au`;
}
export function fmtLd(au) {
  return `${(au / LD_AU).toFixed(1)} LD`;
}
export function fmtProb(p) {
  if (p == null) return '—';
  if (p >= 0.001) return `${(p * 100).toFixed(2)}%`;
  return p.toExponential(2);
}

export function buildClassFilters(container, initial, onChange) {
  container.innerHTML = '';
  CLASS_NAMES.forEach((name, i) => {
    const label = document.createElement('label');
    label.className = 'check';
    label.innerHTML = `<input type="checkbox" ${initial[i] ? 'checked' : ''} data-i="${i}" />
      <span class="sw" style="background:${CLASS_COLORS[i]}"></span>${name}`;
    label.querySelector('input').addEventListener('change', (e) => onChange(i, e.target.checked));
    container.appendChild(label);
  });
}

export function renderLegend(el, mode) {
  if (mode === 'class') {
    el.innerHTML =
      CLASS_NAMES.map(
        (n, i) => `<div><span class="sw" style="background:${CLASS_COLORS[i]}"></span>${n}</div>`
      ).join('') +
      `<div><span class="sw" style="background:${PHA_COLOR}"></span>Potentially hazardous</div>
       <div class="dim">PHA status overrides class color.</div>`;
  } else if (mode === 'risk') {
    el.innerHTML = `
      <div><span class="sw" style="background:#ff2d78"></span>Sentry impact-risk object</div>
      <div><span class="sw" style="background:#ff8c42"></span>PHA (no known risk)</div>
      <div><span class="sw" style="background:#3a4a5c"></span>Everything else</div>
      <div class="dim">Brighter pink = higher Palermo scale.</div>`;
  } else {
    el.innerHTML = `
      <div><span class="sw" style="background:#46586c"></span>&lt; 50 m</div>
      <div><span class="sw" style="background:#4cc9f0"></span>50–300 m</div>
      <div><span class="sw" style="background:#ffd166"></span>300 m – 1 km</div>
      <div><span class="sw" style="background:#ffffff"></span>&gt; 1 km</div>
      <div class="dim">Diameters mostly estimated from H magnitude.</div>`;
  }
}

// ---- detail panel -----------------------------------------------------------

function row(k, v) {
  return `<tr><td>${k}</td><td>${v ?? '—'}</td></tr>`;
}

export function detailHtml(info) {
  const { kind, title, subtitle, badges, orbitRows, physRows, risk, approaches, showFollow, following } = info;
  let h = `<h2>${title}</h2><div class="subtitle">${subtitle}</div>`;
  h += `<div>${badges.map((b) => `<span class="badge ${b.cls}">${b.text}</span>`).join('')}</div>`;
  h += `<div class="actions">
    ${showFollow ? `<button class="tbtn" id="act-follow">${following ? '&#10003; following' : 'Follow camera'}</button>` : ''}
    <button class="tbtn" id="act-link">Copy link</button>
  </div>`;
  if (orbitRows?.length) h += `<h4>Orbit</h4><table>${orbitRows.map(([k, v]) => row(k, v)).join('')}</table>`;
  if (physRows?.length) h += `<h4>Physical</h4><table>${physRows.map(([k, v]) => row(k, v)).join('')}</table>`;
  if (risk) {
    const cls = risk.ts_max >= 1 || risk.ps_cum > -2 ? 'risk-high' : 'risk-med';
    h += `<h4>Impact risk (CNEOS Sentry)</h4><table>
      ${row('Cumulative probability', `<span class="${cls}">${fmtProb(risk.ip)}</span>`)}
      ${row('Palermo scale (cum / max)', `${risk.ps_cum?.toFixed(2) ?? '—'} / ${risk.ps_max?.toFixed(2) ?? '—'}`)}
      ${row('Torino scale (max)', risk.ts_max ?? '—')}
      ${row('Potential impacts', risk.n_imp ?? '—')}
      ${row('Impact window', risk.range ?? '—')}
      ${row('Encounter velocity', risk.v_inf != null ? `${risk.v_inf.toFixed(1)} km/s` : '—')}
    </table>`;
  }
  if (approaches) {
    h += `<h4>Earth close approaches</h4>`;
    if (!approaches.length) h += `<p class="dim">None in the catalogued window (1900–2200).</p>`;
    else {
      h += approaches
        .map(
          (a) => `<div class="ca-row">
            <span class="d" data-jd="${a.jd}" title="jump to this moment">${formatJd(a.jd)}</span>
            <span>${a.v_rel != null ? a.v_rel.toFixed(1) + ' km/s' : ''}</span>
            <span class="r">${fmtLd(a.dist)}</span>
          </div>`
        )
        .join('');
    }
  }
  return h;
}

export function approachRowHtml(a, name) {
  const closeCls = a.dist < 5 * LD_AU ? ' close' : '';
  return `<div class="approach-row${closeCls}" data-jd="${a.jd}" data-des="${a.des}">
    <span class="d">${formatJd(a.jd)}</span>
    <span class="n">${name}</span>
    <span class="dist">${fmtLd(a.dist)}</span>
  </div>`;
}
