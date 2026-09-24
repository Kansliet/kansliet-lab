// One-off, at launch: copies every catalog product from Stripe test mode (or
// a sandbox) into the live account and repoints shop_products at the copies.
// Without it, live keys can't see the test-mode product/price ids the rows
// hold, and every checkout fails.
//
// Usage (DRY RUN by default, prints the plan and changes nothing):
//   DATABASE_URL=<production url> \
//   STRIPE_SOURCE_KEY=sk_test_...  STRIPE_TARGET_KEY=sk_live_... \
//   node copy-products-to-live.mjs            # dry run
//   node copy-products-to-live.mjs --apply    # do it
//
// Per product: read the source price, re-upload the photo to the target's
// Stripe Files (test-mode files vanish if test data is ever deleted), create
// the target product + price, then update that one row. Safe to re-run after
// a failure: rows whose product already exists in the target are skipped.
// Stock, copy, hidden and order history are untouched.
//
// --allow-test lets the target be a test key, for a rehearsal against a copy
// of the database.
import nextEnv from "@next/env";
import pg from "pg";
import Stripe from "stripe";

const { loadEnvConfig } = nextEnv;
// Doesn't override variables already set, so DATABASE_URL on the command line
// wins over .env.local.
loadEnvConfig(process.cwd());

const apply = process.argv.includes("--apply");
const allowTest = process.argv.includes("--allow-test");

const { DATABASE_URL, STRIPE_SOURCE_KEY, STRIPE_TARGET_KEY } = process.env;
if (!DATABASE_URL || !STRIPE_SOURCE_KEY || !STRIPE_TARGET_KEY) {
  console.error("Set DATABASE_URL, STRIPE_SOURCE_KEY and STRIPE_TARGET_KEY (see the top of this file).");
  process.exit(1);
}
if (STRIPE_SOURCE_KEY === STRIPE_TARGET_KEY && !allowTest) {
  console.error("Source and target keys are the same.");
  process.exit(1);
}
if (!/^(sk|rk)_live_/.test(STRIPE_TARGET_KEY) && !allowTest) {
  console.error("STRIPE_TARGET_KEY is not a live key. Pass --allow-test for a rehearsal.");
  process.exit(1);
}

const source = new Stripe(STRIPE_SOURCE_KEY);
const target = new Stripe(STRIPE_TARGET_KEY);

async function existsInTarget(stripeProductId) {
  try {
    await target.products.retrieve(stripeProductId);
    return true;
  } catch (err) {
    if (err?.code === "resource_missing") return false;
    throw err;
  }
}

async function copyPhoto(imageUrl) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`photo download failed (${res.status}): ${imageUrl}`);
  const type = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  const file = await target.files.create({
    purpose: "business_logo",
    file: {
      data: Buffer.from(await res.arrayBuffer()),
      name: type === "image/png" ? "product.png" : "product.jpg",
      type,
    },
    file_link_data: { create: true },
  });
  const url = file.links?.data[0]?.url;
  if (!url) throw new Error("target Stripe returned no file link");
  return url;
}

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const { host, pathname } = new URL(DATABASE_URL);
  const dbHost = host + pathname;
  console.log(`${apply ? "APPLYING" : "DRY RUN"} against database ${dbHost}\n`);

  const { rows } = await pool.query(
    `SELECT id, slug, name, tagline, image_url, stripe_product_id, stripe_price_id
     FROM shop_products ORDER BY id`
  );

  let copied = 0;
  let skipped = 0;
  for (const row of rows) {
    if (await existsInTarget(row.stripe_product_id)) {
      console.log(`skip  ${row.slug} (already in target)`);
      skipped++;
      continue;
    }

    const price = await source.prices.retrieve(row.stripe_price_id);
    const amount = `${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`;
    if (!apply) {
      console.log(`copy  ${row.slug}: ${amount}${row.image_url ? " + photo" : ""}`);
      copied++;
      continue;
    }

    const imageUrl = row.image_url ? await copyPhoto(row.image_url) : null;
    const product = await target.products.create({
      name: row.name,
      description: row.tagline ?? undefined,
      images: imageUrl ? [imageUrl] : undefined,
    });
    const newPrice = await target.prices.create({
      product: product.id,
      unit_amount: price.unit_amount,
      currency: price.currency,
    });
    await pool.query(
      "UPDATE shop_products SET stripe_product_id = $1, stripe_price_id = $2, image_url = $3 WHERE id = $4",
      [product.id, newPrice.id, imageUrl, row.id]
    );
    console.log(`done  ${row.slug}: ${amount} → ${product.id}`);
    copied++;
  }

  console.log(
    `\n${copied} ${apply ? "copied" : "to copy"}, ${skipped} skipped.` +
      (apply ? "" : " Re-run with --apply to do it.")
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
