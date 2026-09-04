import React from 'react';
import { Orbit } from 'lucide-react';

interface LoadingOverlayProps {
  stage: string;
  fraction: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ stage, fraction }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#050811',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Orbit size={32} color="#38bdf8" />
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5, color: '#f8fafc' }}>
          NEO ORBITAL EXPLORER
        </h1>
      </div>

      <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            height: 6,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.round(fraction * 100)}%`,
              background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
              transition: 'width 0.2s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
          <span>{stage}</span>
          <span className="mono">{Math.round(fraction * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
