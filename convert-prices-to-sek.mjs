// One-off: moves every product from its EUR Stripe price to a new SEK price
// (EUR × 11, rounded to the nearest 10 kr) and archives the EUR price.
// Fine-tune the amounts in /admin/products afterwards.
//
// Usage (DRY RUN by default, prints the table and changes nothing):
//   node convert-prices-to-sek.mjs
//   node convert-prices-to-sek.mjs --apply
//
// Safe to re-run: products already priced in SEK are skipped. Uses
// DATABASE_URL and STRIPE_SECRET_KEY from the environment or .env.local.
import nextEnv from "@next/env";
import pg from "pg";
import Stripe from "stripe";

nextEnv.loadEnvConfig(process.cwd());

const apply = process.argv.includes("--apply");
const EUR_TO_SEK = 11;

const { DATABASE_URL, STRIPE_SECRET_KEY } = process.env;
if (!DATABASE_URL || !STRIPE_SECRET_KEY) {
  console.error("Set DATABASE_URL and STRIPE_SECRET_KEY.");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const { host, pathname } = new URL(DATABASE_URL);
  console.log(`${apply ? "APPLYING" : "DRY RUN"} against database ${host}${pathname}\n`);

  const { rows } = await pool.query(
    "SELECT id, slug, stripe_product_id, stripe_price_id FROM shop_products ORDER BY id"
  );

  let converted = 0;
  for (const row of rows) {
    const price = await stripe.prices.retrieve(row.stripe_price_id);
    if (price.currency === "sek") {
      console.log(`skip  ${row.slug} (already SEK)`);
      continue;
    }
    const eur = price.unit_amount / 100;
    const sekOre = Math.round((eur * EUR_TO_SEK) / 10) * 10 * 100;
    const line = `${row.slug}: ${eur.toFixed(2)} ${price.currency.toUpperCase()} → ${sekOre / 100} kr`;

    if (!apply) {
      console.log(`convert  ${line}`);
      converted++;
      continue;
    }

    const sekPrice = await stripe.prices.create({
      product: row.stripe_product_id,
      unit_amount: sekOre,
      currency: "sek",
    });
    await pool.query("UPDATE shop_products SET stripe_price_id = $1 WHERE id = $2", [
      sekPrice.id,
      row.id,
    ]);
    // Archived, not deleted: past orders still resolve the old price.
    await stripe.prices.update(price.id, { active: false });
    console.log(`done  ${line}`);
    converted++;
  }

  console.log(
    `\n${converted} ${apply ? "converted" : "to convert"}.` +
      (apply ? " The site's price cache refreshes within 5 minutes." : " Re-run with --apply to do it.")
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
