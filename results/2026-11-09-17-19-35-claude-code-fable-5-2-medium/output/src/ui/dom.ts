/** Minimal typed element builder; the UI is plain DOM. */

type Child = Node | string | number | null | undefined | false;

type Props<K extends keyof HTMLElementTagNameMap> = Partial<
  Omit<HTMLElementTagNameMap[K], "style" | "dataset" | "children">
> & { class?: string; style?: string; data?: Record<string, string>; attrs?: Record<string, string> };

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props<K> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  const { class: className, style, data, attrs, ...rest } = props;
  if (className) el.className = className;
  if (style) el.style.cssText = style;
  if (data) Object.assign(el.dataset, data);
  if (attrs) for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  Object.assign(el, rest);
  append(el, children);
  return el;
}

export function append(parent: Element, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(typeof child === "number" ? String(child) : child);
  }
}

export function replace(parent: Element, ...children: Child[]): void {
  parent.textContent = "";
  append(parent, children);
}

/** A labelled `<select>` over typed option values. */
export function select<T extends string | number | null>(
  options: Array<{ value: T; label: string }>,
  current: T,
  onChange: (value: T) => void,
  ariaLabel: string,
): HTMLSelectElement {
  const el = h(
    "select",
    { ariaLabel },
    ...options.map((o, k) => h("option", { value: String(k), selected: o.value === current }, o.label)),
  );
  el.addEventListener("change", () => onChange(options[Number(el.value)].value));
  return el;
}
