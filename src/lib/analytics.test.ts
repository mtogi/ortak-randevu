import { describe, expect, it } from "vitest";
import { analyticsBeforeSend } from "./analytics";

describe("analyticsBeforeSend", () => {
  it("drops API routes so auth query strings never ship", () => {
    expect(
      analyticsBeforeSend({
        type: "pageview",
        url: "https://www.ortakrandevu.com/api/auth/callback/nodemailer?token=abc",
      }),
    ).toBeNull();
  });

  it("redacts guest capability tokens on manage URLs", () => {
    const next = analyticsBeforeSend({
      type: "pageview",
      url: "https://www.ortakrandevu.com/bookings/abc?t=super-secret",
    });
    expect(next?.url).toContain("t=%5Bredacted%5D");
    expect(next?.url).not.toContain("super-secret");
  });

  it("keeps public and dashboard paths", () => {
    expect(
      analyticsBeforeSend({ type: "pageview", url: "https://www.ortakrandevu.com/" })
        ?.url,
    ).toBe("https://www.ortakrandevu.com/");
    expect(
      analyticsBeforeSend({
        type: "pageview",
        url: "https://www.ortakrandevu.com/book/ada",
      })?.url,
    ).toBe("https://www.ortakrandevu.com/book/ada");
    expect(
      analyticsBeforeSend({
        type: "pageview",
        url: "https://www.ortakrandevu.com/me/settings",
      })?.url,
    ).toBe("https://www.ortakrandevu.com/me/settings");
  });
});
