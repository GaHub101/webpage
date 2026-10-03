// Erzeugt neutrale Platzhalterbilder, solange die echten Fotos fehlen.
// Aufruf: node scripts/generate-placeholders.mjs   (überschreibt keine vorhandenen Dateien)
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const out = 'src/assets/images/';

const palettes = [
  ['#f6e7e4', '#e9c9c3', '#c8102e'],
  ['#efe9e4', '#d9cfc7', '#8c827d'],
  ['#f3ece8', '#e6d3cd', '#a00d25'],
  ['#ece7e3', '#cfc4bc', '#5f5652'],
];

function svg(w, h, label, i = 0, kind = 'room') {
  const [a, b, accent] = palettes[i % palettes.length];
  const fs = Math.round(Math.min(w, h) / 18);
  const shapes =
    kind === 'person'
      ? `<circle cx="${w / 2}" cy="${h * 0.38}" r="${w * 0.18}" fill="${accent}" opacity=".18"/>
         <path d="M${w * 0.18} ${h} C ${w * 0.2} ${h * 0.62}, ${w * 0.8} ${h * 0.62}, ${w * 0.82} ${h} Z" fill="${accent}" opacity=".14"/>`
      : kind === 'map'
        ? `<g stroke="${accent}" stroke-opacity=".25" stroke-width="${w / 60}" fill="none">
             <path d="M0 ${h * 0.3} L${w} ${h * 0.45}"/><path d="M${w * 0.3} 0 L${w * 0.45} ${h}"/>
             <path d="M0 ${h * 0.75} C ${w * 0.3} ${h * 0.6}, ${w * 0.6} ${h * 0.9}, ${w} ${h * 0.7}"/>
             <path d="M${w * 0.7} 0 L${w * 0.62} ${h}"/></g>
           <g transform="translate(${w * 0.52} ${h * 0.42})"><path d="M0 0c-30 0-48 22-48 46 0 34 48 74 48 74s48-40 48-74C48 22 30 0 0 0Z" transform="translate(0 -100)" fill="${accent}"/><circle cx="0" cy="-54" r="16" fill="#fff"/></g>`
        : `<rect x="${w * 0.08}" y="${h * 0.55}" width="${w * 0.5}" height="${h * 0.3}" rx="${w / 60}" fill="${accent}" opacity=".12"/>
           <circle cx="${w * 0.75}" cy="${h * 0.3}" r="${h * 0.18}" fill="${accent}" opacity=".12"/>
           <rect x="${w * 0.62}" y="${h * 0.6}" width="${w * 0.28}" height="${h * 0.25}" rx="${w / 60}" fill="${accent}" opacity=".08"/>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>${shapes}
    <text x="50%" y="${h - fs * 1.4}" text-anchor="middle" font-family="sans-serif" font-size="${fs}" font-weight="700" fill="#2a2321" fill-opacity=".55">${label}</text>
  </svg>`);
}

async function make(file, w, h, label, i, kind) {
  const path = out + file;
  if (existsSync(path)) return;
  mkdirSync(dirname(path), { recursive: true });
  await sharp(svg(w, h, label, i, kind)).jpeg({ quality: 82, mozjpeg: true }).toFile(path);
  console.log('erstellt', path);
}

await make('og-default.jpg', 1200, 630, 'Platzhalter · Praxisbild', 0);
await make('hero/hero.jpg', 2400, 1400, 'Platzhalter · Hero-Bild', 2);
await make('karte.jpg', 1200, 800, 'Platzhalter · Kartenausschnitt', 1, 'map');
for (let i = 1; i <= 4; i++) await make(`team/person-${i}.jpg`, 800, 1000, `Platzhalter · Teamfoto ${i}`, i, 'person');
for (let i = 1; i <= 8; i++)
  await make(`praxis/praxis-${String(i).padStart(2, '0')}.jpg`, 1800, 1200, `Platzhalter · Praxisbild ${i}`, i);
