// Nach dem Build: für Infomaniak (PUBLIC_FORM_MODE=php) das PHP-Formular und die .htaccess nach dist/ kopieren.
import { copyFileSync, mkdirSync } from 'node:fs';
import { loadEnv } from 'vite';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };

if (env.PUBLIC_FORM_MODE === 'php') {
  mkdirSync('dist/api', { recursive: true });
  copyFileSync('server/contact.php', 'dist/api/contact.php');
  copyFileSync('server/.htaccess', 'dist/.htaccess');
  console.log('Hinweis: contact-config.php (Vorlage server/contact-config.example.php) gehört auf dem Server EINE EBENE ÜBER den Web-Ordner.');
  console.log('PHP-Formular und .htaccess nach dist/ kopiert.');
}
