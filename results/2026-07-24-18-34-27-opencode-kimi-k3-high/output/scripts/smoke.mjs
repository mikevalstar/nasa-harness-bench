// Headless smoke test: serve dist/, open the page, capture console errors and
// screenshots. Run with: node scripts/smoke.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.bin': 'application/octet-stream', '.png': 'image/png',
};

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    // emulate hosting dist/ at a sub-path: strip leading segments until a file matches
    let data = null;
    let cand = p;
    while (data == null) {
      try {
        data = await readFile(join(dist, cand));
        p = cand;
      } catch {
        const i = cand.indexOf('/', 1);
        if (i < 0) break;
        cand = cand.slice(i);
      }
    }
    if (data == null) throw new Error('404');
    res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('nope');
  }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
console.log('serving dist on', port);

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=metal', '--window-size=1400,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
const errors = [];
page.on('console', (m) => { console.log('[console]', m.type(), m.text().slice(0, 300)); if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => { console.log('[pageerror]', e.message); errors.push('PAGEERROR: ' + e.message); });
page.on('requestfailed', (r) => { console.log('[reqfail]', r.url(), r.failure()?.errorText); errors.push('REQFAIL: ' + r.url()); });

await page.goto(`http://127.0.0.1:${port}/sub/path/index.html`, { waitUntil: 'networkidle0', timeout: 60000 });
try {
  await page.waitForFunction(() => document.body.classList.contains('loaded'), { timeout: 20000 });
} catch {
  const msg = await page.evaluate(() => document.getElementById('load-msg')?.textContent);
  console.log('never loaded; load-msg =', msg);
  await page.screenshot({ path: join(root, 'smoke-0-stuck.png') });
  console.log(errors.join('\n'));
  await browser.close(); server.close();
  process.exit(1);
}
await new Promise((r) => setTimeout(r, 3000));
await page.screenshot({ path: join(root, 'smoke-1-default.png') });

// interact: open a detail view via search
await page.type('#search', 'Apophis');
await new Promise((r) => setTimeout(r, 700));
await page.keyboard.press('Tab'); // noop
const hit = await page.$('.search-hit');
if (hit) {
  await hit.click();
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: join(root, 'smoke-2-detail.png') });
} else {
  errors.push('no search hit for Apophis');
}

// comet layer + risk mode
await page.click('#l-comets');
await page.click('[data-mode="risk"]');
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: join(root, 'smoke-3-risk-comets.png') });

// measure FPS over 3s while playing
const fps = await page.evaluate(() => new Promise((resolve) => {
  let frames = 0;
  const t0 = performance.now();
  const tick = () => {
    frames++;
    if (performance.now() - t0 < 3000) requestAnimationFrame(tick);
    else resolve(frames / 3);
  };
  requestAnimationFrame(tick);
}));
console.log('FPS:', fps.toFixed(1));

// follow camera
await page.click('#act-follow');
await new Promise((r) => setTimeout(r, 1200));

// approaches panel
await page.click('[data-mode="class"]');
await page.click('#approaches-load');
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: join(root, 'smoke-4-follow-approaches.png') });
const approachRows = await page.$$eval('#approaches .approach-row', (els) => els.length);
console.log('approach rows:', approachRows);

// hash deep link present?
const hash = await page.evaluate(() => location.hash);
console.log('hash:', decodeURIComponent(hash).slice(0, 160));

// deep-link restore: open the hash URL fresh
await page.goto(`http://127.0.0.1:${port}/sub/path/index.html${hash}`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => document.body.classList.contains('loaded'), { timeout: 20000 });
await new Promise((r) => setTimeout(r, 2000));
await page.screenshot({ path: join(root, 'smoke-5-deeplink.png') });
const restored = await page.evaluate(() => document.querySelector('#detail h2')?.textContent ?? '(no detail)');
console.log('restored selection:', restored);

console.log(errors.length ? `ERRORS (${errors.length}):\n` + errors.slice(0, 12).join('\n---\n') : 'NO CONSOLE ERRORS');
await browser.close();
server.close();
