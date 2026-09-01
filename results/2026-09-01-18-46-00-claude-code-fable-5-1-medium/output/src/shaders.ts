/**
 * Asteroid cloud shaders. Each vertex carries its orbital elements and solves
 * Kepler's equation for the uniform time, so moving 42k bodies costs nothing
 * on the CPU. Layout matches types.ts / prepare-data.mjs.
 */

export const asteroidVertex = /* glsl */ `
  precision highp float;

  attribute vec4 orb0;   // a, e, ma (rad), n (rad/day)
  attribute vec4 orb1;   // epoch - J2000 (days), H, moid, flags
  attribute vec3 pvec;   // perifocal P (ecliptic xyz)
  attribute vec3 qvec;   // perifocal Q
  attribute float cls;   // class index
  attribute float vis;   // 1 = passes filters

  uniform float uT;          // days since J2000
  uniform float uPixelRatio;
  uniform float uColorMode;  // 0 hazard, 1 class, 2 size
  uniform vec3 uClassColors[8];
  uniform float uDim;        // global alpha multiplier

  varying vec3 vColor;
  varying float vAlpha;

  const float TWO_PI = 6.283185307179586;

  float kepler(float M, float e) {
    float E = e < 0.8 ? M : 3.141592653589793;
    for (int k = 0; k < 8; k++) {
      E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
    }
    return E;
  }

  void main() {
    if (vis < 0.5) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      vColor = vec3(0.0);
      return;
    }
    float a = orb0.x, e = orb0.y;
    float M = orb0.z + orb0.w * (uT - orb1.x);
    M = mod(M, TWO_PI);
    if (M < 0.0) M += TWO_PI;
    float E = kepler(M, e);
    float x = a * (cos(E) - e);
    float y = a * sqrt(1.0 - e * e) * sin(E);
    vec3 ecl = x * pvec + y * qvec;
    vec3 pos = vec3(ecl.x, ecl.z, -ecl.y);   // ecliptic -> scene (y up)

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float H = orb1.y;
    float flags = orb1.w;
    bool pha = mod(flags, 2.0) >= 1.0;
    bool sentry = mod(floor(flags / 2.0), 2.0) >= 1.0;

    // size: big (low H) objects get bigger, brighter points
    float s = clamp((28.0 - H) / 12.0, 0.15, 1.6);
    float dist = max(-mv.z, 0.02);
    float px = (1.2 + 4.5 * s) * clamp(2.5 / dist, 0.45, 2.2);
    gl_PointSize = px * uPixelRatio;

    vec3 c;
    if (uColorMode < 0.5) {
      c = vec3(0.45, 0.62, 0.85);
      if (sentry) c = vec3(1.0, 0.72, 0.2);
      if (pha) c = vec3(1.0, 0.3, 0.32);
      if (pha && sentry) c = vec3(1.0, 0.5, 0.15);
    } else if (uColorMode < 1.5) {
      c = uClassColors[int(cls)];
    } else {
      float t = clamp((H - 12.0) / 16.0, 0.0, 1.0); // 0 = big, 1 = tiny
      c = mix(vec3(1.0, 0.85, 0.35), vec3(0.35, 0.5, 0.9), t);
    }
    vColor = c;
    vAlpha = uDim * clamp(0.35 + 0.6 * s, 0.35, 1.0) * ((pha || sentry) && uColorMode < 0.5 ? 1.0 : 0.85);
  }
`;

export const asteroidFragment = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    if (vAlpha <= 0.0) discard;
    vec2 d = gl_PointCoord - 0.5;
    float r2 = dot(d, d);
    if (r2 > 0.25) discard;
    float soft = smoothstep(0.25, 0.05, r2);
    gl_FragColor = vec4(vColor, vAlpha * soft);
  }
`;

export const cometVertex = /* glsl */ `
  precision highp float;
  attribute float bright; // 0..1 from M1
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = max(-mv.z, 0.02);
    gl_PointSize = (2.0 + 4.0 * bright) * clamp(2.5 / dist, 0.5, 2.0) * uPixelRatio;
    vAlpha = 0.55 + 0.45 * bright;
  }
`;

export const cometFragment = /* glsl */ `
  precision highp float;
  varying float vAlpha;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r2 = dot(d, d);
    if (r2 > 0.25) discard;
    gl_FragColor = vec4(0.55, 0.95, 1.0, vAlpha * smoothstep(0.25, 0.04, r2));
  }
`;
