import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { HomeLanding } from "@/components/home/landing";

export async function generateMetadata() {
  const t = await getTranslations("home");
  return {
    description: t("lede"),
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
