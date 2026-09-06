import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { manageBookingPath, manageBookingToken, verifyManageBookingToken } from "./token";

const originalSecret = process.env.AUTH_SECRET;

describe("booking management token", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = "test-secret-for-booking-links";
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalSecret;
  });

  it("accepts only the token minted for that booking id", () => {
    const token = manageBookingToken("booking-1");
    expect(verifyManageBookingToken("booking-1", token)).toBe(true);
    expect(verifyManageBookingToken("booking-2", token)).toBe(false);
    expect(verifyManageBookingToken("booking-1", manageBookingToken("booking-2"))).toBe(
      false,
    );
  });

  it("rejects missing, empty, and truncated tokens", () => {
    const token = manageBookingToken("booking-1");
    expect(verifyManageBookingToken("booking-1", null)).toBe(false);
    expect(verifyManageBookingToken("booking-1", "")).toBe(false);
    expect(verifyManageBookingToken("booking-1", token.slice(0, -1))).toBe(false);
  });

  it("changes when the signing secret changes, invalidating old links", () => {
    const before = manageBookingToken("booking-1");
    process.env.AUTH_SECRET = "rotated-secret";
    expect(verifyManageBookingToken("booking-1", before)).toBe(false);
    process.env.AUTH_SECRET = "test-secret-for-booking-links";
  });

  it("builds a URL-encoded management path", () => {
    const path = manageBookingPath("booking-1");
    expect(path.startsWith("/bookings/booking-1?t=")).toBe(true);
    expect(new URL(path, "https://example.com").searchParams.get("t")).toBe(
      manageBookingToken("booking-1"),
    );
  });
});
