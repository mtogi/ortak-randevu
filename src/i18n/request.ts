import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import {
  isLocale,
  localeCookieName,
  resolveUiLocale,
  vercelCountryHeader,
} from "./config";

export default getRequestConfig(async ({ locale: requestedLocale }) => {
  // An explicit locale wins: emails are rendered for their recipient, which
  // is not necessarily the locale of the request that triggered them.
  if (isLocale(requestedLocale)) {
    return {
      locale: requestedLocale,
      timeZone: "Europe/Istanbul",
      messages: (await import(`../../messages/${requestedLocale}.json`)).default,
    };
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = resolveUiLocale(
    cookieStore.get(localeCookieName)?.value,
    headerStore.get(vercelCountryHeader),
  );

  return {
    locale,
    timeZone: "Europe/Istanbul",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
