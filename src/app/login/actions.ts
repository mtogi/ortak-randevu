"use server";

import { signIn, signOut } from "@/auth";
import { isGoogleSignInEnabled, isValidEmail, normalizeEmail } from "@/lib/identity";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function requestMagicLink(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
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

export async function requestGoogleSignIn() {
  if (!isGoogleSignInEnabled()) {
    redirect("/login?error=google");
  }

  try {
    await signIn("google", { redirectTo: "/me" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=google");
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
