import React, { useState, useMemo } from 'react';
import { Search, Info, HelpCircle, Eye, EyeOff, ShieldAlert, Sparkles, SlidersHorizontal } from 'lucide-react';

interface SidebarProps {
  planets: any[];
  asteroids: any[][];
  comets: any[][];
  selectedObject: any | null;
  onSelectObject: (obj: any | null) => void;
  showOrbits: boolean;
  setShowOrbits: (val: boolean) => void;
  showAsteroids: boolean;
  setShowAsteroids: (val: boolean) => void;
  showComets: boolean;
  setShowComets: (val: boolean) => void;
  followSelected: boolean;
  setFollowSelected: (val: boolean) => void;
  highlightHazardous: boolean;
  setHighlightHazardous: (val: boolean) => void;
  sentryData: Record<string, any>;
  filterClass: string;
  setFilterClass: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  planets,
  asteroids,
  comets,
  selectedObject,
  onSelectObject,
  showOrbits,
  setShowOrbits,
  showAsteroids,
  setShowAsteroids,
  showComets,
  setShowComets,
  followSelected,
  setFollowSelected,
  highlightHazardous,
  setHighlightHazardous,
  sentryData,
  filterClass,
  setFilterClass,
  searchQuery,
  setSearchQuery,
}) => {
  const [showFilters, setShowFilters] = useState(true);
  const [sentryOnly, setSentryOnly] = useState(false);
  const [minDiameter, setMinDiameter] = useState<number | null>(null);

  // Filter & Search Logic (computed in background)
  const filteredAsteroids = useMemo(() => {
    let list = asteroids;

    if (highlightHazardous) {
      list = list.filter(ast => ast[13] === 1);
    }

    if (filterClass && filterClass !== 'ALL') {
      list = list.filter(ast => ast[14] === filterClass);
    }

    if (sentryOnly) {
      list = list.filter(ast => sentryData[ast[0]] !== undefined);
    }

    if (minDiameter !== null) {
      list = list.filter(ast => ast[15] !== null && ast[15] >= minDiameter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        ast =>
          (ast[0] && ast[0].toLowerCase().includes(q)) ||
          (ast[1] && ast[1].toLowerCase().includes(q)) ||
          (ast[2] && ast[2].toLowerCase().includes(q))
      );
    }

    return list;
  }, [asteroids, highlightHazardous, filterClass, sentryOnly, minDiameter, searchQuery, sentryData]);

  // Handle comets search as well
  const filteredComets = useMemo(() => {
    if (!showComets) return [];
    let list = comets;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        com =>
          (com[0] && com[0].toLowerCase().includes(q)) ||
          (com[1] && com[1].toLowerCase().includes(q))
      );
    }

    return list;
  }, [comets, showComets, searchQuery]);

  // Slice list to top 150 for high DOM performance
  const displayAsteroids = useMemo(() => {
    return filteredAsteroids.slice(0, 150);
  }, [filteredAsteroids]);

  const displayComets = useMemo(() => {
    return filteredComets.slice(0, 50);
  }, [filteredComets]);

  const totalMatches = filteredAsteroids.length + (showComets ? filteredComets.length : 0);

  return (
    <div className="w-96 h-screen flex flex-col border-r border-slate-800 bg-slate-950/80 backdrop-blur-xl text-slate-100 z-10 shadow-2xl relative select-none">
      {/* HUD Header */}
      <div className="p-6 border-b border-slate-900 bg-slate-950/40">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="text-cyan-400 w-6 h-6 animate-pulse" />
          <h1 className="text-xl font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            ORBIT-CORE
          </h1>
        </div>
        <p className="text-xs text-slate-400">Near-Earth Asteroid & Comet Tracker v1.0</p>
      </div>

      {/* Global View Toggles */}
      <div className="px-6 py-4 border-b border-slate-900 bg-slate-900/10 flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <SlidersHorizontal size={12} /> Display Config
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {/* Orbits path */}
          <button
            onClick={() => setShowOrbits(!showOrbits)}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              showOrbits
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            {showOrbits ? <Eye size={12} /> : <EyeOff size={12} />} Orbits
          </button>
          
          {/* Asteroids */}
          <button
            onClick={() => setShowAsteroids(!showAsteroids)}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              showAsteroids
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            {showAsteroids ? <Eye size={12} /> : <EyeOff size={12} />} Asteroids
          </button>

          {/* Comets */}
          <button
            onClick={() => setShowComets(!showComets)}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              showComets
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            {showComets ? <Eye size={12} /> : <EyeOff size={12} />} Comets
          </button>

          {/* Follow Focus */}
          <button
            onClick={() => setFollowSelected(!followSelected)}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              followSelected
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            Track Focus
          </button>
        </div>
      </div>

      {/* Main Search Panel */}
      <div className="p-4 border-b border-slate-900">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, SPK-ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 focus:border-cyan-500/50 focus:outline-none rounded-xl py-2 pl-9 pr-4 text-sm font-medium text-white transition placeholder-slate-500"
          />
        </div>
        
        {/* Toggle Advanced Filters Accordion */}
        <div className="flex justify-between items-center mt-3 px-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Advanced Filters</span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
          >
            {showFilters ? 'Hide' : 'Show'}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 p-3 bg-slate-900/20 border border-slate-900 rounded-xl flex flex-col gap-3">
            {/* Orbit Class Filters */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Orbital Class</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {['ALL', 'AMO', 'APO', 'ATE', 'IEO'].map(cls => (
                  <button
                    key={cls}
                    onClick={() => setFilterClass(cls)}
                    className={`text-[10px] font-mono px-2 py-1 rounded transition border ${
                      filterClass === cls
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 font-bold'
                        : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                    title={
                      cls === 'AMO' ? 'Amor: orbits close to Earth but do not cross' :
                      cls === 'APO' ? 'Apollo: orbits cross Earth, semi-major axis > 1 AU' :
                      cls === 'ATE' ? 'Aten: orbits cross Earth, semi-major axis < 1 AU' :
                      cls === 'IEO' ? 'Atira: completely inside Earth orbit' : 'All classes'
                    }
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Boolean Toggles */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => setHighlightHazardous(!highlightHazardous)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition ${
                  highlightHazardous
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <ShieldAlert size={10} /> PHA Only
              </button>

              <button
                onClick={() => setSentryOnly(!sentryOnly)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition ${
                  sentryOnly
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                ☄ Sentry Risk
              </button>
            </div>

            {/* Size filters */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Size (Estimated Diameter)</span>
              <div className="flex gap-1.5 mt-1">
                {[
                  { label: 'All', value: null },
                  { label: '>100m', value: 0.1 },
                  { label: '>1km', value: 1.0 },
                  { label: '>5km', value: 5.0 },
                ].map((sizeOpt, i) => (
                  <button
                    key={i}
                    onClick={() => setMinDiameter(sizeOpt.value)}
                    className={`flex-1 text-[10px] py-1 rounded transition border ${
                      minDiameter === sizeOpt.value
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 font-bold'
                        : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {sizeOpt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scrolling List Panel */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5">
        {/* Header with match count */}
        <div className="flex justify-between items-center text-xs text-slate-400 px-1 mb-1 font-semibold">
          <span>Search Results</span>
          <span className="font-mono text-cyan-400">{totalMatches} match{totalMatches !== 1 ? 'es' : ''}</span>
        </div>

        {/* Standard Planets List (Always shown first for easy clicking) */}
        {!searchQuery && !highlightHazardous && !sentryOnly && filterClass === 'ALL' && minDiameter === null && (
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-1 block">Planets</span>
            <div className="flex flex-col gap-1">
              {planets.map(planet => {
                const isSelected = selectedObject?.type === 'planet' && selectedObject?.data.name === planet.name;
                return (
                  <button
                    key={planet.name}
                    onClick={() => onSelectObject({ type: 'planet', data: planet })}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition ${
                      isSelected
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 font-semibold'
                        : 'bg-slate-900/30 border-transparent hover:border-slate-800 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `#${planet.name === 'Mercury' ? '9e9e9e' : planet.name === 'Venus' ? 'e5c158' : planet.name === 'Earth' ? '2b82c9' : planet.name === 'Mars' ? 'c1440e' : planet.name === 'Jupiter' ? 'b07f35' : planet.name === 'Saturn' ? 'e2bf7d' : planet.name === 'Uranus' ? '4b70dd' : '274687'}` }}></span>
                      <span className="text-sm font-medium">{planet.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{(planet.a).toFixed(2)} au</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Asteroids Scrolling Matches */}
        {displayAsteroids.length > 0 ? (
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-1 block">Near-Earth Asteroids</span>
            <div className="flex flex-col gap-1.5">
              {displayAsteroids.map((ast, index) => {
                const isSelected = selectedObject?.type === 'asteroid' && selectedObject?.data[0] === ast[0];
                const isPHA = ast[13] === 1;
                const hasSentry = sentryData[ast[0]] !== undefined;
                return (
                  <button
                    key={ast[0] || index}
                    onClick={() => onSelectObject({ type: 'asteroid', data: ast })}
                    className={`w-full flex flex-col p-2.5 rounded-xl text-left border transition ${
                      isSelected
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
                        : 'bg-slate-900/30 border-transparent hover:border-slate-800 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold truncate pr-2">
                        {ast[1] ? `${ast[1]} (${ast[0]})` : ast[2] || ast[0]}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {ast[14]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500">
                        a: {ast[4].toFixed(2)} au | e: {ast[5].toFixed(2)}
                      </span>
                      {ast[15] && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          | Ø: {ast[15].toFixed(2)} km
                        </span>
                      )}
                      {isPHA && (
                        <span className="text-[9px] font-bold tracking-wide uppercase px-1 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          Hazardous
                        </span>
                      )}
                      {hasSentry && (
                        <span className="text-[9px] font-bold tracking-wide uppercase px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Sentry
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              
              {/* Truncated hint */}
              {filteredAsteroids.length > 150 && (
                <div className="text-center py-2 text-slate-500 text-[10px] border-t border-slate-900 mt-1">
                  Showing first 150 of {filteredAsteroids.length} matches. Refine search.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Comets Scrolling Matches */}
        {showComets && displayComets.length > 0 ? (
          <div className="mt-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-1 block">Comets</span>
            <div className="flex flex-col gap-1.5">
              {displayComets.map((com, index) => {
                const isSelected = selectedObject?.type === 'comet' && selectedObject?.data[0] === com[0];
                return (
                  <button
                    key={com[0] || index}
                    onClick={() => onSelectObject({ type: 'comet', data: com })}
                    className={`w-full flex flex-col p-2.5 rounded-xl text-left border transition ${
                      isSelected
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
                        : 'bg-slate-900/30 border-transparent hover:border-slate-800 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold truncate pr-2">{com[1] || com[0]}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/30 text-cyan-400 border border-cyan-900/40">
                        {com[12]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500">
                        {com[3] ? `a: ${com[3].toFixed(2)} au |` : ''} e: {com[4].toFixed(2)}
                      </span>
                      {com[13] && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          | Ø: {com[13].toFixed(2)} km
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {filteredComets.length > 50 && (
                <div className="text-center py-2 text-slate-500 text-[10px] border-t border-slate-900 mt-1">
                  Showing first 50 of {filteredComets.length} comets.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Empty state */}
        {totalMatches === 0 && (
          <div className="text-center py-12 text-slate-500 flex flex-col items-center justify-center gap-2">
            <HelpCircle size={24} className="text-slate-600" />
            <span className="text-xs font-semibold">No matching space objects found.</span>
            <span className="text-[10px]">Try adjusting your search criteria or resetting filters.</span>
          </div>
        )}
      </div>
    </div>
  );
};
