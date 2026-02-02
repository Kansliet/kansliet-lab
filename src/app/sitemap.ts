import { projects } from "@/data/projects";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://kansliet.co";

  // 1. Static Routes
  const routes = ["", "/works", "/studio", "/contact", "/legal"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // 2. Dynamic Project Routes
  const projectRoutes = projects.map((project) => ({
    url: `${baseUrl}/works/${project.id}`,
    lastModified: new Date(), // In a real app, use the project's actual date
    changeFrequency: "monthly" as const,
    priority: 0.9, // High priority for your actual work
  }));

  return [...routes, ...projectRoutes];
}
