import type { Dataset } from '../data';
import { AU_KM, LD_AU, formatJd, diameterFromH } from '../orbits';
import type { SolarScene } from '../scene';
import type { Store } from '../state';
import { F, FLAG_PHA, STRIDE, type BodyRef } from '../types';
import { CLASS_NAMES, fmtDiameter } from './filters';
import { clear, fmt, h } from './dom';

export interface DetailPanel {
  /** Called every frame; cheap unless a body is selected. */
  tick(jd: number): void;
}

export function mountDetails(root: HTMLElement, store: Store, data: Dataset, scene: SolarScene, onShare: () => void): DetailPanel {
  const panel = h('div', { class: 'panel detail' });
  root.append(panel);
  panel.style.display = 'none';

  let liveSun: HTMLElement | null = null;
  let liveEarth: HTMLElement | null = null;
  let approachRows: { el: HTMLTableRowElement; jd: number }[] = [];
  let lastLive = 0;
  let current: BodyRef | null = null;

  const kv = (rows: ([string, string] | [string, string, string | undefined])[]) =>
    h('dl', { class: 'kv' }, ...rows.flatMap(([k, v, cls]) => [h('dt', {}, k), h('dd', { class: cls ?? '' }, v)]));

  const actions = (ref: BodyRef) => {
    const followBtn = h('button', { class: store.state.follow ? 'active' : '', onClick: () => {
      const follow = !store.state.follow;
      store.set({ follow });
      if (follow) scene.flyTo(ref, store.state.jd);
    } }, store.state.follow ? '◉ Following' : '◎ Follow');
    return h('div', { class: 'actions' },
      h('button', { class: 'primary', onClick: () => scene.flyTo(ref, store.state.jd) }, '⌖ Focus'),
      followBtn,
      h('button', { onClick: onShare }, '🔗 Share'),
      h('button', { onClick: () => store.set({ selected: null, follow: false }) }, '✕'),
    );
  };

  const liveSection = () => {
    liveSun = h('dd', { class: 'live' }, '…');
    liveEarth = h('dd', { class: 'live' }, '…');
    return h('dl', { class: 'kv' }, h('dt', {}, 'Distance from Sun'), liveSun, h('dt', {}, 'Distance from Earth'), liveEarth);
  };

  const renderAsteroid = (index: number) => {
    const m = data.meta, el = data.elements, b = index * STRIDE;
    const H = el[b + F.H]!, moid = el[b + F.moid]!, diam = el[b + F.diameter]!;
    const flags = el[b + F.flags]!;
    const cls = m.class[index]!;
    const sentry = data.sentryByAsteroid.get(index);
    const ref: BodyRef = { kind: 'asteroid', index };
    const estDiam = H < 99 ? diameterFromH(H) : null;

    const tags = h('div', { class: 'tags' },
      h('span', { class: 'tag', title: CLASS_NAMES[cls] ?? '' }, `${cls} · ${(CLASS_NAMES[cls] ?? '').split(' — ')[0]}`),
      (flags & FLAG_PHA) ? h('span', { class: 'tag pha' }, 'Potentially hazardous') : null,
      sentry ? h('span', { class: 'tag sentry' }, 'Sentry-monitored impact risk') : null,
    );

    const orbit = kv([
      ['Semi-major axis', fmt(el[b + F.a], 4, 'au')],
      ['Eccentricity', fmt(el[b + F.e], 4)],
      ['Inclination', fmt(m.i[index], 2, '°')],
      ['Ascending node Ω', fmt(m.om[index], 2, '°')],
      ['Arg. of perihelion ω', fmt(m.w[index], 2, '°')],
      ['Perihelion / aphelion', `${fmt(m.q[index], 3)} / ${fmt(m.ad[index], 3)} au`],
      ['Period', m.per[index]! > 1000 ? `${(m.per[index]! / 365.25).toFixed(2)} yr` : `${fmt(m.per[index], 0)} d`],
      ['Earth MOID', moid >= 0 ? `${fmt(moid, 4)} au (${(moid / LD_AU).toFixed(1)} LD)` : '—', moid >= 0 && moid < 0.05 ? 'warn' : undefined],
      ['Elements epoch', formatJd(m.epoch[index]!, false)],
    ]);

    const physical = kv([
      ['Abs. magnitude H', H < 99 ? fmt(H, 2) : '—'],
      ['Diameter', diam > 0 ? `${fmtDiameter(diam)} (measured)` : estDiam ? `≈ ${fmtDiameter(estDiam)} (from H)` : '—'],
      ['Albedo', fmt(m.albedo[index], 3)],
      ['Rotation period', m.rot_per[index] !== null ? fmt(m.rot_per[index], 2, 'h') : '—'],
      ['Spectral type', [m.spec_B[index], m.spec_T[index]].filter(Boolean).join(' / ') || '—'],
      ['First observed', m.first_obs[index] ?? '—'],
      ['JPL SPK-ID', String(m.spkid[index])],
    ]);

    const children: (HTMLElement | null)[] = [
      h('div', { class: 'title' }, m.full_name[index]!),
      h('div', { class: 'subtitle' }, `Near-Earth asteroid · designation ${m.pdes[index]}`),
      tags, actions(ref),
      liveSection(),
      h('div', { class: 'section' }, 'Orbit'), orbit,
      h('div', { class: 'section' }, 'Physical'), physical,
    ];

    if (sentry) {
      children.push(
        h('div', { class: 'section' }, 'Impact risk (CNEOS Sentry)'),
        kv([
          ['Cumulative impact probability', `${sentry.ip.toExponential(2)} (1 in ${Math.round(1 / sentry.ip).toLocaleString()})`, sentry.ip > 1e-4 ? 'warn' : undefined],
          ['Palermo scale (cum / max)', `${sentry.ps_cum.toFixed(2)} / ${sentry.ps_max.toFixed(2)}`, sentry.ps_cum > -2 ? 'warn' : undefined],
          ['Torino scale (max)', String(sentry.ts_max), sentry.ts_max > 0 ? 'warn' : undefined],
          ['Potential impacts', `${sentry.n_imp} in ${sentry.range}`],
          ['Impact velocity v∞', fmt(sentry.v_inf, 1, 'km/s')],
          ['Sentry diameter est.', sentry.diameter !== null ? fmtDiameter(sentry.diameter) : '—'],
          ['Last observed', sentry.last_obs ?? '—'],
        ]),
        h('div', { class: 'hint', style: 'padding:0 14px 10px' }, 'Palermo < −2: negligible. Torino 0: no unusual hazard.'),
      );
    }

    const rows = data.approachesByAsteroid.get(index) ?? [];
    approachRows = [];
    if (rows.length) {
      const a = data.approaches;
      const table = h('table', { class: 'list' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Date (TDB)'), h('th', {}, 'Distance'), h('th', {}, 'v rel'))),
        h('tbody', {}, ...rows.map((r) => {
          const jd = a.jd[r]!, dist = a.dist[r]!;
          const tr = h('tr', { class: 'click', title: 'Jump to this approach', onClick: () => { store.set({ jd, playing: false, selected: ref }); } },
            h('td', {}, formatJd(jd, false)),
            h('td', { class: dist < 0.01 ? 'close' : '' }, `${(dist / LD_AU).toFixed(2)} LD`),
            h('td', {}, `${a.vrel[r]!.toFixed(1)} km/s`),
          );
          approachRows.push({ el: tr, jd });
          return tr;
        })),
      );
      children.push(
        h('div', { class: 'section' }, `Close approaches to Earth (${rows.length}, within 0.05 au)`),
        h('div', { style: 'padding:0 8px 10px; max-height: 220px; overflow:auto' }, table),
        h('div', { class: 'hint', style: 'padding:0 14px 10px' }, 'Click a row to jump to that moment. 1 LD = lunar distance ≈ 384,400 km.'),
      );
    } else {
      children.push(h('div', { class: 'section' }, 'Close approaches'), h('div', { class: 'empty' }, 'No recorded approaches within 0.05 au (1900–2200).'));
    }
    panel.replaceChildren(...children.filter((c): c is HTMLElement => c !== null));
  };

  const renderComet = (index: number) => {
    const c = data.comets[index]!;
    const ref: BodyRef = { kind: 'comet', index };
    const type = Math.abs(c.e - 1) < 1e-4 ? 'parabolic' : c.e < 1 ? 'elliptic' : 'hyperbolic';
    approachRows = [];
    panel.replaceChildren(
      h('div', { class: 'title' }, c.full_name),
      h('div', { class: 'subtitle' }, `Comet · ${c.pdes}`),
      h('div', { class: 'tags' },
        h('span', { class: 'tag comet' }, `${c.class} · ${CLASS_NAMES[c.class] ?? ''}`),
        h('span', { class: 'tag' }, `${type} orbit`),
      ),
      actions(ref),
      liveSection(),
      h('div', { class: 'section' }, 'Orbit'),
      kv([
        ['Eccentricity', fmt(c.e, 5)],
        ['Perihelion distance', fmt(c.q, 4, 'au')],
        ['Semi-major axis', c.a !== null ? fmt(c.a, 3, 'au') : '— (open orbit)'],
        ['Inclination', fmt(c.i, 2, '°')],
        ['Ascending node Ω', fmt(c.om, 2, '°')],
        ['Arg. of perihelion ω', fmt(c.w, 2, '°')],
        ['Period', c.per !== null && c.e < 1 ? `${(c.per / 365.25).toFixed(1)} yr` : '—'],
        ['Perihelion passage', formatJd(c.tp, false)],
        ['Elements epoch', formatJd(c.epoch, false)],
      ]),
      h('div', { class: 'section' }, 'Physical'),
      kv([
        ['Total magnitude M1', fmt(c.M1, 1)],
        ['Nucleus diameter', c.diameter !== null ? fmtDiameter(c.diameter) : '—'],
      ]),
      h('div', { class: 'actions' }, h('button', { class: 'small', onClick: () => store.set({ jd: c.tp, playing: false }) }, 'Jump to perihelion')),
      h('div', { class: 'hint', style: 'padding:0 14px 10px' }, 'Open orbits are propagated from the perihelion passage; positions far from the epoch ignore planetary perturbations and non-gravitational forces.'),
    );
  };

  const renderPlanet = (index: number) => {
    const p = data.planets[index]!;
    const ref: BodyRef = { kind: 'planet', index };
    approachRows = [];
    panel.replaceChildren(
      h('div', { class: 'title' }, p.name),
      h('div', { class: 'subtitle' }, 'Planet'),
      actions(ref),
      liveSection(),
      h('div', { class: 'section' }, 'Orbit (J2000 mean elements)'),
      kv([
        ['Semi-major axis', fmt(p.a, 5, 'au')],
        ['Eccentricity', fmt(p.e, 5)],
        ['Inclination', fmt(p.i, 3, '°')],
        ['Period', `${(p.per / 365.25).toFixed(3)} yr`],
        ['Mean radius', `${p.radius_km.toLocaleString()} km`],
      ]),
      h('div', { class: 'hint', style: 'padding:0 14px 10px' }, 'Planet sizes are exaggerated so they stay visible; orbits are to scale.'),
    );
  };

  const renderSun = () => {
    approachRows = [];
    liveSun = liveEarth = null;
    panel.replaceChildren(
      h('div', { class: 'title' }, 'Sun'),
      h('div', { class: 'subtitle' }, 'Central body, at the origin of the heliocentric frame'),
      actions({ kind: 'sun' }),
      kv([['Mean radius', '696,000 km'], ['1 au', `${AU_KM.toLocaleString()} km`]]),
    );
  };

  const render = () => {
    const sel = store.state.selected;
    current = sel;
    if (!sel) { panel.style.display = 'none'; clear(panel); approachRows = []; liveSun = liveEarth = null; return; }
    panel.style.display = '';
    switch (sel.kind) {
      case 'asteroid': renderAsteroid(sel.index); break;
      case 'comet': renderComet(sel.index); break;
      case 'planet': renderPlanet(sel.index); break;
      case 'sun': renderSun(); break;
    }
    lastLive = 0;
  };
  render();
  store.subscribe((changed) => { if (changed.has('selected') || changed.has('follow')) render(); });

  return {
    tick(jd) {
      if (!current) return;
      const now = performance.now();
      if (now - lastLive < 200) return;
      lastLive = now;
      if (liveSun && liveEarth) {
        const ds = scene.distanceBetween(current, { kind: 'sun' }, jd);
        const de = scene.distanceBetween(current, { kind: 'planet', index: 2 }, jd);
        liveSun.textContent = `${ds.toFixed(4)} au`;
        liveEarth.textContent = current.kind === 'planet' && current.index === 2 ? '—' : `${de.toFixed(4)} au · ${(de / LD_AU).toFixed(1)} LD`;
      }
      for (const r of approachRows) r.el.classList.toggle('now', Math.abs(r.jd - jd) < 3);
    },
  };
}
