import { describe, expect, it } from "vitest";
import { publicBookingPath } from "./booking-url";

describe("publicBookingPath", () => {
  it("uses /book/[providerSlug] (Q-T10)", () => {
    expect(publicBookingPath("ada-lovelace")).toBe("/book/ada-lovelace");
  });
});
