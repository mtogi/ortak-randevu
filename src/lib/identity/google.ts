/**
 * Optional Google sign-in (Q-T15). Magic link stays primary (Q-T3).
 * The button and Auth.js Google provider are on only when both env vars are set.
 */

export type GoogleOAuthCredentials = {
  clientId: string;
  clientSecret: string;
};

function readGoogleEnv(name: "AUTH_GOOGLE_ID" | "AUTH_GOOGLE_SECRET"): string {
  // Bracket access so Next.js does not inline an empty value at build time.
  const raw = process.env[name];
  return (raw ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

/** Trimmed credentials, or null if either var is missing. Never log these. */
export function googleOAuthCredentials(): GoogleOAuthCredentials | null {
  const clientId = readGoogleEnv("AUTH_GOOGLE_ID");
  const clientSecret = readGoogleEnv("AUTH_GOOGLE_SECRET");
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isGoogleSignInEnabled(): boolean {
  return googleOAuthCredentials() !== null;
}

/** Google OIDC sets `email_verified`; refuse unverified addresses. */
export function googleEmailIsVerified(
  profile: { email_verified?: boolean | null } | null | undefined,
): boolean {
  return profile?.email_verified === true;
}
