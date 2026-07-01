export function mountShareButton(root: HTMLElement, getLink: () => string): void {
  const el = document.createElement('button');
  el.id = 'share-link-btn';
  el.className = 'panel';
  el.textContent = 'Copy shareable link';
  el.style.cssText =
    'position:absolute;top:16px;left:50%;transform:translateX(-50%);padding:8px 14px;font-size:12px;cursor:pointer;border:1px solid rgba(140,170,220,0.25);color:#e8edf5;';
  root.appendChild(el);

  el.addEventListener('click', async () => {
    const link = getLink();
    history.replaceState(null, '', link);
    try {
      await navigator.clipboard.writeText(location.href);
      el.textContent = 'Link copied!';
    } catch {
      el.textContent = 'Link updated in address bar';
    }
    setTimeout(() => {
      el.textContent = 'Copy shareable link';
    }, 1800);
  });
}
