import React, { useState } from 'react';
import {
  X,
  Target,
  Locate,
  AlertTriangle,
  Flame,
  Info,
  Globe,
  Compass,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { SelectedObjectInfo } from '../types/solar';
import { SolarScene } from '../scene/SolarScene';

interface ObjectInspectorProps {
  selectedObject: SelectedObjectInfo | null;
  scene: SolarScene | null;
  currentJd: number;
  onClose: () => void;
  onJumpToJd: (jd: number) => void;
  onToggleFocus: () => void;
  isFocusAndFollow: boolean;
}

const AU_TO_KM = 149597870.7;
const AU_TO_LD = 389.1704; // 1 AU = ~389.17 Lunar Distances

export const ObjectInspector: React.FC<ObjectInspectorProps> = ({
  selectedObject,
  scene,
  currentJd,
  onClose,
  onJumpToJd,
  onToggleFocus,
  isFocusAndFollow,
}) => {
  const [activeTab, setActiveTab] = useState<'orbit' | 'physical' | 'risk' | 'approaches'>('orbit');

  if (!selectedObject) return null;

  const data = selectedObject.data as any;
  const isAsteroid = selectedObject.type === 'asteroid';
  const isComet = selectedObject.type === 'comet';
  const isPlanet = selectedObject.type === 'planet';
  const isSun = selectedObject.type === 'sun';

  // Calculate live telemetry
  let sunDistAu: number | null = null;
  let earthDistAu: number | null = null;
  let speedKmS: number | null = null;

  if (scene) {
    const pos = scene.getCurrentObjectPosition(selectedObject);
    if (pos) {
      sunDistAu = Math.hypot(pos.x, pos.y, pos.z);

      const earthPos = scene.planetView.getPlanetPosition('Earth');
      if (earthPos && selectedObject.id !== 'Earth' && !isSun) {
        earthDistAu = pos.distanceTo(earthPos);
      }

      // Vis-viva speed estimation: v = 29.78 * sqrt(2/r - 1/a)
      const a = data.a;
      if (a && a > 0 && sunDistAu > 0) {
        const factor = Math.max(0, 2 / sunDistAu - 1 / a);
        speedKmS = 29.78 * Math.sqrt(factor);
      }
    }
  }

  const hasSentry = !!selectedObject.sentry;
  const closeApproaches = selectedObject.closeApproaches || [];

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: 60,
        right: 12,
        width: 360,
        maxHeight: 'calc(100vh - 170px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>
              {selectedObject.displayName}
            </span>
            {isAsteroid && data.class && (
              <span className="badge badge-class">{data.class}</span>
            )}
            {isAsteroid && data.pha && (
              <span className="badge badge-pha">PHA</span>
            )}
            {hasSentry && (
              <span className="badge badge-sentry">Sentry Risk</span>
            )}
            {isComet && (
              <span className="badge badge-class">Comet ({data.class})</span>
            )}
            {isPlanet && (
              <span className="badge badge-neutral">Major Planet</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {isAsteroid && data.spkid && `SPK-ID: ${data.spkid}`}
            {isComet && `Comet Designation: ${data.pdes}`}
            {isPlanet && `Heliocentric Radius: ${data.a} AU`}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{ padding: 4, background: 'transparent', border: 'none' }}
        >
          <X size={16} color="#94a3b8" />
        </button>
      </div>

      {/* Action Toolbar */}
      <div
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0,0,0,0.15)',
        }}
      >
        <button
          onClick={onToggleFocus}
          className={isFocusAndFollow ? 'active' : ''}
          style={{ flex: 1 }}
          title="Lock camera onto body and track as time advances"
        >
          <Target size={13} color={isFocusAndFollow ? '#38bdf8' : '#94a3b8'} />
          {isFocusAndFollow ? 'Tracking Active' : 'Focus & Follow'}
        </button>

        <button
          onClick={() => scene?.focusOnObject(selectedObject)}
          style={{ flex: 1 }}
          title="Center camera on body"
        >
          <Locate size={13} />
          Center
        </button>
      </div>

      {/* Live Distance & Speed Telemetry Cards */}
      <div
        style={{
          padding: '10px 14px',
          display: 'grid',
          gridTemplateColumns: earthDistAu !== null ? '1fr 1fr 1fr' : '1fr 1fr',
          gap: 8,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>Sun Distance</div>
          <div className="mono" style={{ fontWeight: 600, color: '#f8fafc', fontSize: 12 }}>
            {sunDistAu !== null ? `${sunDistAu.toFixed(3)} AU` : '—'}
          </div>
          <div style={{ fontSize: 9, color: '#64748b' }}>
            {sunDistAu !== null ? `${(sunDistAu * AU_TO_KM / 1e6).toFixed(1)}M km` : ''}
          </div>
        </div>

        {earthDistAu !== null && (
          <div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Earth Distance</div>
            <div
              className="mono"
              style={{
                fontWeight: 600,
                color: earthDistAu < 0.05 ? '#ef4444' : '#f8fafc',
                fontSize: 12,
              }}
            >
              {`${earthDistAu.toFixed(3)} AU`}
            </div>
            <div style={{ fontSize: 9, color: '#64748b' }}>
              {`${(earthDistAu * AU_TO_LD).toFixed(1)} LD`}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>Orbital Speed</div>
          <div className="mono" style={{ fontWeight: 600, color: '#f8fafc', fontSize: 12 }}>
            {speedKmS !== null ? `${speedKmS.toFixed(1)} km/s` : '—'}
          </div>
          <div style={{ fontSize: 9, color: '#64748b' }}>heliocentric</div>
        </div>
      </div>

      {/* Tabs Header */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0,0,0,0.1)',
        }}
      >
        <button
          onClick={() => setActiveTab('orbit')}
          style={{
            flex: 1,
            borderRadius: 0,
            border: 'none',
            borderBottom: activeTab === 'orbit' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
            background: 'transparent',
            padding: '7px 4px',
            fontSize: 11,
            fontWeight: activeTab === 'orbit' ? 600 : 400,
          }}
        >
          Orbit
        </button>

        <button
          onClick={() => setActiveTab('physical')}
          style={{
            flex: 1,
            borderRadius: 0,
            border: 'none',
            borderBottom: activeTab === 'physical' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
            background: 'transparent',
            padding: '7px 4px',
            fontSize: 11,
            fontWeight: activeTab === 'physical' ? 600 : 400,
          }}
        >
          Physical
        </button>

        {hasSentry && (
          <button
            onClick={() => setActiveTab('risk')}
            style={{
              flex: 1,
              borderRadius: 0,
              border: 'none',
              borderBottom: activeTab === 'risk' ? '2px solid var(--accent-amber)' : '2px solid transparent',
              background: 'transparent',
              padding: '7px 4px',
              fontSize: 11,
              color: '#fb923c',
              fontWeight: activeTab === 'risk' ? 600 : 400,
            }}
          >
            Sentry Risk
          </button>
        )}

        {closeApproaches.length > 0 && (
          <button
            onClick={() => setActiveTab('approaches')}
            style={{
              flex: 1,
              borderRadius: 0,
              border: 'none',
              borderBottom: activeTab === 'approaches' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              background: 'transparent',
              padding: '7px 4px',
              fontSize: 11,
              fontWeight: activeTab === 'approaches' ? 600 : 400,
            }}
          >
            Approaches ({closeApproaches.length})
          </button>
        )}
      </div>

      {/* Tab Contents (Scrollable) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {activeTab === 'orbit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <DataRow label="Semi-Major Axis (a)" value={data.a ? `${data.a.toFixed(3)} AU` : '—'} />
              <DataRow label="Eccentricity (e)" value={data.e !== undefined ? data.e.toFixed(4) : '—'} />
              <DataRow label="Inclination (i)" value={data.i !== undefined ? `${data.i.toFixed(2)}°` : '—'} />
              <DataRow label="Perihelion (q)" value={data.q ? `${data.q.toFixed(3)} AU` : '—'} />
              <DataRow label="Aphelion (ad)" value={data.ad ? `${data.ad.toFixed(3)} AU` : '—'} />
              <DataRow
                label="Orbital Period"
                value={data.per ? `${data.per.toFixed(1)} d (${(data.per / 365.25).toFixed(2)} yr)` : '—'}
              />
              <DataRow
                label="Ascending Node (Ω)"
                value={data.om !== undefined ? `${data.om.toFixed(2)}°` : '—'}
              />
              <DataRow
                label="Arg. of Perihelion (ω)"
                value={data.w !== undefined ? `${data.w.toFixed(2)}°` : '—'}
              />
              {data.moid !== undefined && data.moid !== null && (
                <DataRow
                  label="Earth MOID"
                  value={`${data.moid.toFixed(4)} AU (${(data.moid * AU_TO_LD).toFixed(1)} LD)`}
                  highlight={data.moid < 0.05}
                />
              )}
              {data.n !== undefined && data.n !== null && (
                <DataRow label="Mean Motion (n)" value={`${data.n.toFixed(4)}°/d`} />
              )}
            </div>
            {data.epoch && (
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                Element Epoch: JD {data.epoch}
              </div>
            )}
          </div>
        )}

        {activeTab === 'physical' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <DataRow
              label="Estimated Diameter"
              value={data.diameter ? `${data.diameter.toFixed(2)} km` : (data.radius_km ? `${(data.radius_km * 2).toLocaleString()} km` : 'Unknown')}
            />
            <DataRow
              label="Absolute Mag (H)"
              value={data.H !== undefined && data.H !== null ? `${data.H.toFixed(2)} mag` : (data.M1 ? `${data.M1.toFixed(1)} mag` : '—')}
            />
            <DataRow
              label="Geometric Albedo"
              value={data.albedo ? `${(data.albedo * 100).toFixed(1)}%` : '—'}
            />
            <DataRow
              label="Rotation Period"
              value={data.rot_per ? `${data.rot_per.toFixed(2)} h` : '—'}
            />
            <DataRow
              label="Spectral Type (SMASS)"
              value={data.spec_B || data.spec_T || '—'}
            />
            <DataRow
              label="First Observed"
              value={data.first_obs || '—'}
            />
          </div>
        )}

        {activeTab === 'risk' && selectedObject.sentry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                padding: '8px 10px',
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: 6,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: '#fb923c', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Flame size={14} /> Sentry Impact Risk Profile
              </div>
              <div style={{ fontSize: 11, color: '#f8fafc', marginTop: 4 }}>
                Cumulative Probability: <strong className="mono">{selectedObject.sentry.ip.toExponential(2)}</strong>
                {' '}(~1 in {Math.round(1 / selectedObject.sentry.ip).toLocaleString()})
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <DataRow label="Max Torino Scale" value={String(selectedObject.sentry.ts_max)} />
              <DataRow label="Max Palermo Scale" value={selectedObject.sentry.ps_max.toFixed(2)} />
              <DataRow label="Cum. Palermo Scale" value={selectedObject.sentry.ps_cum.toFixed(2)} />
              <DataRow label="Impact Years" value={selectedObject.sentry.range} />
              <DataRow label="Potential Impacts" value={String(selectedObject.sentry.n_imp)} />
              <DataRow label="Encounter Velocity" value={`${selectedObject.sentry.v_inf.toFixed(1)} km/s`} />
              <DataRow label="Last Observation" value={selectedObject.sentry.last_obs} />
            </div>
          </div>
        )}

        {activeTab === 'approaches' && closeApproaches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
              Click any event to jump time to that close flyby:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {closeApproaches.slice(0, 30).map((ca, idx) => {
                const distLd = ca.dist * AU_TO_LD;
                const isVeryClose = ca.dist < 0.05;
                return (
                  <div
                    key={idx}
                    onClick={() => onJumpToJd(ca.jd)}
                    style={{
                      padding: '6px 8px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56,189,248,0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 11, color: '#f8fafc' }}>
                        {ca.cd}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        v={ca.v_rel.toFixed(1)} km/s
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        className="mono"
                        style={{
                          fontWeight: 600,
                          fontSize: 11,
                          color: isVeryClose ? '#ef4444' : '#38bdf8',
                        }}
                      >
                        {ca.dist.toFixed(4)} AU
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>
                        {distLd.toFixed(1)} LD
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DataRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <div
    style={{
      padding: '5px 8px',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 4,
      border: '1px solid rgba(255,255,255,0.04)',
    }}
  >
    <div style={{ fontSize: 10, color: '#94a3b8' }}>{label}</div>
    <div
      className="mono"
      style={{
        fontWeight: 600,
        fontSize: 11,
        color: highlight ? '#ef4444' : '#f8fafc',
        marginTop: 1,
      }}
    >
      {value}
    </div>
  </div>
);
