import { describe, expect, it } from "vitest";
import {
  canonicalSiteOrigin,
  openGraphLocale,
  serializeJsonLd,
  siteJsonLd,
  siteMetadataBase,
  siteRobots,
  siteShareMetadata,
} from "./seo";

describe("site metadata origin", () => {
  it("is the canonical www origin", () => {
    expect(canonicalSiteOrigin).toBe("https://www.ortakrandevu.com");
    expect(siteMetadataBase().origin).toBe(canonicalSiteOrigin);
  });
});

describe("openGraphLocale", () => {
  it("maps cookie locales without URL prefixes", () => {
    expect(openGraphLocale("tr")).toBe("tr_TR");
    expect(openGraphLocale("en")).toBe("en_US");
  });
});

describe("siteShareMetadata", () => {
  it("emits a complete website OG block from existing copy", () => {
    const meta = siteShareMetadata({
      name: "Ortak Randevu",
      description: "Easy scheduling for anyone who takes bookings.",
      locale: "en",
      canonicalPath: "/",
    });
    expect(meta.openGraph).toMatchObject({
      type: "website",
      locale: "en_US",
      siteName: "Ortak Randevu",
      url: "/",
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.alternates).toEqual({ canonical: "/" });
  });
});

describe("siteRobots", () => {
  it("allows public pages and keeps /me, auth, guest links, and APIs out", () => {
    const robots = siteRobots();
    expect(robots.sitemap).toBe(`${canonicalSiteOrigin}/sitemap.xml`);
    expect(robots.host).toBe("www.ortakrandevu.com");
    expect(robots.rules).toMatchObject({
      userAgent: "*",
      allow: "/",
    });
    expect(robots.rules).toEqual(
      expect.objectContaining({
        disallow: ["/me", "/login", "/bookings", "/api"],
      }),
    );
  });
});

describe("siteJsonLd", () => {
  it("emits Organization and WebSite from existing copy, not SoftwareApplication", () => {
    const data = siteJsonLd({
      name: "Ortak Randevu",
      description: "Easy scheduling for anyone who takes bookings.",
    });
    const types = data["@graph"].map((node) => node["@type"]);
    expect(types).toEqual(["Organization", "WebSite"]);
    expect(JSON.stringify(data)).not.toMatch(
      /SoftwareApplication|aggregateRating|"offers"|Medical/,
    );
    expect(data["@graph"][0]).toMatchObject({
      url: canonicalSiteOrigin,
      areaServed: { "@type": "Country", name: "Turkey" },
      logo: { url: `${canonicalSiteOrigin}/apple-icon`, width: 180, height: 180 },
    });
    expect(data["@graph"][1]).toMatchObject({
      inLanguage: ["tr", "en"],
      publisher: { "@id": `${canonicalSiteOrigin}/#organization` },
    });
    expect(serializeJsonLd({ html: "<br>" })).toContain("\\u003c");
  });
});
