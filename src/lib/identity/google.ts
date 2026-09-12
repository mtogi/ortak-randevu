/**
 * Optional Google sign-in (Q-T15). Magic link stays primary (Q-T3).
 * The button and Auth.js Google provider are on only when both env vars are set.
 */

export function isGoogleSignInEnabled(): boolean {
  return Boolean(
    process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim(),
  );
}

/** Google OIDC sets `email_verified`; refuse unverified addresses. */
export function googleEmailIsVerified(
  profile: { email_verified?: boolean | null } | null | undefined,
): boolean {
  return profile?.email_verified === true;
}
