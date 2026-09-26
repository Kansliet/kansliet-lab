/**
 * Whether the store is open to the public. Off until launch: the INDEX link
 * and sitemap entry disappear, and /store answers 404 to everyone but a
 * logged-in admin (who can test purchases on the real site meanwhile).
 *
 * Set NEXT_PUBLIC_STORE_ENABLED=true in Vercel and redeploy to open it; it's
 * read at build time (NEXT_PUBLIC_), so a redeploy is what flips it. Locally
 * it defaults to on, so development isn't disrupted; set it to "false" in
 * .env.local to preview the hidden state.
 */
export const STORE_ENABLED =
  process.env.NEXT_PUBLIC_STORE_ENABLED === "true" ||
  (process.env.NEXT_PUBLIC_STORE_ENABLED !== "false" && process.env.NODE_ENV === "development");
