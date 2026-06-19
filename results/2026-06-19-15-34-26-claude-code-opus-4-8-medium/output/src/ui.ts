// DOM construction for the control panels. Pure markup + element lookups;
// behaviour is wired up in main.ts.

export interface UIRefs {
  // topbar
  countAst: HTMLElement;
  countComet: HTMLElement;
  countPha: HTMLElement;
  countShown: HTMLElement;
  // search
  search: HTMLInputElement;
  results: HTMLElement;
  // filters
  fPha: HTMLInputElement;
  fSentry: HTMLInputElement;
  fComets: HTMLInputElement;
  fAsteroids: HTMLInputElement;
  fClass: HTMLSelectElement;
  fDia: HTMLInputElement;
  fDiaVal: HTMLElement;
  fMoid: HTMLInputElement;
  fMoidVal: HTMLElement;
  fReset: HTMLButtonElement;
  color: HTMLSelectElement;
  sizeBoost: HTMLInputElement;
  legend: HTMLElement;
  // time
  date: HTMLElement;
  rateLabel: HTMLElement;
  play: HTMLButtonElement;
  scrub: HTMLInputElement;
  dateInput: HTMLInputElement;
  nowBtn: HTMLButtonElement;
  rateBtns: HTMLElement;
  share: HTMLButtonElement;
  // detail
  detail: HTMLElement;
  // labels
  labels: HTMLElement;
}

export function buildUI(app: HTMLElement, classes: string[]): UIRefs {
  const classOptions = classes
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");

  app.insertAdjacentHTML(
    "beforeend",
    /* html */ `
    <div id="labels"></div>

    <div id="topbar" class="panel">
      <h1>Near-Earth Orbits</h1>
      <div class="sub">The inner solar system &amp; its near-Earth objects, propagated from orbital elements. Click any body to inspect it.</div>
      <div class="counts">
        <span><b id="c-ast">0</b> asteroids</span>
        <span><b id="c-comet">0</b> comets</span>
        <span><b id="c-pha">0</b> PHAs</span>
        <span><b id="c-shown">0</b> shown</span>
      </div>
    </div>

    <div id="controls" class="panel">
      <div class="group">
        <h2>Search</h2>
        <input id="search" type="text" placeholder="Name or designation…" autocomplete="off" />
        <div id="results"></div>
      </div>

      <div class="group">
        <h2>Filter</h2>
        <label class="chk"><input type="checkbox" id="f-ast" checked /> Show asteroids</label>
        <label class="chk"><input type="checkbox" id="f-comets" checked /> Show comets</label>
        <label class="chk"><input type="checkbox" id="f-pha" /> Potentially hazardous only</label>
        <label class="chk"><input type="checkbox" id="f-sentry" /> Sentry impact-risk only</label>

        <label style="margin-top:8px">Orbit class</label>
        <select id="f-class">
          <option value="">All classes</option>
          ${classOptions}
        </select>

        <label style="margin-top:10px">Min diameter: <span class="rangeval" id="f-dia-val">any</span></label>
        <input type="range" id="f-dia" min="0" max="10" step="0.1" value="0" />

        <label style="margin-top:8px">Max Earth MOID: <span class="rangeval" id="f-moid-val">any</span></label>
        <input type="range" id="f-moid" min="0.005" max="0.5" step="0.005" value="0.5" />

        <button id="f-reset" style="margin-top:10px; width:100%">Reset filters</button>
      </div>

      <div class="group">
        <h2>Display</h2>
        <label>Colour by</label>
        <select id="color">
          <option value="0">Hazard status</option>
          <option value="1">Inclination</option>
          <option value="2">Eccentricity</option>
        </select>
        <label style="margin-top:8px">Point size</label>
        <input type="range" id="sizeboost" min="0.4" max="3" step="0.1" value="1" />
        <div id="legend" class="legend" style="margin-top:10px"></div>
      </div>
    </div>

    <div id="timebar" class="panel">
      <div class="line1">
        <button id="play" title="Play / Pause">⏸</button>
        <div>
          <div class="date" id="date">—</div>
          <div class="rate" id="ratelabel"></div>
        </div>
        <div class="spacer"></div>
        <div class="ratebtns" id="ratebtns">
          <button data-rate="-365">⏪</button>
          <button data-rate="-30">◀</button>
          <button data-rate="1">▶</button>
          <button data-rate="30">▶▶</button>
          <button data-rate="365">⏩</button>
        </div>
      </div>
      <div class="scrubwrap">
        <span id="scrub-min"></span>
        <input type="range" id="scrub" min="0" max="1000" step="1" value="0" />
        <span id="scrub-max"></span>
      </div>
      <div class="line1">
        <input type="date" id="dateinput" />
        <button id="now">Today</button>
        <div class="spacer"></div>
        <button id="share" class="primary">Copy share link</button>
      </div>
    </div>

    <div id="detail" class="panel"></div>
    <div id="hint">Drag to orbit · scroll to zoom · click a body to inspect</div>
  `
  );

  const $ = <T extends HTMLElement>(id: string) =>
    document.getElementById(id) as T;

  return {
    countAst: $("c-ast"),
    countComet: $("c-comet"),
    countPha: $("c-pha"),
    countShown: $("c-shown"),
    search: $("search"),
    results: $("results"),
    fPha: $("f-pha"),
    fSentry: $("f-sentry"),
    fComets: $("f-comets"),
    fAsteroids: $("f-ast"),
    fClass: $("f-class"),
    fDia: $("f-dia"),
    fDiaVal: $("f-dia-val"),
    fMoid: $("f-moid"),
    fMoidVal: $("f-moid-val"),
    fReset: $("f-reset"),
    color: $("color"),
    sizeBoost: $("sizeboost"),
    legend: $("legend"),
    date: $("date"),
    rateLabel: $("ratelabel"),
    play: $("play"),
    scrub: $("scrub"),
    dateInput: $("dateinput"),
    nowBtn: $("now"),
    rateBtns: $("ratebtns"),
    share: $("share"),
    detail: $("detail"),
    labels: $("labels"),
  };
}

const LEGEND_HAZARD = [
  ["#94a2bd", "Near-Earth asteroid"],
  ["#ff6a35", "Potentially hazardous"],
  ["#ff4dd2", "Sentry impact risk"],
  ["#74f2ff", "Comet"],
];

export function legendHTML(colorMode: number): string {
  if (colorMode === 1)
    return gradientLegend("Inclination", "0°", "≥50°");
  if (colorMode === 2) return gradientLegend("Eccentricity", "0", "1");
  return LEGEND_HAZARD.map(
    ([c, t]) => `<div><span class="dot" style="background:${c}"></span>${t}</div>`
  ).join("");
}

function gradientLegend(label: string, lo: string, hi: string): string {
  return `<div style="color:var(--muted);margin-bottom:2px">${label}</div>
    <div style="height:10px;border-radius:5px;background:linear-gradient(90deg,#3b6bd6,#37e0d6,#ffe14d,#ff4030)"></div>
    <div style="display:flex;justify-content:space-between;color:var(--muted);font-size:10px;margin-top:2px"><span>${lo}</span><span>${hi}</span></div>
    <div style="margin-top:6px"><span class="dot" style="background:#74f2ff"></span>Comet</div>`;
}
