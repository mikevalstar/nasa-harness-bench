import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Asteroid, Comet, Planet, Position3D, SentryItem } from '../types';
import { propagateOrbit, getOrbitPath, formatJulianDate } from '../utils/propagation';

interface SolarSystemCanvasProps {
  planets: Planet[];
  asteroids: Asteroid[];
  comets: Comet[];
  sentryMap: Map<string, SentryItem>;
  selectedBody: Planet | Asteroid | Comet | null;
  onSelectBody: (body: Planet | Asteroid | Comet | null) => void;
  currentJD: number;
  showComets: boolean;
  showSentryOnly: boolean;
  asteroidFilter: {
    search: string;
    classCode: string; // "all", "APO", "ATE", "AMO", "IEO"
    hazardStatus: string; // "all", "pha", "non-pha"
    sizeRange: [number, number]; // [min, max] in km (0 if unknown)
    moidMax: number; // max MOID in AU (e.g. 1.0 or 0.05)
  };
  planetScale: number;
  cameraMode: 'free' | 'follow';
  setCameraMode: (mode: 'free' | 'follow') => void;
}

export const SolarSystemCanvas: React.FC<SolarSystemCanvasProps> = ({
  planets,
  asteroids,
  comets,
  sentryMap,
  selectedBody,
  onSelectBody,
  currentJD,
  showComets,
  showSentryOnly,
  asteroidFilter,
  planetScale,
  cameraMode,
  setCameraMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsContainerRef = useRef<HTMLDivElement>(null);

  // References to keep track of Three.js objects inside the animate loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Visual meshes
  const planetMeshesRef = useRef<THREE.Mesh[]>([]);
  const planetLabelElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const selectedLabelElRef = useRef<HTMLDivElement | null>(null);
  const selectedMarkerRef = useRef<THREE.Mesh | null>(null);
  const selectedOrbitLineRef = useRef<THREE.Line | null>(null);

  // Asteroid / Comet Particle Systems
  const asteroidPointsRef = useRef<THREE.Points | null>(null);
  const cometPointsRef = useRef<THREE.Points | null>(null);

  // Store lists for raycasting / quick access in frame loop
  const currentAsteroidsRef = useRef<Asteroid[]>([]);
  const currentCometsRef = useRef<Comet[]>([]);

  // Track if mouse was dragged to prevent selecting on drag-end
  const isDraggingRef = useRef(false);

  // Colors for body types
  const colors = {
    sun: 0xffea00,
    mercury: 0x9ca3af,
    venus: 0xe5e7eb,
    earth: 0x3b82f6,
    mars: 0xef4444,
    jupiter: 0xf59e0b,
    saturn: 0xd97706,
    uranus: 0x06b6d4,
    neptune: 0x4f46e5,
    pha: 0xf97316, // orange
    sentry: 0xef4444, // red
    neo: 0x06b6d4, // cyan
    standardAst: 0x6b7280, // gray
    comet: 0xa855f7, // purple
    selected: 0xfacc15, // yellow
  };

  // Pre-filter asteroids on changes to reduce per-frame work
  const filteredAsteroids = useMemo(() => {
    return asteroids.filter((ast) => {
      // 1. Search filter (designation or name)
      if (asteroidFilter.search) {
        const query = asteroidFilter.search.toLowerCase();
        const matchesName = ast.name?.toLowerCase().includes(query);
        const matchesDes = ast.pdes.toLowerCase().includes(query);
        const matchesFullName = ast.full_name.toLowerCase().includes(query);
        if (!matchesName && !matchesDes && !matchesFullName) return false;
      }

      // 2. Class filter
      if (asteroidFilter.classCode !== 'all' && ast.class !== asteroidFilter.classCode) {
        return false;
      }

      // 3. Hazard status filter
      if (asteroidFilter.hazardStatus === 'pha' && !ast.pha) return false;
      if (asteroidFilter.hazardStatus === 'non-pha' && ast.pha) return false;

      // 4. Sentry filter
      const isSentry = sentryMap.has(ast.pdes);
      if (showSentryOnly && !isSentry) return false;

      // 5. Size (diameter) filter
      if (ast.diameter !== null) {
        if (ast.diameter < asteroidFilter.sizeRange[0] || ast.diameter > asteroidFilter.sizeRange[1]) {
          return false;
        }
      } else {
        // If diameter is unknown and we are filtering for a specific non-zero range, hide it
        if (asteroidFilter.sizeRange[0] > 0) return false;
      }

      // 6. MOID filter
      if (ast.moid > asteroidFilter.moidMax) return false;

      return true;
    });
  }, [asteroids, asteroidFilter, showSentryOnly, sentryMap]);

  // Pre-filter comets
  const filteredComets = useMemo(() => {
    if (!showComets) return [];
    if (asteroidFilter.search) {
      const query = asteroidFilter.search.toLowerCase();
      return comets.filter(
        (c) =>
          c.full_name.toLowerCase().includes(query) ||
          c.pdes.toLowerCase().includes(query)
      );
    }
    return comets;
  }, [comets, showComets, asteroidFilter.search]);

  // Update refs so the animation loop always has the fresh lists without rebuilds
  useEffect(() => {
    currentAsteroidsRef.current = filteredAsteroids;
  }, [filteredAsteroids]);

  useEffect(() => {
    currentCometsRef.current = filteredComets;
  }, [filteredComets]);

  // Setup ThreeJS Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
    camera.position.set(0, -3, 3); // Slightly inclined view
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 150;
    controls.minDistance = 0.1;
    controlsRef.current = controls;

    // Listen to changes in controls to break 'follow' mode if user manually pans
    const handleStart = () => {
      isDraggingRef.current = false;
    };
    const handleEnd = () => {
      // Small timeout to distinguish click vs drag
      setTimeout(() => { isDraggingRef.current = false; }, 50);
    };
    const handleControlsChange = () => {
      isDraggingRef.current = true;
    };
    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);
    controls.addEventListener('change', handleControlsChange);

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2); // deep blue space ambient
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2.5, 300, 0); // strong bright light from Sun center
    scene.add(sunLight);

    // 6. Starfield Background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      // Place stars randomly on a large sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 200 + Math.random() * 50; // far away
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      sizeAttenuation: false,
    });
    const starfield = new THREE.Points(starGeometry, starMaterial);
    scene.add(starfield);

    // 7. Sun Mesh
    const sunGeometry = new THREE.SphereGeometry(0.08, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: colors.sun,
    });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);

    // Subtle halo around Sun
    const sunGlowGeometry = new THREE.SphereGeometry(0.12, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: colors.sun,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    scene.add(sunGlow);

    // 8. Planets & Orbits Setup
    const planetMeshes: THREE.Mesh[] = [];
    planetMeshesRef.current = planetMeshes;

    planets.forEach((p) => {
      // Orbit Line
      const orbitPath = getOrbitPath(p, 180);
      const points = orbitPath.map((pt) => new THREE.Vector3(pt.x, pt.y, pt.z));
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
      
      const getPlanetColor = (name: string): number => {
        const key = name.toLowerCase() as keyof typeof colors;
        return colors[key] || 0xffffff;
      };
      
      const pColor = getPlanetColor(p.name);
      
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: pColor,
        transparent: true,
        opacity: 0.25,
      });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbitLine);

      // Planet Sphere Mesh
      // Base radius scaled up so it's visible, multiplied by the user slider
      const baseRadii: Record<string, number> = {
        Mercury: 0.015,
        Venus: 0.024,
        Earth: 0.025,
        Mars: 0.018,
        Jupiter: 0.055,
        Saturn: 0.048,
        Uranus: 0.035,
        Neptune: 0.034,
      };
      
      const r = baseRadii[p.name] || 0.02;
      const planetGeometry = new THREE.SphereGeometry(r, 16, 16);
      const planetMaterial = new THREE.MeshStandardMaterial({
        color: pColor,
        roughness: 0.8,
        metalness: 0.1,
      });
      const pMesh = new THREE.Mesh(planetGeometry, planetMaterial);
      pMesh.userData = { type: 'planet', data: p };
      scene.add(pMesh);
      planetMeshes.push(pMesh);

      // Add Saturn's rings visually
      if (p.name === 'Saturn') {
        const ringGeo = new THREE.RingGeometry(r * 1.4, r * 2.3, 32);
        // Rotate ring to lie on Saturn's equator (slanted)
        ringGeo.rotateX(Math.PI / 2.3);
        const ringMat = new THREE.MeshBasicMaterial({
          color: colors.saturn,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.4,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        pMesh.add(ringMesh);
      }
    });

    // 9. Asteroids Points Particle System
    // We allocate a massive buffer of 45,000 points to handle all possible asteroids
    const maxAsteroidPoints = 45000;
    const astGeometry = new THREE.BufferGeometry();
    const astPositions = new Float32Array(maxAsteroidPoints * 3);
    const astColors = new Float32Array(maxAsteroidPoints * 3);

    // Initialize far away
    for (let i = 0; i < maxAsteroidPoints * 3; i++) {
      astPositions[i] = 10000; // hide initially
    }

    astGeometry.setAttribute('position', new THREE.BufferAttribute(astPositions, 3));
    astGeometry.setAttribute('color', new THREE.BufferAttribute(astColors, 3));

    const astMaterial = new THREE.PointsMaterial({
      size: 2.2,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const asteroidPoints = new THREE.Points(astGeometry, astMaterial);
    scene.add(asteroidPoints);
    asteroidPointsRef.current = asteroidPoints;

    // 10. Comets Points Particle System
    const maxCometPoints = 5000;
    const cometGeometry = new THREE.BufferGeometry();
    const cometPositions = new Float32Array(maxCometPoints * 3);
    const cometColors = new Float32Array(maxCometPoints * 3);

    for (let i = 0; i < maxCometPoints * 3; i++) {
      cometPositions[i] = 10000; // hide
    }

    cometGeometry.setAttribute('position', new THREE.BufferAttribute(cometPositions, 3));
    cometGeometry.setAttribute('color', new THREE.BufferAttribute(cometColors, 3));

    const cometMaterial = new THREE.PointsMaterial({
      size: 2.5,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const cometPoints = new THREE.Points(cometGeometry, cometMaterial);
    scene.add(cometPoints);
    cometPointsRef.current = cometPoints;

    // 11. Selected Body Marker Setup
    // A yellow wireframe sphere to highlight selection
    const markerGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: colors.selected,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const selectedMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    selectedMarker.visible = false;
    scene.add(selectedMarker);
    selectedMarkerRef.current = selectedMarker;

    // Raycaster for mouse clicks
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.05; // ease clicking
    raycasterRef.current = raycaster;

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
      controls.removeEventListener('change', handleControlsChange);
      
      // Dispose materials and geometries
      starGeometry.dispose();
      starMaterial.dispose();
      sunGeometry.dispose();
      sunMaterial.dispose();
      sunGlowGeometry.dispose();
      sunGlowMaterial.dispose();
      astGeometry.dispose();
      astMaterial.dispose();
      cometGeometry.dispose();
      cometMaterial.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
      
      planetMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });

      if (selectedOrbitLineRef.current) {
        selectedOrbitLineRef.current.geometry.dispose();
        (selectedOrbitLineRef.current.material as THREE.Material).dispose();
      }

      controls.dispose();
      renderer.dispose();
    };
  }, [planets]);

  // Click Handler for Raycasting
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If we were dragging the camera around, do NOT trigger a selection!
    if (isDraggingRef.current) return;

    if (!sceneRef.current || !cameraRef.current || !raycasterRef.current || !canvasRef.current) return;

    // Get normalized device coordinates (-1 to +1)
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    mouseRef.current.set(x, y);
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // 1. Raycast planets first (they are 3D meshes)
    const planetIntersects = raycasterRef.current.intersectObjects(planetMeshesRef.current);
    if (planetIntersects.length > 0) {
      const clickedMesh = planetIntersects[0].object as THREE.Mesh;
      if (clickedMesh.userData && clickedMesh.userData.type === 'planet') {
        onSelectBody(clickedMesh.userData.data);
        return;
      }
    }

    // 2. Raycast comets next (if active)
    if (showComets && cometPointsRef.current) {
      const cometIntersects = raycasterRef.current.intersectObject(cometPointsRef.current);
      if (cometIntersects.length > 0) {
        const sorted = cometIntersects.sort((a, b) => a.distanceToRay - b.distanceToRay);
        const index = sorted[0].index;
        if (index !== undefined && index < currentCometsRef.current.length) {
          onSelectBody(currentCometsRef.current[index]);
          return;
        }
      }
    }

    // 3. Raycast asteroids
    if (asteroidPointsRef.current) {
      const asteroidIntersects = raycasterRef.current.intersectObject(asteroidPointsRef.current);
      if (asteroidIntersects.length > 0) {
        // Sort by distance to ray to select the closest point to mouse cursor
        const sorted = asteroidIntersects.sort((a, b) => a.distanceToRay - b.distanceToRay);
        const index = sorted[0].index;
        if (index !== undefined && index < currentAsteroidsRef.current.length) {
          onSelectBody(currentAsteroidsRef.current[index]);
          return;
        }
      }
    }
  };

  // Re-draw selected orbit line when selected body changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old orbit line
    if (selectedOrbitLineRef.current) {
      scene.remove(selectedOrbitLineRef.current);
      selectedOrbitLineRef.current.geometry.dispose();
      (selectedOrbitLineRef.current.material as THREE.Material).dispose();
      selectedOrbitLineRef.current = null;
    }

    if (selectedBody) {
      // Determine color for the orbit line
      let color = colors.selected;
      if ('pha' in selectedBody && selectedBody.pha) {
        color = colors.pha;
      } else if (sentryMap.has(selectedBody.pdes)) {
        color = colors.sentry;
      } else if ('M1' in selectedBody) {
        color = colors.comet;
      }

      const pointsCount = 'e' in selectedBody && selectedBody.e > 1.001 ? 300 : 180; // hyperbolic comets need more points
      const orbitPath = getOrbitPath(selectedBody, pointsCount);
      const points = orbitPath.map((pt) => new THREE.Vector3(pt.x, pt.y, pt.z));
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
      
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        linewidth: 1.5,
      });

      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbitLine);
      selectedOrbitLineRef.current = orbitLine;
    }
  }, [selectedBody, sentryMap]);

  // Handle continuous updates: Positions of Planets, Asteroids, and Comets in the Animation Frame
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      const controls = controlsRef.current;

      if (!scene || !camera || !renderer || !controls) return;

      // 1. Update Planet Positions and Sizes
      planets.forEach((p, idx) => {
        const mesh = planetMeshesRef.current[idx];
        if (mesh) {
          const pos = propagateOrbit(p, currentJD);
          mesh.position.set(pos.x, pos.y, pos.z);

          // Update scale dynamically from the slider
          const baseRadii: Record<string, number> = {
            Mercury: 0.015,
            Venus: 0.024,
            Earth: 0.025,
            Mars: 0.018,
            Jupiter: 0.055,
            Saturn: 0.048,
            Uranus: 0.035,
            Neptune: 0.034,
          };
          const baseR = baseRadii[p.name] || 0.02;
          const s = baseR * planetScale;
          mesh.scale.set(s, s, s);
        }
      });

      // 2. Update Asteroid Positions and Colors
      const activeAsteroids = currentAsteroidsRef.current;
      const astPoints = asteroidPointsRef.current;
      
      if (astPoints) {
        const positionsAttr = astPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
        const positions = positionsAttr.array as Float32Array;

        const colorsAttr = astPoints.geometry.getAttribute('color') as THREE.BufferAttribute;
        const colorsArray = colorsAttr.array as Float32Array;

        // Loop through all buffer slots
        const maxSlots = positions.length / 3;
        const count = Math.min(activeAsteroids.length, maxSlots);

        for (let i = 0; i < maxSlots; i++) {
          const i3 = i * 3;
          if (i < count) {
            const ast = activeAsteroids[i];
            const pos = propagateOrbit(ast, currentJD);
            positions[i3] = pos.x;
            positions[i3 + 1] = pos.y;
            positions[i3 + 2] = pos.z;

            // Color coding based on status
            let col = colors.standardAst;
            if (selectedBody && selectedBody.pdes === ast.pdes) {
              col = colors.selected;
            } else if (sentryMap.has(ast.pdes)) {
              col = colors.sentry;
            } else if (ast.pha) {
              col = colors.pha;
            } else if (ast.neo) {
              col = colors.neo;
            }

            // Unpack color
            const r = ((col >> 16) & 255) / 255;
            const g = ((col >> 8) & 255) / 255;
            const b = (col & 255) / 255;

            colorsArray[i3] = r;
            colorsArray[i3 + 1] = g;
            colorsArray[i3 + 2] = b;
          } else {
            // Hide unused slots in the buffer far away
            positions[i3] = 10000;
            positions[i3 + 1] = 10000;
            positions[i3 + 2] = 10000;
          }
        }

        positionsAttr.needsUpdate = true;
        colorsAttr.needsUpdate = true;
      }

      // 3. Update Comet Positions
      const activeComets = currentCometsRef.current;
      const comPoints = cometPointsRef.current;

      if (comPoints && showComets) {
        const positionsAttr = comPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
        const positions = positionsAttr.array as Float32Array;

        const colorsAttr = comPoints.geometry.getAttribute('color') as THREE.BufferAttribute;
        const colorsArray = colorsAttr.array as Float32Array;

        const maxSlots = positions.length / 3;
        const count = Math.min(activeComets.length, maxSlots);

        for (let i = 0; i < maxSlots; i++) {
          const i3 = i * 3;
          if (i < count) {
            const comet = activeComets[i];
            const pos = propagateOrbit(comet, currentJD);
            positions[i3] = pos.x;
            positions[i3 + 1] = pos.y;
            positions[i3 + 2] = pos.z;

            let col = colors.comet;
            if (selectedBody && selectedBody.pdes === comet.pdes) {
              col = colors.selected;
            }

            const r = ((col >> 16) & 255) / 255;
            const g = ((col >> 8) & 255) / 255;
            const b = (col & 255) / 255;

            colorsArray[i3] = r;
            colorsArray[i3 + 1] = g;
            colorsArray[i3 + 2] = b;
          } else {
            positions[i3] = 10000;
            positions[i3 + 1] = 10000;
            positions[i3 + 2] = 10000;
          }
        }

        positionsAttr.needsUpdate = true;
        colorsAttr.needsUpdate = true;
      }

      // 4. Update Selected Body Highlight Marker
      let targetPos: Position3D | null = null;
      if (selectedBody) {
        targetPos = propagateOrbit(selectedBody, currentJD);
        if (selectedMarkerRef.current) {
          selectedMarkerRef.current.position.set(targetPos.x, targetPos.y, targetPos.z);
          selectedMarkerRef.current.visible = true;

          // Pulse selected marker size slowly over time
          const pulse = 1.0 + 0.3 * Math.sin(Date.now() * 0.005);
          // Scale based on body size/type
          let baseMarkerScale = 1.0;
          if ('radius_km' in selectedBody) {
            // Planet marker scaled slightly larger
            baseMarkerScale = 1.5;
          }
          selectedMarkerRef.current.scale.set(
            pulse * baseMarkerScale,
            pulse * baseMarkerScale,
            pulse * baseMarkerScale
          );
        }
      } else {
        if (selectedMarkerRef.current) {
          selectedMarkerRef.current.visible = false;
        }
      }

      // 5. Focus & Follow Camera Mode
      if (cameraMode === 'follow' && selectedBody && targetPos) {
        controls.target.set(targetPos.x, targetPos.y, targetPos.z);
      }

      controls.update();
      renderer.render(scene, camera);

      // 6. Project 3D Coordinates to 2D HTML Labels Overlay
      const labelsContainer = labelsContainerRef.current;
      if (labelsContainer) {
        const widthHalf = labelsContainer.clientWidth / 2;
        const heightHalf = labelsContainer.clientHeight / 2;
        const tempV = new THREE.Vector3();

        // Project Planets
        planets.forEach((p, idx) => {
          const mesh = planetMeshesRef.current[idx];
          const el = planetLabelElsRef.current[idx];
          if (mesh && el) {
            tempV.setFromMatrixPosition(mesh.matrixWorld);
            tempV.project(camera);

            const isBehind = tempV.z > 1;
            if (isBehind) {
              el.style.display = 'none';
            } else {
              el.style.display = 'block';
              const x = tempV.x * widthHalf + widthHalf;
              const y = -tempV.y * heightHalf + heightHalf;
              el.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
            }
          }
        });

        // Project Selected Object
        const selEl = selectedLabelElRef.current;
        if (selEl && selectedBody && targetPos) {
          tempV.set(targetPos.x, targetPos.y, targetPos.z);
          tempV.project(camera);

          const isBehind = tempV.z > 1;
          if (isBehind) {
            selEl.style.display = 'none';
          } else {
            selEl.style.display = 'block';
            const x = tempV.x * widthHalf + widthHalf;
            const y = -tempV.y * heightHalf + heightHalf;
            selEl.style.transform = `translate(-50%, -140%) translate(${x}px, ${y}px)`;
          }
        } else if (selEl) {
          selEl.style.display = 'none';
        }
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [planets, currentJD, planetScale, cameraMode, selectedBody, showComets]);

  // Watch for manual zoom/pan breaking camera mode from 'follow' to 'free'
  useEffect(() => {
    const checkUserInteraction = () => {
      if (cameraMode === 'follow' && isDraggingRef.current) {
        setCameraMode('free');
      }
    };

    const interval = setInterval(checkUserInteraction, 100);
    return () => clearInterval(interval);
  }, [cameraMode, setCameraMode]);

  return (
    <div ref={containerRef} className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-space-950"
        onClick={handleCanvasClick}
      />

      {/* 2D HTML Projection Overlay for Planet Labels & HUD elements */}
      <div
        ref={labelsContainerRef}
        className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden"
      >
        {/* Planet Labels */}
        {planets.map((p, idx) => (
          <div
            key={p.name}
            ref={(el) => (planetLabelElsRef.current[idx] = el)}
            className="absolute left-0 top-0 text-[10px] md:text-[11px] font-medium px-2 py-0.5 rounded border border-gray-800/40 bg-gray-950/80 text-gray-300 backdrop-blur-[2px] transition-opacity duration-300 flex items-center gap-1 shadow-md shadow-black/20"
            style={{ display: 'none' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: `#${(colors[p.name.toLowerCase() as keyof typeof colors] || 0xffffff)
                  .toString(16)
                  .padStart(6, '0')}`,
              }}
            />
            {p.name}
          </div>
        ))}

        {/* Selected Body Label */}
        {selectedBody && (
          <div
            ref={selectedLabelElRef}
            className="absolute left-0 top-0 px-2.5 py-1 text-xs font-bold rounded-md bg-yellow-500/90 text-gray-950 shadow-lg border border-yellow-400 flex flex-col items-center gap-0.5 text-center min-w-[110px]"
            style={{ display: 'none' }}
          >
            <div className="uppercase tracking-wider font-mono text-[9px] text-gray-950/75">
              {'radius_km' in selectedBody ? 'Planet' : 'M1' in selectedBody ? 'Comet' : 'Asteroid'}
            </div>
            <div>
              {('radius_km' in selectedBody ? selectedBody.name : selectedBody.name || selectedBody.pdes)}
            </div>
            {('pha' in selectedBody && selectedBody.pha) && (
              <span className="text-[8px] bg-red-600 text-white px-1 py-0.5 rounded font-mono uppercase mt-0.5">
                PHA
              </span>
            )}
            {sentryMap.has(selectedBody.pdes) && (
              <span className="text-[8px] bg-red-600 text-white px-1 py-0.5 rounded font-mono uppercase mt-0.5">
                Sentry
              </span>
            )}
          </div>
        )}

        {/* Compass / Orientation HUD (Lower Left) */}
        <div className="absolute bottom-4 left-4 bg-gray-950/80 border border-gray-800 p-2.5 rounded font-mono text-[10px] text-gray-400 flex flex-col gap-1 backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
            <span className="text-gray-200 font-bold">J2000 ECLIPTIC FRAME</span>
          </div>
          <div>JD: {currentJD.toFixed(4)}</div>
          <div>UT: {formatJulianDate(currentJD)}</div>
          <div className="mt-1 flex gap-2">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> NEO</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> PHA</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Sentry</span>
            {showComets && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Comet</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
