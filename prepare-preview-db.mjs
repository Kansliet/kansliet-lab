// Runs before `next build` (see package.json). On a Vercel PREVIEW deployment
// it makes the preview's own Neon branch usable; everywhere else it does
// nothing.
//
// Why: the Vercel–Neon integration gives every preview a copy of the live
// database, but previews run with the TEST Stripe key, which can't see live
// prices, so every store page failed ("No such price"). This:
//   1. applies db/migrations/*.sql (all written to be re-runnable), so a
//      preview has the schema its code expects;
//   2. hides products whose Stripe price the test key can't see (the live
//      catalog), in this branch only;
//   3. seeds the demo catalog with test-mode prices (seed-store-products.mjs,
//      which reuses its Stripe prices across previews).
//
// Guards, since this writes to a database: it refuses to run against the
// live `main` branch (its endpoint's fingerprint is below) and with anything
// but a test Stripe key. Previews must never use main.
//
// Local rehearsal against the Docker database: node prepare-preview-db.mjs --local
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";
import pg from "pg";
import Stripe from "stripe";

const local = process.argv.includes("--local");
if (local) nextEnv.loadEnvConfig(process.cwd());

const log = (message) => console.log(`prepare-preview-db: ${message}`);

if (process.env.VERCEL_ENV !== "preview" && !local) {
  log(`not a preview (${process.env.VERCEL_ENV ?? "no VERCEL_ENV"}), nothing to do.`);
  process.exit(0);
}

// SHA-256 of the live `main` branch's Neon endpoint id ("ep-…", without
// "-pooler"), so the id itself isn't in the repo.
const MAIN_ENDPOINT_SHA256 = "4a0ae21063a0f99f379d7e6dc1943a97e9a8e1292fa8f7bd756abe7f86e1a70a";

const endpointFingerprint = (url) => {
  const endpoint = new URL(url).hostname.split(".")[0].replace(/-pooler$/, "");
  return createHash("sha256").update(endpoint).digest("hex");
};

const urls = [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED].filter(Boolean);
if (urls.length === 0) {
  console.error("prepare-preview-db: no DATABASE_URL; refusing to build a preview without its own database.");
  process.exit(1);
}
if (urls.some((url) => endpointFingerprint(url) === MAIN_ENDPOINT_SHA256)) {
  console.error(
    "prepare-preview-db: REFUSING. This preview's DATABASE_URL points at the live `main` Neon branch. " +
      "Previews must use their own branch: check the Neon integration and the Preview env vars in Vercel."
  );
  process.exit(1);
}
if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
  console.error("prepare-preview-db: REFUSING. Previews must run with a test Stripe key (sk_test_…).");
  process.exit(1);
}

// Schema changes need a direct connection, not Neon's pooler.
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

try {
  // 1. Schema.
  const migrations = readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort();
  for (const file of migrations) {
    await pool.query(readFileSync(`db/migrations/${file}`, "utf8"));
  }
  log(`applied ${migrations.length} migrations.`);

  // 2. Hide what the test key can't sell.
  const { rows } = await pool.query(
    `SELECT DISTINCT p.id, v.stripe_price_id FROM shop_products p
     JOIN shop_variants v ON v.product_id = p.id WHERE NOT p.hidden`
  );
  const unreachable = new Set();
  for (const row of rows) {
    try {
      await stripe.prices.retrieve(row.stripe_price_id);
    } catch (err) {
      if (err?.code === "resource_missing") unreachable.add(row.id);
      else throw err;
    }
  }
  if (unreachable.size > 0) {
    await pool.query("UPDATE shop_products SET hidden = true WHERE id = ANY($1)", [[...unreachable]]);
  }
  log(`hid ${unreachable.size} product(s) with live-only prices.`);
} finally {
  await pool.end();
}

// 3. Demo catalog with test prices.
const seed = spawnSync(process.execPath, ["seed-store-products.mjs"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: connectionString },
});
if (seed.status !== 0) {
  console.error("prepare-preview-db: seeding the demo catalog failed.");
  process.exit(seed.status ?? 1);
}
log("done.");
