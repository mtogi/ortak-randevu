"use server";

import { redirect } from "next/navigation";
import { setLocale } from "@/i18n/actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import {
  getActiveProviderById,
  ProfileValidationError,
  updateProviderProfile,
} from "@/lib/identity";

export async function saveSettingsAction(formData: FormData) {
  const session = await auth();
  if (!session?.providerId) redirect("/login");
  const provider = await getActiveProviderById(prisma, session.providerId);
  if (!provider) redirect("/login");

  try {
    const updated = await updateProviderProfile(prisma, provider.id, {
      name: String(formData.get("name") ?? ""),
      locale: String(formData.get("locale") ?? ""),
    });
    const localeData = new FormData();
    localeData.set("locale", updated.locale);
    await setLocale(localeData);
  } catch (error) {
    if (error instanceof ProfileValidationError) {
      redirect(`/me/settings?error=${encodeURIComponent(error.code)}`);
    }
    throw error;
  }

  redirect("/me/settings?saved=1");
}
