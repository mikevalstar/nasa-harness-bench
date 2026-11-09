/** Bottom bar: the clock, playback controls and a scrubber across 1900 to 2200. */
import type { Store } from "../state.ts";
import { SPEEDS } from "../state.ts";
import { formatDateTime, isoDate, JD_MAX, JD_MIN, jdFromDate, jdFromIsoDate } from "../time.ts";
import { h } from "./dom.ts";

export interface Timebar {
  el: HTMLElement;
  /** Called every frame with the clock. */
  tick(jd: number): void;
}

export function createTimebar(store: Store): Timebar {
  const state = store.state;
  const clock = h("div", { class: "clock" });
  const dateInput = h("input", { type: "date", min: "1900-01-01", max: "2199-12-31", ariaLabel: "Jump to date" });
  const scrub = h("input", { type: "range", min: String(JD_MIN), max: String(JD_MAX), step: "1", ariaLabel: "Timeline" });
  const speed = h("div", { class: "speed" });

  const button = (label: string, title: string, onClick: () => void, className = "transport"): HTMLButtonElement => {
    const el = h("button", { type: "button", class: className, title, ariaLabel: title }, label);
    el.addEventListener("click", onClick);
    return el;
  };
  const transport = (update: () => void) => (): void => {
    update();
    store.emit("transport");
  };

  const play = button("", "Play or pause (space)", transport(() => (state.playing = !state.playing)), "transport play");
  const reverse = button("⇄", "Reverse direction", transport(() => (state.direction = state.direction === 1 ? -1 : 1)));
  const slower = button("−", "Slower", transport(() => (state.speedIndex = Math.max(state.speedIndex - 1, 0))));
  const faster = button("+", "Faster", transport(() => (state.speedIndex = Math.min(state.speedIndex + 1, SPEEDS.length - 1))));
  const now = button("Today", "Jump to today's date", () => store.jumpTo(jdFromDate(new Date())), "text");

  dateInput.addEventListener("change", () => {
    const jd = jdFromIsoDate(dateInput.value);
    if (jd !== null) store.jumpTo(Math.min(Math.max(jd, JD_MIN), JD_MAX));
  });
  let scrubbing = false;
  scrub.addEventListener("input", () => {
    scrubbing = true;
    state.jd = Number(scrub.value);
    store.emit("time");
  });
  scrub.addEventListener("change", () => (scrubbing = false));

  const sync = (): void => {
    play.textContent = state.playing ? "❚❚" : "▶";
    speed.textContent = `${state.direction === -1 ? "−" : ""}${SPEEDS[state.speedIndex].label}`;
    reverse.ariaPressed = String(state.direction === -1);
    slower.disabled = state.speedIndex === 0;
    faster.disabled = state.speedIndex === SPEEDS.length - 1;
  };
  store.on("transport", sync);
  sync();

  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    if (event.code === "Space") {
      event.preventDefault();
      play.click();
    }
  });

  const years = [1900, 1950, 2000, 2050, 2100, 2150, 2200];
  const el = h(
    "footer",
    { class: "panel timebar" },
    h(
      "div",
      { class: "time-row" },
      h("div", { class: "clock-wrap" }, clock, h("span", { class: "utc" }, "UTC")),
      h("div", { class: "transport-group" }, reverse, slower, play, faster, speed),
      h("div", { class: "jump-group" }, dateInput, now),
    ),
    h(
      "div",
      { class: "scrub-wrap" },
      scrub,
      h("div", { class: "scrub-years" }, ...years.map((y) => h("span", {}, String(y)))),
    ),
  );

  let shown = Number.NaN;
  return {
    el,
    tick(jd) {
      if (jd === shown) return;
      shown = jd;
      clock.textContent = formatDateTime(jd);
      if (!scrubbing) scrub.value = String(jd);
      if (document.activeElement !== dateInput) dateInput.value = isoDate(jd);
    },
  };
}
