import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { HomeLanding } from "@/components/home/landing";
import { defaultLocale, isLocale } from "@/i18n/config";
import { siteShareMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [tApp, tHome, locale] = await Promise.all([
    getTranslations("app"),
    getTranslations("home"),
    getLocale(),
  ]);
  const name = tApp("name");
  const lede = tHome("lede");
  const uiLocale = isLocale(locale) ? locale : defaultLocale;
  return {
    description: lede,
    ...siteShareMetadata({
      name,
      description: lede,
      locale: uiLocale,
      canonicalPath: "/",
    }),
  };
}

export default async function Home() {
  const session = await auth();

  return (
    <>
      <AppHeader />
      <HomeLanding signedIn={Boolean(session?.providerId)} />
    </>
  );
}
