// Asteroid cloud — a single THREE.Points covering all 42K objects.
// Per-body attributes are uploaded as BufferAttributes and updated per frame.

import * as THREE from 'three';
import type { PackedAsteroid } from './data';

export interface AsteroidCloud {
  points: THREE.Points;
  positions: THREE.BufferAttribute;
  // Per-vertex color, alpha, size scalars.
  colors: THREE.BufferAttribute;
  sizes: THREE.BufferAttribute;
  alphas: THREE.BufferAttribute;
  flags: THREE.BufferAttribute; // 0=normal NEO, 1=PHA, 2=sentry, 3=PHA+sentry
  rawPositions: Float32Array;
  count: number;
  setMask: (mask: Uint8Array | null) => void;
}

export function buildAsteroidCloud(packed: PackedAsteroid): AsteroidCloud {
  const N = packed.count;
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const sizes = new Float32Array(N);
  const alphas = new Float32Array(N);
  const flags = new Float32Array(N);

  // Color & size initialization.
  for (let i = 0; i < N; i++) {
    const m = packed.meta[i];
    let r = 0.78,
      g = 0.82,
      b = 0.92;
    let alpha = 0.55;
    let flag = 0;

    if (m.diameter != null) {
      // Log-scale 0.05 → 5 km to display size 0.7 → 4.5 px.
      const d = Math.max(0.05, Math.min(50, m.diameter));
      const s = Math.log10(d + 1);
      // d=0.05 → s≈0.7; d=50 → s≈1.71
      sizes[i] = 0.6 + ((s - 0.7) / 1.0) * 4.0;
    } else if (m.H != null) {
      // H = abs magnitude; brighter (lower H) = larger.
      // H~15 → ~1.5 km; H~22 → ~0.1 km.
      const h = Math.max(10, Math.min(28, m.H));
      // size roughly inverse-H
      sizes[i] = 0.8 + (28 - h) * 0.18;
    } else {
      sizes[i] = 0.7;
    }
    sizes[i] = Math.max(0.6, Math.min(5.0, sizes[i]));

    if (m.pha) {
      r = 1.0;
      g = 0.55;
      b = 0.24;
      alpha = 0.95;
      flag = 1;
    }
    // Sentry overlay: we'll mark via flags and recolor slightly.
    if (packed.sentryByPdes[m.pdes]) {
      r = Math.min(1, r * 0.6 + 1.0 * 0.4);
      g = Math.min(1, g * 0.6 + 0.85 * 0.4);
      b = Math.min(1, b * 0.6 + 0.30 * 0.4);
      alpha = Math.max(alpha, 0.9);
      flag = m.pha ? 3 : 2;
    }
    colors[i * 3 + 0] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
    alphas[i] = alpha;
    flags[i] = flag;
  }

  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  const colAttr = new THREE.BufferAttribute(colors, 3);
  const szAttr = new THREE.BufferAttribute(sizes, 1);
  const alAttr = new THREE.BufferAttribute(alphas, 1);
  const flAttr = new THREE.BufferAttribute(flags, 1);

  posAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('color', colAttr);
  geo.setAttribute('aSize', szAttr);
  geo.setAttribute('aAlpha', alAttr);
  geo.setAttribute('aFlag', flAttr);
  geo.setDrawRange(0, N);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: { value: window.devicePixelRatio || 1 },
      uSizeBoost: { value: 1.0 },
      uHighlightId: { value: -1 },
      uSelectedFlag: { value: -1 },
      uSelectedPulse: { value: 0.0 },
      uTime: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAlpha;
      attribute float aFlag;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vFlag;
      uniform float uPixelRatio;
      uniform float uSizeBoost;
      void main() {
        vColor = color;
        vAlpha = aAlpha;
        vFlag = aFlag;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = max(0.001, -mv.z);
        float px = aSize * uSizeBoost * uPixelRatio * 3.5 / dist;
        gl_PointSize = clamp(px, 1.0, 10.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vFlag;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float r2 = dot(uv, uv);
        if (r2 > 0.25) discard;
        float a = (1.0 - r2 * 4.0) * vAlpha;
        vec3 col = vColor;
        if (vFlag >= 2.0) {
          float ring = smoothstep(0.10, 0.25, r2) * 0.6;
          col += vec3(1.0, 0.85, 0.3) * ring;
        }
        gl_FragColor = vec4(col, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    vertexColors: true,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false; // always draw; positions update each frame

  // Use the raw positions buffer for direct writes from propagator.
  const setMask = (_mask: Uint8Array | null) => {
    // Currently no mask — handled via uSizeBoost for visibility. Hook left for
    // future perf work that hides filtered-out asteroids.
  };

  return {
    points,
    positions: posAttr,
    colors: colAttr,
    sizes: szAttr,
    alphas: alAttr,
    flags: flAttr,
    rawPositions: positions,
    count: N,
    setMask,
  };
}
