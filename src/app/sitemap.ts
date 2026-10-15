import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site/config";
import { PUBLIC_CONTENT_PATHS } from "@/lib/site/public-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  return SITE.indexing ? PUBLIC_CONTENT_PATHS.map((path) => ({ url: `${SITE.origin}${path}` })) : [];
}
