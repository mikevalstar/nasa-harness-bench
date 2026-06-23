// Three.js scene: renderer, camera, lights, controls.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface SceneContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  followGroup: THREE.Group; // moves with the followed body
  labelLayer: HTMLDivElement;
  resize: () => void;
}

export function createScene(canvas: HTMLCanvasElement, labelLayer: HTMLDivElement): SceneContext {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x02030a, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = null;

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1e-4,
    1e6,
  );
  // Initial view: ~3 AU back, slightly above the ecliptic.
  camera.position.set(2.4, 1.4, 2.4);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.minDistance = 1e-3;
  controls.maxDistance = 200;
  controls.target.set(0, 0, 0);

  // Ambient + key + fill light. The Sun is an emissive sphere anyway.
  scene.add(new THREE.AmbientLight(0x4a5377, 0.18));
  const key = new THREE.DirectionalLight(0xffffff, 0.35);
  key.position.set(10, 8, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x99aaff, 0.15);
  fill.position.set(-8, -3, -4);
  scene.add(fill);

  // Starfield (simple).
  scene.add(makeStarfield(8000, 600));

  // Subtle ecliptic reference grid.
  scene.add(makeEclipticGrid(80, 32));

  // Group used to "follow" an object: camera target/position live relative to this.
  const followGroup = new THREE.Group();
  scene.add(followGroup);

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  window.addEventListener('resize', resize);

  return { renderer, scene, camera, controls, followGroup, labelLayer, resize };
}

function makeStarfield(count: number, radius: number): THREE.Points {
  const geom = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Uniform on sphere.
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = radius * (0.7 + Math.random() * 0.3);
    pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi);
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    // Slight color tint variation.
    const tint = 0.85 + Math.random() * 0.15;
    col[i * 3 + 0] = tint * (0.95 + Math.random() * 0.1);
    col[i * 3 + 1] = tint * (0.95 + Math.random() * 0.1);
    col[i * 3 + 2] = tint;
  }
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  return new THREE.Points(geom, mat);
}

function makeEclipticGrid(radius: number, segments: number): THREE.LineSegments {
  const pts: number[] = [];
  // Concentric circles in the ecliptic plane.
  for (let r = 0.5; r <= radius; r += 0.5) {
    for (let s = 0; s < segments; s++) {
      const a0 = (s / segments) * Math.PI * 2;
      const a1 = ((s + 1) / segments) * Math.PI * 2;
      pts.push(r * Math.cos(a0), 0, r * Math.sin(a0));
      pts.push(r * Math.cos(a1), 0, r * Math.sin(a1));
    }
  }
  // Radial spokes at AU multiples.
  for (let r = 1; r <= radius; r += 1) {
    for (let s = 0; s < segments; s += 1) {
      const a = (s / segments) * Math.PI * 2;
      pts.push(0, 0, 0);
      pts.push(r * Math.cos(a), 0, r * Math.sin(a));
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0x1c2336,
    transparent: true,
    opacity: 0.45,
  });
  return new THREE.LineSegments(geom, mat);
}
