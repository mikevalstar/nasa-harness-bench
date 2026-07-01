import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { SimClock } from '../clock';
import type { AppState, Selection } from '../state/appState';

function round(n: number, dp = 3): number {
  return Math.round(n * 10 ** dp) / 10 ** dp;
}

export function encodeDeepLink(clock: SimClock, state: AppState, camera: THREE.Camera, controls: OrbitControls): string {
  const params = new URLSearchParams();
  params.set('jd', round(clock.julianDate, 4).toString());
  if (state.selection) {
    params.set('sel', `${state.selection.kind}:${state.selection.id}`);
    if (state.followSelected) params.set('follow', '1');
  }
  const p = camera.position;
  const t = controls.target;
  params.set('cam', [p.x, p.y, p.z, t.x, t.y, t.z].map((v) => round(v, 2)).join(','));
  return `${location.pathname}?${params.toString()}`;
}

export interface DeepLinkPayload {
  jd?: number;
  selection?: Pick<Selection, 'kind' | 'id'>;
  follow?: boolean;
  camera?: { position: THREE.Vector3; target: THREE.Vector3 };
}

export function decodeDeepLink(search: string): DeepLinkPayload {
  const params = new URLSearchParams(search);
  const payload: DeepLinkPayload = {};

  const jd = params.get('jd');
  if (jd) payload.jd = Number(jd);

  const sel = params.get('sel');
  if (sel) {
    const [kind, ...rest] = sel.split(':');
    const id = rest.join(':');
    if ((kind === 'planet' || kind === 'asteroid' || kind === 'comet') && id) {
      payload.selection = { kind, id };
    }
  }

  payload.follow = params.get('follow') === '1';

  const cam = params.get('cam');
  if (cam) {
    const parts = cam.split(',').map(Number);
    if (parts.length === 6 && parts.every((n) => Number.isFinite(n))) {
      payload.camera = {
        position: new THREE.Vector3(parts[0], parts[1], parts[2]),
        target: new THREE.Vector3(parts[3], parts[4], parts[5]),
      };
    }
  }

  return payload;
}
