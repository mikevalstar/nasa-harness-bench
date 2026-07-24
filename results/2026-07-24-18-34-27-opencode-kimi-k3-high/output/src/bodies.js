// Sun, planets (with orbit lines), comets, and the background starfield.
import * as THREE from 'three';
import { positionElliptic, positionBody, sampleOrbitPath, AU_KM } from './orbit.js';

export const PLANET_COLORS = {
  Mercury: 0xb5a58f, Venus: 0xe8c46a, Earth: 0x4f9cf7, Mars: 0xe06a3b,
  Jupiter: 0xd8a56a, Saturn: 0xe3cf9a, Uranus: 0x9adbe8, Neptune: 0x5a7cff,
};

function makeGlowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.25, inner.replace('1)', '0.6)'));
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

export function createSun(sizeScale = 1) {
  const group = new THREE.Group();
  const radiusAu = (696000 / AU_KM) * 25 * sizeScale; // exaggerated so it reads at system scale
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radiusAu, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0xffdf80 })
  );
  group.add(mesh);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture('rgba(255,230,160,1)'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    })
  );
  glow.scale.setScalar(radiusAu * 5.5);
  group.add(glow);
  group.userData.radiusAu = radiusAu;
  return group;
}

export function createPlanets(planets, sizeScale = 1) {
  const group = new THREE.Group();
  const bodies = [];
  for (const p of planets) {
    const rAu = Math.max((p.radius_km / AU_KM) * 300 * sizeScale, 0.006 * sizeScale);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(rAu, 24, 16),
      new THREE.MeshBasicMaterial({ color: PLANET_COLORS[p.name] ?? 0xcccccc })
    );
    mesh.userData.planet = p;
    group.add(mesh);

    // orbit path
    const pts = sampleOrbitPath(p, 360).map((v) => new THREE.Vector3(v.x, v.y, v.z));
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(
      lineGeo,
      new THREE.LineBasicMaterial({
        color: PLANET_COLORS[p.name] ?? 0x888888,
        transparent: true,
        opacity: 0.28,
      })
    );
    group.add(line);

    bodies.push({ def: p, mesh, rAu });
  }
  return {
    group,
    bodies,
    update(jd) {
      const pos = {};
      for (const b of bodies) {
        positionElliptic(b.def, jd, pos);
        b.mesh.position.set(pos.x, pos.y, pos.z);
      }
    },
  };
}

// Faint reference rings every 1 au out to 6 au for a sense of scale.
export function createScaleRings() {
  const group = new THREE.Group();
  for (let r = 1; r <= 6; r++) {
    const pts = [];
    for (let k = 0; k <= 180; k++) {
      const t = (k / 180) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * r, 0, Math.sin(t) * r));
    }
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: r === 1 ? 0.35 : 0.12 })
    );
    group.add(ring);
  }
  return group;
}

export function createStarfield(n = 3000) {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) {
    // random point on sphere, radius 400
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    pos[k * 3] = 400 * s * Math.cos(t);
    pos[k * 3 + 1] = 400 * u;
    pos[k * 3 + 2] = 400 * s * Math.sin(t);
    const b = 0.35 + Math.random() * 0.65;
    const tint = Math.random();
    col[k * 3] = b * (tint < 0.15 ? 1 : 0.9);
    col[k * 3 + 1] = b * 0.95;
    col[k * 3 + 2] = b * (tint > 0.85 ? 1 : 0.95);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 1.4, vertexColors: true, sizeAttenuation: false, depthWrite: false })
  );
  pts.frustumCulled = false;
  return pts;
}

export class CometCloud {
  constructor(comets) {
    this.comets = comets;
    const n = comets.length;
    this.positions = new Float32Array(n * 3);
    this.alpha = new Float32Array(n);
    const geo = new THREE.BufferGeometry();
    this.attrPos = new THREE.BufferAttribute(this.positions, 3);
    this.attrAlpha = new THREE.BufferAttribute(this.alpha, 1);
    geo.setAttribute('position', this.attrPos);
    geo.setAttribute('aAlpha', this.attrAlpha);
    this.points = new THREE.Points(
      geo,
      new THREE.ShaderMaterial({
        uniforms: { uPx: { value: 1 }, uColor: { value: new THREE.Color(0.55, 0.9, 1.0) } },
        vertexShader: /* glsl */ `
          attribute float aAlpha;
          uniform float uPx;
          varying float vAlpha;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = clamp(2.6 * uPx * (2.5 / -mv.z), 1.0, 8.0);
            vAlpha = aAlpha;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float r2 = dot(c, c);
            if (r2 > 0.25) discard;
            gl_FragColor = vec4(uColor, vAlpha * smoothstep(0.25, 0.02, r2));
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.points.frustumCulled = false;
    this.points.visible = false;
    this._v = {};
  }

  update(jd) {
    if (!this.points.visible) return;
    const v = this._v;
    for (let k = 0; k < this.comets.length; k++) {
      positionBody(this.comets[k], jd, v);
      const r = Math.hypot(v.x, v.y, v.z);
      // fade out beyond 25 au, gone at 35 (most hyperbolic comets are long gone)
      this.alpha[k] = r < 25 ? 0.9 : r < 35 ? 0.9 * (35 - r) / 10 : 0;
      this.positions[k * 3] = v.x;
      this.positions[k * 3 + 1] = v.y;
      this.positions[k * 3 + 2] = v.z;
    }
    this.attrPos.needsUpdate = true;
    this.attrAlpha.needsUpdate = true;
  }

  positionAt(index, jd, out = new THREE.Vector3()) {
    const v = positionBody(this.comets[index], jd, {});
    return out.set(v.x, v.y, v.z);
  }
}
