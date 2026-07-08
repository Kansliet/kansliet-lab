/**
 * Single source of truth for the site's canonical origin. Used by metadata,
 * sitemap, robots, and structured data. Trailing slash stripped so string
 * templates like `${SITE_URL}/works` never produce a double slash.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://kansliet.co";
