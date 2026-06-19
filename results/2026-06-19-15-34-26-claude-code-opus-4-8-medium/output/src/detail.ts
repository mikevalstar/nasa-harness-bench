// Renders the detail panel for a selected asteroid, comet, or planet.

import type {
  AsteroidMeta,
  CometMeta,
  PlanetRow,
  SentryRow,
  CloseApproach,
} from "./data";
import { jdToDate } from "./kepler";
import { formatDate } from "./timectl";

const fmt = (v: number | null | undefined, unit = "", dp = 3): string =>
  v == null || !isFinite(v) ? "—" : `${v.toFixed(dp)}${unit}`;

function kv(rows: [string, string][]): string {
  return `<div class="kv">${rows
    .map(([k, v]) => `<div class="k">${k}</div><div class="v">${v}</div>`)
    .join("")}</div>`;
}

function header(title: string, desig: string): string {
  return `
    <div class="head">
      <div>
        <h2>${title}</h2>
        <div class="desig">${desig}</div>
      </div>
      <button class="close" id="d-close" title="Close">×</button>
    </div>`;
}

function actions(followable: boolean, following: boolean): string {
  return `<div class="actions">
    ${
      followable
        ? `<button id="d-follow" class="${following ? "active" : ""}">${
            following ? "Following ✓" : "Follow"
          }</button>`
        : ""
    }
    <button id="d-frame">Focus</button>
  </div>`;
}

function sentryBox(s: SentryRow): string {
  const ipPct = (s.ip * 100).toExponential(2);
  return `<div class="risk">
    <div style="color:var(--sentry);font-weight:600;margin-bottom:6px">⚠ CNEOS Sentry impact risk</div>
    ${kv([
      ["Impact probability", `${ipPct}%`],
      ["Potential impacts", String(s.n_imp)],
      ["Window", s.range],
      ["Palermo scale (cum)", fmt(s.ps_cum, "", 2)],
      ["Palermo scale (max)", fmt(s.ps_max, "", 2)],
      ["Torino scale", String(s.ts_max)],
      ["Encounter velocity", fmt(s.v_inf, " km/s", 1)],
    ])}
  </div>`;
}

function caList(approaches: CloseApproach[], nowJd: number): string {
  if (!approaches.length)
    return `<div style="color:var(--muted);font-size:11.5px">No recorded close approaches.</div>`;
  // show a window around "now": up to 5 past + next 12 upcoming
  const idx = approaches.findIndex((a) => a.jd >= nowJd);
  const start = idx < 0 ? Math.max(0, approaches.length - 8) : Math.max(0, idx - 4);
  const slice = approaches.slice(start, start + 16);
  const items = slice
    .map((a) => {
      const soon = a.jd >= nowJd;
      const ld = a.dist * 389.2; // au -> lunar distances
      return `<div class="ca-item ${soon ? "soon" : ""}">
        <div class="cd">${a.cd}</div>
        <div class="dist">${a.dist.toFixed(5)} au</div>
        <div class="meta">${ld.toFixed(1)} LD · ${a.v.toFixed(1)} km/s${
        a.dmin ? ` · 3σ min ${a.dmin.toFixed(5)} au` : ""
      }</div>
      </div>`;
    })
    .join("");
  return `<div class="ca-list">${items}</div>
    <div style="color:var(--muted);font-size:10px;margin-top:6px">${approaches.length} total events · LD = lunar distance</div>`;
}

export function renderAsteroid(
  a: AsteroidMeta,
  sentry: SentryRow | undefined,
  approaches: CloseApproach[],
  nowJd: number,
  following: boolean
): string {
  const tags = [
    `<span class="tag class">${a.c}</span>`,
    a.pha ? `<span class="tag pha">PHA</span>` : "",
    sentry ? `<span class="tag sentry">SENTRY</span>` : "",
  ].join("");

  return (
    header(a.nm || a.n, a.n) +
    `<div class="body">
      <div class="tags">${tags}</div>
      ${sentry ? sentryBox(sentry) : ""}
      <h3>Physical</h3>
      ${kv([
        ["Diameter", fmt(a.dia, " km")],
        ["Absolute mag (H)", fmt(a.H, "", 2)],
        ["Albedo", fmt(a.alb, "", 3)],
        ["Rotation period", fmt(a.rot, " h", 2)],
        ["Spectral type", a.spec || "—"],
        ["First observed", a.obs || "—"],
      ])}
      <h3>Orbit</h3>
      ${kv([
        ["Semi-major axis", fmt(a.a, " au")],
        ["Eccentricity", fmt(a.e, "", 4)],
        ["Inclination", fmt(a.inc, "°", 2)],
        ["Perihelion (q)", fmt(a.q, " au")],
        ["Aphelion (Q)", fmt(a.ad, " au")],
        ["Period", a.per ? `${(a.per / 365.25).toFixed(2)} yr` : "—"],
        ["Earth MOID", fmt(a.moid, " au", 4)],
      ])}
      <h3>Close approaches to Earth</h3>
      ${caList(approaches, nowJd)}
      ${actions(true, following)}
    </div>`
  );
}

export function renderComet(
  c: CometMeta,
  approaches: CloseApproach[],
  nowJd: number,
  following: boolean
): string {
  const orbitKind =
    c.e < 1 ? "Elliptical" : c.e > 1 ? "Hyperbolic" : "Parabolic";
  return (
    header(c.n, c.d) +
    `<div class="body">
      <div class="tags">
        <span class="tag comet">COMET</span>
        <span class="tag class">${c.c}</span>
        <span class="tag class">${orbitKind}</span>
      </div>
      <h3>Orbit</h3>
      ${kv([
        ["Semi-major axis", c.a != null ? fmt(c.a, " au") : "∞"],
        ["Eccentricity", fmt(c.e, "", 4)],
        ["Inclination", fmt(c.inc, "°", 2)],
        ["Perihelion (q)", fmt(c.q, " au")],
        ["Period", c.per ? `${(c.per / 365.25).toFixed(1)} yr` : "—"],
        ["Perihelion passage", formatDate(jdToDate(c.tp))],
      ])}
      <h3>Physical</h3>
      ${kv([
        ["Total magnitude (M1)", fmt(c.M1, "", 2)],
        ["Diameter", fmt(c.dia, " km")],
      ])}
      ${
        approaches.length
          ? `<h3>Close approaches to Earth</h3>${caList(approaches, nowJd)}`
          : ""
      }
      ${actions(true, following)}
    </div>`
  );
}

export function renderPlanet(p: PlanetRow): string {
  return (
    header(p.name, "Planet") +
    `<div class="body">
      <div class="tags"><span class="tag class">PLANET</span></div>
      <h3>Orbit</h3>
      ${kv([
        ["Semi-major axis", fmt(p.a, " au")],
        ["Eccentricity", fmt(p.e, "", 4)],
        ["Inclination", fmt(p.i, "°", 2)],
        ["Period", `${(p.per / 365.25).toFixed(2)} yr`],
        ["Mean radius", `${p.radius_km.toLocaleString()} km`],
      ])}
      ${actions(true, false)}
    </div>`
  );
}
