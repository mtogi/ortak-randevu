"use client";

import { Analytics } from "@vercel/analytics/next";
import { analyticsBeforeSend } from "@/lib/analytics";

/** Client wrapper: `beforeSend` cannot be passed from the server layout. */
export function VercelAnalytics() {
  return <Analytics beforeSend={analyticsBeforeSend} />;
}
