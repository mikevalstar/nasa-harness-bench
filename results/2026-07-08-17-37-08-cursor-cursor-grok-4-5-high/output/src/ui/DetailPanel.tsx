import { useEffect, useMemo, useState } from "react";
import { CLASS_LABELS } from "../astro/constants";
import { formatJD, jdToDate } from "../astro/kepler";
import { loadApproachesByDes } from "../data/load";
import type { ApproachEvent } from "../data/types";
import { useStore } from "../state/store";

function fmt(n: number | null | undefined, digits = 4, unit = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}${unit}`;
}

function fmtSci(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  if (n >= 0.01) return n.toFixed(4);
  return n.toExponential(2);
}

export function DetailPanel() {
  const {
    data,
    selection,
    setSelection,
    follow,
    setFollow,
    jd,
    setJd,
    setPlaying,
  } = useStore();

  const [approachesByDes, setApproachesByDes] = useState<Record<
    string,
    ApproachEvent[]
  > | null>(null);

  useEffect(() => {
    if (selection?.kind !== "asteroid") return;
    let cancelled = false;
    loadApproachesByDes().then((m) => {
      if (!cancelled) setApproachesByDes(m);
    });
    return () => {
      cancelled = true;
    };
  }, [selection]);

  const content = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === "planet") {
      const p = data.planets[selection.index];
      if (!p) return null;
      return {
        title: p.name,
        subtitle: "Planet",
        rows: [
          ["Semi-major axis", fmt(p.a, 6, " au")],
          ["Eccentricity", fmt(p.e, 6)],
          ["Inclination", fmt((p.i * 180) / Math.PI, 4, "°")],
          ["Period", fmt(p.per, 2, " d")],
          ["Radius", fmt(p.radius_km, 1, " km")],
        ] as [string, string][],
        approaches: null as null | ReturnType<typeof approachBlock>,
        sentry: null as null | ReturnType<typeof sentryBlock>,
      };
    }
    if (selection.kind === "asteroid") {
      const m = data.asteroids.catalog[selection.index];
      const sentry = data.sentryByDes.get(m.pdes) ?? null;
      const approaches = approachesByDes?.[m.pdes] ?? [];
      return {
        title: m.full_name,
        subtitle: [
          CLASS_LABELS[m.class] ?? m.class,
          m.pha ? "PHA" : null,
          sentry ? "Sentry" : null,
        ]
          .filter(Boolean)
          .join(" · "),
        rows: [
          ["Designation", m.pdes],
          ["Semi-major axis", fmt(m.a, 4, " au")],
          ["Eccentricity", fmt(m.e, 4)],
          ["Inclination", fmt(m.i, 3, "°")],
          ["Perihelion q", fmt(m.q, 4, " au")],
          ["Aphelion", fmt(m.ad, 4, " au")],
          ["Period", m.per != null ? fmt(m.per, 1, " d") : "—"],
          ["MOID (Earth)", fmt(m.moid, 4, " au")],
          ["Abs. magnitude H", fmt(m.H, 2)],
          ["Diameter", m.diameter != null ? fmt(m.diameter, 3, " km") : "—"],
          ["Albedo", fmt(m.albedo, 3)],
          ["Rotation", m.rot_per != null ? fmt(m.rot_per, 2, " h") : "—"],
          ["Spectral type", m.spec_B || m.spec_T || "—"],
          ["First observed", m.first_obs ?? "—"],
        ] as [string, string][],
        approaches:
          approachesByDes == null
            ? (
                <section className="approach-block">
                  <h3>Close approaches</h3>
                  <p className="muted">Loading approach history…</p>
                </section>
              )
            : approachBlock(approaches, jd, setJd, setPlaying),
        sentry: sentry ? sentryBlock(sentry) : null,
      };
    }
    const m = data.comets.catalog[selection.index];
    const kindLabel = m.kind === 0 ? "Elliptic" : m.kind === 1 ? "Parabolic" : "Hyperbolic";
    return {
      title: m.full_name,
      subtitle: `${CLASS_LABELS[m.class] ?? m.class} · ${kindLabel}`,
      rows: [
        ["Designation", m.pdes],
        ["Eccentricity", fmt(m.e, 4)],
        ["Perihelion q", fmt(m.q, 4, " au")],
        ["|a|", m.a != null ? fmt(m.a, 4, " au") : "—"],
        ["Inclination", fmt(m.i, 3, "°")],
        ["Period", m.per != null ? fmt(m.per, 1, " d") : "—"],
        ["Perihelion (JD)", m.tp != null ? formatJD(m.tp) : "—"],
        ["Magnitude M1", fmt(m.M1, 1)],
        ["Diameter", m.diameter != null ? fmt(m.diameter, 2, " km") : "—"],
      ] as [string, string][],
      approaches: null,
      sentry: null,
    };
  }, [selection, data, jd, setJd, setPlaying, approachesByDes]);

  if (!selection || !content) {
    return (
      <div className="panel detail-panel empty">
        <h2>Investigate</h2>
        <p className="muted">
          Click a planet, asteroid, or comet to inspect its orbit, physical properties, and
          close-approach history.
        </p>
        <UpcomingList />
      </div>
    );
  }

  return (
    <div className="panel detail-panel">
      <div className="detail-head">
        <div>
          <h2>{content.title}</h2>
          <p className="muted">{content.subtitle}</p>
        </div>
        <button
          type="button"
          className="btn icon"
          aria-label="Close"
          onClick={() => setSelection(null)}
        >
          ✕
        </button>
      </div>

      <div className="detail-actions">
        <button
          type="button"
          className={`btn ${follow ? "active" : ""}`}
          onClick={() => setFollow(!follow)}
        >
          {follow ? "Following" : "Focus & follow"}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            const url = window.location.href;
            void navigator.clipboard?.writeText(url);
          }}
        >
          Copy link
        </button>
      </div>

      <dl className="kv">
        {content.rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      {content.sentry}
      {content.approaches}
    </div>
  );
}

function sentryBlock(s: {
  ip: number;
  ps_cum: number | null;
  ps_max: number | null;
  ts_max: number;
  range: string;
  n_imp: number;
  v_inf: number | null;
}) {
  return (
    <section className="risk-block">
      <h3>Impact risk (Sentry)</h3>
      <dl className="kv">
        <div>
          <dt>Impact probability</dt>
          <dd>{fmtSci(s.ip)}</dd>
        </div>
        <div>
          <dt>Palermo (cum / max)</dt>
          <dd>
            {fmt(s.ps_cum, 2)} / {fmt(s.ps_max, 2)}
          </dd>
        </div>
        <div>
          <dt>Torino scale</dt>
          <dd>
            <span className={`torino t${Math.min(10, Math.max(0, s.ts_max))}`}>{s.ts_max}</span>
          </dd>
        </div>
        <div>
          <dt>Risk window</dt>
          <dd>{s.range || "—"}</dd>
        </div>
        <div>
          <dt>Potential impacts</dt>
          <dd>{s.n_imp}</dd>
        </div>
        <div>
          <dt>v∞</dt>
          <dd>{s.v_inf != null ? fmt(s.v_inf, 2, " km/s") : "—"}</dd>
        </div>
      </dl>
    </section>
  );
}

function approachBlock(
  approaches: {
    jd: number;
    cd: string;
    dist: number;
    dist_min: number;
    v_rel: number;
  }[],
  jd: number,
  setJd: (n: number) => void,
  setPlaying: (p: boolean) => void,
) {
  if (!approaches.length) {
    return (
      <section className="approach-block">
        <h3>Close approaches</h3>
        <p className="muted">No Earth approaches within 0.05 au in the catalog.</p>
      </section>
    );
  }
  const sorted = [...approaches].sort(
    (a, b) => Math.abs(a.jd - jd) - Math.abs(b.jd - jd),
  );
  const near = sorted.slice(0, 8).sort((a, b) => a.jd - b.jd);
  const LD = 0.002569555;

  return (
    <section className="approach-block">
      <h3>Close approaches</h3>
      <ul className="approach-list">
        {near.map((a) => (
          <li key={`${a.jd}-${a.cd}`}>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setJd(a.jd);
              }}
            >
              <span className="when">{a.cd}</span>
              <span className="dist">
                {a.dist.toFixed(5)} au
                <small>({(a.dist / LD).toFixed(1)} LD)</small>
              </span>
              <span className="vel">{a.v_rel.toFixed(1)} km/s</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="muted tiny">{approaches.length} events in catalog · click to jump in time</p>
    </section>
  );
}

function UpcomingList() {
  const { data, setSelection, setJd, setPlaying, jd } = useStore();
  const upcoming = useMemo(() => {
    const now = jd;
    return data.upcoming
      .filter((u) => u.jd >= now - 1 && u.jd <= now + 365)
      .slice(0, 10);
  }, [data.upcoming, jd]);

  const pdesIndex = useMemo(() => {
    const m = new Map<string, number>();
    data.asteroids.catalog.forEach((a, i) => m.set(a.pdes, i));
    return m;
  }, [data.asteroids.catalog]);

  if (!upcoming.length) return null;

  return (
    <section className="upcoming">
      <h3>Upcoming close approaches</h3>
      <ul className="approach-list">
        {upcoming.map((u) => {
          const idx = pdesIndex.get(u.des);
          return (
            <li key={`${u.des}-${u.jd}`}>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setJd(u.jd);
                  if (idx != null) setSelection({ kind: "asteroid", index: idx });
                }}
              >
                <span className="when">{u.des}</span>
                <span className="dist">{jdToDate(u.jd).toISOString().slice(0, 10)}</span>
                <span className="vel">{u.dist.toFixed(4)} au</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
