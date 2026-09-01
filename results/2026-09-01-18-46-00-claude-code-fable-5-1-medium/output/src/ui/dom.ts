/** Minimal DOM helpers so panels stay readable without a framework. */
type Attrs = Record<string, string | number | boolean | ((ev: Event) => void) | undefined>;
type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'value') (el as HTMLInputElement).value = String(v);
    else if (k === 'checked') (el as HTMLInputElement).checked = v === true;
    else el.setAttribute(k, String(v));
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

export function clear(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function fmt(v: number | null | undefined, digits = 3, unit = ''): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  const s = abs !== 0 && (abs < 1e-3 || abs >= 1e6) ? v.toExponential(2) : v.toFixed(digits);
  return unit ? `${s} ${unit}` : s;
}

export function fmtInt(v: number): string {
  return v.toLocaleString('en-US');
}

let toastEl: HTMLDivElement | null = null;
let toastTimer = 0;
export function toast(msg: string): void {
  if (!toastEl) {
    toastEl = h('div', { class: 'toast' });
    document.getElementById('app')!.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl?.classList.remove('show'), 1800);
}
