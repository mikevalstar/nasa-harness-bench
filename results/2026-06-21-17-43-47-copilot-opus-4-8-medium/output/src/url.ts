import * as THREE from 'three';

// Shareable deep-link state encoded in the URL hash. Relative-safe (hash only).
export interface ViewState {
  jd?: number;
  sel?: string; // "ast:<spkid>" or "planet:<name>"
  follow?: boolean;
  speed?: number;
  playing?: boolean;
  color?: number;
  comets?: boolean;
  cam?: number[]; // [px,py,pz, tx,ty,tz]
  filt?: string; // compact filter encoding
}

export function readState(): ViewState {
  const hash = location.hash.replace(/^#/, '');
  if (!hash) return {};
  const p = new URLSearchParams(hash);
  const st: ViewState = {};
  if (p.has('jd')) st.jd = parseFloat(p.get('jd')!);
  if (p.has('sel')) st.sel = p.get('sel')!;
  if (p.has('follow')) st.follow = p.get('follow') === '1';
  if (p.has('speed')) st.speed = parseFloat(p.get('speed')!);
  if (p.has('playing')) st.playing = p.get('playing') === '1';
  if (p.has('color')) st.color = parseInt(p.get('color')!, 10);
  if (p.has('comets')) st.comets = p.get('comets') === '1';
  if (p.has('cam')) st.cam = p.get('cam')!.split(',').map(Number);
  if (p.has('filt')) st.filt = p.get('filt')!;
  return st;
}

let writeTimer: number | undefined;

export function writeState(st: ViewState) {
  // Debounce to avoid thrashing history while the camera moves.
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = window.setTimeout(() => {
    const p = new URLSearchParams();
    if (st.jd != null) p.set('jd', st.jd.toFixed(4));
    if (st.sel) p.set('sel', st.sel);
    if (st.follow) p.set('follow', '1');
    if (st.speed != null) p.set('speed', String(st.speed));
    if (st.playing != null) p.set('playing', st.playing ? '1' : '0');
    if (st.color != null) p.set('color', String(st.color));
    if (st.comets) p.set('comets', '1');
    if (st.cam) p.set('cam', st.cam.map((v) => v.toFixed(3)).join(','));
    if (st.filt) p.set('filt', st.filt);
    history.replaceState(null, '', '#' + p.toString());
  }, 300);
}

export function cameraToArray(cam: THREE.Camera, target: THREE.Vector3): number[] {
  return [cam.position.x, cam.position.y, cam.position.z, target.x, target.y, target.z];
}
