/**
 * Baut interne Links mit dem konfigurierten Basis-Pfad (z. B. /webpage/ auf GitHub Pages).
 * Externe Links, mailto:, tel: und Anker bleiben unverändert.
 */
export function url(path = '/'): string {
  if (/^([a-z]+:|#|\/\/)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
}

/** Pfad ohne Basis-Präfix, für den Vergleich mit der aktuellen Seite */
export function stripBase(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const p = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return p.endsWith('/') ? p : `${p}/`;
}
