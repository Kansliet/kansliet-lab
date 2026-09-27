// Runs before `next build` (see package.json). On a Vercel PREVIEW deployment
// it makes the preview's own Neon branch usable; everywhere else it does
// nothing.
//
// Why: all previews share one Neon branch, `preview`, a copy of the live
// database, but previews run with the TEST Stripe key, which can't see live
// prices, so store pages failed ("No such price"). This:
//   1. applies db/migrations/*.sql (all written to be re-runnable), so a
//      preview has the schema its code expects;
//   2. hides products whose Stripe price the test key can't see (the live
//      catalog), in this branch only;
//   3. seeds the demo catalog with test-mode prices (seed-store-products.mjs,
//      which reuses its Stripe prices across previews).
//
// Guards, since this writes to a database: it only runs against the `preview`
// branch's endpoint (allow-list below; anything else, `main` included, is
// refused) and only with a test Stripe key. Previews must never use main.
//
// Local rehearsal against the Docker database: node prepare-preview-db.mjs --local
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

// The shared `preview` Neon branch's endpoint (host "ep-…", pooled or not).
// The only database a preview build may touch.
const PREVIEW_ENDPOINT = "ep-little-wave-b1wlsic1";

const endpointOf = (url) => new URL(url).hostname.split(".")[0].replace(/-pooler$/, "");

const urls = [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED].filter(Boolean);
if (urls.length === 0) {
  console.error("prepare-preview-db: no DATABASE_URL; refusing to build a preview without its database.");
  process.exit(1);
}
const allowed = (url) =>
  endpointOf(url) === PREVIEW_ENDPOINT || (local && ["localhost", "127.0.0.1"].includes(new URL(url).hostname));
if (!urls.every(allowed)) {
  console.error(
    `prepare-preview-db: REFUSING. Previews may only use the Neon \`preview\` branch (${PREVIEW_ENDPOINT}); ` +
      "this deployment's DATABASE_URL points elsewhere. Check the Preview env vars in Vercel."
  );
  process.exit(1);
}
if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
  console.error("prepare-preview-db: REFUSING. Previews must run with a test Stripe key (sk_test_…).");
  process.exit(1);
}

// Schema changes need a direct connection, not Neon's pooler.
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
log(`database endpoint: ${local ? "localhost (rehearsal)" : `${endpointOf(connectionString)} (preview branch)`}.`);
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
