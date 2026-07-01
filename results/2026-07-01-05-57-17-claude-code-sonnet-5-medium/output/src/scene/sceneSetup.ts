import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AU_SCENE_UNITS } from '../constants';

export interface SceneRig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  resize: () => void;
}

export function createSceneRig(canvas: HTMLCanvasElement): SceneRig {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000308);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, AU_SCENE_UNITS * 200);
  camera.position.set(0, AU_SCENE_UNITS * 1.2, AU_SCENE_UNITS * 2.2);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.5;
  controls.maxDistance = AU_SCENE_UNITS * 150;

  function resize(): void {
    const { clientWidth, clientHeight } = renderer.domElement.parentElement ?? document.body;
    const w = clientWidth || window.innerWidth;
    const h = clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', resize);
  resize();

  return { renderer, scene, camera, controls, resize };
}
