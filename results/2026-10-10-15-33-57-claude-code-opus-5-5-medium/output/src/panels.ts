// HTML for the detail panel and the highlights lists. Interactive rows carry data attributes
// (`data-sel`, `data-jd`) that main.ts handles with delegated click listeners.
import { firstApproachAfter, ORBIT_CLASSES, orbitsOf, type BodyRef, type Catalog } from "./data.ts";
import {
  AU_PER_LD,
  escapeHtml as esc,
  fmtDiameter,
  fmtDistance,
  fmtNum,
  fmtOdds,
  fmtRelDays,
  palermoMeaning,
  sizeComparison,
} from "./format.ts";
import { formatJd, OrbitKind, type OrbitSet } from "./orbit.ts";

const EARTH = 2;

export const selToken = (ref: BodyRef) => `${ref.kind}:${ref.idx}`;
export function parseSelToken(token: string): BodyRef | null {
  const [kind, idx] = token.split(":");
  if (kind !== "planet" && kind !== "asteroid" && kind !== "comet") return null;
  return { kind, idx: Number(idx) };
}

const kv = (rows: [string, string][]) =>
  `<dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;

const deg = (x: number | null | undefined) => fmtNum(x, 2, "°");

// ------------------------------------------------------------------ detail

export function detailHtml(cat: Catalog, ref: BodyRef, jd: number, following: boolean): string {
  const head = (title: string, badges: string) => `
    <div class="detail-head">
      <h2>${esc(title)}</h2>
      <button class="btn icon" data-action="close" title="Close (Esc)">×</button>
    </div>
    <div class="badges">${badges}</div>
    <div class="detail-actions">
      <button class="btn ${following ? "on" : ""}" data-action="follow" title="Keep the camera locked on this body (F)">${following ? "Following" : "Follow"}</button>
      <button class="btn" data-action="center">Center view</button>
      ${ref.kind !== "planet" || ref.idx !== EARTH ? `<button class="btn" data-action="earth" title="Follow Earth, zoomed out far enough to include this body">Frame with Earth</button>` : ""}
    </div>
    <div id="live"></div>`;

  if (ref.kind === "planet") {
    const p = cat.planets[ref.idx]!;
    return (
      head(p.name, `<span class="badge">Planet</span>`) +
      `<h4>Orbit</h4>` +
      kv([
        ["Semi-major axis", fmtNum(p.a, 4, " au")],
        ["Eccentricity", fmtNum(p.e, 4)],
        ["Inclination", deg(p.i)],
        ["Period", `${fmtNum(p.per / 365.25, 2)} yr`],
      ]) +
      `<h4>Physical</h4>` +
      kv([["Mean radius", fmtNum(p.radius_km, 0, " km")]]) +
      `<p class="note">Mean J2000 elements; good to a fraction of a degree for centuries around 2000.</p>`
    );
  }

  if (ref.kind === "comet") {
    const C = cat.comets;
    const j = ref.idx;
    const e = C.e[j]!;
    const kind = cat.cometOrbits.kind[j];
    const type = kind === OrbitKind.Elliptic ? "Closed (elliptical)" : kind === OrbitKind.Parabolic ? "Parabolic (open)" : "Hyperbolic (open)";
    return (
      head(C.name[j]!, `<span class="badge">${esc(ORBIT_CLASSES[C.cls[j]!] ?? C.cls[j]!)}</span>`) +
      `<h4>Orbit</h4>` +
      kv([
        ["Orbit type", type],
        ["Perihelion q", fmtNum(C.q[j], 4, " au")],
        ["Eccentricity", fmtNum(e, 5)],
        ["Semi-major axis", C.a[j] != null ? fmtNum(C.a[j], 3, " au") : "—"],
        ["Inclination", deg(C.i[j])],
        ["Period", kind === OrbitKind.Elliptic && C.n[j] ? `${fmtNum(360 / C.n[j]! / 365.25, 1)} yr` : "—"],
        ["Perihelion date", formatJd(C.tp[j]!, false)],
      ]) +
      `<h4>Physical</h4>` +
      kv([
        ["Total magnitude M1", fmtNum(C.M1[j], 1)],
        ["Nucleus diameter", C.diameter[j] != null ? fmtDiameter(C.diameter[j]!) : "—"],
      ]) +
      (kind === OrbitKind.Elliptic
        ? ""
        : `<p class="note">Open orbit: positioned from its perihelion time with the ${kind === OrbitKind.Parabolic ? "parabolic (Barker)" : "hyperbolic Kepler"} equation. It passes the Sun once.</p>`)
    );
  }

  const A = cat.asteroids;
  const j = ref.idx;
  const sentry = cat.sentryByIdx.get(j);
  const dKm = cat.diameterKm[j]!;
  const measured = cat.diameterMeasured[j] === 1;
  const badges = [
    `<span class="badge">${esc(ORBIT_CLASSES[A.cls[j]!] ?? A.cls[j]!)}</span>`,
    A.pha[j] ? `<span class="badge pha" title="MOID ≤ 0.05 au and H ≤ 22">Potentially hazardous</span>` : "",
    sentry ? `<span class="badge risk">Sentry · Torino ${sentry.ts_max ?? "—"}</span>` : "",
  ].join("");

  const a = A.a[j]!;
  const e = A.e[j]!;
  const physical = kv([
    ["Diameter", `${measured ? "" : "~"}${fmtDiameter(dKm)}${measured ? "" : " (from H)"}`],
    ["Abs. magnitude H", fmtNum(A.H[j], 2)],
    ["Albedo", fmtNum(A.albedo[j], 3)],
    ["Rotation period", fmtNum(A.rot_per[j], 2, " h")],
    ["Spectral type", esc([A.spec_B[j], A.spec_T[j]].filter(Boolean).join(" / ") || "—")],
    ["First observed", esc(A.first_obs[j] ?? "—")],
  ]);

  return (
    head(A.name[j]!, badges) +
    (sentry ? riskHtml(sentry) : "") +
    `<h4>Orbit</h4>` +
    kv([
      ["Semi-major axis a", fmtNum(a, 4, " au")],
      ["Eccentricity e", fmtNum(e, 4)],
      ["Inclination i", deg(A.i[j])],
      ["Asc. node Ω", deg(A.om[j])],
      ["Arg. perihelion ω", deg(A.w[j])],
      ["Perihelion / aphelion", `${fmtNum(a * (1 - e), 3)} / ${fmtNum(a * (1 + e), 3)} au`],
      ["Period", `${fmtNum(360 / A.n[j]! / 365.25, 2)} yr`],
      ["Earth MOID", A.moid[j] != null ? fmtDistance(A.moid[j]!) : "—"],
      ["Elements epoch", formatJd(A.epoch[j]!, false)],
    ]) +
    `<h4>Physical</h4>` +
    physical +
    (Number.isFinite(dKm) ? `<p class="note">Size: ${sizeComparison(dKm)}.</p>` : "") +
    approachesHtml(cat, j, jd)
  );
}

function riskHtml(s: NonNullable<ReturnType<Catalog["sentryByIdx"]["get"]>>): string {
  return `
    <h4>Impact risk (CNEOS Sentry)</h4>
    <div class="risk-box">
      <div class="risk-big">${fmtOdds(s.ip)}</div>
      <div class="muted">cumulative impact probability, ${esc(s.range)}</div>
      ${kv([
        ["Palermo (cum / max)", `${s.ps_cum.toFixed(2)} / ${s.ps_max.toFixed(2)}`],
        ["Torino (max)", String(s.ts_max ?? "—")],
        ["Potential impacts", s.n_imp.toLocaleString()],
        ["Entry velocity", fmtNum(s.v_inf, 1, " km/s")],
        ["Last observed", esc(s.last_obs)],
      ])}
      <p class="note">Palermo ${s.ps_cum.toFixed(1)}: ${palermoMeaning(s.ps_cum)}.</p>
    </div>`;
}

function approachesHtml(cat: Catalog, j: number, jd: number): string {
  const rows = cat.approachesByIdx.get(j) ?? [];
  if (rows.length === 0) return `<h4>Earth close approaches</h4><p class="note">None within 0.05 au between 1900 and 2200.</p>`;
  const ap = cat.approaches;
  const next = rows.find((r) => ap.jd[r]! >= jd);
  const closest = rows.reduce((b, r) => (ap.dist[r]! < ap.dist[b]! ? r : b));
  const body = rows
    .map((r) => {
      const cls = [r === next ? "next" : "", r === closest ? "closest" : ""].join(" ");
      return `<tr class="row ${cls}" data-jd="${ap.jd[r]}" title="Jump to this approach">
        <td>${formatJd(ap.jd[r]!, false)}</td>
        <td>${(ap.dist[r]! / AU_PER_LD).toFixed(2)}</td>
        <td>${((ap.dmax[r]! - ap.dmin[r]!) / 2 / AU_PER_LD).toFixed(2)}</td>
        <td>${ap.vrel[r]!.toFixed(1)}</td>
      </tr>`;
    })
    .join("");
  return `
    <h4>Earth close approaches (${rows.length})</h4>
    <p class="note" style="margin-bottom:6px">Closest: ${fmtDistance(ap.dist[closest]!)} on ${formatJd(ap.jd[closest]!, false)}${
      next !== undefined ? ` · next ${fmtRelDays(ap.jd[next]! - jd)}` : ""
    }. Click a row to jump there.</p>
    <div class="ca-wrap"><table class="ca">
      <thead><tr><th>Date</th><th>LD</th><th>±3σ</th><th>km/s</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>`;
}

/** The frequently refreshed "right now" block of the detail panel. */
export function liveHtml(cat: Catalog, ref: BodyRef, jd: number): string {
  const orbits: OrbitSet = orbitsOf(cat, ref.kind);
  const [x, y, z] = orbits.position(ref.idx, jd);
  const [ex, ey, ez] = cat.planetOrbits.position(EARTH, jd);
  const r = Math.hypot(x, y, z);
  const isEarth = ref.kind === "planet" && ref.idx === EARTH;
  return `<h4>On ${formatJd(jd, false)}</h4>${kv([
    ["From the Sun", fmtDistance(r)],
    ...(isEarth ? [] : [["From Earth", fmtDistance(Math.hypot(x - ex, y - ey, z - ez))] as [string, string]]),
    ["Orbital speed", `${orbits.speedKms(ref.idx, jd).toFixed(2)} km/s`],
  ])}`;
}

// ------------------------------------------------------------------ highlights

type Item = { ref: BodyRef; name: string; value: string; meta?: string; jd?: number };

const list = (title: string, items: Item[], hint = "") => `
  <div class="hl"><h3>${title}</h3>${hint ? `<p class="note">${hint}</p>` : ""}<ol>${items
    .map(
      (it) => `<li data-sel="${selToken(it.ref)}" ${it.jd !== undefined ? `data-jd="${it.jd}"` : ""}>
        <span class="name">${esc(it.name)}</span><span class="num">${it.value}</span>
        ${it.meta ? `<span class="meta">${it.meta}</span>` : ""}
      </li>`,
    )
    .join("")}</ol></div>`;

export function upcomingHtml(cat: Catalog, jd: number, count = 10): string {
  const ap = cat.approaches;
  const items: Item[] = [];
  for (let r = firstApproachAfter(cat, jd); r < ap.count && items.length < count; r++) {
    const idx = ap.idx[r]!;
    items.push({
      ref: { kind: "asteroid", idx },
      name: cat.asteroids.name[idx]!,
      value: `${(ap.dist[r]! / AU_PER_LD).toFixed(2)} LD`,
      meta: `${formatJd(ap.jd[r]!, false)} · ${fmtRelDays(ap.jd[r]! - jd)} · ${ap.vrel[r]!.toFixed(1)} km/s · ~${fmtDiameter(cat.diameterKm[idx]!)}`,
      jd: ap.jd[r]!,
    });
  }
  return list("Next Earth close approaches", items, "From the current date. Click to jump there and follow.");
}

/** Lists that don't depend on the current time; computed once. */
export function staticHighlightsHtml(cat: Catalog): string {
  const A = cat.asteroids;
  const ast = (idx: number): BodyRef => ({ kind: "asteroid", idx });

  const risk = [...cat.sentry].sort((a, b) => b.ps_cum - a.ps_cum).slice(0, 10);
  const riskItems: Item[] = risk.map((s) => ({
    ref: ast(s.idx),
    name: A.name[s.idx]!,
    value: `PS ${s.ps_cum.toFixed(2)}`,
    meta: `${fmtOdds(s.ip)} · ${esc(s.range)} · ~${fmtDiameter(cat.diameterKm[s.idx]!)}`,
  }));

  const ap = cat.approaches;
  const byDist = Array.from({ length: ap.count }, (_, r) => r)
    .filter((r) => cat.diameterKm[ap.idx[r]!]! >= 0.01)
    .sort((a, b) => ap.dist[a]! - ap.dist[b]!)
    .slice(0, 10);
  const closeItems: Item[] = byDist.map((r) => ({
    ref: ast(ap.idx[r]!),
    name: A.name[ap.idx[r]!]!,
    value: fmtDistance(ap.dist[r]!).split(" (")[0]!,
    meta: `${formatJd(ap.jd[r]!, false)} · ~${fmtDiameter(cat.diameterKm[ap.idx[r]!]!)}`,
    jd: ap.jd[r]!,
  }));

  const largePha = Array.from({ length: A.count }, (_, j) => j)
    .filter((j) => A.pha[j])
    .sort((a, b) => (cat.diameterKm[b]! || 0) - (cat.diameterKm[a]! || 0))
    .slice(0, 8);
  const largeItems: Item[] = largePha.map((j) => ({
    ref: ast(j),
    name: A.name[j]!,
    value: fmtDiameter(cat.diameterKm[j]!),
    meta: `MOID ${fmtDistance(A.moid[j] ?? NaN)}`,
  }));

  return (
    list("Highest impact risk (Sentry)", riskItems, "Ranked by cumulative Palermo scale.") +
    list("Closest recorded approaches (≥ 10 m)", closeItems, "1900–2200, from JPL close-approach data.") +
    list("Largest potentially hazardous asteroids", largeItems)
  );
}
