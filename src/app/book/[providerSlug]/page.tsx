import { getLocale, getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/app-header";
import { MissingNotice } from "@/components/missing-notice";
import { PageMain } from "@/components/page-main";
import { SlotPicker } from "@/components/slot-picker";
import {
  GUEST_MODIFY_CUTOFF_HOURS,
  formatPrice,
  getPublicProviderPage,
  isGuestErrorCode,
  listOpenSlots,
} from "@/lib/booking";
import { prisma } from "@/lib/db/client";
import { createBookingAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PublicBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ providerSlug: string }>;
  searchParams: Promise<{ serviceId?: string; error?: string }>;
}) {
  const { providerSlug } = await params;
  const { serviceId, error } = await searchParams;

  const [t, tNav, locale] = await Promise.all([
    getTranslations("book"),
    getTranslations("nav"),
    getLocale(),
  ]);

  const provider = await getPublicProviderPage(prisma, providerSlug);
  if (!provider) {
    return (
      <MissingNotice message={t("errors.PROVIDER_NOT_FOUND")} linkLabel={tNav("home")} />
    );
  }

  const selectedService =
    provider.services.find((service) => service.id === serviceId) ??
    provider.services[0] ??
    null;

  const slots = selectedService
    ? (
        await listOpenSlots(prisma, {
          providerId: provider.id,
          serviceId: selectedService.id,
        })
      ).slots
    : [];

  const providerName = provider.name ?? provider.slug;

  return (
    <>
      <AppHeader />
      <PageMain>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title", { provider: providerName })}
          </h1>
          {provider.bio ? (
            <p className="mt-2 text-sm text-[var(--muted)]">{provider.bio}</p>
          ) : null}
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t("timezoneNote", { tz: provider.timezone })}
          </p>
        </div>

        {error ? (
          <p className="banner banner-error" role="alert">
            {isGuestErrorCode(error) ? t(`errors.${error}`) : t("errors.UNKNOWN")}
          </p>
        ) : null}

        {provider.services.length === 0 || !selectedService ? (
          <p className="text-sm text-[var(--muted)]">{t("noServices")}</p>
        ) : (
          <>
            <section className="surface flex flex-col gap-3">
              <h2 className="text-lg font-medium">{t("serviceTitle")}</h2>
              <ul className="flex flex-wrap gap-2 text-sm">
                {provider.services.map((service) => {
                  const price = formatPrice(
                    service.priceAmount,
                    service.priceCurrency,
                    locale,
                  );
                  const isSelected = service.id === selectedService.id;
                  return (
                    <li key={service.id}>
                      <a
                        href={`/book/${provider.slug}?serviceId=${service.id}`}
                        aria-current={isSelected ? "true" : undefined}
                        className="service-chip"
                      >
                        {service.title} · {service.durationMinutes} {t("minutes")}
                        {price ? ` · ${price}` : ""}
                      </a>
                    </li>
                  );
                })}
              </ul>
              {selectedService.description ? (
                <p className="text-sm text-[var(--muted)]">
                  {selectedService.description}
                </p>
              ) : null}
              <p className="text-sm text-[var(--muted)]">
                {t(`location.${selectedService.locationType}`)}
              </p>
            </section>

            <form action={createBookingAction} className="flex flex-col gap-6">
              <input type="hidden" name="providerSlug" value={provider.slug} />
              <input type="hidden" name="serviceId" value={selectedService.id} />

              <section className="surface flex flex-col gap-3">
                <h2 className="text-lg font-medium">{t("chooseTime")}</h2>
                <SlotPicker
                  slots={slots}
                  timeZone={provider.timezone}
                  locale={locale}
                  name="slotId"
                  emptyLabel={t("noSlots")}
                />
              </section>

              {slots.length > 0 ? (
                <section className="surface flex flex-col gap-3">
                  <h2 className="text-lg font-medium">{t("yourDetails")}</h2>
                  <label className="flex flex-col gap-1 text-sm">
                    {t("name")}
                    <input
                      name="name"
                      autoComplete="name"
                      required
                      maxLength={80}
                      className="field"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    {t("email")}
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="field"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    {t("phone")}
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      maxLength={32}
                      className="field"
                    />
                  </label>
                  <p className="text-sm text-[var(--muted)]">{t("privacyNote")}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {t("cancelPolicy", { hours: GUEST_MODIFY_CUTOFF_HOURS })}
                  </p>
                  <button type="submit" className="btn btn-primary">
                    {t("submit")}
                  </button>
                </section>
              ) : null}
            </form>
          </>
        )}
      </PageMain>
    </>
  );
}
