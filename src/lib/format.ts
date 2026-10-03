/** Leerzeichen durch geschützte Leerzeichen ersetzen (Telefonnummern brechen nicht um) */
export const nbsp = (s: string) => s.replace(/ /g, ' ');
