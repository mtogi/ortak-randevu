import { describe, expect, it } from "vitest";
import { GUEST_MODIFY_CUTOFF_HOURS } from "./constants";
import { ModifyWindowClosedError } from "./errors";
import { assertGuestCanModify, guestCanModify, guestModifyDeadline } from "./rules";

const start = new Date("2027-03-10T09:00:00Z");

describe("guest cancel/reschedule window (Q-P6)", () => {
  it("puts the deadline exactly 24 hours before the start", () => {
    expect(GUEST_MODIFY_CUTOFF_HOURS).toBe(24);
    expect(guestModifyDeadline(start).toISOString()).toBe("2027-03-09T09:00:00.000Z");
  });

  it("allows changes up to and including the deadline", () => {
    expect(guestCanModify(start, new Date("2027-03-01T00:00:00Z"))).toBe(true);
    expect(guestCanModify(start, new Date("2027-03-09T09:00:00Z"))).toBe(true);
  });

  it("refuses changes inside the window and after the start", () => {
    expect(guestCanModify(start, new Date("2027-03-09T09:00:01Z"))).toBe(false);
    expect(guestCanModify(start, new Date("2027-03-10T08:59:00Z"))).toBe(false);
    expect(guestCanModify(start, new Date("2027-03-11T00:00:00Z"))).toBe(false);
  });

  it("throws a coded error once the window has closed", () => {
    expect(() =>
      assertGuestCanModify(start, new Date("2027-03-09T09:00:00Z")),
    ).not.toThrow();
    try {
      assertGuestCanModify(start, new Date("2027-03-10T00:00:00Z"));
      expect.unreachable("expected the closed window to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ModifyWindowClosedError);
      expect((error as ModifyWindowClosedError).code).toBe("MODIFY_WINDOW_CLOSED");
    }
  });
});
