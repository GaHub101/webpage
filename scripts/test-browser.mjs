// Browser-Tests: Barrierefreiheit (axe-core, WCAG 2.2 AA) auf allen Seiten in hell und dunkel,
// plus Funktionstests für Menü, Untermenü, Lightbox und Kontaktformular.
// Aufruf: node scripts/test-browser.mjs [dist] [basePath]
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import { loadEnv } from 'vite';

const dir = process.argv[2] ?? 'dist';
const base = (process.argv[3] ?? loadEnv('production', process.cwd(), '').BASE_PATH ?? '/').replace(/\/?$/, '/');
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

// ---------- Mini-Webserver für dist/ unter dem Basis-Pfad ----------
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.startsWith(base) ? join(dir, path.slice(base.length)) : null;
  if (file && existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!file || !existsSync(file)) {
    res.writeHead(404, { 'Content-Type': types['.html'] });
    return res.end(readFileSync(join(dir, '404.html')));
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const origin = `http://localhost:${server.address().port}`;
const at = (p) => origin + base + p.replace(/^\//, '');

const pages = [];
const walk = (d) => readdirSync(d).forEach((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f === 'index.html' && pages.push(relative(dir, d).split(sep).join('/'))));
walk(dir);

const browser = await chromium.launch();
let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`✗ ${msg}`);
};
const ok = (msg) => console.log(`✓ ${msg}`);

const newPage = async (opts = {}) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...opts });
  page.on('pageerror', (e) => fail(`JS-Fehler: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && fail(`Konsole: ${m.text()}`));
  return page;
};

// ---------- Barrierefreiheit ----------
for (const scheme of ['dark']) {
  for (const width of [390, 1280]) {
    // bypassCSP: axe wird als Inline-Skript eingefügt (die CSP der Seite würde das zu Recht blockieren)
    const page = await newPage({ colorScheme: scheme, viewport: { width, height: 900 }, bypassCSP: true });
    for (const p of pages) {
      await page.goto(at(p ? `${p}/` : ''), { waitUntil: 'networkidle' });
      await page.addScriptTag({ content: axeSource });
      const result = await page.evaluate(() =>
        // @ts-ignore
        window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }),
      );
      for (const v of result.violations) {
        fail(`axe [${scheme}, ${width}px] /${p}: ${v.id} – ${v.help} (${v.nodes.length}×) ${v.nodes[0]?.target}`);
      }
    }
    await page.close();
  }
}
ok(`axe auf ${pages.length} Seiten × mobil/desktop`);

// ---------- Mobiles Menü ----------
{
  const page = await newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(at(''));
  const toggle = page.locator('[data-menu-toggle]');
  await toggle.focus();
  await page.keyboard.press('Enter');
  if ((await toggle.getAttribute('aria-expanded')) !== 'true' || !(await page.locator('#site-nav').isVisible())) fail('Mobiles Menü öffnet nicht');
  await page.keyboard.press('Escape');
  if ((await toggle.getAttribute('aria-expanded')) !== 'false') fail('Mobiles Menü schliesst nicht mit Esc');
  if (!(await toggle.evaluate((el) => el === document.activeElement))) fail('Fokus kehrt nicht zum Menü-Knopf zurück');
  ok('Mobiles Menü');
  await page.close();
}

// ---------- Desktop-Untermenü ----------
{
  const page = await newPage();
  await page.goto(at(''));
  const sub = page.locator('.nav__subtoggle');
  await sub.focus();
  await page.keyboard.press('Enter');
  const first = page.locator('.nav__sub a').first();
  if (!(await first.isVisible())) fail('Untermenü öffnet nicht per Tastatur');
  await page.keyboard.press('Tab');
  if (!(await first.evaluate((el) => el === document.activeElement))) fail('Tab führt nicht ins Untermenü');
  await page.keyboard.press('Escape');
  if (await first.isVisible()) fail('Untermenü schliesst nicht mit Esc');
  ok('Desktop-Untermenü');
  await page.close();
}

// ---------- Lightbox ----------
{
  const page = await newPage();
  await page.goto(at('praxisrundgang/'));
  const thumb = page.locator('.gallery__item').first();
  await thumb.focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('[data-lightbox]');
  if (!(await dialog.isVisible())) fail('Lightbox öffnet nicht');
  await page.keyboard.press('ArrowRight');
  if ((await page.textContent('[data-lightbox-count]'))?.trim() !== `2 / ${await page.locator('.gallery__item').count()}`) fail('Pfeiltaste wechselt Bild nicht');
  await page.keyboard.press('Escape');
  if (await dialog.isVisible()) fail('Lightbox schliesst nicht mit Esc');
  await page
    .waitForFunction(() => document.activeElement?.getAttribute('data-index') === '1', null, { timeout: 2000 })
    .catch(() => fail('Fokus kehrt nicht zum Vorschaubild zurück'));
  ok('Lightbox');
  await page.close();
}

// ---------- Kontaktformular ----------
{
  const page = await newPage();
  await page.goto(at('kontakt/'));
  const mode = await page.getAttribute('[data-contact-form]', 'data-mode');
  await page.click('[data-submit]');
  if ((await page.locator('[aria-invalid="true"]').count()) !== 4) fail('Pflichtfelder werden nicht als ungültig markiert');
  if (!(await page.evaluate(() => document.activeElement?.id === 'cf-name'))) fail('Fokus springt nicht zum ersten Fehler');
  await page.fill('#cf-email', 'keine-mail');
  await page.locator('#cf-email').blur();
  if (!(await page.textContent('#cf-email-err'))?.includes('gültige')) fail('Ungültige E-Mail wird nicht erkannt');
  if (mode === 'demo') {
    await page.fill('#cf-name', 'Test');
    await page.fill('#cf-email', 'test@beispiel.ch');
    await page.fill('#cf-message', 'Hallo');
    await page.check('#cf-privacy');
    await page.click('[data-submit]');
    await page.waitForSelector('[data-form-status][data-state="success"]', { timeout: 3000 }).catch(() => fail('Keine Erfolgsmeldung im Demo-Modus'));
  }
  ok(`Kontaktformular (Modus ${mode})`);
  await page.close();
}

// ---------- Ohne JavaScript ----------
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(at(''));
  if (!(await page.locator('.nav__sublink').first().isVisible())) fail('Ohne JS: Navigation nicht erreichbar');
  ok('Navigation ohne JavaScript');
  await ctx.close();
}

// ---------- Layout-Stabilität (CLS) Startseite ----------
{
  const page = await newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(at(''), { waitUntil: 'networkidle' });
  const cls = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let v = 0;
        new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && (v += e.value))).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(v), 500);
      }),
  );
  if (cls > 0.02) fail(`Layout Shift Startseite zu hoch: ${cls.toFixed(3)}`);
  else ok(`CLS Startseite ${cls.toFixed(3)}`);
  await page.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} Fehler` : '\nAlle Browser-Tests bestanden');
process.exit(failures ? 1 : 0);
