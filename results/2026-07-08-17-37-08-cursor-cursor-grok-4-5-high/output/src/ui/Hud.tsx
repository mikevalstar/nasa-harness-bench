import { useStore } from "../state/store";
import { TimeControls } from "./TimeControls";
import { FilterPanel } from "./FilterPanel";
import { DetailPanel } from "./DetailPanel";
import { Legend } from "./Legend";

export function Hud() {
  const { data, hoverLabel } = useStore();

  return (
    <div className="hud">
      <header className="brand">
        <div className="brand-mark">NEO Atlas</div>
        <p className="brand-sub">
          Inner solar system · {data.manifest.asteroids.toLocaleString()} near-Earth objects
          {data.manifest.comets ? ` · ${data.manifest.comets.toLocaleString()} comets` : ""}
        </p>
      </header>

      <aside className="hud-left">
        <FilterPanel />
        <Legend />
      </aside>

      <aside className="hud-right">
        <DetailPanel />
      </aside>

      <footer className="hud-bottom">
        <TimeControls />
        {hoverLabel && <div className="hover-chip">{hoverLabel}</div>}
      </footer>
    </div>
  );
}
