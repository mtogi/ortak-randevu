"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, localeCookieName } from "./config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setLocale(formData: FormData) {
  const requested = formData.get("locale");
  if (typeof requested !== "string" || !isLocale(requested)) return;

  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, requested, {
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/");
}
