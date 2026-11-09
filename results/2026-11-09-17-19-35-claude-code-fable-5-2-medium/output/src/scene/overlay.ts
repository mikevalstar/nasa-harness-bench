/** Screen-space labels and markers drawn as DOM over the canvas. Rebuilt every frame from keys. */

interface Entry {
  el: HTMLElement;
  text: string;
  className: string;
  used: boolean;
}

export class Overlay {
  private readonly root: HTMLElement;
  private readonly entries = new Map<string, Entry>();

  constructor(root: HTMLElement) {
    this.root = root;
  }

  begin(): void {
    for (const entry of this.entries.values()) entry.used = false;
  }

  put(key: string, className: string, text: string, x: number, y: number): void {
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { el: document.createElement("div"), text: "", className: "", used: true };
      this.root.append(entry.el);
      this.entries.set(key, entry);
    }
    if (entry.className !== className) entry.el.className = entry.className = className;
    if (entry.text !== text) entry.el.textContent = entry.text = text;
    entry.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    entry.used = true;
  }

  end(): void {
    for (const [key, entry] of this.entries) {
      if (entry.used) continue;
      entry.el.remove();
      this.entries.delete(key);
    }
  }
}
