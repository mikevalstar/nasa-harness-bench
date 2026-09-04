export interface UrlState {
  jd?: number;
  target?: string;
  type?: 'asteroid' | 'comet' | 'planet' | 'sun';
  follow?: boolean;
  speed?: number;
  cam?: [number, number, number];
  tar?: [number, number, number];
  pha?: boolean;
  sentry?: boolean;
  comets?: boolean;
  color?: string;
}

export function parseUrlHash(): UrlState {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return {};

  const params = new URLSearchParams(hash);
  const state: UrlState = {};

  if (params.has('jd')) {
    const jd = parseFloat(params.get('jd')!);
    if (!isNaN(jd)) state.jd = jd;
  }
  if (params.has('target')) {
    state.target = params.get('target')!;
  }
  if (params.has('type')) {
    state.type = params.get('type') as any;
  }
  if (params.has('follow')) {
    state.follow = params.get('follow') === '1' || params.get('follow') === 'true';
  }
  if (params.has('speed')) {
    const sp = parseFloat(params.get('speed')!);
    if (!isNaN(sp)) state.speed = sp;
  }
  if (params.has('cam')) {
    const parts = params.get('cam')!.split(',').map(Number);
    if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
      state.cam = [parts[0], parts[1], parts[2]];
    }
  }
  if (params.has('tar')) {
    const parts = params.get('tar')!.split(',').map(Number);
    if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
      state.tar = [parts[0], parts[1], parts[2]];
    }
  }
  if (params.has('pha')) {
    state.pha = params.get('pha') === '1';
  }
  if (params.has('sentry')) {
    state.sentry = params.get('sentry') === '1';
  }
  if (params.has('comets')) {
    state.comets = params.get('comets') === '1';
  }
  if (params.has('color')) {
    state.color = params.get('color')!;
  }

  return state;
}

export function updateUrlHash(state: UrlState) {
  const params = new URLSearchParams();

  if (state.jd !== undefined) params.set('jd', state.jd.toFixed(4));
  if (state.target) params.set('target', state.target);
  if (state.type) params.set('type', state.type);
  if (state.follow) params.set('follow', '1');
  if (state.speed !== undefined && state.speed !== 1.0) params.set('speed', state.speed.toString());
  if (state.cam) {
    params.set(
      'cam',
      `${state.cam[0].toFixed(2)},${state.cam[1].toFixed(2)},${state.cam[2].toFixed(2)}`
    );
  }
  if (state.tar) {
    params.set(
      'tar',
      `${state.tar[0].toFixed(2)},${state.tar[1].toFixed(2)},${state.tar[2].toFixed(2)}`
    );
  }
  if (state.pha) params.set('pha', '1');
  if (state.sentry) params.set('sentry', '1');
  if (state.comets) params.set('comets', '1');
  if (state.color && state.color !== 'class') params.set('color', state.color);

  const hashStr = params.toString();
  if (hashStr) {
    window.history.replaceState(null, '', `#${hashStr}`);
  }
}
