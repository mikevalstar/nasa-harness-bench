import { loadAllData } from './data';
import { JD_DEFAULT, dateToJD, formatDateShort, jdToDate } from './julian';
import { SolarSystemScene } from './scene';
import type { AppState, BodyRef, LoadedData } from './types';
import {
  decodeUrlState,
  encodeUrlState,
  jdToSlider,
  populateClassFilter,
  renderDetailPanel,
  sliderToJd,
  updateDateDisplay,
  updateStats,
  urlToBodyRef,
} from './ui';

const state: AppState = {
  jd: JD_DEFAULT,
  playing: false,
  speedDaysPerSec: 30,
  selected: null,
  following: false,
  filters: {
    search: '',
    phaOnly: false,
    sentryOnly: false,
    orbitClass: '',
    moidMax: null,
    showComets: false,
    showOrbits: true,
  },
};

let data: LoadedData;
let scene: SolarSystemScene;
let lastTime = 0;
let urlUpdateTimer: ReturnType<typeof setTimeout> | null = null;

async function main(): Promise<void> {
  const loading = document.getElementById('loading')!;
  const hud = document.getElementById('hud')!;
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  try {
    data = await loadAllData((msg) => {
      loading.querySelector('p')!.textContent = msg;
    });
  } catch (err) {
    loading.innerHTML = `<p class="error">Failed to load data: ${err}</p>`;
    return;
  }

  scene = new SolarSystemScene(canvas);
  scene.init(data);

  const url = decodeUrlState();
  if (url.jd) state.jd = url.jd;
  const bodyFromUrl = urlToBodyRef(url);
  if (bodyFromUrl) state.selected = bodyFromUrl;

  setupUI();
  applyUrlCamera(url);

  scene.updatePositions(state.jd);
  scene.updateSelectedMarker(state.selected, state.jd);
  refreshUI();

  loading.classList.add('hidden');
  hud.classList.remove('hidden');

  resize();
  window.addEventListener('resize', resize);

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    scene.handleClick(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
  });

  scene.setSelectCallback((ref) => {
    state.selected = ref;
    state.following = false;
    updateFollowButton();
    refreshUI();
    scheduleUrlUpdate();
  });

  lastTime = performance.now();
  requestAnimationFrame(tick);
}

function setupUI(): void {
  const slider = document.getElementById('time-slider') as HTMLInputElement;
  const dateInput = document.getElementById('date-input') as HTMLInputElement;
  const classFilter = document.getElementById('class-filter') as HTMLSelectElement;

  populateClassFilter(classFilter, data.orbitClasses);
  slider.value = String(jdToSlider(state.jd));
  dateInput.value = formatDateShort(state.jd);

  slider.addEventListener('input', () => {
    state.jd = sliderToJd(parseFloat(slider.value));
    state.playing = false;
    updatePlayButton();
    onTimeChange();
  });

  dateInput.addEventListener('change', () => {
    const d = new Date(dateInput.value + 'T12:00:00Z');
    state.jd = dateToJD(d);
    slider.value = String(jdToSlider(state.jd));
    state.playing = false;
    updatePlayButton();
    onTimeChange();
  });

  document.getElementById('btn-play')!.addEventListener('click', () => {
    state.playing = !state.playing;
    updatePlayButton();
  });

  document.getElementById('btn-step-back')!.addEventListener('click', () => {
    state.jd -= 1;
    syncTimeInputs();
    onTimeChange();
  });

  document.getElementById('btn-step-fwd')!.addEventListener('click', () => {
    state.jd += 1;
    syncTimeInputs();
    onTimeChange();
  });

  document.getElementById('speed-select')!.addEventListener('change', (e) => {
    state.speedDaysPerSec = parseFloat((e.target as HTMLSelectElement).value);
  });

  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  let searchTimer: ReturnType<typeof setTimeout>;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filters.search = searchInput.value;
      scene.applyFilters(state.filters);
      onTimeChange();

      const ref = scene.searchAndSelect(searchInput.value);
      if (ref && searchInput.value.trim().length >= 2) {
        state.selected = ref;
        refreshUI();
      }
    }, 200);
  });

  document.getElementById('filter-pha')!.addEventListener('change', (e) => {
    state.filters.phaOnly = (e.target as HTMLInputElement).checked;
    scene.applyFilters(state.filters);
    onTimeChange();
  });

  document.getElementById('filter-sentry')!.addEventListener('change', (e) => {
    state.filters.sentryOnly = (e.target as HTMLInputElement).checked;
    scene.applyFilters(state.filters);
    onTimeChange();
  });

  document.getElementById('show-comets')!.addEventListener('change', (e) => {
    state.filters.showComets = (e.target as HTMLInputElement).checked;
    scene.applyFilters(state.filters);
    onTimeChange();
  });

  document.getElementById('show-orbits')!.addEventListener('change', (e) => {
    state.filters.showOrbits = (e.target as HTMLInputElement).checked;
    scene.applyFilters(state.filters);
  });

  classFilter.addEventListener('change', () => {
    state.filters.orbitClass = classFilter.value;
    scene.applyFilters(state.filters);
    onTimeChange();
  });

  const moidInput = document.getElementById('moid-max') as HTMLInputElement;
  moidInput.addEventListener('change', () => {
    state.filters.moidMax = moidInput.value ? parseFloat(moidInput.value) : null;
    scene.applyFilters(state.filters);
    onTimeChange();
  });

  document.getElementById('btn-reset-cam')!.addEventListener('click', () => {
    scene.resetCamera();
    state.following = false;
    updateFollowButton();
    scheduleUrlUpdate();
  });

  document.getElementById('btn-follow')!.addEventListener('click', () => {
    if (!state.selected) return;
    state.following = !state.following;
    updateFollowButton();
  });

  document.getElementById('btn-share')!.addEventListener('click', async () => {
    const url = encodeUrlState(state, scene.getCameraState());
    history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(window.location.href);
      const btn = document.getElementById('btn-share')!;
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    } catch {
      prompt('Copy this link:', window.location.href);
    }
  });
}

function applyUrlCamera(url: ReturnType<typeof decodeUrlState>): void {
  if (url.px != null && url.tx != null) {
    scene.setCameraState({
      px: url.px,
      py: url.py!,
      pz: url.pz!,
      tx: url.tx!,
      ty: url.ty!,
      tz: url.tz!,
    });
  }
}

function syncTimeInputs(): void {
  const slider = document.getElementById('time-slider') as HTMLInputElement;
  const dateInput = document.getElementById('date-input') as HTMLInputElement;
  slider.value = String(jdToSlider(state.jd));
  dateInput.value = formatDateShort(state.jd);
}

function onTimeChange(): void {
  scene.updatePositions(state.jd);
  const target = scene.updateSelectedMarker(state.selected, state.jd);
  if (state.following && target) {
    scene.controls.target.copy(target);
  }
  updateDateDisplay(document.getElementById('date-display')!, state.jd);
  renderDetailPanel(document.getElementById('detail-content')!, data, state.selected, state.jd);
  scheduleUrlUpdate();
}

function refreshUI(): void {
  syncTimeInputs();
  updateDateDisplay(document.getElementById('date-display')!, state.jd);
  renderDetailPanel(document.getElementById('detail-content')!, data, state.selected, state.jd);
  const stats = scene.getStats();
  updateStats(document.getElementById('stats')!, stats.visible, stats.total, stats.comets);

  const followBtn = document.getElementById('btn-follow')!;
  if (state.selected && state.selected.kind !== 'sun') {
    followBtn.classList.remove('hidden');
  } else {
    followBtn.classList.add('hidden');
    state.following = false;
  }
  updateFollowButton();
}

function updatePlayButton(): void {
  const btn = document.getElementById('btn-play')!;
  btn.textContent = state.playing ? '⏸' : '▶';
}

function updateFollowButton(): void {
  const btn = document.getElementById('btn-follow')!;
  btn.textContent = state.following ? 'Unfollow' : 'Follow';
  btn.classList.toggle('active', state.following);
}

function scheduleUrlUpdate(): void {
  if (urlUpdateTimer) clearTimeout(urlUpdateTimer);
  urlUpdateTimer = setTimeout(() => {
    const url = encodeUrlState(state, scene.getCameraState());
    history.replaceState(null, '', url);
  }, 400);
}

function resize(): void {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  scene.resize(w, h);
}

function tick(now: number): void {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  if (state.playing) {
    state.jd += state.speedDaysPerSec * dt;
    if (state.jd > sliderToJd(1000)) state.jd = sliderToJd(0);
    syncTimeInputs();
    scene.updatePositions(state.jd);
    const target = scene.updateSelectedMarker(state.selected, state.jd);
    if (state.following && target) {
      scene.controls.target.copy(target);
    }
    updateDateDisplay(document.getElementById('date-display')!, state.jd);
  }

  scene.render();
  requestAnimationFrame(tick);
}

main();
