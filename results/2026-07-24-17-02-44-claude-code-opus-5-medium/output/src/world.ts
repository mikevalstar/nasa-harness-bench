/**
 * Three.js scene: renderer, camera, Sun, planets, orbit lines, starfield.
 *
 * Scene units are astronomical units, axes are the J2000 ecliptic frame
 * (+Z = ecliptic north), so the camera's up vector is +Z rather than the
 * three.js default +Y.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AU_KM, planetPositionsHelper } from './helpers';
import type { Planet } from './data';
import { planetElements } from './data';
import { sampleOrbit, positionAt } from './astro';
import { STAR_VERT, STAR_FRAG } from './shaders';

export const PLANET_STYLE: Record<string, { color: number; ring?: boolean }> = {
  Mercury: { color: 0x9c8f84 },
  Venus: { color: 0xe6c98a },
  Earth: { color: 0x4f9fe8 },
  Mars: { color: 0xd9764a },
  Jupiter: { color: 0xd7b489 },
  Saturn: { color: 0xe3ceA0, ring: true },
  Uranus: { color: 0x8fd6df },
  Neptune: { color: 0x5b7ff0 },
};

export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;

  readonly planets: Planet[];
  readonly planetMeshes: THREE.Mesh[] = [];
  readonly planetPos: THREE.Vector3[] = [];
  readonly sun: THREE.Mesh;

  private orbitGroup = new THREE.Group();
  private glows: THREE.Sprite[] = [];
  private markerGeom: THREE.BufferGeometry;
  private markerPos: Float32Array;
  private bodyScale = 1;

  constructor(canvas: HTMLCanvasElement, planets: Planet[]) {
    this.planets = planets;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor(0x05060a, 1);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.0008, 20000);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(0, -3.6, 2.2);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.9;
    this.controls.panSpeed = 0.7;
    this.controls.minDistance = 0.0015;
    this.controls.maxDistance = 400;

    this.scene.add(this.orbitGroup);
    this.addStars();
    this.sun = this.addSun();
    this.addEclipticGrid();

    // planet bodies + orbit rings
    for (const p of planets) {
      const style = PLANET_STYLE[p.name] ?? { color: 0xcccccc };
      const mat = new THREE.MeshBasicMaterial({ color: style.color });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat);
      mesh.renderOrder = 3;
      this.scene.add(mesh);
      this.planetMeshes.push(mesh);
      this.planetPos.push(new THREE.Vector3());

      if (style.ring) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.5, 2.3, 48),
          new THREE.MeshBasicMaterial({ color: 0xd9c79a, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
        );
        ring.rotation.x = 0.47;
        mesh.add(ring);
      }

      const pts = sampleOrbit(planetElements(p), 512);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const line = new THREE.Line(
        g,
        new THREE.LineBasicMaterial({ color: style.color, transparent: true, opacity: 0.28 })
      );
      line.renderOrder = 1;
      this.orbitGroup.add(line);
    }

    // constant-screen-size markers so planets stay visible when zoomed out
    this.markerPos = new Float32Array(planets.length * 3);
    this.markerGeom = new THREE.BufferGeometry();
    this.markerGeom.setAttribute('position', new THREE.BufferAttribute(this.markerPos, 3));
    const markerColors = new Float32Array(planets.length * 3);
    planets.forEach((p, k) => {
      const c = new THREE.Color(PLANET_STYLE[p.name]?.color ?? 0xffffff);
      markerColors[k * 3] = c.r;
      markerColors[k * 3 + 1] = c.g;
      markerColors[k * 3 + 2] = c.b;
    });
    this.markerGeom.setAttribute('color', new THREE.BufferAttribute(markerColors, 3));
    this.markerGeom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
    const markers = new THREE.Points(
      this.markerGeom,
      new THREE.PointsMaterial({
        size: 8,
        sizeAttenuation: false,
        vertexColors: true,
        map: makeDiscTexture(),
        transparent: true,
        alphaTest: 0.35,
        opacity: 0.95,
        depthWrite: false,
        depthTest: false,
      })
    );
    markers.renderOrder = 4;
    markers.frustumCulled = false;
    this.scene.add(markers);
  }

  private addSun(): THREE.Mesh {
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff0c0 })
    );
    this.scene.add(sun);

    // cheap glow: two additive billboards
    const glowTex = makeGlowTexture();
    for (const [size, opacity] of [
      [7, 0.5],
      [24, 0.13],
    ] as const) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color: 0xffc861,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
        })
      );
      s.userData.relScale = size;
      s.renderOrder = 0;
      this.glows.push(s);
      this.scene.add(s);
    }
    return sun;
  }

  private addStars() {
    const N = 2600;
    const pos = new Float32Array(N * 3);
    const mag = new Float32Array(N);
    let seed = 12345;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let k = 0; k < N; k++) {
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const R = 3000;
      pos[k * 3] = R * s * Math.cos(th);
      pos[k * 3 + 1] = R * s * Math.sin(th);
      pos[k * 3 + 2] = R * u;
      mag[k] = 0.35 + Math.pow(rnd(), 3) * 1.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aMag', new THREE.BufferAttribute(mag, 1));
    const stars = new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    stars.frustumCulled = false;
    stars.renderOrder = -1;
    this.scene.add(stars);
  }

  private grid?: THREE.Object3D;

  private addEclipticGrid() {
    const g = new THREE.PolarGridHelper(6, 8, 6, 96, 0x1b2740, 0x141d30);
    // PolarGridHelper lies in the XZ plane; rotate it into the ecliptic (XY)
    g.rotation.x = Math.PI / 2;
    (g.material as THREE.Material).transparent = true;
    (g.material as THREE.Material).opacity = 0.75;
    g.visible = false;
    g.renderOrder = 0;
    this.grid = g;
    this.scene.add(g);
  }

  setGridVisible(v: boolean) {
    if (this.grid) this.grid.visible = v;
  }

  setOrbitsVisible(v: boolean) {
    this.orbitGroup.visible = v;
  }

  setBodyScale(s: number) {
    this.bodyScale = s;
  }

  /** Propagate the planets to time `t` (days from J2000) and update the scene. */
  update(t: number) {
    const scale = this.bodyScale;
    for (let k = 0; k < this.planets.length; k++) {
      const p = this.planets[k];
      const v = positionAt(planetElements(p), t, planetPositionsHelper);
      const vec = this.planetPos[k];
      vec.set(v.x, v.y, v.z);
      const mesh = this.planetMeshes[k];
      mesh.position.copy(vec);
      mesh.scale.setScalar(Math.max((p.radius_km / AU_KM) * scale, 2e-5));
      this.markerPos[k * 3] = v.x;
      this.markerPos[k * 3 + 1] = v.y;
      this.markerPos[k * 3 + 2] = v.z;
    }
    this.markerGeom.attributes.position.needsUpdate = true;
    // The Sun is exaggerated far less than the planets, otherwise it swallows
    // the inner system; at scale 1 both are physically correct.
    const sunScale = Math.max((696000 / AU_KM) * (1 + (scale - 1) * 0.011), 0.0046);
    this.sun.scale.setScalar(sunScale);
    for (const g of this.glows) g.scale.setScalar(sunScale * (g.userData.relScale as number));
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }
}

/** A soft filled disc, so planet markers are dots rather than squares. */
function makeDiscTexture(): THREE.Texture {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeGlowTexture(): THREE.Texture {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,224,160,0.75)');
  g.addColorStop(0.45, 'rgba(255,170,60,0.22)');
  g.addColorStop(1, 'rgba(255,140,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
