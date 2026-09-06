/**
 * Display formatting for slots. Instants are stored in UTC (ADR-001); every
 * user-visible time is rendered in the provider's timezone so a guest and a
 * dietitian always read the same wall clock.
 */
export function formatSlotStart(startAt: Date, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(startAt);
}

export function formatSlotRange(
  startAt: Date,
  endAt: Date,
  timeZone: string,
  locale: string,
): string {
  const day = new Intl.DateTimeFormat(locale, { timeZone, dateStyle: "full" }).format(
    startAt,
  );
  const time = new Intl.DateTimeFormat(locale, { timeZone, timeStyle: "short" });
  return `${day} ${time.format(startAt)} – ${time.format(endAt)}`;
}

export function formatTimeOfDay(instant: Date, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone, timeStyle: "short" }).format(
    instant,
  );
}

export function formatDayHeading(
  instant: Date,
  timeZone: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(instant);
}

/** Q-D7: prices are integer minor units plus an ISO 4217 code. */
export function formatPrice(
  amount: number | null,
  currency: string | null,
  locale: string,
): string | null {
  if (amount == null || !currency) return null;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    amount / 100,
  );
}
