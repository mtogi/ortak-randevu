import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function AppHeader() {
  const session = await auth();
  const t = await getTranslations("nav");

  return (
    <header className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-6">
      <Link href="/" className="font-semibold">
        {t("home")}
      </Link>
      <nav className="flex flex-wrap items-center gap-4 text-sm">
        {session?.providerId ? (
          <>
            <a href="/me" className="underline underline-offset-4">
              {t("account")}
            </a>
            <a href="/me/availability" className="underline underline-offset-4">
              {t("availability")}
            </a>
          </>
        ) : (
          <a href="/login" className="underline underline-offset-4">
            {t("signIn")}
          </a>
        )}
        <LocaleSwitcher />
      </nav>
    </header>
  );
}
