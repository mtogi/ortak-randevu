import { ValidationError } from "./errors";
import { assertMinuteWindow } from "./grid";
import { civilDateKey, type CivilDate, utcCivilDate } from "./tz";

export type WeeklyWindow = {
  weekday: number;
  startMinute: number;
  endMinute: number;
};

export type ExceptionInput = {
  date: Date;
  isClosed: boolean;
  startMinute: number | null;
  endMinute: number | null;
};

export function assertWeekday(weekday: number): void {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new ValidationError("WEEKDAY_INVALID", "Weekday must be 0 (Sunday) through 6.");
  }
}

export function windowsForCivilDate(
  weekly: WeeklyWindow[],
  exceptions: ExceptionInput[],
  date: CivilDate,
): { startMinute: number; endMinute: number }[] {
  const key = civilDateKey(date);
  const exception = exceptions.find(
    (row) => civilDateKey(utcCivilDate(row.date)) === key,
  );
  if (exception) {
    if (exception.isClosed) return [];
    if (exception.startMinute != null && exception.endMinute != null) {
      assertMinuteWindow(exception.startMinute, exception.endMinute);
      return [{ startMinute: exception.startMinute, endMinute: exception.endMinute }];
    }
  }

  const weekday = weekdayForCivilDate(date);
  return weekly
    .filter((row) => row.weekday === weekday)
    .map((row) => {
      assertMinuteWindow(row.startMinute, row.endMinute);
      return { startMinute: row.startMinute, endMinute: row.endMinute };
    });
}

/**
 * Weekday of a civil date is timezone-independent (calendar date).
 * Uses UTC noon so JS weekday matches the civil date.
 */
export function weekdayForCivilDate(date: CivilDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day, 12, 0, 0)).getUTCDay();
}
