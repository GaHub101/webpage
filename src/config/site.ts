/**
 * ZENTRALE KONFIGURATION DER PRAXIS
 * ---------------------------------
 * Alle Praxisdaten stehen nur hier. Header, Footer, Kontaktseite,
 * Notfallseite und die strukturierten Daten für Google lesen von hier.
 *
 * TODO: Platzhalter durch die echten Praxisdaten ersetzen.
 */

export type TimeSlot = [from: string, to: string];

export interface DayHours {
  /** Anzeige, z. B. «Montag – Freitag» */
  label: string;
  /** Wochentage für Google (Mo, Tu, We, Th, Fr, Sa, Su) */
  days: Array<'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa' | 'Su'>;
  /** Leere Liste = geschlossen */
  slots: TimeSlot[];
}

export const site = {
  /** Offizieller Praxisname */
  name: 'Zentrum für Kieferorthopädie',
  /** Kurzform, z. B. für den Seitentitel im Browser-Tab */
  shortName: 'Zentrum für Kieferorthopädie',
  /** Unterzeile im Logo */
  tagline: 'Fachpraxis für Kieferorthopädie',
  /** Standard-Beschreibung für Suchmaschinen (max. ca. 155 Zeichen) */
  description:
    'Fachpraxis für Kieferorthopädie: Zahnspangen für Kinder, Jugendliche und Erwachsene. Persönliche Beratung, moderne und unsichtbare Behandlungsmethoden.',

  address: {
    street: 'Musterstrasse 1', // TODO
    zip: '8400', // TODO
    city: 'Winterthur', // TODO
    region: 'ZH',
    country: 'CH',
  },

  /** Telefon: «display» wird angezeigt, «tel» ist die internationale Wählnummer ohne Leerzeichen */
  phone: { display: '052 000 00 00', tel: '+41520000000' }, // TODO
  email: 'praxis@example.ch', // TODO

  /** Sprechzeiten der Praxis */
  openingHours: [
    { label: 'Montag – Freitag', days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], slots: [['08:00', '12:00'], ['13:00', '17:00']] },
    { label: 'Samstag, Sonntag', days: ['Sa', 'Su'], slots: [] },
  ] satisfies DayHours[],

  /** Telefonische Erreichbarkeit (kann von den Öffnungszeiten abweichen) */
  phoneHours: [
    { label: 'Montag – Freitag', days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], slots: [['08:00', '12:00'], ['13:30', '16:30']] },
  ] satisfies DayHours[],

  /** Hinweisbanner auf der Startseite. enabled: false blendet ihn aus. */
  notice: {
    enabled: true,
    /** true = auf allen Seiten anzeigen, false = nur auf der Startseite */
    allPages: false,
    title: 'Hinweis',
    text: 'TODO: Aktueller Hinweis, z. B. «Wir nehmen zurzeit keine neuen Patientinnen und Patienten auf.»',
    link: { label: 'Mehr erfahren', href: '/kontakt/' } as { label: string; href: string } | null,
  },

  /** Mitgliedschaften (Startseite). logo ist optional: Dateiname in src/assets/images/logos/ */
  memberships: [
    { name: 'SSO – Schweizerische Zahnärzte-Gesellschaft', url: 'https://www.sso.ch/' },
    { name: 'SGK – Schweizerische Gesellschaft für Kieferorthopädie', url: 'https://www.swissortho.ch/' },
    { name: 'TODO: weitere Mitgliedschaft', url: 'https://example.ch/' },
  ] as Array<{ name: string; url: string; logo?: string }>,

  /** PDF für überweisende Zahnärztinnen und Zahnärzte (liegt in public/downloads/) */
  referralPdf: {
    label: 'Formular für überweisende Zahnärzte (PDF)',
    href: '/downloads/ueberweisungsformular.pdf',
  },

  /** Hinweise für E-Mail und Formular */
  mailNotice: 'Bitte keine Terminverschiebungen per Kontaktformular oder E-Mail beantragen. Rufen Sie uns dafür an.',

  /** Links für die Karte. Koordinaten: TODO */
  maps: {
    google: 'https://www.google.com/maps/search/?api=1&query=Musterstrasse+1+8400+Winterthur',
    apple: 'https://maps.apple.com/?q=Musterstrasse+1,+8400+Winterthur',
    geo: { lat: 47.4997, lng: 8.7241 },
  },

  /** Jahr der Praxisgründung (für Texte und strukturierte Daten) */
  foundingYear: 1987,
} as const;

/** Hauptnavigation. href immer mit führendem und abschliessendem Schrägstrich. */
export interface NavItem {
  label: string;
  href?: string;
  children?: Array<{ label: string; href: string }>;
}

export const navigation: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Unser Team', href: '/unser-team/' },
  {
    label: 'Unsere Leistungen',
    children: [
      { label: 'Behandlungsangebot', href: '/leistungen/behandlungsangebot/' },
      { label: 'Unsichtbare Zahnspangen', href: '/leistungen/unsichtbare-zahnspangen/' },
      { label: 'Unsere Standards', href: '/leistungen/unsere-standards/' },
      { label: 'Der erste Termin', href: '/leistungen/der-erste-termin/' },
      { label: 'Notfälle', href: '/leistungen/notfaelle/' },
    ],
  },
  { label: 'Häufige Fragen', href: '/haeufige-fragen/' },
  { label: 'Praxisrundgang', href: '/praxisrundgang/' },
  { label: 'Kontakt', href: '/kontakt/' },
];
