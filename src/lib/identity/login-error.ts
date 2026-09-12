export type AuthPageErrorKey =
  "invalidEmail" | "sendFailed" | "googleFailed" | "signInDenied";

const GOOGLE_ERRORS = new Set([
  "OAuthSignin",
  "OAuthCallback",
  "OAuthCreateAccount",
  "OAuthAccountNotLinked",
  "Callback",
  "google",
]);

/** Map Auth.js /login?error=… (and our own redirects) to next-intl keys. */
export function authPageErrorKey(error: string | undefined): AuthPageErrorKey | null {
  if (!error) return null;
  if (error === "invalid-email") return "invalidEmail";
  if (error === "AccessDenied") return "signInDenied";
  if (GOOGLE_ERRORS.has(error)) return "googleFailed";
  return "sendFailed";
}
