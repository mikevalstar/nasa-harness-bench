import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { positionAt, sampleOrbit } from "./orbits";
import type {
  CameraState,
  DataSet,
  OrbitalElements,
  Selection,
} from "./types";

const PLANET_COLORS = [
  0xb7aaa0, 0xe1b56b, 0x4a8fc9, 0xc96b45, 0xd5a66f, 0xd8c69f, 0x77b8bd,
  0x5279bd,
];
const PLANET_SIZES = [0.026, 0.038, 0.042, 0.033, 0.105, 0.088, 0.067, 0.064];

const pointVertexShader = `
  uniform float pixelRatio;
  attribute float aSize;
  attribute float aVisible;
  varying vec3 vColor;
  varying float vVisible;
  void main() {
    vColor = color;
    vVisible = aVisible;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * min(2.0, pixelRatio) * (18.0 / max(1.0, -mvPosition.z));
    gl_PointSize = clamp(gl_PointSize, 1.2, 7.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const pointFragmentShader = `
  varying vec3 vColor;
  varying float vVisible;
  void main() {
    if (vVisible < 0.5) discard;
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.06, d);
    float glow = smoothstep(0.5, 0.20, d);
    gl_FragColor = vec4(vColor * (0.72 + core * 0.8), glow * 0.86);
  }
`;

interface SceneCallbacks {
  onSelect: (selection: Selection) => void;
  onCameraChange: (camera: CameraState) => void;
}

export class SpaceScene {
  private readonly host: HTMLElement;
  private readonly data: DataSet;
  private readonly callbacks: SceneCallbacks;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.001, 250);
  private readonly controls: OrbitControls;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly pointerDown = new THREE.Vector2();
  private readonly asteroidPositions: Float32Array;
  private readonly asteroidVisible: Float32Array;
  private readonly asteroidGeometry = new THREE.BufferGeometry();
  private readonly cometPositions: Float32Array;
  private readonly cometVisible: Float32Array;
  private readonly cometGeometry = new THREE.BufferGeometry();
  private readonly planetMeshes: THREE.Mesh[] = [];
  private readonly orbitLines: THREE.Line[] = [];
  private readonly labels: HTMLDivElement[] = [];
  private readonly asteroidPoints: THREE.Points;
  private readonly cometPoints: THREE.Points;
  private readonly selectedOrbit: THREE.Line;
  private readonly selectionMarker: THREE.Mesh;
  private readonly resizeObserver: ResizeObserver;
  private selection: Selection = null;
  private julianDate: number;
  private tracking = false;
  private showComets = false;
  private showOrbits = true;
  private animationFrame = 0;
  private lastCometUpdate = 0;

  constructor(
    host: HTMLElement,
    data: DataSet,
    julianDate: number,
    callbacks: SceneCallbacks,
  ) {
    this.host = host;
    this.data = data;
    this.julianDate = julianDate;
    this.callbacks = callbacks;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x030508, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.host.prepend(this.renderer.domElement);

    this.camera.position.set(0, 4.8, 6.8);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 0.06;
    this.controls.maxDistance = 90;
    this.controls.zoomToCursor = true;
    this.controls.target.set(0, 0, 0);

    this.createBackdrop();
    this.createSun();
    this.createPlanets();

    this.asteroidPositions = new Float32Array(data.asteroids.length * 3);
    this.asteroidVisible = new Float32Array(data.asteroids.length).fill(1);
    const sentryDesignations = new Set(data.sentry.map((risk) => risk.des));
    this.asteroidPoints = this.createSmallBodyPoints(
      this.asteroidGeometry,
      this.asteroidPositions,
      this.asteroidVisible,
      data.asteroids.map((asteroid) => {
        if (sentryDesignations.has(asteroid.pdes)) {
          return new THREE.Color(0xff5b81);
        }
        return asteroid.pha
          ? new THREE.Color(0xff8b47)
          : new THREE.Color(0x69bdc6);
      }),
      data.asteroids.map((asteroid) =>
        asteroid.diameter
          ? Math.min(6.5, 2.5 + Math.log2(1 + asteroid.diameter))
          : asteroid.H
            ? Math.max(1.8, 5.4 - asteroid.H * 0.12)
            : 2,
      ),
    );
    this.scene.add(this.asteroidPoints);

    this.cometPositions = new Float32Array(data.comets.length * 3);
    this.cometVisible = new Float32Array(data.comets.length).fill(1);
    this.cometPoints = this.createSmallBodyPoints(
      this.cometGeometry,
      this.cometPositions,
      this.cometVisible,
      data.comets.map(() => new THREE.Color(0x9a82ff)),
      data.comets.map((comet) =>
        comet.diameter ? Math.min(7, 3 + Math.log2(1 + comet.diameter)) : 3,
      ),
    );
    this.cometPoints.visible = false;
    this.scene.add(this.cometPoints);

    this.selectedOrbit = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.78,
      }),
    );
    this.selectedOrbit.visible = false;
    this.scene.add(this.selectedOrbit);

    this.selectionMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.025, 0.032, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthTest: false,
      }),
    );
    this.selectionMarker.renderOrder = 10;
    this.selectionMarker.visible = false;
    this.scene.add(this.selectionMarker);

    this.raycaster.params.Points = { threshold: 0.035 };
    this.renderer.domElement.addEventListener(
      "pointerdown",
      this.handlePointerDown,
    );
    this.renderer.domElement.addEventListener("pointerup", this.handlePointerUp);
    this.controls.addEventListener("end", this.handleControlsEnd);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.host);
    this.resize();
    this.updatePositions(true);
    this.animate();
  }

  private createSmallBodyPoints(
    geometry: THREE.BufferGeometry,
    positions: Float32Array,
    visible: Float32Array,
    colors: THREE.Color[],
    sizes: number[],
  ): THREE.Points {
    const colorValues = new Float32Array(colors.length * 3);
    colors.forEach((color, index) => color.toArray(colorValues, index * 3));
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colorValues, 3));
    geometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(new Float32Array(sizes), 1),
    );
    geometry.setAttribute("aVisible", new THREE.BufferAttribute(visible, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);

    const material = new THREE.ShaderMaterial({
      uniforms: { pixelRatio: { value: this.renderer.getPixelRatio() } },
      vertexShader: pointVertexShader,
      fragmentShader: pointFragmentShader,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return points;
  }

  private createBackdrop(): void {
    this.scene.fog = new THREE.FogExp2(0x030508, 0.012);

    const starCount = 1800;
    const positions = new Float32Array(starCount * 3);
    let seed = 29;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let index = 0; index < starCount; index += 1) {
      const radius = 55 + random() * 75;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.cos(phi);
      positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      ),
      new THREE.PointsMaterial({
        color: 0xaec5ce,
        size: 0.08,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    );
    this.scene.add(stars);

    const referenceRing = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 129 }, (_, index) => {
          const angle = (index / 128) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
        }),
      ),
      new THREE.LineBasicMaterial({
        color: 0x365057,
        transparent: true,
        opacity: 0.18,
      }),
    );
    this.scene.add(referenceRing);
  }

  private createSun(): void {
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 32, 20),
      new THREE.MeshBasicMaterial({ color: 0xffd58a }),
    );
    this.scene.add(sun);
    this.scene.add(new THREE.PointLight(0xffc979, 11, 16, 1.2));

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.createGlowTexture(),
        color: 0xffb34d,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    halo.scale.setScalar(0.7);
    this.scene.add(halo);

    const label = document.createElement("div");
    label.className = "space-label sun-label";
    label.textContent = "SUN";
    this.host.append(label);
    this.labels.push(label);
  }

  private createGlowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 64);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.18, "rgba(255,201,104,.72)");
      gradient.addColorStop(0.5, "rgba(255,145,50,.18)");
      gradient.addColorStop(1, "rgba(255,120,30,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
    }
    return new THREE.CanvasTexture(canvas);
  }

  private createPlanets(): void {
    this.data.planets.forEach((planet, index) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(PLANET_SIZES[index], 20, 14),
        new THREE.MeshStandardMaterial({
          color: PLANET_COLORS[index],
          roughness: 0.82,
          metalness: 0.04,
          emissive: new THREE.Color(PLANET_COLORS[index]).multiplyScalar(0.08),
        }),
      );
      mesh.userData = { kind: "planet", index };
      this.planetMeshes.push(mesh);
      this.scene.add(mesh);

      const orbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setAttribute(
          "position",
          new THREE.BufferAttribute(sampleOrbit(planet, this.julianDate, 220), 3),
        ),
        new THREE.LineBasicMaterial({
          color: PLANET_COLORS[index],
          transparent: true,
          opacity: index < 4 ? 0.25 : 0.11,
          depthWrite: false,
        }),
      );
      this.orbitLines.push(orbit);
      this.scene.add(orbit);

      const label = document.createElement("div");
      label.className = "space-label";
      label.textContent = planet.name.toUpperCase();
      this.host.append(label);
      this.labels.push(label);
    });
  }

  setJulianDate(julianDate: number, force = false): void {
    if (!force && Math.abs(this.julianDate - julianDate) < 0.0002) return;
    this.julianDate = julianDate;
    this.updatePositions(force);
  }

  private updatePositions(forceComets = false): void {
    this.data.asteroids.forEach((asteroid, index) => {
      const valid = positionAt(
        asteroid,
        this.julianDate,
        this.asteroidPositions,
        index * 3,
        80,
      );
      if (!valid) {
        this.asteroidPositions[index * 3] = 1_000;
        this.asteroidPositions[index * 3 + 1] = 1_000;
        this.asteroidPositions[index * 3 + 2] = 1_000;
      }
    });
    this.asteroidGeometry.attributes.position.needsUpdate = true;

    const position = new Float32Array(3);
    this.data.planets.forEach((planet, index) => {
      positionAt(planet, this.julianDate, position);
      this.planetMeshes[index].position.fromArray(position);
    });

    if (
      this.showComets &&
      (forceComets || Math.abs(this.julianDate - this.lastCometUpdate) > 0.2)
    ) {
      this.data.comets.forEach((comet, index) => {
        const valid = positionAt(
          comet,
          this.julianDate,
          this.cometPositions,
          index * 3,
          80,
        );
        this.cometVisible[index] = valid ? 1 : 0;
      });
      this.cometGeometry.attributes.position.needsUpdate = true;
      this.cometGeometry.attributes.aVisible.needsUpdate = true;
      this.lastCometUpdate = this.julianDate;
    }

    this.updateSelectionPosition();
  }

  setAsteroidVisibility(mask: Uint8Array): void {
    for (let index = 0; index < mask.length; index += 1) {
      this.asteroidVisible[index] = mask[index];
    }
    this.asteroidGeometry.attributes.aVisible.needsUpdate = true;
  }

  setCometsVisible(visible: boolean): void {
    this.showComets = visible;
    this.cometPoints.visible = visible;
    if (visible) this.updatePositions(true);
  }

  setOrbitsVisible(visible: boolean): void {
    this.showOrbits = visible;
    this.orbitLines.forEach((orbit) => {
      orbit.visible = visible;
    });
    if (this.selection) this.selectedOrbit.visible = visible;
  }

  setSelection(selection: Selection, frame = false): void {
    this.selection = selection;
    this.selectionMarker.visible = Boolean(selection);
    this.selectedOrbit.visible = Boolean(selection) && this.showOrbits;

    if (selection) {
      const elements = this.getSelectedElements();
      if (elements) {
        this.selectedOrbit.geometry.dispose();
        this.selectedOrbit.geometry = new THREE.BufferGeometry().setAttribute(
          "position",
          new THREE.BufferAttribute(
            sampleOrbit(elements, this.julianDate, 240, 80),
            3,
          ),
        );
      }
      this.updateSelectionPosition();
      if (frame) this.frameSelection();
    }
  }

  private getSelectedElements(): OrbitalElements | null {
    if (!this.selection) return null;
    if (this.selection.kind === "asteroid") {
      return this.data.asteroids[this.selection.index];
    }
    if (this.selection.kind === "comet") {
      return this.data.comets[this.selection.index];
    }
    return this.data.planets[this.selection.index];
  }

  private getSelectedPosition(target = new THREE.Vector3()): THREE.Vector3 | null {
    if (!this.selection) return null;
    if (this.selection.kind === "planet") {
      return target.copy(this.planetMeshes[this.selection.index].position);
    }
    const source =
      this.selection.kind === "asteroid"
        ? this.asteroidPositions
        : this.cometPositions;
    return target.fromArray(source, this.selection.index * 3);
  }

  private updateSelectionPosition(): void {
    const nextPosition = this.getSelectedPosition();
    if (!nextPosition || !Number.isFinite(nextPosition.x)) return;

    if (this.tracking) {
      const delta = nextPosition.clone().sub(this.controls.target);
      this.camera.position.add(delta);
      this.controls.target.copy(nextPosition);
    }
    this.selectionMarker.position.copy(nextPosition);
  }

  setTracking(tracking: boolean): void {
    this.tracking = tracking && Boolean(this.selection);
    if (this.tracking) {
      const position = this.getSelectedPosition();
      if (position) this.controls.target.copy(position);
    }
  }

  frameSelection(): void {
    const position = this.getSelectedPosition();
    if (!position) return;
    const currentDirection = this.camera.position
      .clone()
      .sub(this.controls.target)
      .normalize();
    const distance = this.selection?.kind === "planet" ? 0.55 : 0.28;
    this.controls.target.copy(position);
    this.camera.position.copy(position).addScaledVector(currentDirection, distance);
    this.controls.update();
  }

  resetCamera(): void {
    this.tracking = false;
    this.camera.position.set(0, 4.8, 6.8);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  getCameraState(): CameraState {
    return {
      position: this.camera.position.toArray() as [number, number, number],
      target: this.controls.target.toArray() as [number, number, number],
    };
  }

  setCameraState(state: CameraState): void {
    if (
      state.position.every(Number.isFinite) &&
      state.target.every(Number.isFinite)
    ) {
      this.camera.position.fromArray(state.position);
      this.controls.target.fromArray(state.target);
      this.controls.update();
    }
  }

  private readonly handleControlsEnd = (): void => {
    this.callbacks.onCameraChange(this.getCameraState());
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerDown.set(event.clientX, event.clientY);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (
      event.button !== 0 ||
      this.pointerDown.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) >
        4
    ) {
      return;
    }
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const planetHit = this.raycaster.intersectObjects(this.planetMeshes, false)[0];
    if (planetHit) {
      const { index } = planetHit.object.userData as { index: number };
      this.callbacks.onSelect({ kind: "planet", index });
      return;
    }

    const targets = this.showComets
      ? [this.asteroidPoints, this.cometPoints]
      : [this.asteroidPoints];
    const hits = this.raycaster.intersectObjects(targets, false);
    for (const hit of hits) {
      if (hit.index === undefined) continue;
      if (
        hit.object === this.asteroidPoints &&
        this.asteroidVisible[hit.index] > 0
      ) {
        this.callbacks.onSelect({ kind: "asteroid", index: hit.index });
        return;
      }
      if (
        hit.object === this.cometPoints &&
        this.cometVisible[hit.index] > 0
      ) {
        this.callbacks.onSelect({ kind: "comet", index: hit.index });
        return;
      }
    }
  };

  private readonly resize = (): void => {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private updateLabels(): void {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    const projected = new THREE.Vector3();
    const positions = [
      new THREE.Vector3(0, 0.17, 0),
      ...this.planetMeshes.map((planet) =>
        planet.position.clone().add(new THREE.Vector3(0, 0.07, 0)),
      ),
    ];
    positions.forEach((position, index) => {
      projected.copy(position).project(this.camera);
      const visible = projected.z > -1 && projected.z < 1;
      const label = this.labels[index];
      label.style.transform = `translate(-50%, -50%) translate(${(projected.x * 0.5 + 0.5) * width}px, ${(-projected.y * 0.5 + 0.5) * height}px)`;
      label.classList.toggle("is-hidden", !visible);
    });
  }

  private animate = (): void => {
    this.animationFrame = requestAnimationFrame(this.animate);
    this.controls.update();
    if (this.selectionMarker.visible) {
      this.selectionMarker.quaternion.copy(this.camera.quaternion);
      const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.12;
      this.selectionMarker.scale.setScalar(pulse);
    }
    this.updateLabels();
    this.renderer.render(this.scene, this.camera);
  };

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener(
      "pointerdown",
      this.handlePointerDown,
    );
    this.renderer.domElement.removeEventListener("pointerup", this.handlePointerUp);
    this.controls.removeEventListener("end", this.handleControlsEnd);
    this.controls.dispose();
    this.renderer.dispose();
    this.labels.forEach((label) => label.remove());
  }
}
