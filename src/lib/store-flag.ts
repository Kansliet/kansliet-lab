/**
 * Whether the store is open to the public. Open by default (launched
 * 2026-09-26). To close it again, e.g. for a stock-take or before a relaunch,
 * set NEXT_PUBLIC_STORE_ENABLED=false in Vercel and redeploy: the INDEX link
 * and sitemap entry disappear, and /store answers 404 to everyone but a
 * logged-in admin (who keeps a preview). It's read at build time
 * (NEXT_PUBLIC_), so a redeploy is what flips it.
 */
export const STORE_ENABLED = process.env.NEXT_PUBLIC_STORE_ENABLED !== "false";
