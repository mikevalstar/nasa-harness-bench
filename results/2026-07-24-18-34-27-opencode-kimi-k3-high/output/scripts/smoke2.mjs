// Extended interaction test: filters, comet overview, sentry detail, size mode.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.bin': 'application/octet-stream' };

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    let data = null, cand = p;
    while (data == null) {
      try { data = await readFile(join(dist, cand)); p = cand; }
      catch { const i = cand.indexOf('/', 1); if (i < 0) break; cand = cand.slice(i); }
    }
    if (data == null) throw new Error('404');
    res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=metal', '--window-size=1400,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`http://127.0.0.1:${port}/app/index.html`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => document.body.classList.contains('loaded'), { timeout: 20000 });

const statsText = () => page.$eval('#stats', (el) => el.textContent);
console.log('stats default:', await statsText());

// PHA only
await page.click('#f-pha');
await new Promise((r) => setTimeout(r, 400));
console.log('stats PHA only:', await statsText());
await page.click('#f-pha');

// sentry only
await page.click('#f-sentry');
await new Promise((r) => setTimeout(r, 400));
console.log('stats sentry only:', await statsText());
await page.click('#f-sentry');

// uncheck Apollo
await page.click('#class-filters input[data-i="0"]');
await new Promise((r) => setTimeout(r, 400));
console.log('stats no-Apollo:', await statsText());
await page.click('#class-filters input[data-i="0"]');

// zoom out & show comets (jump to Halley perihelion-ish era via hash)
await page.goto(`http://127.0.0.1:${port}/app/index.html#t=2446469.97&pause=1&comets=1&cam=0,18,25,0,0,0`);
await page.waitForFunction(() => document.body.classList.contains('loaded'), { timeout: 20000 });
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: join(root, 'smoke-6-comets-1986.png') });

// select Halley via search
await page.type('#search', 'Halley');
await new Promise((r) => setTimeout(r, 700));
const hit = await page.$('.search-hit');
if (hit) {
  await hit.click();
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: join(root, 'smoke-7-halley.png') });
  console.log('halley detail:', await page.$eval('#detail h2', (el) => el.textContent));
} else errors.push('no Halley search hit');

// sentry detail: Bennu
await page.goto(`http://127.0.0.1:${port}/app/index.html#t=2461200&pause=1&sel=a:101955`);
await page.waitForFunction(() => document.body.classList.contains('loaded'), { timeout: 20000 });
await new Promise((r) => setTimeout(r, 2500));
const risk = await page.evaluate(() => document.body.innerHTML.includes('Impact risk'));
console.log('bennu sentry section:', risk);
await page.screenshot({ path: join(root, 'smoke-8-bennu.png') });

// size color mode
await page.click('[data-mode="size"]');
await new Promise((r) => setTimeout(r, 500));

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO PAGE ERRORS');
await browser.close();
server.close();
