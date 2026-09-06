import type { PrismaClient, WeeklyHours } from "@prisma/client";
import { ValidationError } from "./errors";
import { assertMinuteWindow } from "./grid";
import { assertWeekday, type WeeklyWindow } from "./windows";

export async function listWeeklyHours(
  db: PrismaClient,
  providerId: string,
): Promise<WeeklyHours[]> {
  return db.weeklyHours.findMany({
    where: { providerId },
    orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
  });
}

export async function replaceWeeklyHours(
  db: PrismaClient,
  providerId: string,
  windows: WeeklyWindow[],
): Promise<WeeklyHours[]> {
  for (const window of windows) {
    assertWeekday(window.weekday);
    assertMinuteWindow(window.startMinute, window.endMinute);
  }

  await db.$transaction(async (tx) => {
    await tx.weeklyHours.deleteMany({ where: { providerId } });
    if (windows.length === 0) return;
    await tx.weeklyHours.createMany({
      data: windows.map((window) => ({
        providerId,
        weekday: window.weekday,
        startMinute: window.startMinute,
        endMinute: window.endMinute,
      })),
    });
  });

  return listWeeklyHours(db, providerId);
}

export async function listExceptions(db: PrismaClient, providerId: string) {
  return db.availabilityException.findMany({
    where: { providerId },
    orderBy: { date: "asc" },
  });
}

export async function upsertException(
  db: PrismaClient,
  providerId: string,
  input: {
    date: Date;
    isClosed: boolean;
    startMinute: number | null;
    endMinute: number | null;
  },
) {
  if (!input.isClosed) {
    if (input.startMinute == null || input.endMinute == null) {
      throw new ValidationError(
        "EXCEPTION_HOURS_REQUIRED",
        "Open exceptions need start and end times.",
      );
    }
    assertMinuteWindow(input.startMinute, input.endMinute);
  }

  return db.availabilityException.upsert({
    where: {
      providerId_date: { providerId, date: input.date },
    },
    create: {
      providerId,
      date: input.date,
      isClosed: input.isClosed,
      startMinute: input.isClosed ? null : input.startMinute,
      endMinute: input.isClosed ? null : input.endMinute,
    },
    update: {
      isClosed: input.isClosed,
      startMinute: input.isClosed ? null : input.startMinute,
      endMinute: input.isClosed ? null : input.endMinute,
    },
  });
}

export async function deleteException(db: PrismaClient, providerId: string, date: Date) {
  await db.availabilityException.deleteMany({
    where: { providerId, date },
  });
}
