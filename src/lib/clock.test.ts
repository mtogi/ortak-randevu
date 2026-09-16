import { describe, expect, it } from "vitest";
import { displayCalendarYear } from "./clock";

describe("displayCalendarYear", () => {
  it("uses Europe/Istanbul, not UTC, around New Year", () => {
    expect(displayCalendarYear(new Date("2025-12-31T21:00:00.000Z"))).toBe(2026);
    expect(displayCalendarYear(new Date("2025-12-31T20:59:59.000Z"))).toBe(2025);
  });
});
