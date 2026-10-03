# Website Praxis für Kieferorthopädie

Statische Website mit [Astro](https://astro.build). Kein Tracking, keine Cookies, keine externen Schriften. Sie läuft auf GitHub Pages (Test), Cloudflare Pages oder Infomaniak (Produktiv), ohne dass der Code umgebaut werden muss.

- **Testumgebung:** https://gahub101.github.io/webpage/ (für Suchmaschinen gesperrt)

---

## Inhalt

1. [Inhalte ändern (ohne Programmierkenntnisse)](#1-inhalte-ändern)
2. [Lokal starten](#2-lokal-starten)
3. [Veröffentlichen](#3-veröffentlichen)
4. [Kontaktformular](#4-kontaktformular)
5. [Umzug auf die eigene Domain](#5-umzug-auf-die-eigene-domain)
6. [Technik und Qualität](#6-technik-und-qualität)
7. [Offene Punkte (TODO)](#7-offene-punkte-todo)

---

## 1. Inhalte ändern

Alle Texte liegen in einfachen Textdateien. Sie können sie direkt auf GitHub bearbeiten: Datei öffnen → Stift-Symbol → ändern → **Commit changes**. Nach etwa 2 Minuten ist die Änderung online.

> **Tipp:** Zeilen mit `#` am Anfang sind Kommentare und erscheinen nicht auf der Website.

### Praxisdaten, Öffnungszeiten, Hinweisbanner

**Datei:** `src/config/site.ts`

Hier stehen Name, Adresse, Telefon, E-Mail, Öffnungszeiten, telefonische Erreichbarkeit, Mitgliedschaften und der Hinweisbanner. Header, Footer, Kontaktseite, Notfallseite und die Angaben für Google lesen alle von hier.

| Was | Wo in `site.ts` | Beispiel |
|---|---|---|
| Telefonnummer | `phone` | `{ display: '052 269 05 55', tel: '+41522690555' }` |
| Öffnungszeiten | `openingHours` | `slots: [['08:00', '12:00'], ['13:00', '17:00']]` |
| Geschlossen | `slots: []` | |
| Hinweisbanner ein/aus | `notice.enabled` | `true` oder `false` |
| Banner auf allen Seiten | `notice.allPages` | `true` |
| Bannertext | `notice.text` | `'Praxis vom 22.12. bis 5.1. geschlossen.'` |

Texte stehen in einfachen Anführungszeichen `'…'`. Soll im Text selbst ein Apostroph vorkommen, verwenden Sie `’` statt `'`.

### Texte der Seiten

| Seite | Datei |
|---|---|
| Startseite (Hero, Einleitung, 3 Kacheln) | `src/content/seiten/startseite.md` |
| Unsere Leistungen (5 Seiten) | `src/content/leistungen/*.md` |
| Unser Team (Einleitung) | `src/content/seiten/unser-team.md` |
| Häufige Fragen (Einleitung) | `src/content/seiten/haeufige-fragen.md` |
| Kontakt (Einleitung) | `src/content/seiten/kontakt.md` |
| Impressum | `src/content/seiten/impressum.md` |
| Datenschutz | `src/content/seiten/datenschutz.md` |

**So ist eine Datei aufgebaut:** Oben zwischen den beiden `---` stehen Titel und Einstellungen. Darunter folgt der Text in [Markdown](https://www.markdownguide.org/basic-syntax/):

```markdown
## Zwischenüberschrift

Normaler Absatz. **Fett** und [ein Link](/kontakt/).

- Aufzählungspunkt
- noch einer
```

### Teammitglied hinzufügen

1. Ein Foto (Hochformat 4:5, mindestens 800 × 1000 px, JPG) in `src/assets/images/team/` hochladen, z. B. `maria-muster.jpg`.
2. Eine bestehende Datei in `src/content/team/` kopieren, z. B. als `maria-muster.md`, und anpassen:

```markdown
---
name: Maria Muster
rolle: Dentalassistentin
foto: ../../assets/images/team/maria-muster.jpg
fotoAlt: Porträt von Maria Muster
reihenfolge: 5
gruppe: Praxisteam        # oder: Fachzahnärzte
---

Kurzer Text zur Person.
```

Zum **Entfernen** löschen Sie die `.md`-Datei und das zugehörige Foto.

### Häufige Fragen ergänzen

**Datei:** `src/content/faq/faq.yaml`. Einen Block kopieren und anpassen. Die `id` muss eindeutig sein und darf keine Leerzeichen enthalten:

```yaml
- id: sport
  reihenfolge: 8
  frage: Kann ich mit Zahnspange Sport treiben?
  antwort: Ja. Bei Kontaktsportarten empfehlen wir einen Mundschutz.
```

### Bilder austauschen

- **Praxisrundgang:** Fotos in `src/assets/images/praxis/` ablegen und in `src/content/galerie/galerie.yaml` eintragen. Eine Bildbeschreibung (`alt`) ist Pflicht.
- **Startbild (Hero):** `src/assets/images/hero/hero.jpg` ersetzen (Querformat, mindestens 2400 px breit).
- **Karte Kontaktseite:** `src/assets/images/karte.jpg` ersetzen, z. B. durch einen Export von [openstreetmap.org](https://www.openstreetmap.org) (Teilen → Bild).
- **Logo:** `src/components/Logo.astro` und `public/favicon.svg`.
- **Überweisungsformular:** `public/downloads/ueberweisungsformular.pdf` ersetzen und den Dateinamen beibehalten.

Bilder werden beim Veröffentlichen automatisch verkleinert und in moderne Formate (AVIF/WebP) umgewandelt. Laden Sie einfach die Originalfotos hoch.

Fehlt ein Pflichtfeld (z. B. ein Alt-Text), schlägt die Veröffentlichung fehl. Die Fehlermeldung unter **Actions** auf GitHub nennt die Datei.

---

## 2. Lokal starten

Voraussetzung: [Node.js](https://nodejs.org) ab Version 22.

```bash
npm install        # einmalig
npm run dev        # Vorschau auf http://localhost:4321 (aktualisiert sich bei Änderungen)
```

Weitere Befehle:

| Befehl | Zweck |
|---|---|
| `npm run build` | Website nach `dist/` bauen |
| `npm run preview` | Gebaute Website ansehen |
| `npm run check` | Typprüfung, Build und alle Tests (wie auf GitHub) |
| `npm run test:browser` | Barrierefreiheit (axe) und Funktionstests; braucht einmalig `npx playwright install chromium` |

Einstellungen für den Build stehen in `.env` (Vorlage: `.env.example`).

---

## 3. Veröffentlichen

### Testumgebung: GitHub Pages

Jeder Push auf `main` löst den Workflow `.github/workflows/deploy.yml` aus. Er prüft die Website (Typen, HTML, Links, CSP, Barrierefreiheit, Funktionen) und veröffentlicht sie nur, wenn alles grün ist. Pull Requests werden nur geprüft.

Einmalig einrichten: **Settings → Pages → Source: GitHub Actions**.

Die Testumgebung ist für Suchmaschinen gesperrt (`PUBLIC_NOINDEX=true`). Das Formular läuft im Demo-Modus und versendet nichts.

> **Hinweis:** Im Gratis-Plan ist das Repository öffentlich. Hier gehören keine Passwörter, API-Schlüssel oder vertraulichen Personendaten hinein.

### Produktiv, Option A: Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → mit GitHub verbinden → dieses Repository.
2. Build command: `npm run build` · Output: `dist` · Node-Version: Umgebungsvariable `NODE_VERSION=22`.
3. Umgebungsvariablen:

| Variable | Wert | Art |
|---|---|---|
| `SITE_URL` | `https://www.ihre-domain.ch` | Text |
| `BASE_PATH` | `/` | Text |
| `PUBLIC_NOINDEX` | `false` | Text |
| `PUBLIC_FORM_MODE` | `cloudflare` | Text |
| `PUBLIC_TURNSTILE_SITEKEY` | Site-Key aus Cloudflare Turnstile | Text |
| `TURNSTILE_SECRET` | Secret-Key aus Turnstile | **Secret** |
| `RESEND_API_KEY` | API-Key von [resend.com](https://resend.com) | **Secret** |
| `MAIL_TO` | Empfängeradresse der Praxis | Text |
| `MAIL_FROM` | z. B. `Website <formular@ihre-domain.ch>` (Domain bei Resend verifizieren) | Text |

4. Optional, als Rate-Limit: einen KV-Namespace anlegen und als `RATE_KV` an das Projekt binden.
5. `public/_headers` (Security-Header) und `public/_redirects` (alte URLs) werden automatisch angewendet.

### Produktiv, Option B: Infomaniak (Daten in der Schweiz)

1. In `.env` setzen: `SITE_URL=https://www.ihre-domain.ch`, `BASE_PATH=/`, `PUBLIC_NOINDEX=false`, `PUBLIC_FORM_MODE=php`, `PUBLIC_TURNSTILE_SITEKEY=…`.
2. `npm run build` ausführen. Dabei werden `api/contact.php` und `.htaccess` automatisch nach `dist/` kopiert.
3. Den **Inhalt** von `dist/` per SFTP in den Web-Ordner der Site laden, z. B. mit `rsync -avz --delete dist/ benutzer@server:/pfad/zum/web/`.
4. `server/contact-config.example.php` als `contact-config.php` **eine Ebene über** den Web-Ordner legen und ausfüllen (Turnstile-Secret, Empfänger, Absender). So ist die Datei nie öffentlich abrufbar.
5. Im Infomaniak-Manager das SSL-Zertifikat (Let's Encrypt) aktivieren und PHP 8.1 oder neuer wählen.

---

## 4. Kontaktformular

| Modus (`PUBLIC_FORM_MODE`) | Verhalten |
|---|---|
| `demo` | Prüft die Eingaben und zeigt eine Erfolgsmeldung, versendet aber nichts. Die Felder haben keinen `name`, damit Testeingaben nie in einer URL landen. |
| `cloudflare` | Sendet an `functions/api/contact.ts` → Versand per Resend |
| `php` | Sendet an `server/contact.php` → Versand über den Mailserver des Hosters |

In allen Modi gilt:
- **Validierung** im Browser und auf dem Server.
- **Spamschutz** über ein Honeypot-Feld und Cloudflare Turnstile (kein Google reCAPTCHA).
- **Rate-Limit:** 5 Anfragen pro 10 Minuten und IP. Die IP wird nur gehasht verwendet.
- **Schutz vor Header-Injection:** Zeilenumbrüche werden aus Name und E-Mail entfernt.
- **Reply-To** ist der Absender. Eine Antwort per Mail geht also direkt an ihn.
- **Keine Speicherung** von Formulardaten in einer Datenbank oder in Logs.
- **Ohne JavaScript** wird normal abgesendet und auf `/kontakt/danke/` bzw. `/kontakt/fehler/` weitergeleitet.

---

## 5. Umzug auf die eigene Domain

Der Code bleibt gleich. Es ändern sich nur die Umgebungsvariablen `SITE_URL`, `BASE_PATH=/` und `PUBLIC_NOINDEX=false`.

**Checkliste Domain:**
- [ ] DNS: A/AAAA bzw. CNAME auf den neuen Hoster. **MX-, SPF- (TXT), DKIM- und DMARC-Einträge nicht verändern**, sonst funktioniert die E-Mail der Praxis nicht mehr.
- [ ] Beim Mail-Dienst (Resend oder Infomaniak) die Absenderdomain verifizieren. Den SPF-Eintrag dafür **ergänzen**, nicht ersetzen.
- [ ] www-Weiterleitung: Eine Variante festlegen (`.htaccess` leitet aktuell www → ohne www um; bei Cloudflare eine Redirect Rule anlegen).
- [ ] HTTPS aktiv, HSTS-Header prüfen, z. B. mit [securityheaders.com](https://securityheaders.com).
- [ ] Alte URLs testen: `/haufige-fragen`, `/unsere-leistungen/notfalle` usw. müssen per 301 auf die neuen Seiten weiterleiten.
- [ ] Google Search Console: Sitemap `https://ihre-domain.ch/sitemap-index.xml` einreichen.
- [ ] Testformular absenden und prüfen, ob die Mail ankommt und «Antworten» an den Absender geht.

---

## 6. Technik und Qualität

- **Astro 7**, rein statisch. JavaScript nur für Menü, Lightbox und Formular, jeweils mit Fallback ohne JS.
- **Plain CSS** mit Design-Tokens in `src/styles/tokens.css` (Farben, Schriftgrössen, Abstände). Dunkles, flaches Design mit Petrol als Akzent; Farbwechsel nur in dieser Datei.
- **Schrift:** Manrope, selbst gehostet (`@fontsource-variable/manrope`).
- **Content Security Policy** wird von Astro per Hash erzeugt. `npm run test:csp` prüft das.
- **SEO:** Titel/Beschreibung pro Seite, Open Graph, Sitemap, robots.txt, strukturierte Daten (`Dentist`, `FAQPage`).
- **Gemessen (Lighthouse mobil):** Performance, Barrierefreiheit, Best Practices und SEO je 100 (SEO im Produktivmodus). Startseite rund 50 KB, kein Layout Shift.

### Farben und Kontraste (WCAG 2.2 AA)

Stil: dunkel und flach (keine Schatten, keine Verläufe), Akzentfarbe Petrol.

| Kombination | Kontrast |
|---|---|
| Text `#E7EEF0` auf Hintergrund `#0F1517` | 15.7 : 1 |
| Sekundärtext `#9FB2B7` auf Hintergrund | 8.4 : 1 |
| Petrol-Akzent `#5BBCC7` (Links, Icons) auf Hintergrund | 8.3 : 1 |
| Weiss auf Petrol-Button `#0F6E7C` | 5.9 : 1 |
| Weiss auf Button-Hover `#137F8E` | 4.7 : 1 |
| Formularrahmen `#56707A` auf Hintergrund | 3.5 : 1 (≥ 3 : 1 für Bedienelemente) |

### Werberegeln (SSO)

Als Zahnarztpraxis gelten die Werberichtlinien der SSO und das Medizinalberufegesetz:
- keine reisserische oder vergleichende Werbung und keine Superlative («beste», «schmerzfrei garantiert»)
- Vorher-/Nachher-Bilder nur mit schriftlicher Einwilligung und in sachlichem Kontext
- keine Preis-Lockangebote

### Decap CMS (optional, später)

Ein Web-Editor (Decap CMS) liesse sich ergänzen, damit das Team Texte im Browser statt auf GitHub bearbeitet.

| Vorteile | Nachteile |
|---|---|
| Komfortable Oberfläche | Braucht einen OAuth-Dienst für die GitHub-Anmeldung (auf Cloudflare ca. 1–2 h Einrichtung) |
| Bleibt Git-basiert und gratis | Zusätzliches Admin-Skript |
| | Die Felder müssen ein zweites Mal beschrieben werden |

Empfehlung: erst nach dem Go-live entscheiden, falls die Bearbeitung auf GitHub zu umständlich ist.

---

## 7. Offene Punkte (TODO)

Alle Platzhalter sind mit `TODO` markiert und lassen sich so finden: GitHub → Suchfeld → `TODO`.

- Praxisdaten in `src/config/site.ts`
- Texte und Fotos (Team, Praxis, Hero), Logo, Kartenausschnitt, Überweisungsformular (PDF)
- Impressum und Datenschutzerklärung vervollständigen und rechtlich prüfen lassen
- Mitgliedschaften (ggf. mit Logos in `src/assets/images/logos/`)
