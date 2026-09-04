import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SolarSystemData } from '../data/dataLoader';
import { SunView } from './SunView';
import { PlanetView } from './PlanetView';
import { AsteroidPointCloud, AsteroidColorMode, AsteroidFilterOptions } from './AsteroidPointCloud';
import { CometPointCloud } from './CometPointCloud';
import { OrbitLines } from './OrbitLines';
import { EclipticGrid } from './EclipticGrid';
import { SelectedObjectInfo } from '../types/solar';

export class SolarScene {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;

  public sunView: SunView;
  public planetView: PlanetView;
  public asteroidPointCloud: AsteroidPointCloud;
  public cometPointCloud: CometPointCloud;
  public orbitLines: OrbitLines;
  public eclipticGrid: EclipticGrid;

  public data: SolarSystemData;
  public currentJd: number = 2460500.5; // ~July 2024
  public isPlaying: boolean = true;
  public timeMultiplier: number = 1.0; // days per second
  private lastRafTime: number = 0;

  // Camera tracking / focus & follow
  public trackingTarget: THREE.Vector3 | null = null;
  public isFocusAndFollow: boolean = false;
  private cameraLerpTarget: THREE.Vector3 = new THREE.Vector3();
  private controlsLerpTarget: THREE.Vector3 = new THREE.Vector3();

  // Selection
  public selectedObject: SelectedObjectInfo | null = null;
  public onSelectCallback?: (info: SelectedObjectInfo | null) => void;
  public onHoverCallback?: (info: SelectedObjectInfo | null) => void;

  private raycaster: THREE.Raycaster;
  private mousePos: THREE.Vector2;
  private animId: number = 0;

  constructor(container: HTMLElement, data: SolarSystemData, initialJd: number = 2460500.5) {
    this.container = container;
    this.data = data;
    this.currentJd = initialJd;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050811); // Deep cosmic void

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.01,
      500
    );
    // Initial camera position: slightly elevated 3D view of inner solar system
    this.camera.position.set(2.8, 3.2, 4.2);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.05;
    this.controls.maxDistance = 150;
    this.controls.target.set(0, 0, 0);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x223344, 0.6);
    this.scene.add(ambientLight);

    // Starfield
    this.buildStarfield();

    // Scene subviews
    this.eclipticGrid = new EclipticGrid();
    this.scene.add(this.eclipticGrid.group);

    this.sunView = new SunView();
    this.scene.add(this.sunView.group);

    this.planetView = new PlanetView(data.planets);
    this.scene.add(this.planetView.group);

    this.asteroidPointCloud = new AsteroidPointCloud(data.asteroids, data.asteroidArrays);
    this.scene.add(this.asteroidPointCloud.group);

    this.cometPointCloud = new CometPointCloud(data.comets, data.cometArrays);
    this.scene.add(this.cometPointCloud.group);

    this.orbitLines = new OrbitLines();
    this.scene.add(this.orbitLines.group);

    // Raycaster & interaction
    this.raycaster = new THREE.Raycaster();
    this.mousePos = new THREE.Vector2();

    this.initEvents();

    // Initial propagation
    this.updateAllPositions(this.currentJd, true);

    // Start render loop
    this.lastRafTime = performance.now();
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  private buildStarfield() {
    const starCount = 1800;
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 250 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPos[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = radius * Math.cos(phi);

      const brightness = 0.4 + Math.random() * 0.6;
      // Slight spectral temperature variation
      const tint = Math.random();
      if (tint < 0.2) {
        starCol[i * 3 + 0] = 0.8 * brightness;
        starCol[i * 3 + 1] = 0.9 * brightness;
        starCol[i * 3 + 2] = 1.0 * brightness;
      } else if (tint > 0.8) {
        starCol[i * 3 + 0] = 1.0 * brightness;
        starCol[i * 3 + 1] = 0.8 * brightness;
        starCol[i * 3 + 2] = 0.6 * brightness;
      } else {
        starCol[i * 3 + 0] = brightness;
        starCol[i * 3 + 1] = brightness;
        starCol[i * 3 + 2] = brightness;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(starCol, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    const starPoints = new THREE.Points(geom, mat);
    this.scene.add(starPoints);
  }

  private initEvents() {
    const dom = this.renderer.domElement;

    let isDragging = false;
    let downX = 0, downY = 0;

    dom.addEventListener('pointerdown', (e) => {
      isDragging = false;
      downX = e.clientX;
      downY = e.clientY;
    });

    dom.addEventListener('pointermove', (e) => {
      const dx = Math.abs(e.clientX - downX);
      const dy = Math.abs(e.clientY - downY);
      if (dx > 5 || dy > 5) {
        isDragging = true;
      }

      // Hover check
      const rect = dom.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      this.mousePos.set(nx, ny);

      this.handleHover(nx, ny, rect.width, rect.height);
    });

    dom.addEventListener('pointerup', (e) => {
      if (!isDragging) {
        const rect = dom.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        this.handleClick(nx, ny, rect.width, rect.height);
      }
    });

    window.addEventListener('resize', this.onResize.bind(this));
  }

  public onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private handleHover(nx: number, ny: number, width: number, height: number) {
    this.raycaster.setFromCamera(this.mousePos, this.camera);

    // 1. Check Sun
    const sunHits = this.raycaster.intersectObject(this.sunView.mesh);
    if (sunHits.length > 0) {
      this.asteroidPointCloud.setHoveredIndex(-1);
      this.cometPointCloud.setHoveredIndex(-1);
      this.container.style.cursor = 'pointer';
      return;
    }

    // 2. Check Planets
    for (const p of this.data.planets) {
      const mesh = this.planetView.getPlanetMesh(p.name);
      if (mesh) {
        const hits = this.raycaster.intersectObject(mesh);
        if (hits.length > 0) {
          this.asteroidPointCloud.setHoveredIndex(-1);
          this.cometPointCloud.setHoveredIndex(-1);
          this.container.style.cursor = 'pointer';
          return;
        }
      }
    }

    // 3. Check Asteroids
    const astIdx = this.asteroidPointCloud.findNearestAsteroid(nx, ny, this.camera, width, height, 16);
    if (astIdx >= 0) {
      this.asteroidPointCloud.setHoveredIndex(astIdx);
      this.cometPointCloud.setHoveredIndex(-1);
      this.container.style.cursor = 'pointer';
      return;
    }

    // 4. Check Comets
    const cometIdx = this.cometPointCloud.findNearestComet(nx, ny, this.camera, width, height, 16);
    if (cometIdx >= 0) {
      this.cometPointCloud.setHoveredIndex(cometIdx);
      this.asteroidPointCloud.setHoveredIndex(-1);
      this.container.style.cursor = 'pointer';
      return;
    }

    // Nothing hovered
    this.asteroidPointCloud.setHoveredIndex(-1);
    this.cometPointCloud.setHoveredIndex(-1);
    this.container.style.cursor = 'default';
  }

  private handleClick(nx: number, ny: number, width: number, height: number) {
    this.raycaster.setFromCamera(this.mousePos, this.camera);

    // 1. Check Sun
    const sunHits = this.raycaster.intersectObject(this.sunView.mesh);
    if (sunHits.length > 0) {
      this.selectObject({
        type: 'sun',
        id: 'Sun',
        displayName: 'The Sun',
        data: { name: 'Sun' },
      });
      return;
    }

    // 2. Check Planets
    for (const p of this.data.planets) {
      const mesh = this.planetView.getPlanetMesh(p.name);
      if (mesh) {
        const hits = this.raycaster.intersectObject(mesh);
        if (hits.length > 0) {
          this.selectObject({
            type: 'planet',
            id: p.name,
            displayName: p.name,
            data: p,
          });
          return;
        }
      }
    }

    // 3. Check Asteroids
    const astIdx = this.asteroidPointCloud.findNearestAsteroid(nx, ny, this.camera, width, height, 20);
    if (astIdx >= 0) {
      const ast = this.data.asteroids[astIdx];
      const sentry = this.data.sentryMap.get(ast.pdes);
      const closeApproaches = this.data.closeApproachesMap.get(ast.pdes);
      this.asteroidPointCloud.setSelectedIndex(astIdx);
      this.cometPointCloud.setSelectedIndex(-1);

      this.selectObject({
        type: 'asteroid',
        id: ast.pdes,
        displayName: ast.name ? `${ast.name} (${ast.pdes})` : ast.full_name,
        data: ast,
        sentry,
        closeApproaches,
      });
      return;
    }

    // 4. Check Comets
    const cometIdx = this.cometPointCloud.findNearestComet(nx, ny, this.camera, width, height, 20);
    if (cometIdx >= 0) {
      const comet = this.data.comets[cometIdx];
      const closeApproaches = this.data.closeApproachesMap.get(comet.pdes);
      this.cometPointCloud.setSelectedIndex(cometIdx);
      this.asteroidPointCloud.setSelectedIndex(-1);

      this.selectObject({
        type: 'comet',
        id: comet.pdes,
        displayName: comet.full_name,
        data: comet,
        closeApproaches,
      });
      return;
    }

    // Clicked empty space: do not deselect immediately unless desired
  }

  public selectObject(info: SelectedObjectInfo | null) {
    this.selectedObject = info;

    if (!info) {
      this.asteroidPointCloud.setSelectedIndex(-1);
      this.cometPointCloud.setSelectedIndex(-1);
      this.orbitLines.clear();
      this.isFocusAndFollow = false;
      this.trackingTarget = null;
      this.onSelectCallback?.(null);
      return;
    }

    if (info.type === 'asteroid') {
      const ast = info.data as any;
      const idx = this.data.asteroids.findIndex((a) => a.pdes === ast.pdes);
      this.asteroidPointCloud.setSelectedIndex(idx);
      this.cometPointCloud.setSelectedIndex(-1);

      const color = ast.pha ? 0xef4444 : 0x38bdf8;
      this.orbitLines.setOrbit(ast.a, ast.e, ast.q, ast.i, ast.om, ast.w, color);
    } else if (info.type === 'comet') {
      const comet = info.data as any;
      const idx = this.data.comets.findIndex((c) => c.pdes === comet.pdes);
      this.cometPointCloud.setSelectedIndex(idx);
      this.asteroidPointCloud.setSelectedIndex(-1);

      const color = comet.e >= 1.0 ? 0xa855f7 : 0x38bdf8;
      this.orbitLines.setOrbit(comet.a, comet.e, comet.q, comet.i, comet.om, comet.w, color);
    } else if (info.type === 'planet') {
      const planet = info.data as any;
      this.asteroidPointCloud.setSelectedIndex(-1);
      this.cometPointCloud.setSelectedIndex(-1);
      this.orbitLines.setOrbit(planet.a, planet.e, planet.a * (1 - planet.e), planet.i, planet.om, planet.w, 0x38bdf8);
    } else if (info.type === 'sun') {
      this.asteroidPointCloud.setSelectedIndex(-1);
      this.cometPointCloud.setSelectedIndex(-1);
      this.orbitLines.clear();
    }

    this.onSelectCallback?.(info);
  }

  public focusOnObject(info: SelectedObjectInfo) {
    this.selectObject(info);
    this.isFocusAndFollow = true;

    const pos = this.getCurrentObjectPosition(info);
    if (pos) {
      const offset = new THREE.Vector3(0.4, 0.3, 0.5);
      if (info.type === 'planet') {
        const pName = (info.data as any).name;
        if (pName === 'Jupiter' || pName === 'Saturn') offset.multiplyScalar(2.0);
        else if (pName === 'Uranus' || pName === 'Neptune') offset.multiplyScalar(3.0);
      }
      this.camera.position.copy(pos).add(offset);
      this.controls.target.copy(pos);
    }
  }

  public getCurrentObjectPosition(info: SelectedObjectInfo): THREE.Vector3 | null {
    if (info.type === 'sun') {
      return new THREE.Vector3(0, 0, 0);
    }
    if (info.type === 'planet') {
      const pName = (info.data as any).name;
      return this.planetView.getPlanetPosition(pName) || null;
    }
    if (info.type === 'asteroid') {
      const pdes = (info.data as any).pdes;
      const idx = this.data.asteroids.findIndex((a) => a.pdes === pdes);
      return this.asteroidPointCloud.getAsteroidPosition(idx);
    }
    if (info.type === 'comet') {
      const pdes = (info.data as any).pdes;
      const idx = this.data.comets.findIndex((c) => c.pdes === pdes);
      return this.cometPointCloud.getCometPosition(idx);
    }
    return null;
  }

  public setViewPreset(preset: 'top' | 'oblique' | 'inner' | 'outer') {
    if (preset === 'top') {
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(0, 4.5, 0.001);
      this.camera.up.set(0, 0, -1);
    } else if (preset === 'oblique') {
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(2.8, 3.2, 4.2);
      this.camera.up.set(0, 1, 0);
    } else if (preset === 'inner') {
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(1.5, 1.8, 2.2);
      this.camera.up.set(0, 1, 0);
    } else if (preset === 'outer') {
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(25, 30, 45);
      this.camera.up.set(0, 1, 0);
    }
    this.controls.update();
  }

  public updateAllPositions(jd: number, force: boolean = false) {
    this.currentJd = jd;
    this.planetView.updatePositions(jd);
    this.asteroidPointCloud.updatePositions(jd, force);
    this.cometPointCloud.updatePositions(jd, force);

    // Update orbit lines reticle & Earth line
    if (this.selectedObject) {
      const pos = this.getCurrentObjectPosition(this.selectedObject);
      if (pos) {
        this.orbitLines.updateReticle(pos, this.camera);
        const earthPos = this.planetView.getPlanetPosition('Earth');
        if (earthPos && this.selectedObject.type !== 'sun' && (this.selectedObject.data as any).name !== 'Earth') {
          this.orbitLines.updateEarthLine(pos, earthPos);
        }
      }
    }
  }

  private animate(timestamp: number) {
    this.animId = requestAnimationFrame(this.animate);

    const deltaSec = (timestamp - this.lastRafTime) / 1000;
    this.lastRafTime = timestamp;

    if (this.isPlaying) {
      // Advance Julian date
      const deltaJd = this.timeMultiplier * deltaSec;
      this.currentJd += deltaJd;
      this.updateAllPositions(this.currentJd);
    }

    // Focus & Follow camera tracking
    if (this.isFocusAndFollow && this.selectedObject) {
      const pos = this.getCurrentObjectPosition(this.selectedObject);
      if (pos) {
        const offset = this.camera.position.clone().sub(this.controls.target);
        this.controls.target.copy(pos);
        this.camera.position.copy(pos).add(offset);
      }
    }

    this.sunView.update(timestamp);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.dispose();
  }
}
