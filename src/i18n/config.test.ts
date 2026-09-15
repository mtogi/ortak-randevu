import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import tr from "../../messages/tr.json";
import { defaultLocale, isLocale, locales } from "./config";

function flatten(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("i18n config", () => {
  it("defaults to Turkish", () => {
    expect(defaultLocale).toBe("tr");
    expect(locales[0]).toBe("tr");
    expect(locales).toContain("en");
  });

  it("rejects unknown locales", () => {
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("keeps EN and TR catalogs in sync", () => {
    expect(flatten(tr).sort()).toEqual(flatten(en).sort());
  });
});
