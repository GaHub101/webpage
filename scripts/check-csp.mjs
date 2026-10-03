// Prüft, ob jedes Inline-Skript jeder Seite in der CSP (Meta-Tag) per Hash erlaubt ist.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'dist';
const files = [];
const walk = (d) => readdirSync(d).forEach((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.html') && files.push(join(d, f))));
walk(dir);

let errors = 0;
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const csp = html.match(/http-equiv="content-security-policy" content="([^"]+)"/)?.[1] ?? '';
  for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(attrs) || /application\/ld\+json/.test(attrs) || !body.trim()) continue;
    const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`;
    if (!csp.includes(hash)) {
      errors++;
      console.error(`✗ ${file}: Inline-Skript nicht in CSP erlaubt (${body.slice(0, 60)}…)`);
    }
  }
}
console.log(errors ? `${errors} CSP-Fehler` : `✓ CSP ok (${files.length} Seiten)`);
process.exit(errors ? 1 : 0);
