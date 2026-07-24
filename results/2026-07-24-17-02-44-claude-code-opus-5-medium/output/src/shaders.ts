/**
 * GLSL for the two big point clouds.
 *
 * Kepler's equation is solved per-vertex on the GPU: with ~42,000 asteroids and
 * ~4,000 comets that keeps a full re-propagation of the whole catalogue at
 * 60 fps essentially free, and means changing the time is a single uniform
 * update rather than 46,000 CPU solves.
 *
 * Everything is float32, so the element epochs are stored as days from J2000
 * (small numbers) rather than raw Julian dates (~2.4e6, which would burn the
 * entire mantissa).
 */

const COMMON = /* glsl */ `
  #define TAU 6.283185307179586
  #define PI  3.141592653589793

  // Rotate the in-plane (r, nu) position into the J2000 ecliptic frame.
  vec3 orbitToEcliptic(float r, float nu, float w, float i, float om) {
    float u = nu + w;
    float cu = cos(u), su = sin(u);
    float ci = cos(i), si = sin(i);
    float co = cos(om), so = sin(om);
    return vec3(
      r * (co * cu - so * su * ci),
      r * (so * cu + co * su * ci),
      r * (su * si)
    );
  }

  // M = E - e sin E
  float keplerElliptic(float M, float e) {
    float m = mod(M, TAU);
    float E = m + e * sin(m) * (1.0 + e * cos(m));
    for (int k = 0; k < 8; k++) {
      float f  = E - e * sin(E) - m;
      float fp = 1.0 - e * cos(E);
      E -= f / fp;
    }
    return E;
  }

  float sinh_(float x) { return 0.5 * (exp(x) - exp(-x)); }
  float cosh_(float x) { return 0.5 * (exp(x) + exp(-x)); }
  float tanh_(float x) { float a = exp(2.0 * x); return (a - 1.0) / (a + 1.0); }

  // M = e sinh H - H
  float keplerHyperbolic(float M, float e) {
    float s = M >= 0.0 ? 1.0 : -1.0;
    float am = abs(M);
    float H = s * log(2.0 * am / e + 1.8);
    for (int k = 0; k < 24; k++) {
      float f  = e * sinh_(H) - H - M;
      float fp = e * cosh_(H) - 1.0;
      H -= f / fp;
    }
    return H;
  }

  // Elliptic position from mean anomaly at epoch.
  vec3 ellipticPosition(float a, float e, float i, float om, float w, float ma, float n, float dt) {
    float M = ma + n * dt;
    float E = keplerElliptic(M, e);
    float r = a * (1.0 - e * cos(E));
    float nu = 2.0 * atan(sqrt(1.0 + e) * sin(E * 0.5), sqrt(1.0 - e) * cos(E * 0.5));
    return orbitToEcliptic(r, nu, w, i, om);
  }
`;

export const ASTEROID_VERT = /* glsl */ `
  ${COMMON}

  attribute vec4 aElemA;   // a, e, i, om      (angles in radians)
  attribute vec4 aElemB;   // w, ma, n, epoch0 (n in rad/day, epoch0 in days from J2000)
  attribute float aIndex;  // vertex index, for selection tests
  attribute float aVis;    // 0 = filtered out
  attribute float aSize;   // relative point size
  attribute vec3 aColor;

  uniform float uT;        // days from J2000
  uniform float uSize;     // global point size scale (px * au)
  uniform float uDim;      // opacity of non-highlighted points
  uniform float uSelected; // index of the selected point, or -1

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (aVis < 0.5) {
      gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      vColor = aColor;
      return;
    }

    vec3 pos = ellipticPosition(
      aElemA.x, aElemA.y, aElemA.z, aElemA.w,
      aElemB.x, aElemB.y, aElemB.z, uT - aElemB.w
    );

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float d = max(-mv.z, 0.02);
    float px = uSize * aSize / d;
    bool isSel = abs(aIndex - uSelected) < 0.5;
    gl_PointSize = clamp(px, 1.0, 14.0) * (isSel ? 2.4 : 1.0);
    vColor = isSel ? vec3(1.0) : aColor;
    vAlpha = isSel ? 1.0 : uDim * clamp(px * 1.6, 0.30, 1.0);
  }
`;

export const POINT_FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r2 = dot(uv, uv);
    if (r2 > 0.25) discard;
    // soft round sprite with a slightly hot core
    float a = smoothstep(0.25, 0.045, r2);
    float core = smoothstep(0.06, 0.0, r2) * 0.55;
    gl_FragColor = vec4(vColor + core, a * vAlpha);
    if (gl_FragColor.a < 0.01) discard;
  }
`;

export const COMET_VERT = /* glsl */ `
  ${COMMON}

  attribute vec4 cElemA;   // e, a, q, i
  attribute vec4 cElemB;   // om, w, ma, n
  attribute vec2 cElemC;   // epoch0, tp0
  attribute float aIndex;
  attribute float aVis;
  attribute float aSize;
  attribute vec3 aColor;

  uniform float uT;
  uniform float uSize;
  uniform float uMaxR;     // hide comets beyond this heliocentric distance (au)
  uniform float uSelected;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float e = cElemA.x, a = cElemA.y, q = cElemA.z, i = cElemA.w;
    float om = cElemB.x, w = cElemB.y, ma = cElemB.z, n = cElemB.w;
    float epoch0 = cElemC.x, tp0 = cElemC.y;

    vec3 pos;
    float r;
    if (aVis < 0.5) {
      gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      vColor = aColor;
      return;
    }

    if (e < 0.999) {
      float M = ma + n * (uT - epoch0);
      float E = keplerElliptic(M, e);
      r = a * (1.0 - e * cos(E));
      float nu = 2.0 * atan(sqrt(1.0 + e) * sin(E * 0.5), sqrt(1.0 - e) * cos(E * 0.5));
      pos = orbitToEcliptic(r, nu, w, i, om);
    } else if (e > 1.001) {
      float M = n * (uT - tp0);
      float H = keplerHyperbolic(M, e);
      r = a * (1.0 - e * cosh_(H));
      float nu = 2.0 * atan(sqrt(e + 1.0) * tanh_(H * 0.5), sqrt(e - 1.0));
      pos = orbitToEcliptic(r, nu, w, i, om);
    } else {
      // Barker's equation (near-parabolic): D + D^3/3 = sqrt(mu / 2q^3) (t - tp)
      float Mp = (0.01720209895 / sqrt(2.0 * q * q * q)) * (uT - tp0);
      float W = 1.5 * Mp;
      float s = W + sqrt(W * W + 1.0);
      float y = sign(s) * pow(abs(s), 1.0 / 3.0);
      float D = y - 1.0 / y;
      float nu = 2.0 * atan(D);
      r = q * (1.0 + D * D);
      pos = orbitToEcliptic(r, nu, w, i, om);
    }

    bool isSel = abs(aIndex - uSelected) < 0.5;
    if (r > uMaxR && !isSel) {
      gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      vColor = aColor;
      return;
    }

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float d = max(-mv.z, 0.02);
    float px = uSize * aSize / d;
    gl_PointSize = clamp(px, 1.2, 16.0) * (isSel ? 2.4 : 1.0);
    vColor = isSel ? vec3(1.0) : aColor;
    vAlpha = isSel ? 1.0 : clamp(px * 1.6, 0.35, 1.0);
  }
`;

/** Starfield: fixed random directions on a huge sphere. */
export const STAR_VERT = /* glsl */ `
  attribute float aMag;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aMag * 2.2;
    vA = aMag * 0.55;
  }
`;

export const STAR_FRAG = /* glsl */ `
  precision mediump float;
  varying float vA;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r2 = dot(uv, uv);
    if (r2 > 0.25) discard;
    gl_FragColor = vec4(vec3(1.0), smoothstep(0.25, 0.0, r2) * vA);
  }
`;
