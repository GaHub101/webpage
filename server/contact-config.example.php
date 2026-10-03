<?php
// Kopieren nach «contact-config.php» und EINE EBENE ÜBER den Web-Ordner hochladen
// (z. B. /sites/ihre-domain.ch/../contact-config.php), damit sie nie öffentlich abrufbar ist.
// Diese Datei enthält Geheimnisse – niemals ins Git-Repository einchecken.
return [
    'TURNSTILE_SECRET' => '0x0000000000000000000000000000000000',
    'MAIL_TO'          => 'praxis@ihre-domain.ch',
    'MAIL_FROM'        => 'Website <formular@ihre-domain.ch>',
];
