import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// pg currently treats sslmode=prefer/require/verify-ca as verify-full, warns on
// every cold start, and will switch them to the weaker libpq meaning (no
// certificate check) in its next major. Neon's URLs say "require", so pin the
// strict mode explicitly: same behaviour today, no warning, no silent downgrade.
export function withStrictSsl(url: string): string {
  return url.replace(/([?&]sslmode=)(prefer|require|verify-ca)(?=&|$)/, "$1verify-full");
}

// Reuse the pool across hot reloads in dev so we don't exhaust Postgres connections.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

// On Vercel every function instance gets its own pool, so the default max of 10
// multiplies by instance count and can exhaust a small hosted Postgres. Keep a
// few connections (Fluid compute serves concurrent requests per instance, and
// the webhook holds one for its transaction), release idle ones fast, and use
// the provider's *pooled* connection string as DATABASE_URL in production.
export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: withStrictSsl(process.env.DATABASE_URL),
    ...(process.env.VERCEL ? { max: 5, idleTimeoutMillis: 5_000 } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}
