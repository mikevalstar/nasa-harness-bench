import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  Camera,
  Share2,
  AlertTriangle,
  Flame,
  Orbit,
  X,
  Compass,
} from 'lucide-react';
import { SolarSystemData } from '../data/dataLoader';
import { AsteroidColorMode, AsteroidFilterOptions } from '../scene/AsteroidPointCloud';
import { SelectedObjectInfo } from '../types/solar';

interface TopNavProps {
  data: SolarSystemData;
  colorMode: AsteroidColorMode;
  onSetColorMode: (mode: AsteroidColorMode) => void;
  filters: AsteroidFilterOptions;
  onSetFilters: (filters: Partial<AsteroidFilterOptions>) => void;
  cometsVisible: boolean;
  onToggleComets: (visible: boolean) => void;
  onSelectObject: (info: SelectedObjectInfo | null) => void;
  onSetViewPreset: (preset: 'top' | 'oblique' | 'inner' | 'outer') => void;
  onShareLink: () => void;
}

const FEATURED_OBJECTS = [
  { label: '99942 Apophis', pdes: '99942', type: 'asteroid' as const },
  { label: '101955 Bennu', pdes: '101955', type: 'asteroid' as const },
  { label: '433 Eros', pdes: '433', type: 'asteroid' as const },
  { label: '29075 (1950 DA)', pdes: '29075', type: 'asteroid' as const },
  { label: '1P/Halley', pdes: '1P', type: 'comet' as const },
  { label: '3200 Phaethon', pdes: '3200', type: 'asteroid' as const },
  { label: 'Earth', name: 'Earth', type: 'planet' as const },
  { label: 'Mars', name: 'Mars', type: 'planet' as const },
];

export const TopNav: React.FC<TopNavProps> = ({
  data,
  colorMode,
  onSetColorMode,
  filters,
  onSetFilters,
  cometsVisible,
  onToggleComets,
  onSelectObject,
  onSetViewPreset,
  onShareLink,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];

    const results: {
      type: 'asteroid' | 'comet' | 'planet';
      title: string;
      subtitle: string;
      badge?: string;
      data: any;
    }[] = [];

    // Search planets
    for (const p of data.planets) {
      if (p.name.toLowerCase().includes(q)) {
        results.push({
          type: 'planet',
          title: p.name,
          subtitle: `Planet • a=${p.a.toFixed(2)} AU`,
          data: p,
        });
      }
    }

    // Search asteroids
    let astMatches = 0;
    for (const a of data.asteroids) {
      if (
        (a.name && a.name.toLowerCase().includes(q)) ||
        a.pdes.toLowerCase().includes(q) ||
        a.full_name.toLowerCase().includes(q)
      ) {
        let badge = a.class;
        if (a.pha) badge += ' • PHA';
        results.push({
          type: 'asteroid',
          title: a.name ? `${a.name} (${a.pdes})` : a.full_name,
          subtitle: `Asteroid • a=${a.a.toFixed(2)} AU • e=${a.e.toFixed(2)}`,
          badge,
          data: a,
        });
        astMatches++;
        if (astMatches >= 12) break;
      }
    }

    // Search comets
    let cometMatches = 0;
    for (const c of data.comets) {
      if (c.full_name.toLowerCase().includes(q) || c.pdes.toLowerCase().includes(q)) {
        results.push({
          type: 'comet',
          title: c.full_name,
          subtitle: `Comet • q=${c.q.toFixed(2)} AU • e=${c.e.toFixed(2)}`,
          badge: c.class,
          data: c,
        });
        cometMatches++;
        if (cometMatches >= 6) break;
      }
    }

    return results;
  }, [searchQuery, data]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (item: (typeof searchResults)[0]) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (item.type === 'planet') {
      onSelectObject({
        type: 'planet',
        id: item.data.name,
        displayName: item.data.name,
        data: item.data,
      });
    } else if (item.type === 'asteroid') {
      const sentry = data.sentryMap.get(item.data.pdes);
      const closeApproaches = data.closeApproachesMap.get(item.data.pdes);
      onSelectObject({
        type: 'asteroid',
        id: item.data.pdes,
        displayName: item.title,
        data: item.data,
        sentry,
        closeApproaches,
      });
    } else if (item.type === 'comet') {
      const closeApproaches = data.closeApproachesMap.get(item.data.pdes);
      onSelectObject({
        type: 'comet',
        id: item.data.pdes,
        displayName: item.title,
        data: item.data,
        closeApproaches,
      });
    }
  };

  const handleSelectFeatured = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const feat = FEATURED_OBJECTS.find((f) => (f.pdes || f.name) === val);
    if (!feat) return;

    if (feat.type === 'planet') {
      const p = data.planets.find((pl) => pl.name === feat.name)!;
      onSelectObject({
        type: 'planet',
        id: p.name,
        displayName: p.name,
        data: p,
      });
    } else if (feat.type === 'asteroid') {
      const a = data.asteroids.find((ast) => ast.pdes === feat.pdes)!;
      onSelectObject({
        type: 'asteroid',
        id: a.pdes,
        displayName: a.name ? `${a.name} (${a.pdes})` : a.full_name,
        data: a,
        sentry: data.sentryMap.get(a.pdes),
        closeApproaches: data.closeApproachesMap.get(a.pdes),
      });
    } else if (feat.type === 'comet') {
      const c = data.comets.find((cm) => cm.pdes === feat.pdes)!;
      onToggleComets(true);
      onSelectObject({
        type: 'comet',
        id: c.pdes,
        displayName: c.full_name,
        data: c,
        closeApproaches: data.closeApproachesMap.get(c.pdes),
      });
    }
    e.target.value = '';
  };

  const handleShareClick = () => {
    onShareLink();
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  };

  const toggleClass = (cls: string) => {
    const next = new Set(filters.classes);
    if (next.has(cls)) {
      if (next.size > 1) next.delete(cls);
    } else {
      next.add(cls);
    }
    onSetFilters({ classes: next });
  };

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 20,
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      {/* Brand & Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Orbit size={18} color="#38bdf8" />
        <div>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.5, color: '#f8fafc' }}>
            NEO ORBITAL EXPLORER
          </span>
          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
            42,075 Asteroids
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div ref={searchRef} style={{ position: 'relative', width: 230 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 8 }} />
          <input
            type="text"
            placeholder="Search by name, designation..."
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            style={{
              width: '100%',
              paddingLeft: 28,
              paddingRight: searchQuery ? 24 : 8,
              height: 28,
            }}
          />
          {searchQuery && (
            <X
              size={14}
              color="#94a3b8"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              style={{ position: 'absolute', right: 8, cursor: 'pointer' }}
            />
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              top: 34,
              left: 0,
              width: 320,
              maxHeight: 340,
              overflowY: 'auto',
              background: '#0b1120',
              padding: '4px 0',
              boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
            }}
          >
            {searchResults.map((item, i) => (
              <div
                key={i}
                onClick={() => handleSelectSearchResult(item)}
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56,189,248,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: 12 }}>
                    {item.title}
                  </span>
                  {item.badge && <span className="badge badge-class">{item.badge}</span>}
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.subtitle}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => onSetFilters({ phaOnly: !filters.phaOnly })}
          className={filters.phaOnly ? 'danger active' : ''}
          title="Filter Potentially Hazardous Asteroids"
        >
          <AlertTriangle size={13} color={filters.phaOnly ? '#ef4444' : '#94a3b8'} />
          PHAs
        </button>

        <button
          onClick={() => onSetFilters({ sentryOnly: !filters.sentryOnly })}
          className={filters.sentryOnly ? 'active' : ''}
          title="Filter Sentry Impact Risk objects"
        >
          <Flame size={13} color={filters.sentryOnly ? '#f97316' : '#94a3b8'} />
          Sentry Risk
        </button>

        <button
          onClick={() => onToggleComets(!cometsVisible)}
          className={cometsVisible ? 'active' : ''}
          title="Toggle Comets Overlay (4,068 objects)"
        >
          Comets
        </button>

        {/* Orbit Classes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
          {['APO', 'ATE', 'AMO', 'IEO'].map((cls) => (
            <button
              key={cls}
              onClick={() => toggleClass(cls)}
              className={filters.classes.has(cls) ? 'active' : ''}
              style={{ padding: '3px 6px', fontSize: 11 }}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Encodings & Views */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Eye size={13} color="#94a3b8" />
          <select
            value={colorMode}
            onChange={(e) => onSetColorMode(e.target.value as AsteroidColorMode)}
            style={{ height: 26, fontSize: 11 }}
          >
            <option value="class">Color: Orbit Class</option>
            <option value="hazard">Color: Hazard Status</option>
            <option value="sentry">Color: Sentry Risk</option>
            <option value="size">Color: Size & Brightness</option>
            <option value="uniform">Color: Uniform</option>
          </select>
        </div>

        {/* Camera Views */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Camera size={13} color="#94a3b8" />
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                onSetViewPreset(e.target.value as any);
                e.target.value = '';
              }
            }}
            style={{ height: 26, fontSize: 11 }}
          >
            <option value="" disabled>
              Camera Views
            </option>
            <option value="top">Top-Down (Ecliptic)</option>
            <option value="oblique">Oblique 3D</option>
            <option value="inner">Zoom Inner Planets</option>
            <option value="outer">Zoom Full System</option>
          </select>
        </div>

        {/* Featured Targets Selector */}
        <select
          defaultValue=""
          onChange={handleSelectFeatured}
          style={{ height: 26, fontSize: 11 }}
        >
          <option value="" disabled>
            Featured Targets
          </option>
          {FEATURED_OBJECTS.map((f) => (
            <option key={f.pdes || f.name} value={f.pdes || f.name}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Share Link */}
        <button
          onClick={handleShareClick}
          title="Copy shareable deep link"
          style={{ height: 26 }}
        >
          <Share2 size={13} />
          {copiedFeedback ? 'Copied!' : 'Share'}
        </button>
      </div>
    </div>
  );
};
