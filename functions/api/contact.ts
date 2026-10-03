/**
 * Kontaktformular – Cloudflare Pages Function (POST /api/contact)
 *
 * Ablauf: Rate-Limit → Honeypot → Validierung → Turnstile → Versand per Resend.
 * Formulardaten werden weder gespeichert noch geloggt.
 *
 * Umgebungsvariablen (Cloudflare Pages → Settings → Variables and Secrets):
 *   TURNSTILE_SECRET   Geheimer Turnstile-Schlüssel (Secret)
 *   RESEND_API_KEY     API-Schlüssel des Mail-Dienstes Resend (Secret)
 *   MAIL_TO            Empfänger, z. B. praxis@ihre-domain.ch
 *   MAIL_FROM          Absender auf verifizierter Domain, z. B. «Website <formular@ihre-domain.ch>»
 * Optionale Bindings:
 *   RATE_LIMITER       Rate-Limiting-Binding (falls verfügbar)
 *   RATE_KV            KV-Namespace als Fallback für das Rate-Limit
 */

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

interface RateLimiter {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

interface Env {
  TURNSTILE_SECRET: string;
  RESEND_API_KEY: string;
  MAIL_TO: string;
  MAIL_FROM: string;
  RATE_LIMITER?: RateLimiter;
  RATE_KV?: KVNamespace;
}

interface Context {
  request: Request;
  env: Env;
}

const SUCCESS_PATH = '/kontakt/danke/';
const ERROR_PATH = '/kontakt/fehler/';
const RATE_MAX = 5; // Anfragen …
const RATE_WINDOW = 600; // … pro 10 Minuten und IP

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'message' | 'privacy', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+()/ .\-]{6,40}$/;

/** Steuerzeichen entfernen (verhindert Header-Injection in Betreff/Reply-To) */
const oneLine = (s: string) => s.replace(/[\r\n\t\u0000-\u001f\u007f]+/g, ' ').trim();

export function validate(form: FormData) {
  const get = (k: string) => String(form.get(k) ?? '');
  const data = {
    name: oneLine(get('name')),
    email: oneLine(get('email')),
    phone: oneLine(get('phone')),
    message: get('message').replace(/\r\n/g, '\n').trim(),
    privacy: get('privacy') === 'on',
  };
  const errors: Errors = {};
  if (!data.name) errors.name = 'Bitte geben Sie Ihren Namen ein.';
  else if (data.name.length > 100) errors.name = 'Der Name ist zu lang.';
  if (!data.email) errors.email = 'Bitte geben Sie Ihre E-Mail-Adresse ein.';
  else if (data.email.length > 254 || !EMAIL_RE.test(data.email)) errors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
  if (data.phone && !PHONE_RE.test(data.phone)) errors.phone = 'Bitte geben Sie eine gültige Telefonnummer ein.';
  if (!data.message) errors.message = 'Bitte schreiben Sie uns eine Nachricht.';
  else if (data.message.length > 2000) errors.message = 'Die Nachricht ist zu lang (maximal 2000 Zeichen).';
  if (!data.privacy) errors.privacy = 'Bitte bestätigen Sie, dass Sie die Datenschutzerklärung gelesen haben.';
  return { data, errors };
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** true = Anfrage erlaubt. Die IP wird nur gehasht verwendet. */
async function rateLimit(env: Env, ip: string) {
  const key = `contact:${await sha256(ip)}`;
  if (env.RATE_LIMITER) return (await env.RATE_LIMITER.limit({ key })).success;
  if (env.RATE_KV) {
    const count = Number((await env.RATE_KV.get(key)) ?? 0);
    if (count >= RATE_MAX) return false;
    await env.RATE_KV.put(key, String(count + 1), { expirationTtl: RATE_WINDOW });
  }
  return true;
}

async function verifyTurnstile(secret: string, token: string, ip: string) {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const json = (await res.json()) as { success?: boolean };
  return json.success === true;
}

async function sendMail(env: Env, d: ReturnType<typeof validate>['data']) {
  const text = [
    'Neue Nachricht über das Kontaktformular der Website',
    '',
    `Name:    ${d.name}`,
    `E-Mail:  ${d.email}`,
    `Telefon: ${d.phone || '–'}`,
    '',
    'Nachricht:',
    d.message,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [env.MAIL_TO],
      reply_to: d.email,
      subject: `Kontaktformular: ${d.name}`.slice(0, 150),
      text,
    }),
  });
  return res.ok;
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const wantsJson = (request.headers.get('Accept') ?? '').includes('application/json');
  const origin = new URL(request.url).origin;

  const reply = (status: number, ok: boolean, message: string, errors?: Errors) =>
    wantsJson
      ? new Response(JSON.stringify({ ok, message, errors }), {
          status,
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
        })
      : Response.redirect(`${origin}${ok ? SUCCESS_PATH : ERROR_PATH}`, 303);

  // Nur Anfragen von der eigenen Website annehmen
  const reqOrigin = request.headers.get('Origin');
  if (reqOrigin && reqOrigin !== origin) return reply(403, false, 'Ungültige Herkunft der Anfrage.');

  const ip = request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';
  if (!(await rateLimit(env, ip))) {
    return reply(429, false, 'Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut oder rufen Sie uns an.');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(400, false, 'Ungültige Anfrage.');
  }

  // Honeypot ausgefüllt → Bot. Erfolg vortäuschen, nichts senden.
  if (String(form.get('website') ?? '').trim() !== '') return reply(200, true, 'Vielen Dank!');

  const { data, errors } = validate(form);
  if (Object.keys(errors).length) return reply(422, false, 'Bitte korrigieren Sie die markierten Felder.', errors);

  if (!(await verifyTurnstile(env.TURNSTILE_SECRET, String(form.get('cf-turnstile-response') ?? ''), ip))) {
    return reply(400, false, 'Die Spamschutz-Prüfung ist fehlgeschlagen. Bitte laden Sie die Seite neu und versuchen Sie es erneut.');
  }

  try {
    if (!(await sendMail(env, data))) throw new Error('mail');
  } catch {
    // Bewusst ohne Formularinhalt loggen
    console.error('Kontaktformular: Versand fehlgeschlagen');
    return reply(502, false, 'Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut oder rufen Sie uns an.');
  }

  return reply(200, true, 'Vielen Dank! Ihre Nachricht wurde gesendet. Wir melden uns so bald wie möglich.');
}
