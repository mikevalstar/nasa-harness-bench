// The ~42k asteroids rendered as a single THREE.Points cloud. Orbit propagation
// happens entirely on the GPU: orbital elements are vertex attributes and the
// vertex shader solves Kepler's equation per object per frame. CPU-side helpers
// mirror the same math for picking and the camera-follow feature.
import * as THREE from 'three';

const VERT = /* glsl */ `
attribute vec4 aOrb1; // a, e, i(deg), om(deg)
attribute vec4 aOrb2; // w(deg), ma(deg), depoch(days), n(deg/day)
attribute vec3 aMisc; // diam(km), flags, classIdx
attribute vec3 aColor;
attribute float aAlpha;
uniform float uT;    // jd - epochRef, days
uniform float uPx;   // global point-size scale (devicePixelRatio * user setting)
varying vec3 vColor;
varying float vAlpha;

void main() {
  float a = aOrb1.x, e = aOrb1.y;
  float inc = radians(aOrb1.z), om = radians(aOrb1.w);
  float w = radians(aOrb2.x);
  float M = radians(aOrb2.y + aOrb2.w * (uT - aOrb2.z));
  M = mod(M + 3.141592653589793, 6.283185307179586) - 3.141592653589793;
  float E = e < 0.8 ? M + e * sin(M) : 3.141592653589793 * sign(M + 1e-12);
  for (int k = 0; k < 9; k++) {
    E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
  }
  float xo = a * (cos(E) - e);
  float yo = a * sqrt(1.0 - e * e) * sin(E);
  float cw = cos(w), sw = sin(w);
  float ci = cos(inc), si = sin(inc);
  float co = cos(om), so = sin(om);
  vec3 pos = vec3(
    (co * cw - so * sw * ci) * xo + (-co * sw - so * cw * ci) * yo,
    (sw * si) * xo + (cw * si) * yo,
    (so * cw + co * sw * ci) * xo + (-so * sw + co * cw * ci) * yo
  );
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float diam = aMisc.x;
  float pha = mod(aMisc.y, 2.0);
  float base = 1.5 + 2.0 * log(diam + 1.0) + 1.2 * pha;
  float att = clamp(2.5 / -mv.z, 0.3, 2.2); // shrink nearby points so close-ups stay readable
  gl_PointSize = clamp(base * uPx * att, 1.25, 10.0);
  vColor = aColor;
  vAlpha = aAlpha;
}
`;

const FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r2 = dot(c, c);
  if (r2 > 0.25) discard;
  float glow = smoothstep(0.25, 0.02, r2);
  gl_FragColor = vec4(vColor, vAlpha * glow);
}
`;

export class AsteroidCloud {
  constructor(core) {
    this.core = core;
    const { bin, stride, count } = core;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    // de-interleave the binary into typed-attribute views
    const orb1 = new Float32Array(count * 4);
    const orb2 = new Float32Array(count * 4);
    const misc = new Float32Array(count * 3);
    for (let k = 0; k < count; k++) {
      const b = k * stride;
      orb1.set([bin[b], bin[b + 1], bin[b + 2], bin[b + 3]], k * 4);
      orb2.set([bin[b + 4], bin[b + 5], bin[b + 6], bin[b + 7]], k * 4);
      misc.set([bin[b + 9], bin[b + 10], bin[b + 11]], k * 3);
    }
    this.attrOrb1 = new THREE.BufferAttribute(orb1, 4);
    this.attrOrb2 = new THREE.BufferAttribute(orb2, 4);
    this.attrMisc = new THREE.BufferAttribute(misc, 3);
    this.attrColor = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
    this.attrAlpha = new THREE.BufferAttribute(new Float32Array(count), 1);
    geo.setAttribute('aOrb1', this.attrOrb1);
    geo.setAttribute('aOrb2', this.attrOrb2);
    geo.setAttribute('aMisc', this.attrMisc);
    geo.setAttribute('aColor', this.attrColor);
    geo.setAttribute('aAlpha', this.attrAlpha);

    this.uniforms = {
      uT: { value: 0 },
      uPx: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
  }

  setTime(jd) {
    this.uniforms.uT.value = jd - this.core.epochRef;
  }
  setPxScale(v) {
    this.uniforms.uPx.value = v;
  }
  flagColorDirty() {
    this.attrColor.needsUpdate = true;
    this.attrAlpha.needsUpdate = true;
  }

  // CPU mirror of the vertex-shader propagation; used for picking / follow.
  positionAt(index, jd, out = new THREE.Vector3()) {
    const { bin, stride, epochRef } = this.core;
    const b = index * stride;
    const a = bin[b], e = bin[b + 1];
    const inc = (bin[b + 2] * Math.PI) / 180, om = (bin[b + 3] * Math.PI) / 180;
    const w = (bin[b + 4] * Math.PI) / 180;
    let M = ((bin[b + 5] + bin[b + 7] * (jd - epochRef - bin[b + 6])) * Math.PI) / 180;
    M = ((M + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    let E = e < 0.8 ? M + e * Math.sin(M) : Math.abs(M) < 1e-9 ? M : Math.PI * Math.sign(M);
    for (let k = 0; k < 10; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const xo = a * (Math.cos(E) - e);
    const yo = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const cw = Math.cos(w), sw = Math.sin(w);
    const ci = Math.cos(inc), si = Math.sin(inc);
    const co = Math.cos(om), so = Math.sin(om);
    out.set(
      (co * cw - so * sw * ci) * xo + (-co * sw - so * cw * ci) * yo,
      sw * si * xo + cw * si * yo,
      (so * cw + co * sw * ci) * xo + (-so * sw + co * cw * ci) * yo
    );
    return out;
  }

  // Elements of one object in the plain {a,e,i,om,w,...} shape orbit.js expects.
  elementsAt(index) {
    const { bin, stride, epochRef } = this.core;
    const b = index * stride;
    return {
      a: bin[b], e: bin[b + 1], i: bin[b + 2], om: bin[b + 3], w: bin[b + 4],
      ma: bin[b + 5], epoch: bin[b + 6] + epochRef, n: bin[b + 7],
      H: bin[b + 8], diam: bin[b + 9], flags: bin[b + 10], classIdx: bin[b + 11],
    };
  }

  // Nearest on-screen point to (mx, my) in CSS pixels, or null.
  pick(jd, camera, mx, my, width, height, maxPx = 10) {
    const { count } = this.core;
    const v = new THREE.Vector3();
    let best = -1;
    let bestD = maxPx;
    const alpha = this.attrAlpha.array;
    for (let k = 0; k < count; k++) {
      if (alpha[k] < 0.05) continue; // filtered out
      this.positionAt(k, jd, v).project(camera);
      if (v.z > 1 || v.z < -1) continue;
      const sx = (v.x * 0.5 + 0.5) * width;
      const sy = (-v.y * 0.5 + 0.5) * height;
      const d = Math.hypot(sx - mx, sy - my);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    return best;
  }
}
