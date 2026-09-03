export const locales = ["en", "tr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Locale is carried in a cookie, not a URL prefix — see OPEN-QUESTIONS Q-T9. */
export const localeCookieName = "locale";

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}
