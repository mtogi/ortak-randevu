export const locales = ["tr", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "tr";

/** Locale is carried in a cookie, not a URL prefix — see OPEN-QUESTIONS Q-T9. */
export const localeCookieName = "locale";

/** Vercel request geo: ISO 3166-1 alpha-2. Never read city/region headers (Q-T16). */
export const vercelCountryHeader = "x-vercel-ip-country";

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * First-visit locale when no cookie (Q-T16).
 * TR → tr; any other country → en; missing/blank header (local) → defaultLocale.
 */
export function localeFromCountry(country: string | undefined | null): Locale {
  const code = country?.trim();
  if (!code) return defaultLocale;
  return code.toUpperCase() === "TR" ? "tr" : "en";
}

/** Valid locale cookie wins; otherwise country header. */
export function resolveUiLocale(
  cookieValue: string | undefined,
  country: string | undefined | null,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  return localeFromCountry(country);
}
