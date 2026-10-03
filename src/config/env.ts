/**
 * Umgebungsabhängige Einstellungen (werden beim Build gesetzt, siehe .env.example).
 */
export type FormMode = 'demo' | 'cloudflare' | 'php';

const mode = (import.meta.env.PUBLIC_FORM_MODE ?? 'demo') as string;

export const env = {
  /** Suchmaschinen aussperren (Testumgebung) */
  noindex: import.meta.env.PUBLIC_NOINDEX === 'true',
  formMode: (['demo', 'cloudflare', 'php'].includes(mode) ? mode : 'demo') as FormMode,
  turnstileSiteKey: (import.meta.env.PUBLIC_TURNSTILE_SITEKEY ?? '') as string,
};

/** Endpunkt des Kontaktformulars je nach Hosting */
export const formEndpoint: Record<FormMode, string> = {
  demo: '/kontakt/danke/',
  cloudflare: '/api/contact',
  php: '/api/contact.php',
};
