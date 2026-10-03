// Prüft alle internen Links und Ressourcen in dist/ (inkl. Anker). Externe Links werden übersprungen.
// Aufruf: node scripts/check-links.mjs [dist] [basePath]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from 'vite';

const dir = process.argv[2] ?? 'dist';
const base = (process.argv[3] ?? loadEnv('production', process.cwd(), '').BASE_PATH ?? '/').replace(/\/?$/, '/');
const pages = [];
const walk = (d) => readdirSync(d).forEach((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.html') && pages.push(join(d, f))));
walk(dir);

const idsCache = new Map();
const idsOf = (file) => {
  if (!idsCache.has(file)) idsCache.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return idsCache.get(file);
};

const resolve = (path) => {
  if (!path.startsWith(base)) return null;
  const rel = decodeURIComponent(path.slice(base.length));
  const candidates = [join(dir, rel), join(dir, rel, 'index.html')];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
};

let errors = 0;
let checked = 0;
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const refs = [
    ...[...html.matchAll(/\s(?:href|src|action)="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])),
  ];
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(ref)) continue;
    checked++;
    const [pathPart, hash] = ref.split('#');
    const target = pathPart === '' ? page : resolve(pathPart.split('?')[0]);
    if (!target) {
      errors++;
      console.error(`✗ ${page}: ${ref} nicht gefunden`);
    } else if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) {
      errors++;
      console.error(`✗ ${page}: Anker #${hash} fehlt in ${target}`);
    }
  }
}
console.log(errors ? `${errors} defekte Links` : `✓ Links ok (${checked} Verweise auf ${pages.length} Seiten, Basis ${base})`);
process.exit(errors ? 1 : 0);
