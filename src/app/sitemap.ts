import { projects } from "@/data/projects";
import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

// Last meaningful change to static-page copy (studio rewrite, 2026-07-08).
// Fixed, not new Date() — a date that moves every deploy trains crawlers to
// distrust the sitemap. Bump this when static copy actually changes.
const LAUNCH_DATE = new Date("2026-07-08");

export default function sitemap(): MetadataRoute.Sitemap {
  // 1. Static Routes
  const routes = ["", "/works", "/studio", "/contact", "/legal"].map((route) => ({
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

  return [...routes, ...projectRoutes];
}
