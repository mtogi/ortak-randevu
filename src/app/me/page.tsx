import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/auth";
import { absoluteUrl } from "@/lib/app-url";
import { prisma } from "@/lib/db/client";
import { getActiveProviderById, toPublicProvider } from "@/lib/identity";
import { signOutAction } from "../login/actions";
import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";

export default async function MePage() {
  const session = await auth();
  if (!session?.providerId) {
    redirect("/login");
  }

  const provider = await getActiveProviderById(prisma, session.providerId);
  if (!provider) {
    redirect("/login");
  }

  const t = await getTranslations("me");
  const view = toPublicProvider(provider);
  const bookingUrl = absoluteUrl(view.publicBookingPath);

  return (
    <>
      <AppHeader />
      <PageMain width="sm">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <section className="surface flex flex-col gap-4">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">{t("email")}</dt>
              <dd>{view.email}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">{t("slug")}</dt>
              <dd>{view.slug}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">{t("bookingPath")}</dt>
              <dd className="break-all">
                <code>{bookingUrl}</code>
              </dd>
            </div>
          </dl>
          <p className="text-sm text-[var(--muted)]">{t("bookingPathNote")}</p>
          <Link href={view.publicBookingPath} className="btn btn-secondary self-start">
            {t("bookingPathLink")}
          </Link>
        </section>
        <nav className="flex flex-col gap-3">
          <Link href="/me/bookings" className="hub-link">
            {t("bookingsLink")}
          </Link>
          <Link href="/me/availability" className="hub-link">
            {t("availabilityLink")}
          </Link>
          <Link href="/me/settings" className="hub-link">
            {t("settingsLink")}
          </Link>
        </nav>
        <form action={signOutAction}>
          <button type="submit" className="btn btn-secondary">
            {t("signOut")}
          </button>
        </form>
      </PageMain>
    </>
  );
}
