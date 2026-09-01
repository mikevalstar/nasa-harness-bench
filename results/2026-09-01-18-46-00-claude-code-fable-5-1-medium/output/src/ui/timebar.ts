import { dateToJd, formatJd, jdToDate, nowJd } from '../orbits';
import { SPEED_STEPS, type Store } from '../state';
import { h } from './dom';

const SCRUB_MIN = dateToJd(new Date(Date.UTC(1900, 0, 1)));
const SCRUB_MAX = dateToJd(new Date(Date.UTC(2200, 0, 1)));

export function mountTimebar(root: HTMLElement, store: Store, onShare: () => void, onResetView: () => void): void {
  const playBtn = h('button', { class: 'primary', onClick: () => store.set({ playing: !store.state.playing }) }, '▶');
  const dateOut = h('span', { class: 'date' });
  const speedSel = h('select', {
    onChange: () => store.set({ speed: Number(speedSel.value) }),
  }, ...SPEED_STEPS.map((s) => h('option', { value: s.days }, s.label)));
  const dirBtn = h('button', { title: 'Reverse direction', onClick: () => store.set({ speed: -store.state.speed }) }, '⇄');

  const dateIn = h('input', { type: 'date', min: '1900-01-01', max: '2199-12-31' });
  const timeIn = h('input', { type: 'time', value: '00:00' });
  const jump = () => {
    if (!dateIn.value) return;
    const d = new Date(`${dateIn.value}T${timeIn.value || '00:00'}:00Z`);
    if (!Number.isNaN(d.getTime())) store.set({ jd: dateToJd(d) });
  };
  dateIn.addEventListener('change', jump);
  timeIn.addEventListener('change', jump);

  const step = (days: number, label: string) => h('button', { class: 'small', onClick: () => store.set({ jd: store.state.jd + days }) }, label);

  const scrub = h('input', { type: 'range', id: 'scrub', min: 0, max: 100000, step: 1 });
  scrub.addEventListener('input', () => {
    const t = Number(scrub.value) / 100000;
    store.set({ jd: SCRUB_MIN + t * (SCRUB_MAX - SCRUB_MIN), playing: false });
  });

  root.append(
    h('div', { class: 'time-row' },
      playBtn, dirBtn, dateOut,
      h('span', { class: 'hint' }, 'speed'), speedSel,
      step(-365.25, '−1 y'), step(-30, '−30 d'), step(-1, '−1 d'), step(1, '+1 d'), step(30, '+30 d'), step(365.25, '+1 y'),
      h('span', { class: 'spacer' }),
      h('span', { class: 'hint' }, 'jump to'), dateIn, timeIn,
      h('button', { onClick: () => store.set({ jd: nowJd() }) }, 'Now'),
      h('button', { title: 'Copy a link to this exact view', onClick: onShare }, '🔗 Share view'),
      h('button', { title: 'Return to the overview (R)', onClick: onResetView }, '⟲ Reset view'),
    ),
    scrub,
    h('div', { class: 'scrub-labels' }, h('span', {}, '1900'), h('span', {}, '1950'), h('span', {}, '2000'), h('span', {}, '2050'), h('span', {}, '2100'), h('span', {}, '2150'), h('span', {}, '2200')),
  );

  let lastShownJd = NaN;
  const render = () => {
    const s = store.state;
    playBtn.textContent = s.playing ? '❚❚' : '▶';
    playBtn.title = s.playing ? 'Pause' : 'Play';
    speedSel.value = String(Math.abs(s.speed));
    dirBtn.classList.toggle('active', s.speed < 0);
    if (s.jd !== lastShownJd) {
      lastShownJd = s.jd;
      dateOut.textContent = formatJd(s.jd) + (s.speed < 0 && s.playing ? '  ◀' : '');
      const t = (s.jd - SCRUB_MIN) / (SCRUB_MAX - SCRUB_MIN);
      if (document.activeElement !== scrub) scrub.value = String(Math.round(Math.min(1, Math.max(0, t)) * 100000));
      if (document.activeElement !== dateIn && document.activeElement !== timeIn) {
        const d = jdToDate(s.jd);
        if (!Number.isNaN(d.getTime())) {
          dateIn.value = d.toISOString().slice(0, 10);
          timeIn.value = d.toISOString().slice(11, 16);
        }
      }
    }
  };
  render();
  store.subscribe((changed) => {
    if (changed.has('jd') || changed.has('playing') || changed.has('speed')) render();
  });
}
