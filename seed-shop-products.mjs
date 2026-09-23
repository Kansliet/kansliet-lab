// One-off script to seed placeholder shop products (Stripe product/price + DB row).
// Usage: node seed-shop-products.mjs
// Re-running creates new Stripe products/prices each time (no Stripe-side idempotency here) —
// the DB row is upserted by slug, but old Stripe test objects are left behind.
import nextEnv from "@next/env";
import pg from "pg";
import Stripe from "stripe";

const { loadEnvConfig } = nextEnv;
const { Pool } = pg;

loadEnvConfig(process.cwd());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const products = [
  {
    slug: "canvas-tote",
    name: "Canvas Tote",
    description:
      "Heavyweight canvas tote, screen-printed with the studio wordmark. One size.",
    amount: 3500,
    soldOut: false,
    category: "bags",
  },
  {
    slug: "grid-notebook",
    name: "Grid Notebook A5",
    description:
      "Dot-grid notebook, 160 pages, stitched binding. Made for sketching layouts.",
    amount: 1800,
    soldOut: false,
    category: "stationery",
  },
  {
    slug: "desk-print-01",
    name: "Desk Print — No. 01",
    description:
      "Giclée print, 30x40cm, unframed. First in an ongoing series.",
    amount: 4500,
    soldOut: false,
    category: "prints",
  },
  {
    slug: "ceramic-mug",
    name: "Ceramic Mug",
    description: "Matte-glazed 300ml mug, dishwasher safe.",
    amount: 2200,
    soldOut: false,
    category: "homeware",
  },
  {
    slug: "sticker-pack",
    name: "Sticker Pack",
    description: "Set of 6 vinyl stickers from past project marks.",
    amount: 900,
    soldOut: true,
    category: "stationery",
  },
  {
    slug: "wool-beanie",
    name: "Wool Beanie",
    description: "Merino wool beanie, one size, embroidered tab.",
    amount: 4000,
    soldOut: false,
    category: "apparel",
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  for (const product of products) {
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
    });
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.amount,
      currency: "eur",
    });

    const label = encodeURIComponent(product.name);
    const imageUrl = `https://placehold.co/800x800/f4f4f5/71717a/png?text=${label}&font=roboto`;

    const { rows } = await pool.query(
      `INSERT INTO shop_products (slug, name, description, image_url, stripe_product_id, stripe_price_id, sold_out, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         image_url = EXCLUDED.image_url,
         stripe_product_id = EXCLUDED.stripe_product_id,
         stripe_price_id = EXCLUDED.stripe_price_id,
         sold_out = EXCLUDED.sold_out,
         category = EXCLUDED.category
       RETURNING id, slug`,
      [
        product.slug,
        product.name,
        product.description,
        imageUrl,
        stripeProduct.id,
        stripePrice.id,
        product.soldOut,
        product.category,
      ]
    );

    console.log("Seeded:", rows[0]);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
