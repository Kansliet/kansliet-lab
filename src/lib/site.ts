/**
 * Single source of truth for the site's canonical origin. Used by metadata,
 * sitemap, robots, and structured data. Trailing slash stripped so string
 * templates like `${SITE_URL}/works` never produce a double slash.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://kansliet.co";

/**
 * Origin for absolute URLs we hand to third parties (Stripe success/cancel
 * URLs). Deliberately NOT derived from the request's Host header, which the
 * client controls — that would let anyone mint a Checkout Session on our
 * Stripe account that redirects to their domain after payment.
 */
export function getAppBaseUrl(): string {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV !== "production") {
    return `http://localhost:${process.env.PORT ?? 3000}`;
  }
  return SITE_URL;
}
