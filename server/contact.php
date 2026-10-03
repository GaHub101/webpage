<?php
/**
 * Kontaktformular – PHP-Variante für Infomaniak (POST /api/contact.php)
 *
 * Gleiche Logik wie functions/api/contact.ts:
 * Rate-Limit → Honeypot → Validierung → Turnstile → Versand per mail() des Hosters.
 * Formulardaten werden weder gespeichert noch geloggt.
 *
 * Konfiguration: contact-config.php AUSSERHALB des Web-Ordners ablegen
 * (Vorlage: server/contact-config.example.php). Alternativ Umgebungsvariablen.
 */

declare(strict_types=1);

const SUCCESS_PATH = '/kontakt/danke/';
const ERROR_PATH = '/kontakt/fehler/';
const RATE_MAX = 5;        // Anfragen …
const RATE_WINDOW = 600;   // … pro 10 Minuten und IP

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

// ---------- Konfiguration ----------
$config = [];
// Liegt eine Ebene über dem Web-Ordner: <web-ordner>/api/contact.php → <web-ordner>/../contact-config.php
$configFile = dirname(__DIR__, 2) . '/contact-config.php';
if (is_file($configFile)) {
    $config = require $configFile;
}
$cfg = static fn(string $key): string => (string)($config[$key] ?? getenv($key) ?: '');

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function reply(int $status, bool $ok, string $message, array $errors = []): never
{
    global $wantsJson;
    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message, 'errors' => (object)$errors], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ' . ($ok ? SUCCESS_PATH : ERROR_PATH), true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(405, false, 'Methode nicht erlaubt.');
}

// Nur Anfragen von der eigenen Website annehmen
$host = $_SERVER['HTTP_HOST'] ?? '';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== $host) {
    reply(403, false, 'Ungültige Herkunft der Anfrage.');
}

// ---------- Rate-Limit (nur gehashte IP, Datei im Temp-Ordner) ----------
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rateFile = sys_get_temp_dir() . '/contact_' . hash('sha256', $ip . __FILE__);
$now = time();
$hits = is_file($rateFile) ? array_filter(
    array_map('intval', explode(',', (string)file_get_contents($rateFile))),
    static fn(int $t): bool => $t > $now - RATE_WINDOW
) : [];
if (count($hits) >= RATE_MAX) {
    reply(429, false, 'Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut oder rufen Sie uns an.');
}
$hits[] = $now;
file_put_contents($rateFile, implode(',', $hits), LOCK_EX);

// ---------- Honeypot ----------
if (trim((string)($_POST['website'] ?? '')) !== '') {
    reply(200, true, 'Vielen Dank!');
}

// ---------- Validierung ----------
$oneLine = static fn(string $s): string => trim((string)preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $s));
$name = $oneLine((string)($_POST['name'] ?? ''));
$email = $oneLine((string)($_POST['email'] ?? ''));
$phone = $oneLine((string)($_POST['phone'] ?? ''));
$message = trim(str_replace("\r\n", "\n", (string)($_POST['message'] ?? '')));
$privacy = ($_POST['privacy'] ?? '') === 'on';

$errors = [];
if ($name === '') $errors['name'] = 'Bitte geben Sie Ihren Namen ein.';
elseif (mb_strlen($name) > 100) $errors['name'] = 'Der Name ist zu lang.';
if ($email === '') $errors['email'] = 'Bitte geben Sie Ihre E-Mail-Adresse ein.';
elseif (mb_strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
if ($phone !== '' && !preg_match('#^[0-9+()/ .\-]{6,40}$#', $phone)) $errors['phone'] = 'Bitte geben Sie eine gültige Telefonnummer ein.';
if ($message === '') $errors['message'] = 'Bitte schreiben Sie uns eine Nachricht.';
elseif (mb_strlen($message) > 2000) $errors['message'] = 'Die Nachricht ist zu lang (maximal 2000 Zeichen).';
if (!$privacy) $errors['privacy'] = 'Bitte bestätigen Sie, dass Sie die Datenschutzerklärung gelesen haben.';

if ($errors) {
    reply(422, false, 'Bitte korrigieren Sie die markierten Felder.', $errors);
}

// ---------- Turnstile ----------
$token = (string)($_POST['cf-turnstile-response'] ?? '');
$verified = false;
if ($token !== '' && $cfg('TURNSTILE_SECRET') !== '') {
    $ctx = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => http_build_query(['secret' => $cfg('TURNSTILE_SECRET'), 'response' => $token, 'remoteip' => $ip]),
        'timeout' => 8,
    ]]);
    $res = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $ctx);
    $verified = $res !== false && (json_decode($res, true)['success'] ?? false) === true;
}
if (!$verified) {
    reply(400, false, 'Die Spamschutz-Prüfung ist fehlgeschlagen. Bitte laden Sie die Seite neu und versuchen Sie es erneut.');
}

// ---------- Versand ----------
$to = $cfg('MAIL_TO');
$from = $cfg('MAIL_FROM');
if ($to === '' || $from === '') {
    error_log('Kontaktformular: MAIL_TO/MAIL_FROM nicht konfiguriert');
    reply(500, false, 'Die Nachricht konnte nicht gesendet werden. Bitte rufen Sie uns an.');
}

$body = implode("\n", [
    'Neue Nachricht über das Kontaktformular der Website',
    '',
    'Name:    ' . $name,
    'E-Mail:  ' . $email,
    'Telefon: ' . ($phone !== '' ? $phone : '–'),
    '',
    'Nachricht:',
    $message,
]);
$subject = '=?UTF-8?B?' . base64_encode(mb_substr('Kontaktformular: ' . $name, 0, 150)) . '?=';
$headers = implode("\r\n", [
    'From: ' . $from,
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

// -f setzt den Envelope-Absender (wichtig für SPF)
$envelope = filter_var(preg_replace('/^.*<([^>]+)>.*$/', '$1', $from), FILTER_VALIDATE_EMAIL) ?: '';
$sent = mail($to, $subject, $body, $headers, $envelope !== '' ? '-f' . $envelope : '');

if (!$sent) {
    error_log('Kontaktformular: Versand fehlgeschlagen'); // bewusst ohne Inhalt
    reply(502, false, 'Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut oder rufen Sie uns an.');
}

reply(200, true, 'Vielen Dank! Ihre Nachricht wurde gesendet. Wir melden uns so bald wie möglich.');
