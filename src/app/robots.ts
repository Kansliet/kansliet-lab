import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/login", "/store/cart", "/store/orders", "/store/success"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
