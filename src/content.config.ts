import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Inhalte der Website. Die Schemas prüfen beim Build, ob alle Pflichtfelder vorhanden sind.
 * Fehlt z. B. ein Alt-Text, bricht der Build mit einer verständlichen Meldung ab.
 */

/** Unterseiten «Unsere Leistungen» – eine Markdown-Datei pro Seite */
const leistungen = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/leistungen' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Kurzer Text für Suchmaschinen (max. ca. 155 Zeichen) */
      description: z.string().max(170),
      /** Einleitungssatz unter dem Seitentitel */
      lead: z.string().optional(),
      /** Reihenfolge in Navigation und Übersichten */
      order: z.number(),
      /** Kurztext für Kacheln und Themenlinks */
      teaser: z.string(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      /** Notfallbox mit Telefonnummer oben anzeigen */
      emergency: z.boolean().default(false),
      /** Nummerierte Schritte (z. B. Ablauf erster Termin) */
      steps: z.array(z.object({ title: z.string(), text: z.string() })).optional(),
    }).refine((d) => !d.image || d.imageAlt, { message: 'imageAlt ist Pflicht, wenn ein Bild gesetzt ist.' }),
});

/** Teammitglieder – eine Markdown-Datei pro Person */
const team = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/team' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      rolle: z.string(),
      foto: image(),
      fotoAlt: z.string(),
      reihenfolge: z.number(),
      /** Optional: Gruppe, z. B. «Ärzte» oder «Praxisteam» */
      gruppe: z.enum(['Fachzahnärzte', 'Praxisteam']).default('Praxisteam'),
    }),
});

/** Häufige Fragen – alle in einer YAML-Datei */
const faq = defineCollection({
  loader: file('src/content/faq/faq.yaml'),
  schema: z.object({
    frage: z.string(),
    /** Antwort. Leerzeilen trennen Absätze. */
    antwort: z.string(),
    reihenfolge: z.number(),
  }),
});

/** Bilder für den Praxisrundgang */
const galerie = defineCollection({
  loader: file('src/content/galerie/galerie.yaml'),
  schema: ({ image }) =>
    z.object({
      bild: image(),
      alt: z.string().min(3),
      beschriftung: z.string().optional(),
      reihenfolge: z.number(),
    }),
});

/** Texte der übrigen Seiten (Startseite, Team, FAQ, Impressum …) */
const seiten = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/seiten' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().max(170),
      lead: z.string().optional(),
      /** Nur Startseite */
      hero: z
        .object({
          eyebrow: z.string(),
          title: z.string(),
          text: z.string(),
          image: image(),
          imageAlt: z.string(),
        })
        .optional(),
      teasers: z
        .array(z.object({ title: z.string(), text: z.string(), href: z.string(), image: image(), imageAlt: z.string() }))
        .optional(),
    }),
});

export const collections = { leistungen, team, faq, galerie, seiten };
