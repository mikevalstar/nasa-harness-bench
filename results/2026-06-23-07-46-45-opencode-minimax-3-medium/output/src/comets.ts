// Comet rendering: propagates and draws comets using their orbital elements.
// Most comets use the same elliptic propagator as asteroids; hyperbolic ones
// (e ≥ 1) use a separate code path. Only comets within `maxDist` AU of the Sun
// are drawn (they're otherwise invisible at interstellar distances).

import * as THREE from 'three';
import type { Comet } from './types';
import { buildEllipticProp, propagateElliptic, buildHyperbolicProp, propagateHyperbolic, GM_SUN } from './orbit';

const DEG = Math.PI / 180;

interface EllipticEntry {
  type: 'e';
  prop: ReturnType<typeof buildEllipticProp>;
}
interface HyperbolicEntry {
  type: 'h';
  prop: ReturnType<typeof buildHyperbolicProp>;
}

export interface CometCloud {
  points: THREE.Points;
  positions: THREE.BufferAttribute;
  colors: THREE.BufferAttribute;
  sizes: THREE.BufferAttribute;
  alphas: THREE.BufferAttribute;
  rawPositions: Float32Array;
  count: number;
  visible: Uint8Array;
  update: (t: number) => void;
}

export function buildComets(comets: Comet[]): CometCloud {
  const ell: EllipticEntry[] = [];
  const hyp: HyperbolicEntry[] = [];
  for (const c of comets) {
    if (c.e >= 1) {
      const p = buildHyperbolicProp(c);
      if (p) hyp.push({ type: 'h', prop: p });
    } else {
      // Use ma+epoch+n like asteroids if available.
      if (c.n != null && c.epoch != null && c.ma != null) {
        ell.push({
          type: 'e',
          prop: buildEllipticProp({
            a: c.a,
            e: c.e,
            i: c.i,
            om: c.om,
            w: c.w,
            ma: c.ma,
            epoch: c.epoch,
            n: c.n,
          }),
        });
      } else if (c.tp != null) {
        // Approximate as small ellipse around tp.
        // Fall back to using q as semi-major with synthesized mean motion.
        const aSynth = c.q / Math.max(1 - c.e, 0.05);
        // Mean motion derived from a: n = sqrt(GM/a^3) rad/day.
        const nRad = Math.sqrt(GM_SUN / Math.pow(Math.max(aSynth, 0.1), 3));
        ell.push({
          type: 'e',
          prop: {
            a: aSynth,
            e: Math.min(0.99, Math.max(0, c.e)),
            n: nRad / DEG,
            ma0: 0,
            epoch: c.tp,
            coeffs: (function () {
              const om = c.om * DEG, w = c.w * DEG, i = c.i * DEG;
              const cosOm = Math.cos(om), sinOm = Math.sin(om);
              const cosW = Math.cos(w), sinW = Math.sin(w);
              const cosI = Math.cos(i), sinI = Math.sin(i);
              return {
                cosOm, sinOm, cosW, sinW, cosI, sinI,
                Px: cosOm * cosW - sinOm * sinW * cosI,
                Py: sinOm * cosW + cosOm * sinW * cosI,
                Pz: sinW * sinI,
                Qx: -cosOm * sinW - sinOm * cosW * cosI,
                Qy: -sinOm * sinW + cosOm * cosW * cosI,
                Qz: cosW * sinI,
              };
            })(),
          },
        });
      }
    }
  }

  const total = ell.length + hyp.length;
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  const sizes = new Float32Array(total);
  const alphas = new Float32Array(total);
  const visible = new Uint8Array(total);

  for (let i = 0; i < total; i++) {
    colors[i * 3 + 0] = 0.55;
    colors[i * 3 + 1] = 0.85;
    colors[i * 3 + 2] = 1.0;
    sizes[i] = 1.6;
    alphas[i] = 0.85;
  }

  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  geo.setDrawRange(0, total);

  const mat = new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: window.devicePixelRatio || 1 } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAlpha;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uPixelRatio;
      void main() {
        vColor = color;
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = max(0.001, -mv.z);
        gl_PointSize = clamp(aSize * uPixelRatio * 6.0 / dist, 1.0, 14.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv);
        float a = (1.0 - smoothstep(0.0, 0.5, r)) * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  const tmp = [0, 0, 0];

  const update = (t: number) => {
    let visibleCount = 0;
    for (let i = 0; i < ell.length; i++) {
      propagateElliptic(ell[i].prop, t, tmp);
      const x = tmp[0], y = tmp[1], z = tmp[2];
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      const r = Math.hypot(x, y, z);
      const v = r < 50 ? 1 : 0;
      visible[i] = v;
      if (v) visibleCount++;
    }
    for (let j = 0; j < hyp.length; j++) {
      const i = ell.length + j;
      const prop = hyp[j].prop;
      if (!prop) continue;
      const ok = propagateHyperbolic(prop, t, tmp, 50);
      positions[i * 3 + 0] = tmp[0];
      positions[i * 3 + 1] = tmp[1];
      positions[i * 3 + 2] = tmp[2];
      visible[i] = ok ? 1 : 0;
      if (ok) visibleCount++;
    }
    posAttr.needsUpdate = true;
    // The total visible count can be displayed if desired.
    void visibleCount;
  };

  return {
    points,
    positions: posAttr,
    colors: new THREE.BufferAttribute(colors, 3),
    sizes: new THREE.BufferAttribute(sizes, 1),
    alphas: new THREE.BufferAttribute(alphas, 1),
    rawPositions: positions,
    count: total,
    visible,
    update,
  };
}
