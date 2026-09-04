import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AsteroidColorMode } from '../scene/AsteroidPointCloud';

interface StatisticsHUDProps {
  totalCount: number;
  visibleCount: number;
  phaCount: number;
  sentryCount: number;
  cometCount: number;
  cometsVisible: boolean;
  colorMode: AsteroidColorMode;
}

export const StatisticsHUD: React.FC<StatisticsHUDProps> = ({
  totalCount,
  visibleCount,
  phaCount,
  sentryCount,
  cometCount,
  cometsVisible,
  colorMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          padding: '8px 12px',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minWidth: 200,
        }}
      >
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 11, color: '#f8fafc' }}>
            System Catalog
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowHelp(true);
              }}
              title="Keyboard shortcuts & guide"
              style={{ padding: 2, display: 'inline-flex' }}
            >
              <HelpCircle size={13} color="#94a3b8" />
            </span>
            {isExpanded ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronUp size={14} color="#94a3b8" />}
          </div>
        </div>

        {isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#94a3b8' }}>Visible Asteroids:</span>
              <span className="mono" style={{ fontWeight: 600, color: '#f8fafc' }}>
                {visibleCount.toLocaleString()} / {totalCount.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#94a3b8' }}>Hazardous (PHAs):</span>
              <span className="mono" style={{ fontWeight: 600, color: '#ef4444' }}>
                {phaCount.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#94a3b8' }}>Sentry Risk Monitored:</span>
              <span className="mono" style={{ fontWeight: 600, color: '#fb923c' }}>
                {sentryCount.toLocaleString()}
              </span>
            </div>

            {cometsVisible && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#94a3b8' }}>Active Comets:</span>
                <span className="mono" style={{ fontWeight: 600, color: '#38bdf8' }}>
                  {cometCount.toLocaleString()}
                </span>
              </div>
            )}

            {/* Color mode legend preview */}
            <div
              style={{
                marginTop: 4,
                paddingTop: 6,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <span style={{ fontSize: 10, color: '#64748b' }}>Active Legend:</span>
              {colorMode === 'class' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 10 }}>
                  <LegendItem color="#f59e0b" label="Apollo" />
                  <LegendItem color="#10b981" label="Aten" />
                  <LegendItem color="#3b82f6" label="Amor" />
                  <LegendItem color="#ec4899" label="Atira" />
                </div>
              )}
              {colorMode === 'hazard' && (
                <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                  <LegendItem color="#ef4444" label="Potentially Hazardous" />
                  <LegendItem color="#334155" label="Standard NEO" />
                </div>
              )}
              {colorMode === 'sentry' && (
                <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                  <LegendItem color="#ff4500" label="Sentry Impact Risk" />
                  <LegendItem color="#1e293b" label="Unmonitored" />
                </div>
              )}
              {colorMode === 'size' && (
                <div style={{ display: 'flex', gap: 6, fontSize: 10 }}>
                  <LegendItem color="#fff176" label="> 1 km" />
                  <LegendItem color="#fb8c00" label="300m - 1km" />
                  <LegendItem color="#4fc3f7" label="< 300m" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            className="glass-panel"
            style={{ width: 420, padding: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Navigation & Shortcuts</h3>
              <button
                onClick={() => setShowHelp(false)}
                style={{ background: 'transparent', border: 'none', padding: 2 }}
              >
                ✕
              </button>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div><strong>Rotate View:</strong> Left click and drag</div>
              <div><strong>Pan Camera:</strong> Right click and drag (or Shift + Left click)</div>
              <div><strong>Zoom In / Out:</strong> Scroll wheel or pinch</div>
              <div><strong>Select Body:</strong> Click any planet, asteroid, or comet</div>
              <div><strong>Spacebar:</strong> Toggle Play / Pause time</div>
              <div><strong>R:</strong> Reset camera to oblique 3D view</div>
              <div><strong>F:</strong> Toggle Focus & Follow tracking on selected body</div>
              <div><strong>Esc:</strong> Deselect current object</div>
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button onClick={() => setShowHelp(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'inline-block',
      }}
    />
    <span style={{ color: '#cbd5e1' }}>{label}</span>
  </div>
);
