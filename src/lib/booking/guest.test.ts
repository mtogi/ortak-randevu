import { describe, expect, it } from "vitest";
import { BookingValidationError } from "./errors";
import { normalizeGuest } from "./guest";

const valid = {
  name: "  Ada   Lovelace ",
  email: " Ada@Example.COM ",
  phone: "+90 555 000 11 22",
};

describe("guest input (Q-P7: name + email + phone, nothing else)", () => {
  it("trims, collapses whitespace, and normalizes the email", () => {
    expect(normalizeGuest(valid)).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+90 555 000 11 22",
    });
  });

  it.each([
    ["NAME_INVALID", { ...valid, name: "   " }],
    ["NAME_INVALID", { ...valid, name: "a".repeat(81) }],
    ["EMAIL_INVALID", { ...valid, email: "not-an-email" }],
    ["PHONE_INVALID", { ...valid, phone: "12345" }],
    ["PHONE_INVALID", { ...valid, phone: "call me maybe" }],
    ["PHONE_INVALID", { ...valid, phone: "" }],
  ])("rejects bad input with %s", (code, input) => {
    try {
      normalizeGuest(input);
      expect.unreachable(`expected ${code}`);
    } catch (error) {
      expect(error).toBeInstanceOf(BookingValidationError);
      expect((error as BookingValidationError).code).toBe(code);
    }
  });
});
