import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import {
  serializeJsonLd,
  siteJsonLd,
  siteMetadataBase,
  siteShareMetadata,
} from "@/lib/seo";
import "./globals.css";

const geist = Geist({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-geist",
});

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("app"), getLocale()]);
  const name = t("name");
  const tagline = t("tagline");
  const uiLocale = isLocale(locale) ? locale : defaultLocale;

  return {
    metadataBase: siteMetadataBase(),
    title: name,
    description: tagline,
    ...siteShareMetadata({ name, description: tagline, locale: uiLocale }),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("app")]);
  const jsonLd = siteJsonLd({ name: t("name"), description: t("tagline") });

  return (
    <html lang={locale} className={geist.variable}>
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
