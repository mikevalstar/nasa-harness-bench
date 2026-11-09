/** Top card: colour mode with its legend, layer toggles, link sharing and the panel toggle. */
import type { App } from "../app.ts";
import { MODE_LABELS, type Legend } from "../encoding.ts";
import { COLOR_MODES, LAYERS, type ColorMode, type Layer } from "../state.ts";
import { h, replace, select } from "./dom.ts";

const LAYER_LABELS: Record<Layer, string> = {
  comets: "Comets",
  orbits: "Planet orbits",
  labels: "Labels",
  grid: "Distance rings",
  flybys: "Flyby markers",
};

function legendNode(legend: Legend): HTMLElement {
  if (legend.kind === "categories") {
    return h(
      "div",
      { class: "legend" },
      ...legend.items.map((item) =>
        h(
          "div",
          { class: "legend-item" },
          h("span", { class: "dot", style: `background:${item.color}` }),
          h("span", {}, item.label),
          h("span", { class: "legend-count" }, item.count.toLocaleString("en-US")),
        ),
      ),
    );
  }
  return h(
    "div",
    { class: "legend" },
    h("div", { class: "ramp", style: `background:linear-gradient(90deg, ${legend.stops.join(", ")})` }),
    h("div", { class: "ramp-ends" }, h("span", {}, legend.low), h("span", {}, legend.high)),
    legend.rest
      ? h("div", { class: "legend-item" }, h("span", { class: "dot", style: `background:${legend.rest.color}` }), h("span", {}, legend.rest.label))
      : null,
  );
}

export function createViewbar(app: App, onToggleSidebar: () => void, getLink: () => string): HTMLElement {
  const { store } = app;
  const state = store.state;

  const mode = select<ColorMode>(
    COLOR_MODES.map((value) => ({ value, label: MODE_LABELS[value] })),
    state.colorMode,
    (value) => {
      state.colorMode = value;
      store.emit("colorMode");
    },
    "Colour asteroids by",
  );
  const legend = h("div", {});
  const renderLegend = (): void => {
    mode.selectedIndex = COLOR_MODES.indexOf(state.colorMode);
    replace(
      legend,
      legendNode(app.encoding.legend),
      h(
        "div",
        { class: "legend-item size-key" },
        h("span", { class: "dot", style: "width:3px;height:3px" }),
        h("span", { class: "dot", style: "width:5px;height:5px" }),
        h("span", { class: "dot", style: "width:8px;height:8px" }),
        h("span", {}, "Dot size is diameter: 10 m, 1 km, 10 km+"),
      ),
      state.layers.comets
        ? h("div", { class: "legend-item" }, h("span", { class: "dot", style: "background:#7ee8d6" }), h("span", {}, "Comets, with tails near the Sun"))
        : null,
    );
  };
  store.on(["colorMode", "layers"], renderLegend);
  renderLegend();

  const layers = h(
    "div",
    { class: "layers" },
    ...LAYERS.map((layer) => {
      const input = h("input", { type: "checkbox", checked: state.layers[layer] });
      input.addEventListener("change", () => {
        state.layers[layer] = input.checked;
        store.emit("layers");
      });
      return h("label", { class: "check" }, input, LAYER_LABELS[layer]);
    }),
  );

  const menu = h("button", { type: "button", class: "icon", ariaLabel: "Show or hide the object panel", title: "Show or hide the object panel" }, "☰");
  menu.addEventListener("click", onToggleSidebar);

  const share = h("button", { type: "button", class: "text" }, "Copy link");
  share.addEventListener("click", () => {
    const link = getLink();
    const done = (text: string): void => {
      share.textContent = text;
      window.setTimeout(() => (share.textContent = "Copy link"), 1600);
    };
    // Clipboard access can be blocked inside an iframe; the address bar hash is always current as a fallback.
    navigator.clipboard?.writeText(link).then(
      () => done("Link copied"),
      () => done("Copy blocked, use the URL"),
    ) ?? done("Use the page URL");
  });

  return h(
    "div",
    { class: "panel viewbar" },
    h("div", { class: "viewbar-head" }, menu, h("h1", {}, "Near-Earth objects"), share),
    h("label", { class: "field-label" }, "Colour by", mode),
    legend,
    h("details", { class: "layer-box" }, h("summary", {}, "Layers"), layers),
  );
}
