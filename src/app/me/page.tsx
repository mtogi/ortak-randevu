import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { getActiveProviderById, toPublicProvider } from "@/lib/identity";
import { signOutAction } from "../login/actions";
import { AppHeader } from "@/components/app-header";

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

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 pb-16">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="opacity-70">{t("email")}</dt>
            <dd>{view.email}</dd>
          </div>
          <div>
            <dt className="opacity-70">{t("slug")}</dt>
            <dd>{view.slug}</dd>
          </div>
          <div>
            <dt className="opacity-70">{t("bookingPath")}</dt>
            <dd>
              <code>{view.publicBookingPath}</code>
            </dd>
          </div>
        </dl>
        <p className="text-sm opacity-70">{t("bookingPathNote")}</p>
        <a href={view.publicBookingPath} className="text-sm underline underline-offset-4">
          {t("bookingPathLink")}
        </a>
        <a href="/me/availability" className="text-sm underline underline-offset-4">
          {t("availabilityLink")}
        </a>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded border border-current/20 px-3 py-2 text-sm"
          >
            {t("signOut")}
          </button>
        </form>
      </main>
    </>
  );
}
