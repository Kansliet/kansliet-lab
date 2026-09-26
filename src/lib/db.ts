import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
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
    connectionString: process.env.DATABASE_URL,
    ...(process.env.VERCEL ? { max: 5, idleTimeoutMillis: 5_000 } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}
