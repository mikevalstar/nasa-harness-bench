import React from 'react';
import { Play, Pause, RotateCcw, Calendar, FastForward, Rewind } from 'lucide-react';
import { getDateFromJulian, getJulianDate, formatDate } from '../math/orbits';

interface TimeControlProps {
  jd: number;
  setJd: (jd: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speed: number; // in days per second
  setSpeed: (speed: number) => void;
}

const SPEED_PRESETS = [
  { label: '-100d/s', value: -100 },
  { label: '-10d/s', value: -10 },
  { label: '-1d/s', value: -1 },
  { label: 'Pause', value: 0 },
  { label: '1d/s', value: 1 },
  { label: '10d/s', value: 10 },
  { label: '30d/s', value: 30 },
  { label: '100d/s', value: 100 },
  { label: '365d/s', value: 365 },
];

export const TimeControl: React.FC<TimeControlProps> = ({
  jd,
  setJd,
  isPlaying,
  setIsPlaying,
  speed,
  setSpeed,
}) => {
  const currentDate = getDateFromJulian(jd);
  const dateString = formatDate(currentDate);

  const handlePlayPause = () => {
    if (speed === 0 && !isPlaying) {
      setSpeed(10); // Default to 10d/s if paused and at speed 0
    }
    setIsPlaying(!isPlaying);
  };

  const handleResetToToday = () => {
    setJd(getJulianDate(new Date()));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const selectedDate = new Date(val + 'T00:00:00');
      setJd(getJulianDate(selectedDate));
    }
  };

  const adjustSpeed = (direction: 'up' | 'down') => {
    const currentIndex = SPEED_PRESETS.findIndex(p => p.value === speed);
    if (direction === 'up' && currentIndex < SPEED_PRESETS.length - 1) {
      setSpeed(SPEED_PRESETS[currentIndex + 1].value);
      if (SPEED_PRESETS[currentIndex + 1].value !== 0) setIsPlaying(true);
    } else if (direction === 'down' && currentIndex > 0) {
      setSpeed(SPEED_PRESETS[currentIndex - 1].value);
      if (SPEED_PRESETS[currentIndex - 1].value !== 0) setIsPlaying(true);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 hud-panel rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center gap-4 z-10 w-11/12 max-w-2xl shadow-2xl transition-all duration-300">
      {/* Date & Julian Date Readout */}
      <div className="flex flex-col min-w-[140px] border-r border-slate-800 pr-4">
        <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Simulation Time</span>
        <span className="text-xl font-bold font-mono text-cyan-400">{dateString}</span>
        <span className="text-[10px] font-mono text-slate-500 mt-0.5">JD {jd.toFixed(4)}</span>
      </div>

      {/* Main Playback Controls */}
      <div className="flex items-center gap-3">
        {/* Rewind */}
        <button
          onClick={() => adjustSpeed('down')}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
          title="Slower / Reverse"
        >
          <Rewind size={18} />
        </button>

        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          className={`p-3 rounded-full ${
            isPlaying ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-cyan-400'
          } shadow-lg transition-all transform hover:scale-105 active:scale-95`}
          title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
        >
          {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
        </button>

        {/* Fast Forward */}
        <button
          onClick={() => adjustSpeed('up')}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
          title="Faster"
        >
          <FastForward size={18} />
        </button>

        {/* Reset to Today */}
        <button
          onClick={handleResetToToday}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-400 transition"
          title="Reset to Today"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Time Speed Control */}
      <div className="flex-1 flex flex-col w-full md:w-auto border-l border-r border-slate-800 px-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-semibold">
          <span>Speed: {speed === 0 ? 'Paused' : `${speed} days/sec`}</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {SPEED_PRESETS.map((preset) => {
            const isSelected = speed === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => {
                  setSpeed(preset.value);
                  setIsPlaying(preset.value !== 0);
                }}
                className={`text-[10px] font-mono px-2 py-1 rounded transition border ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Date Input */}
      <div className="flex items-center gap-2 relative">
        <label
          htmlFor="manual-date"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-400 transition cursor-pointer flex items-center gap-1.5"
          title="Jump to Date"
        >
          <Calendar size={18} />
          <span className="text-xs font-semibold md:hidden">Jump</span>
          <input
            id="manual-date"
            type="date"
            value={dateString}
            onChange={handleDateChange}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
