import type { SimClock } from '../clock';
import { jdToDate } from '../constants';

const SPEED_PRESETS = [
  { label: '1 hr/s', days: 1 / 24 },
  { label: '1 day/s', days: 1 },
  { label: '10 days/s', days: 10 },
  { label: '100 days/s', days: 100 },
  { label: '1 yr/s', days: 365.25 },
];

const SLIDER_MIN_JD = 2415020.5; // ~1900
const SLIDER_MAX_JD = 2488070.5; // ~2100

export function mountTimePanel(root: HTMLElement, clock: SimClock, onScrubStart?: () => void): void {
  const panel = document.createElement('div');
  panel.id = 'time-panel';
  panel.className = 'panel';
  panel.innerHTML = `
    <button id="play-pause">▶</button>
    <button id="jump-now" title="Jump to now">Now</button>
    <input type="range" id="time-slider" min="${SLIDER_MIN_JD}" max="${SLIDER_MAX_JD}" step="0.5" value="${clock.julianDate}" />
    <div id="time-date"></div>
    <div id="time-speed"></div>
  `;
  root.appendChild(panel);

  const speedBar = document.createElement('div');
  speedBar.className = 'panel';
  speedBar.style.cssText = 'position:absolute;left:50%;bottom:66px;transform:translateX(-50%);padding:6px 10px;display:flex;gap:6px;';
  speedBar.innerHTML = SPEED_PRESETS.map(
    (s, idx) => `<button data-speed="${s.days}" class="speed-btn${idx === 1 ? ' active' : ''}">${s.label}</button>`
  ).join('');
  root.appendChild(speedBar);

  const playBtn = panel.querySelector('#play-pause') as HTMLButtonElement;
  const slider = panel.querySelector('#time-slider') as HTMLInputElement;
  const dateLabel = panel.querySelector('#time-date') as HTMLDivElement;
  const speedLabel = panel.querySelector('#time-speed') as HTMLDivElement;
  const jumpNowBtn = panel.querySelector('#jump-now') as HTMLButtonElement;

  function formatSpeed(days: number): string {
    if (days < 1) return `${(days * 24).toFixed(1)} hr/s`;
    if (days < 365) return `${days.toFixed(days < 10 ? 2 : 0)} d/s`;
    return `${(days / 365.25).toFixed(2)} yr/s`;
  }

  function refresh(): void {
    const d = jdToDate(clock.julianDate);
    dateLabel.textContent = d.toISOString().slice(0, 16).replace('T', '  ') + ' UTC';
    playBtn.textContent = clock.isPlaying ? '❚❚' : '▶';
    playBtn.classList.toggle('active', clock.isPlaying);
    speedLabel.textContent = formatSpeed(clock.speed);
    if (document.activeElement !== slider) {
      slider.value = String(clock.julianDate);
    }
  }

  playBtn.addEventListener('click', () => {
    clock.togglePlay();
    refresh();
  });

  jumpNowBtn.addEventListener('click', () => {
    clock.setJulianDate(2451545.0 + (Date.now() / 86400000 - (2451545.0 - 2440587.5)));
  });

  slider.addEventListener('input', () => {
    onScrubStart?.();
    clock.setJulianDate(Number(slider.value));
  });

  speedBar.querySelectorAll<HTMLButtonElement>('.speed-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      clock.setSpeed(Number(btn.dataset.speed));
      speedBar.querySelectorAll('.speed-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      refresh();
    });
  });

  clock.onChange(refresh);
  refresh();
}
