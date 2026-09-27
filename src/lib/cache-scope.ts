/**
 * Part of every cross-request cache key (catalog, Stripe price map), so
 * production and each preview branch never read each other's entries: a
 * preview's database holds a demo catalog with test-mode prices (see
 * prepare-preview-db.mjs), which must never reach the live store.
 */
export const CACHE_SCOPE =
  process.env.VERCEL_ENV === "production"
    ? "production"
    : `${process.env.VERCEL_ENV ?? "local"}:${process.env.VERCEL_GIT_COMMIT_REF ?? ""}`;
