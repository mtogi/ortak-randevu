"use server";

import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { setLocale } from "@/i18n/actions";
import { prisma } from "@/lib/db/client";
import {
  getActiveProviderById,
  ProfileValidationError,
  scrubProviderAccount,
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

export async function deleteAccountAction(formData: FormData) {
  const session = await auth();
  if (!session?.providerId) redirect("/login");
  const provider = await getActiveProviderById(prisma, session.providerId);
  if (!provider) redirect("/login");

  if (String(formData.get("confirm") ?? "") !== "delete") {
    redirect("/me/settings?error=DELETE_CONFIRM");
  }

  await scrubProviderAccount(prisma, provider.id);
  await signOut({ redirectTo: "/login?deleted=1" });
}
