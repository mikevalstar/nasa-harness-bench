import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { propagateOrbit, getOrbitPathPoints, Position3D } from '../math/orbits';

interface OrbitViewerProps {
  jd: number;
  planets: any[];
  asteroids: any[][];
  comets: any[][];
  selectedObject: any | null; // e.g. { type: 'planet' | 'asteroid' | 'comet', data: any }
  onSelectObject: (obj: any | null) => void;
  showOrbits: boolean;
  showAsteroids: boolean;
  showComets: boolean;
  followSelected: boolean;
  highlightHazardous: boolean;
  sentryData: Record<string, any>;
  filterClass: string;
}

const PLANET_COLORS: Record<string, number> = {
  Mercury: 0x9e9e9e,
  Venus: 0xe5c158,
  Earth: 0x2b82c9,
  Mars: 0xc1440e,
  Jupiter: 0xb07f35,
  Saturn: 0xe2bf7d,
  Uranus: 0x4b70dd,
  Neptune: 0x274687,
};

export const OrbitViewer: React.FC<OrbitViewerProps> = ({
  jd,
  planets,
  asteroids,
  comets,
  selectedObject,
  onSelectObject,
  showOrbits,
  showAsteroids,
  showComets,
  followSelected,
  highlightHazardous,
  sentryData,
  filterClass,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Keep track of mutable elements for animation updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  // Scene elements
  const planetMeshesRef = useRef<Record<string, THREE.Mesh>>({});
  const planetOrbitLinesRef = useRef<THREE.Line[]>([]);
  
  const asteroidPointsRef = useRef<THREE.Points | null>(null);
  const cometPointsRef = useRef<THREE.Points | null>(null);
  const selectedOrbitLineRef = useRef<THREE.Line | null>(null);
  const selectedHighlightMeshRef = useRef<THREE.Mesh | null>(null);

  // Scale: 1 AU = 20 Three.js units.
  const SCALE = 20;

  // Track rendering state
  const stateRef = useRef({
    jd,
    showOrbits,
    showAsteroids,
    showComets,
    followSelected,
    highlightHazardous,
    filterClass,
    selectedObject,
  });

  // Keep state updated in ref for the requestAnimationFrame loop
  useEffect(() => {
    stateRef.current = {
      jd,
      showOrbits,
      showAsteroids,
      showComets,
      followSelected,
      highlightHazardous,
      filterClass,
      selectedObject,
    };
  }, [jd, showOrbits, showAsteroids, showComets, followSelected, highlightHazardous, filterClass, selectedObject]);

  // Initial Scene Setup
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Slate-950
    sceneRef.current = scene;

    // Add Ambient Space Stars (Starfield)
    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      // Random points on a large sphere
      const r = 500 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: false,
    });
    const starfield = new THREE.Points(starGeometry, starMaterial);
    scene.add(starfield);

    // Create Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 50, 80);
    cameraRef.current = camera;

    // Create Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 600;
    controls.minDistance = 2;
    controlsRef.current = controls;

    // Add Lights
    // 1. Central PointLight (The Sun)
    const sunLight = new THREE.PointLight(0xffffff, 2, 800, 0.1);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // 2. Ambient light to ensure planets are slightly visible on their dark sides
    const ambientLight = new THREE.AmbientLight(0x334155, 0.6);
    scene.add(ambientLight);

    // Create the Sun
    const sunGeom = new THREE.SphereGeometry(1.8, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfdb813,
      toneMapped: false,
    });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    scene.add(sunMesh);

    // Sun corona glow effect
    const coronaGeom = new THREE.SphereGeometry(2.4, 16, 16);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
    scene.add(coronaMesh);

    // Create Planet Spheres and Orbits
    planets.forEach((planet) => {
      // Planet Sphere
      // Stylized sizes for inner solar system visibility
      const radius = Math.max(0.12, Math.min(0.8, planet.radius_km / 12000));
      const geom = new THREE.SphereGeometry(radius, 16, 16);
      const color = PLANET_COLORS[planet.name] || 0xffffff;
      
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.1,
        emissive: color,
        emissiveIntensity: 0.1,
      });
      const mesh = new THREE.Mesh(geom, mat);
      scene.add(mesh);
      planetMeshesRef.current[planet.name] = mesh;

      // Draw Planet Orbit Line
      const orbitPoints = getOrbitPathPoints(planet, 200).map(
        (p) => new THREE.Vector3(p.x * SCALE, p.y * SCALE, p.z * SCALE)
      );
      const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.25,
      });
      const orbitLine = new THREE.Line(orbitGeom, orbitMat);
      scene.add(orbitLine);
      planetOrbitLinesRef.current.push(orbitLine);
    });

    // Create Highlighting Overlay for selected object
    const selectedGeom = new THREE.RingGeometry(0.8, 1.2, 32);
    selectedGeom.rotateX(-Math.PI / 2); // align with horizontal plane
    const selectedMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, // Cyan-500
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const selectionRing = new THREE.Mesh(selectedGeom, selectedMat);
    selectionRing.visible = false;
    scene.add(selectionRing);
    selectedHighlightMeshRef.current = selectionRing;

    // Handle Window Resizing
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- Start Animation Loop ---
    let animFrameId: number;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      
      const {
        jd: currentJd,
        showOrbits: renderOrbits,
        showAsteroids: renderAsteroids,
        showComets: renderComets,
        followSelected: follow,
        highlightHazardous: hazOnly,
        filterClass: cls,
        selectedObject: sel,
      } = stateRef.current;

      // Update Planet Positions
      planets.forEach((p) => {
        const mesh = planetMeshesRef.current[p.name];
        if (mesh) {
          const pos = propagateOrbit(p, currentJd);
          mesh.position.set(pos.x * SCALE, pos.y * SCALE, pos.z * SCALE);
        }
      });

      // Update Orbit Lines visibility
      planetOrbitLinesRef.current.forEach((line) => {
        line.visible = renderOrbits;
      });

      // Update Selection Indicator position
      let focusTarget: THREE.Vector3 | null = null;
      if (sel) {
        let selPos: Position3D | null = null;
        if (sel.type === 'planet') {
          selPos = propagateOrbit(sel.data, currentJd);
        } else if (sel.type === 'asteroid') {
          selPos = propagateOrbit(
            {
              a: sel.data[4],
              e: sel.data[5],
              i: sel.data[6],
              om: sel.data[7],
              w: sel.data[8],
              ma: sel.data[9],
              epoch: sel.data[3],
              per: sel.data[10],
              n: sel.data[11],
              tp: sel.data[12],
            },
            currentJd
          );
        } else if (sel.type === 'comet') {
          selPos = propagateOrbit(
            {
              a: sel.data[3],
              e: sel.data[4],
              i: sel.data[5],
              om: sel.data[6],
              w: sel.data[7],
              ma: sel.data[8],
              epoch: sel.data[2],
              per: sel.data[9],
              n: sel.data[10],
              tp: sel.data[11],
            },
            currentJd
          );
        }

        if (selPos && selectionRing) {
          const x = selPos.x * SCALE;
          const y = selPos.y * SCALE;
          const z = selPos.z * SCALE;
          selectionRing.position.set(x, y, z);
          selectionRing.visible = true;

          // Orbit animation of selection ring
          selectionRing.rotation.y += 0.01;
          
          focusTarget = new THREE.Vector3(x, y, z);
        }
      } else if (selectionRing) {
        selectionRing.visible = false;
      }

      // Update Asteroids Particles
      if (renderAsteroids && asteroidPointsRef.current) {
        asteroidPointsRef.current.visible = true;
        const positions = asteroidPointsRef.current.geometry.attributes.position.array as Float32Array;
        const colors = asteroidPointsRef.current.geometry.attributes.color.array as Float32Array;

        for (let idx = 0; idx < asteroids.length; idx++) {
          const ast = asteroids[idx];
          
          // Determine asteroid fields
          const a_val = ast[4];
          const e_val = ast[5];
          const isPHA = ast[13] === 1;
          const astClass = ast[14];
          const hasSentry = sentryData[ast[0]] !== undefined;

          // Filter evaluation
          let isVisible = true;
          if (hazOnly && !isPHA) isVisible = false;
          if (cls && cls !== 'ALL' && astClass !== cls) isVisible = false;

          const pIdx = idx * 3;
          
          if (!isVisible) {
            // Put off screen or set positions to 0
            positions[pIdx] = 99999;
            positions[pIdx + 1] = 99999;
            positions[pIdx + 2] = 99999;
            continue;
          }

          // Propagate
          const pos = propagateOrbit(
            {
              a: a_val,
              e: e_val,
              i: ast[6],
              om: ast[7],
              w: ast[8],
              ma: ast[9],
              epoch: ast[3],
              per: ast[10],
              n: ast[11],
              tp: ast[12],
            },
            currentJd
          );

          positions[pIdx] = pos.x * SCALE;
          positions[pIdx + 1] = pos.y * SCALE;
          positions[pIdx + 2] = pos.z * SCALE;

          // Dynamically adjust color
          if (hasSentry) {
            // Flash red-orange
            const val = Math.sin(Date.now() * 0.005) * 0.4 + 0.6;
            colors[pIdx] = 1.0;
            colors[pIdx + 1] = 0.2 * val;
            colors[pIdx + 2] = 0.0;
          } else if (isPHA) {
            colors[pIdx] = 0.93;     // Red-500
            colors[pIdx + 1] = 0.27;
            colors[pIdx + 2] = 0.27;
          } else if (sel && sel.type === 'asteroid' && sel.data[0] === ast[0]) {
            colors[pIdx] = 0.06;     // Cyan-400 (selected)
            colors[pIdx + 1] = 0.71;
            colors[pIdx + 2] = 0.83;
          } else {
            // Default color according to orbital class for visual texture
            if (astClass === 'AMO') {
              colors[pIdx] = 0.38;     // Slatey yellow-green
              colors[pIdx + 1] = 0.72;
              colors[pIdx + 2] = 0.48;
            } else if (astClass === 'APO') {
              colors[pIdx] = 0.29;     // soft blue
              colors[pIdx + 1] = 0.62;
              colors[pIdx + 2] = 0.84;
            } else {
              colors[pIdx] = 0.58;     // grey-white dust
              colors[pIdx + 1] = 0.64;
              colors[pIdx + 2] = 0.73;
            }
          }
        }
        asteroidPointsRef.current.geometry.attributes.position.needsUpdate = true;
        asteroidPointsRef.current.geometry.attributes.color.needsUpdate = true;
      } else if (asteroidPointsRef.current) {
        asteroidPointsRef.current.visible = false;
      }

      // Update Comets Particles
      if (renderComets && cometPointsRef.current) {
        cometPointsRef.current.visible = true;
        const positions = cometPointsRef.current.geometry.attributes.position.array as Float32Array;
        const colors = cometPointsRef.current.geometry.attributes.color.array as Float32Array;

        for (let idx = 0; idx < comets.length; idx++) {
          const com = comets[idx];
          const pIdx = idx * 3;

          // Propagate
          const pos = propagateOrbit(
            {
              a: com[3],
              e: com[4],
              i: com[5],
              om: com[6],
              w: com[7],
              ma: com[8],
              epoch: com[2],
              per: com[9],
              n: com[10],
              tp: com[11],
            },
            currentJd
          );

          positions[pIdx] = pos.x * SCALE;
          positions[pIdx + 1] = pos.y * SCALE;
          positions[pIdx + 2] = pos.z * SCALE;

          if (sel && sel.type === 'comet' && sel.data[0] === com[0]) {
            colors[pIdx] = 0.06;     // cyan
            colors[pIdx + 1] = 0.71;
            colors[pIdx + 2] = 0.83;
          } else {
            // soft cyan-blue for comets
            colors[pIdx] = 0.4;
            colors[pIdx + 1] = 0.85;
            colors[pIdx + 2] = 0.9;
          }
        }
        cometPointsRef.current.geometry.attributes.position.needsUpdate = true;
        cometPointsRef.current.geometry.attributes.color.needsUpdate = true;
      } else if (cometPointsRef.current) {
        cometPointsRef.current.visible = false;
      }

      // Follow Camera Focus
      if (follow && focusTarget && controlsRef.current && cameraRef.current) {
        // Move controls target to focus position
        const currentTarget = controlsRef.current.target;
        const dx = focusTarget.x - currentTarget.x;
        const dy = focusTarget.y - currentTarget.y;
        const dz = focusTarget.z - currentTarget.z;

        // Smooth interpolate to follow target smoothly
        controlsRef.current.target.set(
          currentTarget.x + dx * 0.1,
          currentTarget.y + dy * 0.1,
          currentTarget.z + dz * 0.1
        );
        cameraRef.current.position.set(
          cameraRef.current.position.x + dx * 0.1,
          cameraRef.current.position.y + dy * 0.1,
          cameraRef.current.position.z + dz * 0.1
        );
      } else if (!focusTarget && controlsRef.current) {
        // Smooth interpolate back to the Sun at origin (0, 0, 0)
        const currentTarget = controlsRef.current.target;
        controlsRef.current.target.set(
          currentTarget.x * 0.9,
          currentTarget.y * 0.9,
          currentTarget.z * 0.9
        );
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [planets, asteroids, comets]); // Redraw scene when base datasets change (only at startup)

  // Draw or update selected object's orbit line path
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous line
    if (selectedOrbitLineRef.current) {
      scene.remove(selectedOrbitLineRef.current);
      selectedOrbitLineRef.current.geometry.dispose();
      selectedOrbitLineRef.current = null;
    }

    if (!selectedObject || !showOrbits) return;

    // Construct orbital element dictionary for drawing path
    let elements = null;
    let color = 0x06b6d4; // Cyan-500

    if (selectedObject.type === 'planet') {
      elements = selectedObject.data;
      color = PLANET_COLORS[selectedObject.data.name] || 0x06b6d4;
    } else if (selectedObject.type === 'asteroid') {
      const ast = selectedObject.data;
      elements = {
        a: ast[4],
        e: ast[5],
        i: ast[6],
        om: ast[7],
        w: ast[8],
        ma: ast[9],
        epoch: ast[3],
        per: ast[10],
        n: ast[11],
        tp: ast[12],
      };
      if (ast[13] === 1) color = 0xef4444; // Red for PHAs
    } else if (selectedObject.type === 'comet') {
      const com = selectedObject.data;
      elements = {
        a: com[3],
        e: com[4],
        i: com[5],
        om: com[6],
        w: com[7],
        ma: com[8],
        epoch: com[2],
        per: com[9],
        n: com[10],
        tp: com[11],
      };
      color = 0x22d3ee; // Comet cyan
    }

    if (elements) {
      const points = getOrbitPathPoints(elements, 300).map(
        (p) => new THREE.Vector3(p.x * SCALE, p.y * SCALE, p.z * SCALE)
      );
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color,
        linewidth: 2,
        transparent: true,
        opacity: 0.8,
      });
      const orbitLine = new THREE.Line(geom, mat);
      scene.add(orbitLine);
      selectedOrbitLineRef.current = orbitLine;
    }
  }, [selectedObject, showOrbits]);

  // Create static Asteroid Particle Group (once data is loaded)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || asteroids.length === 0) return;

    // Clear old points
    if (asteroidPointsRef.current) {
      scene.remove(asteroidPointsRef.current);
      asteroidPointsRef.current.geometry.dispose();
    }

    const astCount = asteroids.length;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(astCount * 3);
    const colors = new Float32Array(astCount * 3);

    // Fill buffer with initial fake positions (will be updated dynamically in animate loop)
    for (let i = 0; i < astCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Initial color grey
      colors[i * 3] = 0.6;
      colors[i * 3 + 1] = 0.6;
      colors[i * 3 + 2] = 0.6;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom shader material or simple points material with vertex coloring
    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
    });

    const points = new THREE.Points(geom, material);
    scene.add(points);
    asteroidPointsRef.current = points;
  }, [asteroids]);

  // Create static Comet Particle Group
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || comets.length === 0) return;

    // Clear old points
    if (cometPointsRef.current) {
      scene.remove(cometPointsRef.current);
      cometPointsRef.current.geometry.dispose();
    }

    const comCount = comets.length;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(comCount * 3);
    const colors = new Float32Array(comCount * 3);

    for (let i = 0; i < comCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      colors[i * 3] = 0.4;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 0.9;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.5, // comets slightly larger
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
    });

    const points = new THREE.Points(geom, material);
    scene.add(points);
    cometPointsRef.current = points;
  }, [comets]);

  // Click on screen to select planet (using simple Raycaster)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!container || !camera || !scene) return;

    // Calculate mouse position in normalized device coordinates
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    const y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // Gather testable meshes (the planet meshes + Sun)
    const targets: THREE.Object3D[] = [];
    const nameMap = new Map<THREE.Object3D, any>();

    planets.forEach((p) => {
      const mesh = planetMeshesRef.current[p.name];
      if (mesh) {
        targets.push(mesh);
        nameMap.set(mesh, { type: 'planet', data: p });
      }
    });

    // Also check if we clicked on asteroids (using higher raycast threshold for points)
    raycaster.params.Points.threshold = 0.4;
    
    const intersects = raycaster.intersectObjects(targets);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      const selectInfo = nameMap.get(hitObj);
      if (selectInfo) {
        onSelectObject(selectInfo);
        return;
      }
    }

    // Check if clicked the Sun itself
    const sceneChildren = scene.children;
    const sunGeomMesh = sceneChildren.find(
      (c) => c instanceof THREE.Mesh && c.geometry instanceof THREE.SphereGeometry && c.geometry.parameters.radius === 1.8
    );
    if (sunGeomMesh) {
      const sunIntersect = raycaster.intersectObject(sunGeomMesh);
      if (sunIntersect.length > 0) {
        onSelectObject(null); // Deselect (or reset focus to Sun)
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing outline-none"
      onClick={handleCanvasClick}
    />
  );
};
