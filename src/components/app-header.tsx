import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function AppHeader() {
  const session = await auth();
  const t = await getTranslations("nav");

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="font-semibold tracking-tight">
          {t("home")}
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {session?.providerId ? (
            <>
              <Link href="/me" className="nav-link">
                {t("account")}
              </Link>
              <Link href="/me/bookings" className="nav-link">
                {t("bookings")}
              </Link>
              <Link href="/me/availability" className="nav-link">
                {t("availability")}
              </Link>
              <Link href="/me/settings" className="nav-link">
                {t("settings")}
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn btn-secondary">
              {t("signIn")}
            </Link>
          )}
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
