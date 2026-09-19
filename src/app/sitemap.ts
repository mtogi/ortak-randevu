import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/client";
import { listPublicBookingSlugs, publicBookingPath } from "@/lib/identity";
import { canonicalSiteOrigin } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const providers = await listPublicBookingSlugs(prisma);
  return [
    {
      url: canonicalSiteOrigin,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...providers.map((provider) => ({
      url: `${canonicalSiteOrigin}${publicBookingPath(provider.slug)}`,
      lastModified: provider.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
