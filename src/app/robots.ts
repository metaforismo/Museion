import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site/config";

export default function robots(): MetadataRoute.Robots {
  return SITE.indexing ? {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/login", "/signup", "/dashboard", "/welcome", "/library", "/courses/", "/lessons/", "/learn/", "/create", "/review", "/progress", "/settings", "/account"] },
    sitemap: `${SITE.origin}/sitemap.xml`,
  } : { rules: { userAgent: "*", disallow: "/" } };
}
