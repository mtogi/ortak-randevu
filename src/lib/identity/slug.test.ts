import { describe, expect, it } from "vitest";
import { isReservedSlug, slugBaseFromEmail, withSlugSuffix } from "./slug";

describe("slugBaseFromEmail", () => {
  it("uses the local part", () => {
    expect(slugBaseFromEmail("Ada.Lovelace@example.com")).toBe("ada-lovelace");
  });

  it("falls back when the local part has no letters", () => {
    expect(slugBaseFromEmail("+++@example.com")).toBe("provider");
  });
});

describe("reserved slugs", () => {
  it("reserves app routes that must not be dietitian slugs at the top level", () => {
    expect(isReservedSlug("login")).toBe(true);
    expect(isReservedSlug("book")).toBe(true);
    expect(isReservedSlug("ada")).toBe(false);
  });
});

describe("withSlugSuffix", () => {
  it("appends a disambiguator", () => {
    expect(withSlugSuffix("ada", "ab12cd")).toBe("ada-ab12cd");
  });
});
