import * as THREE from 'three';
import type { AstMeta } from './data';

// Orbit-class palette (indices match CLASS_CODES order below).
export const CLASS_CODES: Record<string, number> = {
  AMO: 0, // Amor
  APO: 1, // Apollo
  ATE: 2, // Aten
  IEO: 3, // Atira / interior-Earth
  HTC: 4,
  ETc: 5,
  JFc: 6,
  JFC: 7,
};

export const CLASS_COLORS: [number, number, number][] = [
  [0.45, 0.78, 1.0], // AMO  blue
  [0.55, 1.0, 0.6], // APO  green
  [1.0, 0.78, 0.35], // ATE  amber
  [0.8, 0.5, 1.0], // IEO  violet
  [1.0, 0.55, 0.8], // HTC  pink
  [0.6, 0.9, 0.9], // ETc  teal
  [0.9, 0.7, 0.5], // JFc  tan
  [0.9, 0.7, 0.5], // JFC  tan
];

export interface AsteroidLayer {
  points: THREE.Points;
  setTime(daysSinceJ2000: number): void;
  setColorMode(mode: number): void;
  setPointScale(scale: number): void;
  setVisibility(mask: Uint8Array): void;
  material: THREE.ShaderMaterial;
  count: number;
}

// Estimate a visual point-size base from physical data so bigger / brighter
// objects read larger. Falls back to an albedo-based diameter estimate from H.
function sizeBaseFor(diameter: number | null, H: number | null): number {
  let d = diameter ?? 0;
  if (!d && H != null) {
    const albedo = 0.14; // typical NEO assumption when unknown
    d = (1329 / Math.sqrt(albedo)) * Math.pow(10, -0.2 * H); // km
  }
  if (!d) d = 0.3;
  // Compress the enormous dynamic range; map to ~[0.6, 3.4].
  const s = 0.6 + 0.45 * Math.log10(d + 1) * 2.2;
  return Math.max(0.6, Math.min(3.6, s));
}

export function createAsteroidLayer(orbits: Float32Array, meta: AstMeta): AsteroidLayer {
  const N = meta.count;
  const geo = new THREE.BufferGeometry();

  // Pack orbit elements into two vec4 attributes.
  const aA = new Float32Array(N * 4); // a, e, i, om
  const aB = new Float32Array(N * 4); // w, ma, n, epochOffset
  const aClass = new Float32Array(N);
  const aPha = new Float32Array(N);
  const aSize = new Float32Array(N);
  const aMetric = new Float32Array(N); // normalized size metric for "size" color mode
  const aMoid = new Float32Array(N);
  const aVisible = new Float32Array(N);

  for (let k = 0; k < N; k++) {
    const b = k * 8;
    aA[k * 4 + 0] = orbits[b + 0];
    aA[k * 4 + 1] = orbits[b + 1];
    aA[k * 4 + 2] = orbits[b + 2];
    aA[k * 4 + 3] = orbits[b + 3];
    aB[k * 4 + 0] = orbits[b + 4];
    aB[k * 4 + 1] = orbits[b + 5];
    aB[k * 4 + 2] = orbits[b + 6];
    aB[k * 4 + 3] = orbits[b + 7];

    aClass[k] = CLASS_CODES[meta.class[k] ?? ''] ?? 0;
    aPha[k] = meta.pha[k];
    aSize[k] = sizeBaseFor(meta.diameter[k], meta.H[k]);
    // size metric: smaller H (brighter/bigger) -> closer to 1
    const H = meta.H[k];
    aMetric[k] = H == null ? 0.3 : Math.max(0, Math.min(1, (28 - H) / 18));
    aMoid[k] = meta.moid[k] ?? 0.5;
    aVisible[k] = 1;
  }

  // Dummy position attribute (positions are computed in the vertex shader).
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute('aA', new THREE.BufferAttribute(aA, 4));
  geo.setAttribute('aB', new THREE.BufferAttribute(aB, 4));
  geo.setAttribute('aClass', new THREE.BufferAttribute(aClass, 1));
  geo.setAttribute('aPha', new THREE.BufferAttribute(aPha, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  geo.setAttribute('aMetric', new THREE.BufferAttribute(aMetric, 1));
  geo.setAttribute('aMoid', new THREE.BufferAttribute(aMoid, 1));
  geo.setAttribute('aVisible', new THREE.BufferAttribute(aVisible, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e6);

  const palette = CLASS_COLORS.map((c) => new THREE.Vector3(c[0], c[1], c[2]));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorMode: { value: 0 },
      uPointScale: { value: 1 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uPalette: { value: palette },
    },
    vertexShader: /* glsl */ `
      precision highp float;
      attribute vec4 aA;     // a, e, i, om
      attribute vec4 aB;     // w, ma, n, epochOff
      attribute float aClass;
      attribute float aPha;
      attribute float aSize;
      attribute float aMetric;
      attribute float aMoid;
      attribute float aVisible;

      uniform float uTime;       // days since J2000
      uniform int   uColorMode;  // 0 class, 1 hazard, 2 size, 3 moid
      uniform float uPointScale;
      uniform float uPixelRatio;
      uniform vec3  uPalette[8];

      varying vec3 vColor;
      varying float vAlpha;

      const float PI = 3.141592653589793;
      const float TWO_PI = 6.283185307179586;

      vec3 ramp(float t, vec3 lo, vec3 mid, vec3 hi) {
        if (t < 0.5) return mix(lo, mid, t * 2.0);
        return mix(mid, hi, (t - 0.5) * 2.0);
      }

      void main() {
        float a = aA.x, e = aA.y, inc = aA.z, om = aA.w;
        float w = aB.x, ma = aB.y, n = aB.z, epochOff = aB.w;

        // Mean anomaly at uTime, wrapped to [-pi, pi].
        float M = ma + n * (uTime - epochOff);
        M = mod(M + PI, TWO_PI) - PI;

        // Solve Kepler's equation (Newton-Raphson).
        float E = M;
        for (int it = 0; it < 8; it++) {
          float dE = (E - e * sin(E) - M) / (1.0 - e * cos(E));
          E -= dE;
        }

        float xo = a * (cos(E) - e);
        float yo = a * sqrt(max(0.0, 1.0 - e * e)) * sin(E);

        float cw = cos(w), sw = sin(w);
        float co = cos(om), so = sin(om);
        float ci = cos(inc), si = sin(inc);

        float x1 = cw * xo - sw * yo;
        float y1 = sw * xo + cw * yo;
        float y2 = ci * y1;
        float z2 = si * y1;
        vec3 pos = vec3(co * x1 - so * y2, so * x1 + co * y2, z2);

        // Color selection.
        vec3 col;
        if (uColorMode == 0) {
          int ci2 = int(aClass + 0.5);
          col = uPalette[ci2];
        } else if (uColorMode == 1) {
          col = aPha > 0.5 ? vec3(1.0, 0.27, 0.27) : vec3(0.45, 0.55, 0.7);
        } else if (uColorMode == 2) {
          col = ramp(aMetric, vec3(0.2,0.35,0.7), vec3(0.4,0.9,0.9), vec3(1.0,0.95,0.5));
        } else {
          float t = clamp(1.0 - aMoid / 0.05, 0.0, 1.0); // close MOID -> hot
          col = ramp(t, vec3(0.35,0.55,0.8), vec3(1.0,0.8,0.3), vec3(1.0,0.25,0.2));
        }
        vColor = col;
        vAlpha = aVisible;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        float sz = aSize * uPointScale * uPixelRatio;
        // Mild distance attenuation so the cloud keeps depth cues.
        gl_PointSize = aVisible * sz * (1.0 + 6.0 / (1.0 + -mvPosition.z));
        if (aVisible < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 d = gl_PointCoord - vec2(0.5);
        float r = dot(d, d);
        if (r > 0.25) discard;
        float edge = smoothstep(0.25, 0.05, r);
        gl_FragColor = vec4(vColor, edge * 0.95 * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;

  const visAttr = geo.getAttribute('aVisible') as THREE.BufferAttribute;

  return {
    points,
    material,
    count: N,
    setTime(d: number) {
      material.uniforms.uTime.value = d;
    },
    setColorMode(mode: number) {
      material.uniforms.uColorMode.value = mode;
    },
    setPointScale(scale: number) {
      material.uniforms.uPointScale.value = scale;
    },
    setVisibility(mask: Uint8Array) {
      const arr = visAttr.array as Float32Array;
      for (let i = 0; i < N; i++) arr[i] = mask[i];
      visAttr.needsUpdate = true;
    },
  };
}
