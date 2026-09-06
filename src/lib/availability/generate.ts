import { GRID_MINUTES, SLOT_HORIZON_DAYS } from "./constants";
import { assertGridDuration } from "./grid";
import {
  civilDatesInclusive,
  getZonedParts,
  zonedWallTimeToUtc,
  type CivilDate,
} from "./tz";
import {
  windowsForCivilDate,
  type ExceptionInput,
  type WeeklyWindow,
} from "./windows";

export type ProposedSlot = {
  startAt: Date;
  endAt: Date;
};

export type GenerateSlotsInput = {
  timeZone: string;
  durationMinutes: number;
  weekly: WeeklyWindow[];
  exceptions: ExceptionInput[];
  now: Date;
  horizonDays?: number;
};

export function proposeSlots(input: GenerateSlotsInput): ProposedSlot[] {
  assertGridDuration(input.durationMinutes);
  const horizonDays = input.horizonDays ?? SLOT_HORIZON_DAYS;
  const today = getZonedParts(input.now, input.timeZone);
  const start: CivilDate = { year: today.year, month: today.month, day: today.day };
  const dates = civilDatesInclusive(start, horizonDays);
  const proposed: ProposedSlot[] = [];

  for (const date of dates) {
    const windows = windowsForCivilDate(input.weekly, input.exceptions, date);
    for (const window of windows) {
      for (
        let startMinute = window.startMinute;
        startMinute + input.durationMinutes <= window.endMinute;
        startMinute += GRID_MINUTES
      ) {
        const hour = Math.floor(startMinute / 60);
        const minute = startMinute % 60;
        const startAt = zonedWallTimeToUtc(
          input.timeZone,
          date.year,
          date.month,
          date.day,
          hour,
          minute,
        );
        if (startAt.getTime() <= input.now.getTime()) continue;
        const endAt = new Date(startAt.getTime() + input.durationMinutes * 60_000);
        proposed.push({ startAt, endAt });
      }
    }
  }

  return proposed;
}

export function overlaps(
  a: { startAt: Date; endAt: Date },
  b: { startAt: Date; endAt: Date },
): boolean {
  return a.startAt.getTime() < b.endAt.getTime() && a.endAt.getTime() > b.startAt.getTime();
}
