import type { BeforeSendEvent } from "@vercel/analytics";
import { redactUrl } from "@/lib/log/redact";
import { canonicalSiteOrigin } from "@/lib/seo";

/** Drop `/api` (auth tokens in query). Redact guest `?t=` and magic-link params. */
export function analyticsBeforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  let parsed: URL;
  try {
    parsed = new URL(event.url, canonicalSiteOrigin);
  } catch {
    return null;
  }
  if (parsed.pathname === "/api" || parsed.pathname.startsWith("/api/")) {
    return null;
  }
  return { ...event, url: redactUrl(parsed.toString()) };
}
