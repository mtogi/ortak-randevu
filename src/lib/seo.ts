import type { Metadata, MetadataRoute } from "next";
import type { Locale } from "@/i18n/config";

/** Public site origin. Apex redirects here. Used for metadataBase / canonical. */
export const canonicalSiteOrigin = "https://www.ortakrandevu.com";

export function siteMetadataBase(): URL {
  return new URL(canonicalSiteOrigin);
}

/** Open Graph locale (underscore). UI locale stays cookie `tr` | `en` (Q-T9). */
export function openGraphLocale(locale: Locale): "tr_TR" | "en_US" {
  return locale === "en" ? "en_US" : "tr_TR";
}

/** Full OG/Twitter block. Pass `canonicalPath` only on the page that owns that URL. */
export function siteShareMetadata({
  name,
  description,
  locale,
  canonicalPath,
}: {
  name: string;
  description: string;
  locale: Locale;
  canonicalPath?: string;
}): Pick<Metadata, "openGraph" | "twitter" | "alternates"> {
  return {
    ...(canonicalPath !== undefined ? { alternates: { canonical: canonicalPath } } : {}),
    openGraph: {
      type: "website",
      locale: openGraphLocale(locale),
      siteName: name,
      title: name,
      description,
      ...(canonicalPath !== undefined ? { url: canonicalPath } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },
  };
}

/** Dashboard, auth, guest manage links, and APIs are not for the index. */
export const robotsDisallowPaths = ["/me", "/login", "/bookings", "/api"] as const;

export const noindexMetadata = {
  robots: { index: false, follow: false },
} as const satisfies Pick<Metadata, "robots">;

export function siteRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...robotsDisallowPaths],
    },
    sitemap: `${canonicalSiteOrigin}/sitemap.xml`,
    host: "www.ortakrandevu.com",
  };
}

const organizationId = `${canonicalSiteOrigin}/#organization`;
const websiteId = `${canonicalSiteOrigin}/#website`;

/**
 * Organization + WebSite only. Skip SoftwareApplication: Google wants offers
 * or reviews for that type, and we have neither. No address, ratings, or
 * medical types.
 */
export function siteJsonLd({ name, description }: { name: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name,
        url: canonicalSiteOrigin,
        description,
        logo: {
          "@type": "ImageObject",
          url: `${canonicalSiteOrigin}/apple-icon`,
          width: 180,
          height: 180,
        },
        areaServed: {
          "@type": "Country",
          name: "Turkey",
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: canonicalSiteOrigin,
        name,
        description,
        inLanguage: ["tr", "en"],
        publisher: { "@id": organizationId },
      },
    ],
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
