export type CivilDate = {
  year: number;
  month: number;
  day: number;
};

export type ZonedParts = CivilDate & {
  hour: number;
  minute: number;
  weekday: number;
};

function parsePart(parts: Intl.DateTimeFormatPart[], type: string): number {
  const value = parts.find((part) => part.type === type)?.value;
  if (!value) {
    throw new Error(`Missing Intl part: ${type}`);
  }
  return Number(value);
}

const weekdayIndex: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Wall-clock parts of `instant` in `timeZone`.
 * `weekday` is 0 = Sunday … 6 = Saturday (matches WeeklyHours).
 */
export function getZonedParts(instant: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(instant);
  const weekdayName = parts.find((part) => part.type === "weekday")?.value ?? "";
  const weekday = weekdayIndex[weekdayName];
  if (weekday === undefined) {
    throw new Error(`Unknown weekday: ${weekdayName}`);
  }
  return {
    year: parsePart(parts, "year"),
    month: parsePart(parts, "month"),
    day: parsePart(parts, "day"),
    hour: parsePart(parts, "hour"),
    minute: parsePart(parts, "minute"),
    weekday,
  };
}

/**
 * Convert a civil wall time in `timeZone` to a UTC Instant.
 */
export function zonedWallTimeToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
  let instant = desired;
  for (let i = 0; i < 4; i += 1) {
    const parts = getZonedParts(new Date(instant), timeZone);
    const shown = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      0,
    );
    const delta = desired - shown;
    instant += delta;
    if (delta === 0) break;
  }
  return new Date(instant);
}

export function addCivilDays(date: CivilDate, days: number): CivilDate {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

export function civilDatesInclusive(start: CivilDate, count: number): CivilDate[] {
  const dates: CivilDate[] = [];
  for (let i = 0; i < count; i += 1) {
    dates.push(addCivilDays(start, i));
  }
  return dates;
}

/** Prisma `@db.Date` values compared as UTC calendar dates. */
export function utcCivilDate(value: Date): CivilDate {
  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
  };
}

export function civilDateKey(date: CivilDate): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}

export function parseIsoDate(value: string): CivilDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() + 1 !== month ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function civilDateToUtcDate(date: CivilDate): Date {
  return new Date(Date.UTC(date.year, date.month - 1, date.day));
}
