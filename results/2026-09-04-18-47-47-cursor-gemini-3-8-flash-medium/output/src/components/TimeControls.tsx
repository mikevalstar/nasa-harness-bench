import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Calendar,
  FastForward,
} from 'lucide-react';
import {
  formatJulianDate,
  formatShortDate,
  julianDateToDate,
  dateToJulianDate,
  parseDateInput,
} from '../math/time';

interface TimeControlsProps {
  currentJd: number;
  isPlaying: boolean;
  timeMultiplier: number;
  onTogglePlay: () => void;
  onSetJd: (jd: number) => void;
  onSetMultiplier: (speed: number) => void;
  onStep: (days: number) => void;
}

const PRESET_MILESTONES = [
  { label: 'Today', getJd: () => dateToJulianDate(new Date()) },
  { label: 'Apophis 2029', jd: 2462239.98 }, // 2029-04-13
  { label: 'Halley 1986', jd: 2446471.0 },  // 1986-02-09
  { label: 'Bennu 2182', jd: 2518255.0 },   // 2182-09-24
  { label: 'J2000 Epoch', jd: 2451545.0 },   // 2000-01-01
];

const SPEED_PRESETS = [
  { label: '1d/s', value: 1.0 },
  { label: '7d/s', value: 7.0 },
  { label: '30d/s', value: 30.0 },
  { label: '365d/s', value: 365.0 },
];

export const TimeControls: React.FC<TimeControlsProps> = ({
  currentJd,
  isPlaying,
  timeMultiplier,
  onTogglePlay,
  onSetJd,
  onSetMultiplier,
  onStep,
}) => {
  const [dateInputValue, setDateInputValue] = useState(formatShortDate(currentJd));
  const [isEditingDate, setIsEditingDate] = useState(false);

  useEffect(() => {
    if (!isEditingDate) {
      setDateInputValue(formatShortDate(currentJd));
    }
  }, [currentJd, isEditingDate]);

  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseDateInput(dateInputValue);
    if (parsed !== null) {
      onSetJd(parsed);
    }
    setIsEditingDate(false);
  };

  // Scrubber min/max in Julian Dates (~1980 to ~2060)
  const minScrubJd = 2444239.5; // 1980-01-01
  const maxScrubJd = 2473458.5; // 2060-01-01

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSetJd(val);
  };

  const isReverse = timeMultiplier < 0;

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 540,
        maxWidth: '92vw',
        zIndex: 20,
      }}
    >
      {/* Top row: Date display, quick milestones, date input */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <form onSubmit={handleDateSubmit} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="#94a3b8" />
            <input
              type="text"
              value={dateInputValue}
              onFocus={() => setIsEditingDate(true)}
              onBlur={handleDateSubmit}
              onChange={(e) => setDateInputValue(e.target.value)}
              style={{
                width: 95,
                padding: '3px 6px',
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'center',
              }}
              title="Click to enter YYYY-MM-DD"
            />
          </form>

          <span className="mono" style={{ color: '#94a3b8', fontSize: 11 }}>
            JD {currentJd.toFixed(2)}
          </span>
        </div>

        {/* Milestone presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {PRESET_MILESTONES.map((m) => (
            <button
              key={m.label}
              onClick={() => onSetJd(m.getJd ? m.getJd() : m.jd!)}
              style={{ padding: '3px 7px', fontSize: 11 }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Middle row: Timeline scrubber */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10, color: '#64748b' }}>1980</span>
        <input
          type="range"
          min={minScrubJd}
          max={maxScrubJd}
          step={0.5}
          value={Math.max(minScrubJd, Math.min(maxScrubJd, currentJd))}
          onChange={handleScrubberChange}
          style={{
            flex: 1,
            cursor: 'ew-resize',
            accentColor: 'var(--accent-cyan)',
            height: 4,
          }}
        />
        <span style={{ fontSize: 10, color: '#64748b' }}>2060</span>
      </div>

      {/* Bottom row: Playback transport buttons, speed presets */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => onSetMultiplier(-Math.abs(timeMultiplier))}
            className={isReverse ? 'active' : ''}
            title="Reverse playback"
          >
            <RotateCcw size={13} />
          </button>

          <button onClick={() => onStep(-1)} title="Step back 1 day">
            <SkipBack size={13} />
          </button>

          <button
            onClick={onTogglePlay}
            className={isPlaying ? 'active' : ''}
            style={{ width: 68, fontWeight: 600 }}
          >
            {isPlaying ? (
              <>
                <Pause size={13} /> Pause
              </>
            ) : (
              <>
                <Play size={13} /> Play
              </>
            )}
          </button>

          <button onClick={() => onStep(1)} title="Step forward 1 day">
            <SkipForward size={13} />
          </button>

          <button
            onClick={() => onSetMultiplier(Math.abs(timeMultiplier))}
            className={!isReverse ? 'active' : ''}
            title="Forward playback"
          >
            <FastForward size={13} />
          </button>
        </div>

        {/* Speed multiplier selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#64748b', marginRight: 2 }}>Rate:</span>
          {SPEED_PRESETS.map((p) => {
            const isActive = Math.abs(timeMultiplier) === p.value;
            return (
              <button
                key={p.label}
                onClick={() => onSetMultiplier((isReverse ? -1 : 1) * p.value)}
                className={isActive ? 'active' : ''}
                style={{ padding: '3px 8px', fontSize: 11 }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
