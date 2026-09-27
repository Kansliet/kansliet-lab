import { projects } from "@/data/projects";
import { SITE_URL } from "@/lib/site";
import { STORE_ENABLED } from "@/lib/store-flag";
import { getProducts } from "@/lib/products";
import type { MetadataRoute } from "next";

// Last meaningful change to static-page copy (studio rewrite, 2026-07-08).
// Fixed, not new Date() — a date that moves every deploy trains crawlers to
// distrust the sitemap. Bump this when static copy actually changes.
const LAUNCH_DATE = new Date("2026-07-08");

// Product pages come from the database, so rebuild the sitemap hourly rather
// than only at deploy time.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Routes
  // /store only once it's open (see lib/store-flag).
  const routes = ["", "/works", "/studio", ...(STORE_ENABLED ? ["/store"] : []), "/contact", "/legal", "/terms", "/privacy"].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: LAUNCH_DATE,
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // 2. Dynamic Project Routes — each stamped with its own content date.
  const projectRoutes = projects.map((project) => ({
    url: `${SITE_URL}/works/${project.id}`,
    lastModified: new Date(project.updatedAt),
    changeFrequency: "yearly" as const,
    priority: 0.9, // High priority for your actual work
  }));

  // 3. Product pages (visible products only; getProducts leaves hidden ones out).
  const productRoutes = STORE_ENABLED
    ? (await getProducts()).map((product) => ({
        url: `${SITE_URL}/store/${product.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    : [];

  return [...routes, ...projectRoutes, ...productRoutes];
}
