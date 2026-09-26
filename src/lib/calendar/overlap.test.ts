import { describe, expect, it } from "vitest";
import {
  filterSlotsNotBusy,
  intervalsOverlap,
  overlapsAnyBusy,
} from "./overlap";

describe("calendar interval overlap", () => {
  it("detects partial and contained overlaps", () => {
    const a0 = new Date("2027-06-01T09:00:00Z");
    const a1 = new Date("2027-06-01T09:30:00Z");
    expect(
      intervalsOverlap(a0, a1, new Date("2027-06-01T09:15:00Z"), new Date("2027-06-01T10:00:00Z")),
    ).toBe(true);
    expect(
      intervalsOverlap(a0, a1, new Date("2027-06-01T08:00:00Z"), new Date("2027-06-01T10:00:00Z")),
    ).toBe(true);
    expect(
      intervalsOverlap(a0, a1, new Date("2027-06-01T09:00:00Z"), new Date("2027-06-01T09:30:00Z")),
    ).toBe(true);
  });

  it("treats touching endpoints as non-overlapping", () => {
    expect(
      intervalsOverlap(
        new Date("2027-06-01T09:00:00Z"),
        new Date("2027-06-01T09:30:00Z"),
        new Date("2027-06-01T09:30:00Z"),
        new Date("2027-06-01T10:00:00Z"),
      ),
    ).toBe(false);
  });

  it("filters slots against busy blocks", () => {
    const slots = [
      {
        id: "a",
        startAt: new Date("2027-06-01T09:00:00Z"),
        endAt: new Date("2027-06-01T09:30:00Z"),
      },
      {
        id: "b",
        startAt: new Date("2027-06-01T10:00:00Z"),
        endAt: new Date("2027-06-01T10:30:00Z"),
      },
    ];
    const busy = [
      {
        startAt: new Date("2027-06-01T09:00:00Z"),
        endAt: new Date("2027-06-01T09:45:00Z"),
      },
    ];
    expect(overlapsAnyBusy(slots[0]!, busy)).toBe(true);
    expect(overlapsAnyBusy(slots[1]!, busy)).toBe(false);
    expect(filterSlotsNotBusy(slots, busy).map((s) => s.id)).toEqual(["b"]);
  });
});
