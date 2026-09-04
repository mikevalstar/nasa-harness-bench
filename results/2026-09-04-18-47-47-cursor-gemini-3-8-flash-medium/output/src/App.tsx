import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadSolarSystemData, SolarSystemData } from './data/dataLoader';
import { SolarScene } from './scene/SolarScene';
import { AsteroidColorMode, AsteroidFilterOptions } from './scene/AsteroidPointCloud';
import { SelectedObjectInfo } from './types/solar';
import { TopNav } from './components/TopNav';
import { TimeControls } from './components/TimeControls';
import { ObjectInspector } from './components/ObjectInspector';
import { StatisticsHUD } from './components/StatisticsHUD';
import { LoadingOverlay } from './components/LoadingOverlay';
import { parseUrlHash, updateUrlHash } from './utils/urlState';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SolarScene | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadStage, setLoadStage] = useState('Initializing application...');
  const [loadFraction, setLoadFraction] = useState(0);

  const [data, setData] = useState<SolarSystemData | null>(null);
  const [currentJd, setCurrentJd] = useState(2460500.5); // July 2024
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeMultiplier, setTimeMultiplier] = useState(7.0); // 7 days/sec default
  const [colorMode, setColorMode] = useState<AsteroidColorMode>('class');
  const [cometsVisible, setCometsVisible] = useState(false);
  const [filters, setFilters] = useState<AsteroidFilterOptions>({
    phaOnly: false,
    sentryOnly: false,
    classes: new Set(['APO', 'ATE', 'AMO', 'IEO']),
    minDiameter: 0,
    maxH: 99,
    searchQuery: '',
  });

  const [selectedObject, setSelectedObject] = useState<SelectedObjectInfo | null>(null);
  const [isFocusAndFollow, setIsFocusAndFollow] = useState(false);
  const [visibleCount, setVisibleCount] = useState(42075);

  // Load datasets on mount
  useEffect(() => {
    let mounted = true;
    loadSolarSystemData((stage, fraction) => {
      if (mounted) {
        setLoadStage(stage);
        setLoadFraction(fraction);
      }
    })
      .then((loadedData) => {
        if (!mounted) return;
        setData(loadedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load solar system datasets:', err);
        setLoadStage(`Error loading data: ${err.message}`);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Initialize 3D scene
  useEffect(() => {
    if (!data || !containerRef.current) return;

    // Check URL state for initial parameters
    const urlState = parseUrlHash();
    const initialJd = urlState.jd ?? 2460500.5;
    const initialSpeed = urlState.speed ?? 7.0;

    const scene = new SolarScene(containerRef.current, data, initialJd);
    scene.timeMultiplier = initialSpeed;
    sceneRef.current = scene;

    setCurrentJd(initialJd);
    setTimeMultiplier(initialSpeed);

    if (urlState.pha) {
      setFilters((prev) => ({ ...prev, phaOnly: true }));
      scene.asteroidPointCloud.setFilters({ phaOnly: true });
    }
    if (urlState.sentry) {
      setFilters((prev) => ({ ...prev, sentryOnly: true }));
      scene.asteroidPointCloud.setFilters({ sentryOnly: true });
    }
    if (urlState.comets) {
      setCometsVisible(true);
      scene.cometPointCloud.setVisible(true);
    }
    if (urlState.color) {
      setColorMode(urlState.color as AsteroidColorMode);
      scene.asteroidPointCloud.setColorMode(urlState.color as AsteroidColorMode);
    }

    if (urlState.cam) {
      scene.camera.position.set(urlState.cam[0], urlState.cam[1], urlState.cam[2]);
    }
    if (urlState.tar) {
      scene.controls.target.set(urlState.tar[0], urlState.tar[1], urlState.tar[2]);
    }
    scene.controls.update();

    // Check initial target
    if (urlState.target) {
      const pdes = urlState.target;
      const ast = data.asteroids.find((a) => a.pdes === pdes);
      if (ast) {
        const info: SelectedObjectInfo = {
          type: 'asteroid',
          id: ast.pdes,
          displayName: ast.name ? `${ast.name} (${ast.pdes})` : ast.full_name,
          data: ast,
          sentry: data.sentryMap.get(ast.pdes),
          closeApproaches: data.closeApproachesMap.get(ast.pdes),
        };
        scene.selectObject(info);
        setSelectedObject(info);
        if (urlState.follow) {
          scene.isFocusAndFollow = true;
          setIsFocusAndFollow(true);
        }
      } else {
        const planet = data.planets.find((p) => p.name.toLowerCase() === pdes.toLowerCase());
        if (planet) {
          const info: SelectedObjectInfo = {
            type: 'planet',
            id: planet.name,
            displayName: planet.name,
            data: planet,
          };
          scene.selectObject(info);
          setSelectedObject(info);
          if (urlState.follow) {
            scene.isFocusAndFollow = true;
            setIsFocusAndFollow(true);
          }
        }
      }
    }

    // Callbacks from scene
    scene.onSelectCallback = (info) => {
      setSelectedObject(info);
      setIsFocusAndFollow(scene.isFocusAndFollow);
    };

    // Animation ticker to sync React state smoothly
    let timer = setInterval(() => {
      if (sceneRef.current) {
        setCurrentJd(sceneRef.current.currentJd);
        setVisibleCount(sceneRef.current.asteroidPointCloud.getVisibleCount());
      }
    }, 100);

    return () => {
      clearInterval(timer);
      scene.destroy();
      sceneRef.current = null;
    };
  }, [data]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      const scene = sceneRef.current;
      if (!scene) return;

      if (e.code === 'Space') {
        e.preventDefault();
        const next = !scene.isPlaying;
        scene.isPlaying = next;
        setIsPlaying(next);
      } else if (e.code === 'KeyR') {
        scene.setViewPreset('oblique');
      } else if (e.code === 'KeyF') {
        if (selectedObject) {
          const next = !scene.isFocusAndFollow;
          scene.isFocusAndFollow = next;
          setIsFocusAndFollow(next);
        }
      } else if (e.code === 'Escape') {
        scene.selectObject(null);
        setSelectedObject(null);
        setIsFocusAndFollow(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject]);

  // Time control handlers
  const handleTogglePlay = useCallback(() => {
    if (sceneRef.current) {
      const next = !sceneRef.current.isPlaying;
      sceneRef.current.isPlaying = next;
      setIsPlaying(next);
    }
  }, []);

  const handleSetJd = useCallback((jd: number) => {
    if (sceneRef.current) {
      sceneRef.current.updateAllPositions(jd, true);
      setCurrentJd(jd);
    }
  }, []);

  const handleSetMultiplier = useCallback((speed: number) => {
    if (sceneRef.current) {
      sceneRef.current.timeMultiplier = speed;
      setTimeMultiplier(speed);
      if (!sceneRef.current.isPlaying) {
        sceneRef.current.isPlaying = true;
        setIsPlaying(true);
      }
    }
  }, []);

  const handleStep = useCallback((days: number) => {
    if (sceneRef.current) {
      const next = sceneRef.current.currentJd + days;
      sceneRef.current.updateAllPositions(next, true);
      setCurrentJd(next);
    }
  }, []);

  // Filter & visual handlers
  const handleSetColorMode = useCallback((mode: AsteroidColorMode) => {
    setColorMode(mode);
    sceneRef.current?.asteroidPointCloud.setColorMode(mode);
  }, []);

  const handleSetFilters = useCallback((nextFilters: Partial<AsteroidFilterOptions>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...nextFilters };
      sceneRef.current?.asteroidPointCloud.setFilters(updated);
      return updated;
    });
  }, []);

  const handleToggleComets = useCallback((visible: boolean) => {
    setCometsVisible(visible);
    sceneRef.current?.cometPointCloud.setVisible(visible);
    if (visible && sceneRef.current) {
      sceneRef.current.cometPointCloud.updatePositions(sceneRef.current.currentJd, true);
    }
  }, []);

  const handleSelectObject = useCallback((info: SelectedObjectInfo | null) => {
    setSelectedObject(info);
    sceneRef.current?.selectObject(info);
    if (info && sceneRef.current) {
      setIsFocusAndFollow(sceneRef.current.isFocusAndFollow);
    } else {
      setIsFocusAndFollow(false);
    }
  }, []);

  const handleSetViewPreset = useCallback((preset: 'top' | 'oblique' | 'inner' | 'outer') => {
    sceneRef.current?.setViewPreset(preset);
  }, []);

  const handleToggleFocus = useCallback(() => {
    if (sceneRef.current && selectedObject) {
      const next = !sceneRef.current.isFocusAndFollow;
      sceneRef.current.isFocusAndFollow = next;
      setIsFocusAndFollow(next);
      if (next) {
        sceneRef.current.focusOnObject(selectedObject);
      }
    }
  }, [selectedObject]);

  const handleShareLink = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const camPos = scene.camera.position;
    const targetPos = scene.controls.target;

    updateUrlHash({
      jd: scene.currentJd,
      target: selectedObject?.id,
      type: selectedObject?.type,
      follow: isFocusAndFollow,
      speed: timeMultiplier,
      cam: [camPos.x, camPos.y, camPos.z],
      tar: [targetPos.x, targetPos.y, targetPos.z],
      pha: filters.phaOnly,
      sentry: filters.sentryOnly,
      comets: cometsVisible,
      color: colorMode,
    });

    navigator.clipboard?.writeText(window.location.href);
  }, [selectedObject, isFocusAndFollow, timeMultiplier, filters, cometsVisible, colorMode]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {loading && <LoadingOverlay stage={loadStage} fraction={loadFraction} />}

      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {data && (
        <>
          <TopNav
            data={data}
            colorMode={colorMode}
            onSetColorMode={handleSetColorMode}
            filters={filters}
            onSetFilters={handleSetFilters}
            cometsVisible={cometsVisible}
            onToggleComets={handleToggleComets}
            onSelectObject={handleSelectObject}
            onSetViewPreset={handleSetViewPreset}
            onShareLink={handleShareLink}
          />

          <TimeControls
            currentJd={currentJd}
            isPlaying={isPlaying}
            timeMultiplier={timeMultiplier}
            onTogglePlay={handleTogglePlay}
            onSetJd={handleSetJd}
            onSetMultiplier={handleSetMultiplier}
            onStep={handleStep}
          />

          <ObjectInspector
            selectedObject={selectedObject}
            scene={sceneRef.current}
            currentJd={currentJd}
            onClose={() => handleSelectObject(null)}
            onJumpToJd={handleSetJd}
            onToggleFocus={handleToggleFocus}
            isFocusAndFollow={isFocusAndFollow}
          />

          <StatisticsHUD
            totalCount={data.asteroids.length}
            visibleCount={visibleCount}
            phaCount={data.asteroids.filter((a) => a.pha).length}
            sentryCount={data.sentry.length}
            cometCount={data.comets.length}
            cometsVisible={cometsVisible}
            colorMode={colorMode}
          />
        </>
      )}
    </div>
  );
};
