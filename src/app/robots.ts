import type { MetadataRoute } from "next";
import { siteRobots } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return siteRobots();
}
