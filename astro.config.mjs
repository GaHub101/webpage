// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { JS_FLAG } from './src/lib/inline-scripts.mjs';

const sha256 = (s) => `sha256-${createHash('sha256').update(s).digest('base64')}`;

// Werte kommen aus Umgebungsvariablen (siehe .env.example und README).
// Lokal ohne Variablen: Root-Pfad "/" und localhost.
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const site = env.SITE_URL || 'http://localhost:4321';
const base = env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  markdown: { syntaxHighlight: false },
  // Keine data:-URIs für Schriften/Bilder (CSP font-src 'self')
  vite: { build: { assetsInlineLimit: 0 } },
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'never',
  },
  integrations: [
    sitemap({
      filter: (page) => !/\/kontakt\/(danke|fehler)\/$/.test(page),
    }),
  ],
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-src https://challenges.cloudflare.com",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
      ],
      scriptDirective: {
        resources: ["'self'", 'https://challenges.cloudflare.com'],
        hashes: [sha256(JS_FLAG)],
      },
    },
  },
});
