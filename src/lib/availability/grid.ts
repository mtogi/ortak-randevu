import { GRID_MINUTES, MINUTES_PER_DAY } from "./constants";
import { ValidationError } from "./errors";

export function isGridAligned(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes % GRID_MINUTES === 0;
}

export function assertGridDuration(durationMinutes: number): void {
  if (!isGridAligned(durationMinutes) || durationMinutes < GRID_MINUTES) {
    throw new ValidationError(
      "DURATION_NOT_GRID",
      `Duration must be a multiple of ${GRID_MINUTES} minutes.`,
    );
  }
  if (durationMinutes > MINUTES_PER_DAY) {
    throw new ValidationError("DURATION_TOO_LONG", "Duration cannot exceed 24 hours.");
  }
}

export function assertMinuteWindow(startMinute: number, endMinute: number): void {
  if (!isGridAligned(startMinute) || !isGridAligned(endMinute)) {
    throw new ValidationError(
      "WINDOW_NOT_GRID",
      `Hours must align to ${GRID_MINUTES}-minute steps.`,
    );
  }
  if (startMinute < 0 || endMinute > MINUTES_PER_DAY || startMinute >= endMinute) {
    throw new ValidationError(
      "WINDOW_INVALID",
      "End time must be after start time on the same day (no overnight windows in M2b).",
    );
  }
}

export function minutesToClock(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function clockToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = match[3] ? Number(match[3]) : 0;
  if (second !== 0) return null;
  if (hour > 24 || minute > 59) return null;
  if (hour === 24 && minute !== 0) return null;
  return hour * 60 + minute;
}
