import { formatJD, jdToDate, parseDateInput } from "../astro/kepler";
import { useStore } from "../state/store";

const SPEEDS = [
  { label: "1h/s", value: 1 / 24 },
  { label: "1d/s", value: 1 },
  { label: "7d/s", value: 7 },
  { label: "30d/s", value: 30 },
  { label: "1y/s", value: 365.25 },
];

export function TimeControls() {
  const { jd, setJd, playing, setPlaying, speed, setSpeed } = useStore();
  const date = jdToDate(jd);
  const dateValue = date.toISOString().slice(0, 10);

  return (
    <div className="panel time-panel">
      <div className="time-row">
        <button
          type="button"
          className="btn icon"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <button
          type="button"
          className="btn icon"
          aria-label="Step back one day"
          onClick={() => {
            setPlaying(false);
            setJd(jd - 1);
          }}
        >
          ‹
        </button>
        <button
          type="button"
          className="btn icon"
          aria-label="Step forward one day"
          onClick={() => {
            setPlaying(false);
            setJd(jd + 1);
          }}
        >
          ›
        </button>
        <div className="time-readout">
          <strong>{formatJD(jd)}</strong>
          <span>JD {jd.toFixed(2)}</span>
        </div>
      </div>
      <div className="time-row">
        <label className="field">
          <span>Jump</span>
          <input
            type="date"
            value={dateValue}
            onChange={(e) => {
              const v = parseDateInput(e.target.value + "T12:00:00Z");
              if (v != null) {
                setPlaying(false);
                setJd(v);
              }
            }}
          />
        </label>
        <label className="field grow">
          <span>Speed</span>
          <div className="speed-pills">
            {SPEEDS.map((s) => (
              <button
                key={s.label}
                type="button"
                className={`pill ${Math.abs(speed - s.value) < 1e-9 ? "active" : ""}`}
                onClick={() => setSpeed(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </label>
      </div>
      <input
        className="scrub"
        type="range"
        min={dateToYearJD(1900)}
        max={dateToYearJD(2200)}
        step={1}
        value={jd}
        onChange={(e) => {
          setPlaying(false);
          setJd(Number(e.target.value));
        }}
        aria-label="Scrub time"
      />
    </div>
  );
}

function dateToYearJD(year: number): number {
  return Date.UTC(year, 0, 1) / 86400000 + 2440587.5;
}
