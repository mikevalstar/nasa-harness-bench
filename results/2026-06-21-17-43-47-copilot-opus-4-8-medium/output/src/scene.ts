import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Core 3D scaffolding: renderer, camera, controls, render loop and a starfield.
export class Scene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  private updaters: ((dt: number) => void)[] = [];
  private lastT = performance.now();

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x05060a, 1);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.0005,
      100000
    );
    this.camera.position.set(0, -3.2, 2.0);
    this.camera.up.set(0, 0, 1); // ecliptic: z is "up"

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 1.1;
    this.controls.minDistance = 0.002;
    this.controls.maxDistance = 5000;

    this.addStarfield();

    window.addEventListener('resize', () => this.onResize(container));
    this.animate();
  }

  private addStarfield() {
    const N = 4000;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      // Random points on a large sphere.
      const r = 6000;
      const u = Math.random() * 2 - 1;
      const t = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(t);
      pos[i * 3 + 1] = r * s * Math.sin(t);
      pos[i * 3 + 2] = r * u;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xaab4d4,
      size: 1.4,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const stars = new THREE.Points(geo, mat);
    stars.frustumCulled = false;
    this.scene.add(stars);
  }

  onUpdate(fn: (dt: number) => void) {
    this.updaters.push(fn);
  }

  private onResize(container: HTMLElement) {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const now = performance.now();
    const dt = (now - this.lastT) / 1000;
    this.lastT = now;
    for (const u of this.updaters) u(dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
