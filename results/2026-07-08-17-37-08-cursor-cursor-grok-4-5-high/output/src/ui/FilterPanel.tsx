import { useMemo, useState } from "react";
import { CLASS_LABELS } from "../astro/constants";
import { useStore } from "../state/store";

export function FilterPanel() {
  const { data, filters, setFilters, setSelection, visibleAsteroidIndices } = useStore();
  const [open, setOpen] = useState(true);

  const classCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < data.asteroids.count; i++) {
      const c = data.asteroids.classes[data.asteroids.flags[i * 3 + 1]];
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return m;
  }, [data.asteroids]);

  const neoClasses = ["APO", "ATE", "AMO", "IEO"];

  return (
    <div className={`panel filter-panel ${open ? "open" : ""}`}>
      <button type="button" className="panel-head" onClick={() => setOpen(!open)}>
        <span>Filter & search</span>
        <span className="muted">{visibleAsteroidIndices.length.toLocaleString()} shown</span>
      </button>
      {open && (
        <div className="panel-body">
          <label className="field">
            <span>Search</span>
            <input
              type="search"
              placeholder="Name or designation…"
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            />
          </label>

          {filters.query.trim() && (
            <ul className="search-hits">
              {visibleAsteroidIndices.slice(0, 12).map((i) => {
                const m = data.asteroids.catalog[i];
                return (
                  <li key={m.pdes}>
                    <button
                      type="button"
                      onClick={() => setSelection({ kind: "asteroid", index: i })}
                    >
                      {m.full_name}
                      {m.pha && <em className="tag pha">PHA</em>}
                    </button>
                  </li>
                );
              })}
              {filters.showComets &&
                data.comets.catalog
                  .map((c, i) => ({ c, i }))
                  .filter(({ c }) =>
                    `${c.full_name} ${c.pdes}`
                      .toLowerCase()
                      .includes(filters.query.trim().toLowerCase()),
                  )
                  .slice(0, 6)
                  .map(({ c, i }) => (
                    <li key={`c-${c.pdes}`}>
                      <button
                        type="button"
                        onClick={() => setSelection({ kind: "comet", index: i })}
                      >
                        {c.full_name}
                        <em className="tag comet">comet</em>
                      </button>
                    </li>
                  ))}
            </ul>
          )}

          <div className="toggles">
            <Toggle
              label="Asteroids"
              checked={filters.showAsteroids}
              onChange={(v) => setFilters((f) => ({ ...f, showAsteroids: v }))}
            />
            <Toggle
              label="Comets"
              checked={filters.showComets}
              onChange={(v) => setFilters((f) => ({ ...f, showComets: v }))}
            />
            <Toggle
              label="PHA only"
              checked={filters.phaOnly}
              onChange={(v) => setFilters((f) => ({ ...f, phaOnly: v }))}
            />
            <Toggle
              label="Sentry risk only"
              checked={filters.sentryOnly}
              onChange={(v) => setFilters((f) => ({ ...f, sentryOnly: v }))}
            />
          </div>

          <fieldset className="class-set">
            <legend>Orbit class</legend>
            {neoClasses.map((c) => (
              <label key={c} className="check">
                <input
                  type="checkbox"
                  checked={filters.classes.has(c)}
                  onChange={(e) =>
                    setFilters((f) => {
                      const next = new Set(f.classes);
                      if (e.target.checked) next.add(c);
                      else next.delete(c);
                      return { ...f, classes: next };
                    })
                  }
                />
                <span>
                  {CLASS_LABELS[c] ?? c}
                  <small>{(classCounts.get(c) ?? 0).toLocaleString()}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="field-row">
            <label className="field">
              <span>Min diameter (km)</span>
              <input
                type="number"
                min={0}
                step={0.1}
                placeholder="any"
                value={filters.minDiameter ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minDiameter: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Max MOID (au)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="any"
                value={filters.maxMoid ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxMoid: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </label>
          </div>

          <button
            type="button"
            className="btn ghost"
            onClick={() =>
              setFilters(() => ({
                query: "",
                phaOnly: false,
                sentryOnly: false,
                classes: new Set(),
                minDiameter: null,
                maxMoid: null,
                showComets: filters.showComets,
                showAsteroids: true,
                highlightUpcoming: true,
              }))
            }
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
