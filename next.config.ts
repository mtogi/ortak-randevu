import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next.js stdout only. Does not strip Vercel/CDN access logs (see
  // docs/legal/PRIVACY-NOTES.md §Logging). Skip paths that carry ?t= or
  // magic-link tokens so `next dev` does not print those query strings.
  logging: {
    incomingRequests: {
      ignore: [
        /\/api\/auth(?:\/|$)/,
        /\/bookings(?:\/|$)/,
        /\/api\/v1\/public\/bookings(?:\/|$)/,
      ],
    },
  },
};

export default withNextIntl(nextConfig);
