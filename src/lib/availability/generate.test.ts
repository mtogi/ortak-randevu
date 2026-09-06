import { describe, expect, it } from "vitest";
import { proposeSlots } from "./generate";
import { zonedWallTimeToUtc } from "./tz";
import { windowsForCivilDate } from "./windows";

describe("zonedWallTimeToUtc (Europe/Istanbul)", () => {
  it("maps 09:00 to 06:00 UTC", () => {
    const instant = zonedWallTimeToUtc("Europe/Istanbul", 2026, 9, 7, 9, 0);
    expect(instant.toISOString()).toBe("2026-09-07T06:00:00.000Z");
  });
});

describe("windowsForCivilDate", () => {
  const monday = { year: 2026, month: 9, day: 7 };
  const weekly = [{ weekday: 1, startMinute: 9 * 60, endMinute: 17 * 60 }];

  it("uses weekly hours", () => {
    expect(windowsForCivilDate(weekly, [], monday)).toEqual([
      { startMinute: 540, endMinute: 1020 },
    ]);
  });

  it("closes a dated exception", () => {
    expect(
      windowsForCivilDate(
        weekly,
        [
          {
            date: new Date("2026-09-07T00:00:00.000Z"),
            isClosed: true,
            startMinute: null,
            endMinute: null,
          },
        ],
        monday,
      ),
    ).toEqual([]);
  });
});

describe("proposeSlots", () => {
  it("emits 15-minute starts that fit a 30-minute service", () => {
    const now = new Date("2026-09-07T05:00:00.000Z");
    const slots = proposeSlots({
      timeZone: "Europe/Istanbul",
      durationMinutes: 30,
      weekly: [{ weekday: 1, startMinute: 9 * 60, endMinute: 10 * 60 }],
      exceptions: [],
      now,
      horizonDays: 1,
    });
    expect(slots.map((slot) => slot.startAt.toISOString())).toEqual([
      "2026-09-07T06:00:00.000Z",
      "2026-09-07T06:15:00.000Z",
      "2026-09-07T06:30:00.000Z",
    ]);
    expect(slots.map((slot) => slot.endAt.toISOString())).toEqual([
      "2026-09-07T06:30:00.000Z",
      "2026-09-07T06:45:00.000Z",
      "2026-09-07T07:00:00.000Z",
    ]);
  });

  it("skips starts that are already in the past", () => {
    const now = new Date("2026-09-07T06:20:00.000Z");
    const slots = proposeSlots({
      timeZone: "Europe/Istanbul",
      durationMinutes: 30,
      weekly: [{ weekday: 1, startMinute: 9 * 60, endMinute: 10 * 60 }],
      exceptions: [],
      now,
      horizonDays: 1,
    });
    expect(slots.map((slot) => slot.startAt.toISOString())).toEqual([
      "2026-09-07T06:30:00.000Z",
    ]);
  });
});
