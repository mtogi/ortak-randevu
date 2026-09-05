"use server";

import { signIn, signOut } from "@/auth";
import { isValidEmail } from "@/lib/identity";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  if (!isValidEmail(email)) {
    redirect("/login?error=invalid-email");
  }

  try {
    await signIn("nodemailer", {
      email,
      redirectTo: "/me",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=send");
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
