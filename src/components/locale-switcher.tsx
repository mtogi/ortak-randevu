import { getLocale, getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/actions";
import { locales } from "@/i18n/config";

export async function LocaleSwitcher() {
  const [t, current] = await Promise.all([getTranslations("locale"), getLocale()]);

  return (
    <form action={setLocale} className="flex items-center gap-2 text-sm">
      <label htmlFor="locale" className="text-[var(--muted)]">
        {t("label")}
      </label>
      <select
        id="locale"
        name="locale"
        defaultValue={current}
        className="field field-inline py-1"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {t(locale)}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-secondary min-h-8 px-2 py-1">
        {t("submit")}
      </button>
    </form>
  );
}
