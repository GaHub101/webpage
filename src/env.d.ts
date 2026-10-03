/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_NOINDEX?: string;
  readonly PUBLIC_FORM_MODE?: string;
  readonly PUBLIC_TURNSTILE_SITEKEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
