// Three.js scene: sun, planets, instanced asteroid/comet points, orbit lines, labels.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const AU_KM = 149597870.7;
export const SUN_R_AU = 696000 / AU_KM;

// Ecliptic (x,y,z) -> three.js (x, z, -y) so the system is seen
// counter-clockwise from +Y (north).
export function eclToThree(x: number, y: number, z: number, out: { set(x: number, y: number, z: number): void }) {
  out.set(x, z, -y);
}

export const PLANET_COLORS: Record<string, number> = {
  Mercury: 0x9c8e82,
  Venus: 0xe8c47a,
  Earth: 0x4da6ff,
  Mars: 0xff6b47,
  Jupiter: 0xe0b48f,
  Saturn: 0xe8d39a,
  Uranus: 0x9be8e0,
  Neptune: 0x6b8cff,
};

const CLASS_COLORS: Record<string, [number, number, number]> = {
  ATE: [0.48, 0.85, 1.0],
  APO: [1.0, 0.82, 0.48],
  AMO: [0.71, 0.6, 1.0],
  IEO: [0.48, 1.0, 0.77],
};
export const DEFAULT_AST_COLOR: [number, number, number] = [0.6, 0.64, 0.68];

function pointsMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aAlpha;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = aColor;
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (240.0 / max(0.1, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 d = gl_PointCoord - vec2(0.5);
        float m = smoothstep(0.5, 0.18, length(d));
        if (m * vAlpha < 0.01) discard;
        gl_FragColor = vec4(vColor, m * vAlpha);
      }`,
  });
}

function makePoints(n: number): { points: THREE.Points; pos: Float32Array; col: Float32Array; size: Float32Array; alpha: Float32Array } {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const size = new Float32Array(n);
  const alpha = new Float32Array(n);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
  const points = new THREE.Points(geo, pointsMaterial());
  points.frustumCulled = false;
  return { points, pos, col, size, alpha };
}

function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,240,200,1)');
  grad.addColorStop(0.25, 'rgba(255,200,120,0.55)');
  grad.addColorStop(1, 'rgba(255,160,60,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export interface PlanetVis {
  mesh: THREE.Mesh;
  orbitLine: THREE.Line;
  label: HTMLDivElement;
  trueR: number; // AU
}

export interface SceneHandle {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  labelLayer: HTMLDivElement;
  planets: PlanetVis[];
  sun: THREE.Mesh;
  sunGlow: THREE.Sprite;
  ast: ReturnType<typeof makePoints>;
  comets: ReturnType<typeof makePoints>;
  selOrbit: THREE.Line;
  selMarker: THREE.Sprite;
  trueScale: boolean;
  setTrueScale(on: boolean): void;
  setSunScale(): void;
  syncAttributes(which: 'ast' | 'comets' | 'both'): void;
  projectToScreen(v: THREE.Vector3, out: { x: number; y: number; visible: boolean }): void;
  resize(): void;
  render(): void;
}

export function createScene(container: HTMLElement): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04060c);

  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.0005, 4000);
  camera.position.set(0, 4.2, 9.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.002;
  controls.maxDistance = 500;

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sunLight = new THREE.PointLight(0xffffff, 2.5, 0, 0);
  scene.add(sunLight);

  // Sun + glow
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd27a }),
  );
  scene.add(sun);
  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  sunGlow.scale.setScalar(0.9);
  scene.add(sunGlow);

  // Starfield (procedural, no assets)
  {
    const n = 2500;
    const p = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      const t = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const s = Math.sqrt(1 - u * u);
      const R = 1200 + Math.random() * 800;
      p[k * 3] = Math.cos(t) * s * R;
      p[k * 3 + 1] = u * R;
      p[k * 3 + 2] = Math.sin(t) * s * R;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    scene.add(
      new THREE.Points(g, new THREE.PointsMaterial({ color: 0xaFC4dd, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.8 })),
    );
  }

  // Faint ecliptic polar grid for scale
  {
    const grid = new THREE.PolarGridHelper(5, 12, 5, 64, 0x223349, 0x16233a);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    scene.add(grid);
  }

  const labelLayer = document.createElement('div');
  labelLayer.className = 'labels';
  container.appendChild(labelLayer);

  // Generous headroom so a regrown dataset still fits; boot clamps drawRange.
  const ast = makePoints(66000);
  const comets = makePoints(7000);
  scene.add(ast.points);
  scene.add(comets.points);

  const selOrbit = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }),
  );
  selOrbit.frustumCulled = false;
  selOrbit.visible = false;
  scene.add(selOrbit);

  const selMarker = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  selMarker.scale.setScalar(0.12);
  selMarker.visible = false;
  scene.add(selMarker);

  const handle: SceneHandle = {
    renderer,
    scene,
    camera,
    controls,
    labelLayer,
    planets: [],
    sun,
    sunGlow,
    ast,
    comets,
    selOrbit,
    selMarker,
    trueScale: false,
    setTrueScale(on: boolean) {
      handle.trueScale = on;
      for (const p of handle.planets) {
        const r = on ? p.trueR : Math.max(p.trueR * 900, 0.011);
        p.mesh.scale.setScalar(r / (p.mesh.geometry as THREE.SphereGeometry).parameters.radius);
      }
      handle.setSunScale();
    },
    setSunScale() {
      const r = handle.trueScale ? SUN_R_AU : 0.05;
      sun.scale.setScalar(r / 0.05);
      sunGlow.scale.setScalar(handle.trueScale ? 0.06 : 0.9);
    },
    syncAttributes(which: 'ast' | 'comets' | 'both') {
      const sync = (m: ReturnType<typeof makePoints>) => {
        const g = m.points.geometry;
        (g.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
        (g.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
        (g.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true;
        (g.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
      };
      if (which === 'ast' || which === 'both') sync(handle.ast);
      if (which === 'comets' || which === 'both') sync(handle.comets);
    },
    projectToScreen(v: THREE.Vector3, out: { x: number; y: number; visible: boolean }) {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const p = v.clone().project(camera);
      out.x = (p.x * 0.5 + 0.5) * w;
      out.y = (-p.y * 0.5 + 0.5) * h;
      out.visible = p.z < 1;
    },
    resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    },
    render() {
      controls.update();
      renderer.render(scene, camera);
    },
  };

  window.addEventListener('resize', handle.resize);
  return handle;
}

export function addPlanet(
  handle: SceneHandle,
  name: string,
  trueR_AU: number,
  orbitPtsEcl: Float32Array, // (seg+1)*3 ecliptic xyz
  colorHex: number,
): PlanetVis {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 24, 24),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.9, metalness: 0 }),
  );
  const r = Math.max(trueR_AU * 900, 0.011);
  mesh.scale.setScalar(r);
  handle.scene.add(mesh);

  if (name === 'Saturn') {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.25, 2.1, 64),
      new THREE.MeshBasicMaterial({ color: 0xcbb98a, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2 + 0.12;
    mesh.add(ring);
  }

  const g = new THREE.BufferGeometry();
  const tp = new Float32Array(orbitPtsEcl.length);
  for (let k = 0; k < orbitPtsEcl.length / 3; k++) {
    tp[k * 3] = orbitPtsEcl[k * 3];
    tp[k * 3 + 1] = orbitPtsEcl[k * 3 + 2];
    tp[k * 3 + 2] = -orbitPtsEcl[k * 3 + 1];
  }
  g.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  const orbitLine = new THREE.Line(
    g,
    new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: name === 'Earth' ? 0.65 : 0.35 }),
  );
  handle.scene.add(orbitLine);

  const label = document.createElement('div');
  label.className = 'planet-label';
  label.textContent = name;
  handle.labelLayer.appendChild(label);

  const vis: PlanetVis = { mesh, orbitLine, label, trueR: trueR_AU };
  handle.planets.push(vis);
  return vis;
}

export { CLASS_COLORS };
