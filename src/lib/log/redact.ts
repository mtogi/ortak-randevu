// Application-log redaction for capability secrets (ADR-005) and PII.
// Vercel/CDN access logs are a separate, limited surface — see
// docs/legal/PRIVACY-NOTES.md §Logging.

const SECRET_QUERY_KEYS = new Set(["t", "token", "email", "callbackurl"]);

function shouldRedactQueryKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (SECRET_QUERY_KEYS.has(lower)) return true;
  return lower.includes("token") || lower.includes("secret");
}

/** Replace guest `?t=`, magic-link `token`, and similar query values. */
export function redactUrl(raw: string): string {
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (shouldRedactQueryKey(key)) {
        url.searchParams.set(key, "[redacted]");
      }
    }
    return url.toString();
  } catch {
    return "[unparseable-url]";
  }
}

const EMAIL_LIKE = /[^\s@/,;]+@[^\s@/,;]+/g;
const PHONE_LIKE = /\+?\d[\d ()./-]{6,}\d/g;

/** Strip email/phone-shaped substrings from a log line when avoidable. */
export function redactPii(text: string): string {
  return text.replace(EMAIL_LIKE, "[email]").replace(PHONE_LIKE, "[phone]");
}
