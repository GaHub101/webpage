import type { DayHours } from '../config/site';

/** «08:00–12:00, 13:00–17:00» oder «geschlossen» */
export function formatSlots(day: DayHours): string {
  if (day.slots.length === 0) return 'geschlossen';
  return day.slots.map(([from, to]) => `${from}–${to}`).join(', ');
}

/** Schema.org openingHoursSpecification */
export function toOpeningHoursSpec(hours: readonly DayHours[]) {
  const names = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' };
  return hours.flatMap((d) =>
    d.slots.map(([opens, closes]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: d.days.map((x) => `https://schema.org/${names[x]}`),
      opens,
      closes,
    })),
  );
}
