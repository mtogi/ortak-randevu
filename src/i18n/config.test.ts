import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import tr from "../../messages/tr.json";
import {
  defaultLocale,
  isLocale,
  localeFromCountry,
  locales,
  resolveUiLocale,
} from "./config";

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

describe("Q-T16 geo default locale", () => {
  it("lets a valid cookie win over country", () => {
    expect(resolveUiLocale("en", "TR")).toBe("en");
    expect(resolveUiLocale("tr", "US")).toBe("tr");
  });

  it("maps TR to Turkish and any other country to English", () => {
    expect(localeFromCountry("TR")).toBe("tr");
    expect(localeFromCountry("tr")).toBe("tr");
    expect(localeFromCountry("US")).toBe("en");
    expect(localeFromCountry("DE")).toBe("en");
    expect(localeFromCountry("XX")).toBe("en");
  });

  it("defaults to Turkish when the country header is missing", () => {
    expect(localeFromCountry(undefined)).toBe("tr");
    expect(localeFromCountry(null)).toBe("tr");
    expect(localeFromCountry("")).toBe("tr");
    expect(localeFromCountry("  ")).toBe("tr");
    expect(resolveUiLocale(undefined, undefined)).toBe("tr");
  });

  it("falls through an invalid cookie to country", () => {
    expect(resolveUiLocale("de", "US")).toBe("en");
    expect(resolveUiLocale("de", undefined)).toBe("tr");
  });
});
