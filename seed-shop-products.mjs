// Seeds placeholder shop products (Stripe product/price + DB row).
// Usage: node seed-shop-products.mjs
// Safe to re-run: a slug already in shop_products keeps its Stripe product
// and price (so no duplicate Stripe test objects pile up) and only gets its
// catalog fields refreshed. Price changes to an existing slug are NOT applied
// here — Stripe prices are immutable; create a new price in the dashboard.
// image_url is left NULL: the shop renders a typographic placeholder until a
// real photo URL is set on the row.
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
  {
    slug: "desk-print-02",
    name: "Desk Print — No. 02",
    description:
      "Giclée print, 30x40cm, unframed. Second in the series: section drawings from the studio archive.",
    amount: 4500,
    soldOut: false,
    category: "prints",
  },
  {
    slug: "dossier-poster",
    name: "Dossier Poster 50x70",
    description:
      "Offset-printed poster on uncoated 170g stock. The studio's reference sheet, in full.",
    amount: 3200,
    soldOut: false,
    category: "prints",
  },
  {
    slug: "work-shirt",
    name: "Work Shirt",
    description:
      "Heavy cotton twill overshirt with two chest pockets and a woven label. Boxy fit.",
    amount: 9500,
    soldOut: false,
    category: "apparel",
  },
  {
    slug: "logo-tee",
    name: "Logo Tee",
    description:
      "Organic cotton t-shirt, 220g, with the K(DC) mark printed on the chest.",
    amount: 3800,
    soldOut: true,
    category: "apparel",
  },
  {
    slug: "document-folder",
    name: "Document Folder",
    description:
      "A4 folder in grey board with elastic closure and a printed index label.",
    amount: 2400,
    soldOut: false,
    category: "stationery",
  },
  {
    slug: "brass-pen-tray",
    name: "Brass Pen Tray",
    description:
      "Machined solid brass tray, 220x60mm. Develops a patina with use.",
    amount: 6500,
    soldOut: false,
    category: "objects",
  },
  {
    slug: "concrete-bookend",
    name: "Concrete Bookend",
    description:
      "Cast concrete bookend with a felt base, sold individually. Each cast is slightly different.",
    amount: 5500,
    soldOut: false,
    category: "objects",
  },
  {
    slug: "desk-tray",
    name: "Desk Tray",
    description:
      "Powder-coated steel tray with folded edges, in signal grey. Holds A4.",
    amount: 4800,
    soldOut: false,
    category: "homeware",
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const { rows: existingRows } = await pool.query(
    "SELECT slug, stripe_product_id, stripe_price_id FROM shop_products"
  );
  const existing = new Map(existingRows.map((row) => [row.slug, row]));

  for (const product of products) {
    let stripeProductId;
    let stripePriceId;

    const current = existing.get(product.slug);
    if (current) {
      stripeProductId = current.stripe_product_id;
      stripePriceId = current.stripe_price_id;
    } else {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
      });
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: product.amount,
        currency: "eur",
      });
      stripeProductId = stripeProduct.id;
      stripePriceId = stripePrice.id;
    }

    const { rows } = await pool.query(
      `INSERT INTO shop_products (slug, name, description, image_url, stripe_product_id, stripe_price_id, sold_out, category)
       VALUES ($1, $2, $3, NULL, $4, $5, $6, $7)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         image_url = EXCLUDED.image_url,
         sold_out = EXCLUDED.sold_out,
         category = EXCLUDED.category
       RETURNING id, slug`,
      [
        product.slug,
        product.name,
        product.description,
        stripeProductId,
        stripePriceId,
        product.soldOut,
        product.category,
      ]
    );

    console.log(current ? "Updated:" : "Created:", rows[0]);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
