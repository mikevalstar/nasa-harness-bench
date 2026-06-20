import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class SceneManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly pickScene = new THREE.Scene();
  private readonly pickTarget: THREE.WebGLRenderTarget;
  private readonly pixelBuf = new Uint8Array(4);

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      logarithmicDepthBuffer: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene.background = new THREE.Color(0x05060a);

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.002,
      200000,
    );
    this.camera.position.set(0, 2.4, 3.6);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 1.1;
    this.controls.minDistance = 0.02;
    this.controls.maxDistance = 1500;

    // Lighting: a point light at the Sun + soft ambient so far bodies aren't black.
    const sunLight = new THREE.PointLight(0xfff2d8, 2.4, 0, 0.0);
    this.scene.add(sunLight);
    this.scene.add(new THREE.AmbientLight(0x404a5a, 1.4));

    this.scene.add(makeStarfield());

    this.pickTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });

    window.addEventListener("resize", () => this.onResize());
  }

  onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  // GPU pick: render the pickScene through a 1x1 view-offset window centered on
  // the cursor and read back the encoded id. Returns -1 on background.
  pick(clientX: number, clientY: number): number {
    const dpr = this.renderer.getPixelRatio();
    const rect = this.renderer.domElement.getBoundingClientRect();
    const px = Math.floor((clientX - rect.left) * dpr);
    const py = Math.floor((clientY - rect.top) * dpr);
    const fullW = Math.floor(rect.width * dpr);
    const fullH = Math.floor(rect.height * dpr);

    this.camera.setViewOffset(fullW, fullH, px, fullH - py - 1, 1, 1);
    this.renderer.setRenderTarget(this.pickTarget);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.clear();
    this.renderer.render(this.pickScene, this.camera);
    this.renderer.readRenderTargetPixels(this.pickTarget, 0, 0, 1, 1, this.pixelBuf);
    this.renderer.setRenderTarget(null);
    this.camera.clearViewOffset();

    const [r, g, b] = this.pixelBuf;
    if (r === 0 && g === 0 && b === 0) return -1;
    return r + g * 256 + b * 65536;
  }
}

function makeStarfield(): THREE.Points {
  const N = 3500;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const R = 8000;
  for (let i = 0; i < N; i++) {
    // uniform on sphere
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    pos[i * 3] = R * s * Math.cos(t);
    pos[i * 3 + 1] = R * u;
    pos[i * 3 + 2] = R * s * Math.sin(t);
    const tint = 0.7 + Math.random() * 0.3;
    col[i * 3] = tint;
    col[i * 3 + 1] = tint;
    col[i * 3 + 2] = tint * (0.9 + Math.random() * 0.1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({
    size: 1.4,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const stars = new THREE.Points(g, m);
  stars.frustumCulled = false;
  return stars;
}
