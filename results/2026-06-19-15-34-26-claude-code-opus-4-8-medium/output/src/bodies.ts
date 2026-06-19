// GPU-propagated point cloud for the full asteroid + comet population.
//
// Each point carries its orbital elements as vertex attributes; the vertex
// shader solves Kepler's equation (elliptic / hyperbolic / parabolic) every
// frame from a single time uniform. This keeps ~46k bodies animating smoothly
// without touching them on the CPU.

import * as THREE from "three";
import type { BodySet } from "./data";
import { REF_EPOCH } from "./kepler";

const VERT = /* glsl */ `
precision highp float;

in vec4 aA;   // a, e, i(rad), om(rad)
in vec4 aB;   // w(rad), n(rad/day), q(au), tpOff(days)
in vec2 aE;   // sizeKey (abs mag), flags
in float aShown;

uniform float uTRel;       // jd - refEpoch
uniform float uScale;      // au -> scene units
uniform float uPointScale; // pixels per (unit / distance)
uniform float uSizeBoost;
uniform float uFilterActive;
uniform int   uSelected;
uniform int   uColorMode;  // 0 hazard, 1 inclination, 2 eccentricity

out vec3 vColor;
out float vAlpha;
flat out int vSelected;

const float PI = 3.141592653589793;
const float K  = 0.01720209895;

float keplerE(float M, float e){
  M = mod(M + PI, 2.0*PI) - PI;
  float E = (e < 0.8) ? M : PI;
  for(int i=0;i<12;i++){
    E -= (E - e*sin(E) - M) / (1.0 - e*cos(E));
  }
  return E;
}
float keplerH(float M, float e){
  float H = asinh(M / e);
  for(int i=0;i<24;i++){
    H -= (e*sinh(H) - H - M) / (e*cosh(H) - 1.0);
  }
  return H;
}

vec3 heat(float t){ // 0..1 -> blue->cyan->yellow->red
  t = clamp(t, 0.0, 1.0);
  return clamp(vec3(
    smoothstep(0.4,0.9,t) + smoothstep(0.85,1.0,t)*0.4,
    smoothstep(0.0,0.4,t) - smoothstep(0.8,1.0,t)*0.7,
    1.0 - smoothstep(0.2,0.7,t)
  ), 0.0, 1.0);
}

void main(){
  float a = aA.x, e = aA.y, inc = aA.z, om = aA.w;
  float w = aB.x, n = aB.y, q = aB.z, tp = aB.w;

  float xp, yp;
  if(e < 1.0){
    float M = n*(uTRel - tp);
    float E = keplerE(M, e);
    xp = a*(cos(E)-e);
    yp = a*sqrt(max(1.0-e*e,0.0))*sin(E);
  } else if(e > 1.0){
    float M = n*(uTRel - tp);
    float H = keplerH(M, e);
    xp = a*(e - cosh(H));
    yp = -a*sqrt(e*e-1.0)*sinh(H);
  } else {
    float W = 3.0*K*(uTRel - tp)/sqrt(2.0*q*q*q);
    float h = W*0.5;
    float t1 = h + sqrt(h*h + 1.0);
    float c = sign(t1)*pow(abs(t1), 1.0/3.0);
    float D = c - 1.0/c;
    xp = q*(1.0 - D*D);
    yp = q*2.0*D;
  }

  float cw=cos(w), sw=sin(w), co=cos(om), so=sin(om), ci=cos(inc), si=sin(inc);
  float x1 = xp*cw - yp*sw;
  float y1 = xp*sw + yp*cw;
  float y2 = y1*ci;
  float z2 = y1*si;
  float X = x1*co - y2*so;
  float Y = x1*so + y2*co;
  vec3 pos = vec3(X, z2, -Y) * uScale;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  int flags = int(aE.y + 0.5);
  bool pha    = (flags & 1) != 0;
  bool sentry = (flags & 2) != 0;
  bool comet  = (flags & 4) != 0;

  float Hmag = aE.x;
  float baseSize = clamp(13.0 - Hmag*0.42, 1.6, 9.0);
  float dist = max(-mv.z, 0.05);
  float ps = baseSize * uPointScale / dist * uSizeBoost;
  gl_PointSize = clamp(ps, 1.0, 48.0);

  vec3 col;
  if(comet){
    col = vec3(0.45, 0.95, 1.0);
  } else if(uColorMode == 1){
    col = heat(inc / 0.9); // up to ~51 deg
  } else if(uColorMode == 2){
    col = heat(e);
  } else {
    if(sentry)    col = vec3(1.0, 0.25, 0.85);
    else if(pha)  col = vec3(1.0, 0.42, 0.18);
    else          col = vec3(0.58, 0.64, 0.74);
  }

  float alpha = comet ? 0.95 : 0.92;
  if(uFilterActive > 0.5 && aShown < 0.5){
    alpha = 0.04;
    gl_PointSize = min(gl_PointSize, 2.0);
  }

  vSelected = (gl_VertexID == uSelected) ? 1 : 0;
  if(vSelected == 1){
    gl_PointSize = max(gl_PointSize, 18.0);
    col = vec3(1.0, 1.0, 0.65);
    alpha = 1.0;
  }

  vColor = col;
  vAlpha = alpha;
}
`;

const FRAG = /* glsl */ `
precision highp float;
in vec3 vColor;
in float vAlpha;
flat in int vSelected;
out vec4 frag;

void main(){
  vec2 uv = gl_PointCoord*2.0 - 1.0;
  float r2 = dot(uv, uv);
  if(r2 > 1.0) discard;
  float core = smoothstep(1.0, 0.1, r2);
  float a = core * vAlpha;
  vec3 c = vColor;
  if(vSelected == 1){
    float ring = smoothstep(1.0, 0.82, r2) * (1.0 - smoothstep(0.82, 0.55, r2));
    c = mix(c, vec3(1.0), ring);
    a = max(a, ring);
  }
  frag = vec4(c, a);
}
`;

export interface BodyCloud {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  geometry: THREE.BufferGeometry;
  shown: Float32Array; // per-body visibility (1 / 0), mutate then markShownDirty()
  count: number;
  setShown(visible: Uint8Array | null): void; // null => no filter
}

export function buildBodyCloud(
  set: BodySet,
  opts: { scale: number; sizeBoost?: number }
): BodyCloud {
  const geometry = new THREE.BufferGeometry();
  // Dummy position attribute so three derives the vertex count.
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(set.count * 3), 3)
  );
  geometry.setAttribute("aA", new THREE.BufferAttribute(set.A, 4));
  geometry.setAttribute("aB", new THREE.BufferAttribute(set.B, 4));
  geometry.setAttribute("aE", new THREE.BufferAttribute(set.E, 2));

  const shown = new Float32Array(set.count).fill(1);
  const shownAttr = new THREE.BufferAttribute(shown, 1);
  shownAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("aShown", shownAttr);

  // A generous bounding sphere so the cloud is never frustum-culled (positions
  // are computed in-shader, so three can't know the real extent).
  geometry.boundingSphere = new THREE.Sphere(
    new THREE.Vector3(0, 0, 0),
    1e6
  );

  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    uniforms: {
      uTRel: { value: 0 },
      uScale: { value: opts.scale },
      uPointScale: { value: 100 },
      uSizeBoost: { value: opts.sizeBoost ?? 1 },
      uFilterActive: { value: 0 },
      uSelected: { value: -1 },
      uColorMode: { value: 0 },
    },
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  return {
    points,
    material,
    geometry,
    shown,
    count: set.count,
    setShown(visible: Uint8Array | null) {
      if (!visible) {
        material.uniforms.uFilterActive.value = 0;
        return;
      }
      material.uniforms.uFilterActive.value = 1;
      for (let i = 0; i < shown.length; i++) shown[i] = visible[i] ? 1 : 0;
      shownAttr.needsUpdate = true;
    },
  };
}

export { REF_EPOCH };
