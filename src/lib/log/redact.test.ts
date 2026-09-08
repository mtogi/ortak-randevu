import { describe, expect, it } from "vitest";
import { redactPii, redactUrl } from "./redact";

describe("redactUrl", () => {
  it("redacts guest capability tokens and magic-link query params", () => {
    expect(redactUrl("https://www.ortakrandevu.com/bookings/abc?t=super-secret")).toBe(
      "https://www.ortakrandevu.com/bookings/abc?t=%5Bredacted%5D",
    );

    const magic =
      "http://localhost:3000/api/auth/callback/nodemailer?token=abc123&email=a@b.co";
    const redacted = redactUrl(magic);
    expect(redacted).toContain("token=%5Bredacted%5D");
    expect(redacted).toContain("email=%5Bredacted%5D");
    expect(redacted).not.toContain("abc123");
    expect(redacted).not.toContain("a@b.co");
  });

  it("leaves ordinary paths alone", () => {
    expect(redactUrl("https://www.ortakrandevu.com/me/settings")).toBe(
      "https://www.ortakrandevu.com/me/settings",
    );
  });
});

describe("redactPii", () => {
  it("replaces email and phone-shaped text", () => {
    expect(redactPii("mail dietitian@example.com or +90 555 000 11 22")).toBe(
      "mail [email] or [phone]",
    );
  });
});
