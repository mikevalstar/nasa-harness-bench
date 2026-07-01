// Shared GLSL: solve Kepler's equation and rotate the orbital-plane position
// into the J2000 ecliptic frame. Mirrors src/orbit.ts, but runs per-vertex on
// the GPU so 40k+ bodies can be propagated every frame at interactive rates.
export const KEPLER_GLSL = /* glsl */ `
float solveEllipticalKepler(float M, float e) {
  float m = mod(M + 3.14159265358979, 6.28318530717959) - 3.14159265358979;
  float E = m;
  for (int k = 0; k < 10; k++) {
    float f = E - e * sin(E) - m;
    float fp = 1.0 - e * cos(E);
    E -= f / fp;
  }
  return E;
}

float solveHyperbolicKepler(float M, float e) {
  float H = log(2.0 * abs(M) / e + 1.8) * sign(M);
  for (int k = 0; k < 20; k++) {
    float f = e * sinh(H) - H - M;
    float fp = e * cosh(H) - 1.0;
    H -= f / fp;
  }
  return H;
}

vec3 orbitalPlaneToEcliptic(float r, float nu, float i, float om, float w) {
  float u = w + nu;
  float cosOm = cos(om);
  float sinOm = sin(om);
  float cosU = cos(u);
  float sinU = sin(u);
  float cosI = cos(i);
  float sinI = sin(i);
  return vec3(
    r * (cosOm * cosU - sinOm * sinU * cosI),
    r * (sinI * sinU),
    -r * (sinOm * cosU + cosOm * sinU * cosI)
  );
}

// Elliptical orbit from mean-anomaly-at-epoch elements (asteroids, planets).
vec3 positionFromMeanElements(float a, float e, float i, float om, float w, float ma, float n, float epoch, float jd) {
  float M = ma + n * (jd - epoch);
  float E = solveEllipticalKepler(M, e);
  float nu = 2.0 * atan(sqrt(1.0 + e) * sin(E * 0.5), sqrt(1.0 - e) * cos(E * 0.5));
  float r = a * (1.0 - e * cos(E));
  return orbitalPlaneToEcliptic(r, nu, i, om, w);
}

// Any orbit (elliptical/parabolic/hyperbolic) from perihelion-based elements
// (comets: q, e, tp always present even when a/ma/n are not).
vec3 positionFromPerihelionElements(float q, float e, float i, float om, float w, float tp, float jd) {
  float dt = jd - tp;
  float nu;
  float r;
  const float kGauss = 0.01720209895;

  if (abs(e - 1.0) < 1.0e-3) {
    float M = (kGauss * dt) / (q * sqrt(q)) * 0.70710678;
    float D = M;
    for (int k = 0; k < 20; k++) {
      float f = D + (D * D * D) / 3.0 - M;
      float fp = 1.0 + D * D;
      D -= f / fp;
    }
    nu = 2.0 * atan(D);
    r = q * (1.0 + D * D);
  } else if (e < 1.0) {
    float a = q / (1.0 - e);
    float n = kGauss / pow(a, 1.5);
    float M = n * dt;
    float E = solveEllipticalKepler(M, e);
    nu = 2.0 * atan(sqrt(1.0 + e) * sin(E * 0.5), sqrt(1.0 - e) * cos(E * 0.5));
    r = a * (1.0 - e * cos(E));
  } else {
    float a = q / (1.0 - e);
    float n = kGauss / pow(-a, 1.5);
    float M = n * dt;
    float H = solveHyperbolicKepler(M, e);
    nu = 2.0 * atan(sqrt(e + 1.0) * sinh(H * 0.5), sqrt(e - 1.0) * cosh(H * 0.5));
    r = a * (1.0 - e * cosh(H));
  }

  return orbitalPlaneToEcliptic(r, nu, i, om, w);
}
`;
