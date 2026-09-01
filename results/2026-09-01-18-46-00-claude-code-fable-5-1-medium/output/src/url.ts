/**
 * Deep links: the current time, selection, camera, and playback are encoded in
 * the URL hash so any moment can be shared and reopened.
 *   #t=<jd>&sel=<a:pdes|c:pdes|p:Name|sun>&cam=x,y,z,tx,ty,tz&spd=<days/s>&play=1&follow=1
 */
import * as THREE from 'three';
import type { Dataset } from './data';
import type { BodyRef } from './types';
import { SPEED_STEPS } from './state';

export interface UrlView {
  jd?: number;
  selected?: BodyRef;
  camera?: { pos: THREE.Vector3; target: THREE.Vector3 };
  speed?: number;
  playing?: boolean;
  follow?: boolean;
}

export function encodeSelected(ref: BodyRef, data: Dataset): string {
  switch (ref.kind) {
    case 'sun': return 'sun';
    case 'planet': return 'p:' + data.planets[ref.index]!.name;
    case 'asteroid': return 'a:' + data.meta.pdes[ref.index]!;
    case 'comet': return 'c:' + data.comets[ref.index]!.pdes;
  }
}

function decodeSelected(s: string, data: Dataset): BodyRef | undefined {
  if (s === 'sun') return { kind: 'sun' };
  const [kind, ...rest] = s.split(':');
  const id = rest.join(':');
  if (kind === 'p') {
    const index = data.planets.findIndex((p) => p.name === id);
    return index >= 0 ? { kind: 'planet', index } : undefined;
  }
  if (kind === 'a') {
    const index = data.byPdes.get(id.toLowerCase());
    return index !== undefined ? { kind: 'asteroid', index } : undefined;
  }
  if (kind === 'c') {
    const index = data.comets.findIndex((c) => c.pdes === id);
    return index >= 0 ? { kind: 'comet', index } : undefined;
  }
  return undefined;
}

export function readUrl(data: Dataset): UrlView {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const view: UrlView = {};
  const t = Number(params.get('t'));
  if (params.has('t') && Number.isFinite(t) && t > 0) view.jd = t;
  const sel = params.get('sel');
  if (sel) {
    const ref = decodeSelected(sel, data);
    if (ref) view.selected = ref;
  }
  const cam = params.get('cam')?.split(',').map(Number);
  if (cam && cam.length === 6 && cam.every(Number.isFinite)) {
    view.camera = { pos: new THREE.Vector3(cam[0], cam[1], cam[2]), target: new THREE.Vector3(cam[3], cam[4], cam[5]) };
  }
  const spd = Number(params.get('spd'));
  if (params.has('spd') && Number.isFinite(spd) && spd > 0) {
    view.speed = SPEED_STEPS.reduce((best, s) => (Math.abs(s.days - spd) < Math.abs(best - spd) ? s.days : best), SPEED_STEPS[0].days);
  }
  if (params.has('play')) view.playing = params.get('play') === '1';
  if (params.has('follow')) view.follow = params.get('follow') === '1';
  return view;
}

export function writeUrl(view: Required<Pick<UrlView, 'jd' | 'camera' | 'speed' | 'playing' | 'follow'>> & { selected: BodyRef | null }, data: Dataset): void {
  const p = new URLSearchParams();
  p.set('t', view.jd.toFixed(4));
  if (view.selected) p.set('sel', encodeSelected(view.selected, data));
  const c = view.camera;
  p.set('cam', [c.pos.x, c.pos.y, c.pos.z, c.target.x, c.target.y, c.target.z].map((v) => v.toFixed(4)).join(','));
  p.set('spd', String(view.speed));
  p.set('play', view.playing ? '1' : '0');
  if (view.follow) p.set('follow', '1');
  const hash = '#' + p.toString();
  if (hash !== location.hash) history.replaceState(null, '', hash);
}
