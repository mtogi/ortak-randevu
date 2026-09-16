import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ProviderNav } from "@/components/provider-nav";
import { Wordmark } from "@/components/wordmark";

export async function AppHeader() {
  const session = await auth();
  const t = await getTranslations("nav");

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Wordmark label={t("home")} />
        <div className="site-header-actions">
          {session?.providerId ? (
            <ProviderNav
              menuLabel={t("menu")}
              account={t("account")}
              bookings={t("bookings")}
              availability={t("availability")}
              settings={t("settings")}
            />
          ) : (
            <Link href="/login" className="btn btn-primary site-header-signin">
              {t("signIn")}
            </Link>
          )}
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
