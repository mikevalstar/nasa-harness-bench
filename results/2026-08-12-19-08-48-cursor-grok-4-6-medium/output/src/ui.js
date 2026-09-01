import { formatDate, formatJd, toDatetimeLocal } from "./time.js";
import { asteroidElements, cometElements } from "./orbit.js";

const CLASS_LABEL = {
  AMO: "Amor",
  APO: "Apollo",
  ATE: "Aten",
  IEO: "Atira",
  ETc: "Encke-type",
  HTC: "Halley-type",
  JFC: "Jupiter-family",
  JFc: "Jupiter-family",
  COM: "Comet",
  CTc: "Centaur-type",
  HYP: "Hyperbolic",
  PAR: "Parabolic",
};

function fmt(n, d = 3, unit = "") {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return `${Number(n).toFixed(d)}${unit ? " " + unit : ""}`;
}

function fmtSci(n) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return Number(n).toExponential(3);
}

export function bindUi(app) {
  const $ = (id) => document.getElementById(id);
  const classes = ["APO", "ATE", "AMO", "IEO"];
  const classOn = Object.fromEntries(classes.map((c) => [c, true]));
  const chips = $("class-chips");
  for (const c of classes) {
    const b = document.createElement("button");
    b.textContent = `${c} ${CLASS_LABEL[c] || ""}`;
    b.className = "on";
    b.dataset.cls = c;
    b.addEventListener("click", () => {
      classOn[c] = !classOn[c];
      b.classList.toggle("on", classOn[c]);
      app.applyFilters();
    });
    chips.appendChild(b);
  }

  $("search").addEventListener("input", () => app.search($("search").value));
  $("only-pha").addEventListener("change", () => app.applyFilters());
  $("only-sentry").addEventListener("change", () => app.applyFilters());
  $("only-sized").addEventListener("change", () => app.applyFilters());
  $("moid").addEventListener("input", () => {
    $("moid-label").textContent = `${Number($("moid").value).toFixed(2)} au`;
    app.applyFilters();
  });
  $("show-asteroids").addEventListener("change", () => app.syncShow());
  $("show-comets").addEventListener("change", () => app.syncShow());
  $("show-orbits").addEventListener("change", () => app.syncShow());
  $("show-labels").addEventListener("change", () => app.syncShow());
  $("btn-play").addEventListener("click", () => app.togglePlay());
  $("btn-rew").addEventListener("click", () => app.nudgeSpeed(-1));
  $("btn-ff").addEventListener("click", () => app.nudgeSpeed(1));
  $("speed").addEventListener("change", () => app.setSpeed(Number($("speed").value)));
  $("btn-now").addEventListener("click", () => app.setNow());
  $("date-input").addEventListener("change", () => app.setDateInput($("date-input").value));
  $("scrub").addEventListener("input", () => app.scrub(Number($("scrub").value)));

  window.addEventListener("keydown", (e) => {
    if (e.target.matches("input, select, textarea")) return;
    if (e.code === "Space") {
      e.preventDefault();
      app.togglePlay();
    }
    if (e.key === "f" || e.key === "F") app.toggleFollow();
    if (e.key === "Escape") app.clearSelection();
  });

  return {
    classOn,
    onlyPha: () => $("only-pha").checked,
    onlySentry: () => $("only-sentry").checked,
    onlySized: () => $("only-sized").checked,
    maxMoid: () => Number($("moid").value),
    showAsteroids: () => $("show-asteroids").checked,
    showComets: () => $("show-comets").checked,
    showOrbits: () => $("show-orbits").checked,
    showLabels: () => $("show-labels").checked,
    speed: () => Number($("speed").value),
    setSpeedSelect(v) {
      $("speed").value = String(v);
    },
    setPlaying(on) {
      $("btn-play").textContent = on ? "Pause" : "Play";
    },
    setClock(jd) {
      $("date-input").value = toDatetimeLocal(jd);
      $("jd-readout").textContent = formatJd(jd);
      const span = 50 * 365.25;
      $("tl-start").textContent = formatDate(jd - span).slice(0, 10);
      $("tl-end").textContent = formatDate(jd + span).slice(0, 10);
    },
    setScrub(v) {
      $("scrub").value = String(v);
    },
    setStats(text) {
      $("stats").textContent = text;
    },
    setFollow(sel, on) {
      const el = $("follow-banner");
      if (on && sel) {
        el.hidden = false;
        el.textContent = `Following ${sel.label} — press F to release`;
      } else {
        el.hidden = true;
      }
    },
    setSearchResults(items, onPick) {
      const ul = $("search-results");
      ul.innerHTML = "";
      for (const it of items.slice(0, 30)) {
        const li = document.createElement("li");
        li.textContent = it.label;
        li.addEventListener("click", () => onPick(it));
        ul.appendChild(li);
      }
    },
    renderDetail(html) {
      $("detail").innerHTML = html;
    },
  };
}

export function detailHtml(sel, ctx) {
  if (!sel) {
    return `<p class="empty">Select an object to inspect its orbit, physical properties, close approaches, and impact-risk data.</p>`;
  }
  if (sel.kind === "planet") {
    const p = ctx.planets[sel.index];
    const pos = ctx.pos;
    const r = Math.hypot(pos[0], pos[1], pos[2]);
    return `
      <div class="detail-head"><div>
        <h3>${p.name}</h3>
        <p class="mono">${fmt(r, 4, "au")} from the Sun</p>
      </div></div>
      <div class="actions">
        <button data-act="follow">Follow</button>
        <button data-act="look">Frame</button>
      </div>
      <table class="kv">
        <tr><th>Semi-major axis</th><td>${fmt(p.a, 6, "au")}</td></tr>
        <tr><th>Eccentricity</th><td>${fmt(p.e, 6)}</td></tr>
        <tr><th>Inclination</th><td>${fmt(p.i, 4, "°")}</td></tr>
        <tr><th>Period</th><td>${fmt(p.per, 2, "d")}</td></tr>
        <tr><th>Mean radius</th><td>${fmt(p.radius_km, 1, "km")}</td></tr>
      </table>`;
  }
  if (sel.kind === "asteroid") {
    const m = ctx.astMeta;
    const i = sel.index;
    const el = asteroidElements(ctx.astOrbits, i);
    const sentry = ctx.sentry[m.pdes[i]];
    const cad = ctx.cad[m.pdes[i]] || [];
    const pos = ctx.pos;
    const earth = ctx.earth;
    const heli = Math.hypot(pos[0], pos[1], pos[2]);
    const distE = Math.hypot(pos[0] - earth[0], pos[1] - earth[1], pos[2] - earth[2]);
    const cls = m.classes[m.class[i]] || "—";
    const badges = [
      `<span class="badge">${cls} ${CLASS_LABEL[cls] || ""}</span>`,
      m.pha[i] ? `<span class="badge pha">PHA</span>` : "",
      sentry ? `<span class="badge sentry">Sentry</span>` : "",
    ].join("");
    const cadRows = cad
      .slice()
      .sort((a, b) => Math.abs(a[0] - ctx.jd) - Math.abs(b[0] - ctx.jd))
      .slice(0, 12)
      .map(
        (e) =>
          `<li data-jd="${e[0]}"><span>${e[3]}</span><span>${fmt(e[1], 5, "au")} · ${fmt(e[1] / ctx.LD, 2, "LD")}<br>${fmt(e[2], 2, "km/s")}</span></li>`
      )
      .join("");
    const risk = sentry
      ? `<div class="risk"><h4>CNEOS Sentry</h4>
          <table class="kv">
            <tr><th>Impact probability</th><td>${fmtSci(sentry.ip)}</td></tr>
            <tr><th>Palermo (cum / max)</th><td>${fmt(sentry.ps_cum, 2)} / ${fmt(sentry.ps_max, 2)}</td></tr>
            <tr><th>Torino (max)</th><td>${sentry.ts_max ?? "—"}</td></tr>
            <tr><th>Potential impacts</th><td>${sentry.n_imp ?? "—"} (${sentry.range || "—"})</td></tr>
            <tr><th>v∞</th><td>${fmt(sentry.v_inf, 2, "km/s")}</td></tr>
            <tr><th>Last obs.</th><td>${sentry.last_obs || "—"}</td></tr>
          </table></div>`
      : "";
    return `
      <div class="detail-head"><div>
        <h3>${m.full_name[i]}</h3>
        <p class="mono">${m.pdes[i]} · SPK ${m.spkid[i]}</p>
      </div></div>
      <div class="badges">${badges}</div>
      <div class="actions">
        <button data-act="follow">Follow</button>
        <button data-act="look">Frame</button>
        <button data-act="share">Copy link</button>
      </div>
      <table class="kv">
        <tr><th>Heliocentric dist.</th><td>${fmt(heli, 4, "au")}</td></tr>
        <tr><th>Distance from Earth</th><td>${fmt(distE, 4, "au")} · ${fmt(distE / ctx.LD, 2, "LD")}</td></tr>
        <tr><th>a / e / i</th><td>${fmt(el.a, 4)} au · ${fmt(el.e, 4)} · ${fmt(el.i, 2)}°</td></tr>
        <tr><th>Ω / ω / M</th><td>${fmt(el.om, 2)}° · ${fmt(el.w, 2)}° · ${fmt(el.ma, 2)}°</td></tr>
        <tr><th>Period</th><td>${fmt(el.per, 1, "d")}</td></tr>
        <tr><th>MOID (Earth)</th><td>${fmt(m.moid[i], 4, "au")}</td></tr>
        <tr><th>H / diameter</th><td>${fmt(m.H[i], 2)} · ${fmt(m.diameter[i], 3, "km")}</td></tr>
      </table>
      ${risk}
      <h2 style="margin-top:1rem">Close approaches</h2>
      <ul class="cad-list">${cadRows || "<li>None in catalog (dist ≤ 0.05 au, 1900–2200)</li>"}</ul>`;
  }
  if (sel.kind === "comet") {
    const m = ctx.comMeta;
    const i = sel.index;
    const el = cometElements(ctx.comOrbits, i);
    const pos = ctx.pos;
    const heli = Math.hypot(pos[0], pos[1], pos[2]);
    const kind = el.e >= 1.000001 ? "hyperbolic" : el.e >= 0.995 ? "near-parabolic" : "elliptical";
    return `
      <div class="detail-head"><div>
        <h3>${m.full_name[i]}</h3>
        <p class="mono">${m.pdes[i]} · ${m.class[i] || ""} · ${kind}</p>
      </div></div>
      <div class="actions">
        <button data-act="follow">Follow</button>
        <button data-act="look">Frame</button>
      </div>
      <table class="kv">
        <tr><th>Heliocentric dist.</th><td>${fmt(heli, 4, "au")}</td></tr>
        <tr><th>q / e / i</th><td>${fmt(el.q, 4, "au")} · ${fmt(el.e, 5)} · ${fmt(el.i, 2)}°</td></tr>
        <tr><th>a</th><td>${el.a ? fmt(el.a, 3, "au") : "—"}</td></tr>
        <tr><th>Perihelion (JD)</th><td>${fmt(el.tp, 2)}</td></tr>
        <tr><th>M1 / diameter</th><td>${fmt(m.M1[i], 1)} · ${fmt(m.diameter[i], 2, "km")}</td></tr>
      </table>`;
  }
  return "";
}
