// Seeds placeholder store products (Stripe product/price + DB row).
// Usage: node seed-store-products.mjs
// Safe to re-run: a slug already in shop_products keeps its Stripe price (so
// no duplicate Stripe test objects pile up); its catalog fields are refreshed
// and the Stripe product's name/description are synced. Price changes to an
// existing slug are NOT applied here — Stripe prices are immutable; create a
// new price in the dashboard.
// Day-to-day catalog edits (new products, stock, photos) belong in
// /admin/products; this script only bootstraps a fresh database.
// image_url is left NULL: the store renders a typographic placeholder until a
// real photo URL is set on the row. All copy below is placeholder.
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
    category: "bags",
    amount: 3500,
    soldOut: false,
    tagline: "A carry-all cut from the same canvas we wrap our models in.",
    description: [
      "Heavyweight 16 oz cotton canvas, screen-printed on one side with the studio wordmark in signal grey. The gusset takes an A3 portfolio flat; the long handles sit on the shoulder over a winter coat.",
      "Unlined on purpose: the inside seams are bound, not hidden, so you can see how it is made. It softens and creases with use, and gets better for it.",
    ],
    specs: [
      { label: "Material", value: "16 oz cotton canvas" },
      { label: "Dimensions", value: "42 × 38 × 10 cm" },
      { label: "Handles", value: "68 cm, webbing" },
      { label: "Print", value: "Water-based screen print" },
      { label: "Made in", value: "Portugal" },
      { label: "Care", value: "Cold wash, line dry" },
    ],
  },
  {
    slug: "grid-notebook",
    name: "Grid Notebook A5",
    category: "stationery",
    amount: 1800,
    soldOut: false,
    tagline: "The notebook every Kansliet project starts in.",
    description: [
      "160 pages of 100 g paper printed with a 5 mm dot grid, fine enough to disappear under a sketch and firm enough to hold a layout. Section-sewn so it opens flat on the desk.",
      "Grey board covers, blind-debossed K(DC) mark, rounded corners. Numbered pages and a blank index at the front, because references matter.",
    ],
    specs: [
      { label: "Format", value: "A5, 148 × 210 mm" },
      { label: "Pages", value: "160, numbered" },
      { label: "Paper", value: "100 g, 5 mm dot grid" },
      { label: "Binding", value: "Section-sewn, lays flat" },
      { label: "Made in", value: "Sweden" },
    ],
  },
  {
    slug: "desk-print-01",
    name: "Desk Print — No. 01",
    category: "prints",
    amount: 4500,
    soldOut: false,
    tagline: "A plan view of the studio desk, drawn at 1:5.",
    description: [
      "The first in an ongoing series of drawings of the objects we work with every day. Printed as a giclée on 308 g cotton rag with archival pigment inks.",
      "Unframed and shipped rolled in a tube. Each print is numbered and blind-stamped on the lower margin.",
    ],
    specs: [
      { label: "Size", value: "30 × 40 cm" },
      { label: "Paper", value: "308 g cotton rag" },
      { label: "Process", value: "Giclée, pigment inks" },
      { label: "Edition", value: "Open, numbered" },
      { label: "Framing", value: "Unframed" },
    ],
  },
  {
    slug: "ceramic-mug",
    name: "Ceramic Mug",
    category: "homeware",
    amount: 2200,
    soldOut: false,
    tagline: "A cylinder, a handle, and nothing else.",
    description: [
      "Stoneware thrown in a small workshop, finished in a matte grey glaze outside and a gloss white inside, so the coffee is the only colour in the cup.",
      "The handle is set low for a four-finger grip. Every glaze firing varies slightly; no two are quite the same.",
    ],
    specs: [
      { label: "Material", value: "Stoneware" },
      { label: "Volume", value: "300 ml" },
      { label: "Dimensions", value: "Ø 8 × 9.5 cm" },
      { label: "Finish", value: "Matte out, gloss in" },
      { label: "Care", value: "Dishwasher safe" },
    ],
  },
  {
    slug: "sticker-pack",
    name: "Sticker Pack",
    category: "stationery",
    amount: 900,
    soldOut: true,
    tagline: "Six marks from six projects.",
    description: [
      "Die-cut vinyl stickers of identity marks we have drawn for clients and for ourselves, from first sketch to final lockup.",
      "Matte laminate, weatherproof, sized for a laptop lid or a flight case.",
    ],
    specs: [
      { label: "Contents", value: "6 stickers" },
      { label: "Material", value: "Matte vinyl, laminated" },
      { label: "Size", value: "40–80 mm" },
      { label: "Made in", value: "Sweden" },
    ],
  },
  {
    slug: "wool-beanie",
    name: "Wool Beanie",
    category: "apparel",
    amount: 4000,
    soldOut: false,
    tagline: "Worn on every site visit from October to April.",
    description: [
      "Fine-gauge merino rib, knitted double so it holds its shape and keeps the wind out. A small woven tab on the cuff, no logo on the front.",
      "One size, with enough length to wear folded or slouched.",
    ],
    specs: [
      { label: "Material", value: "100% merino wool" },
      { label: "Knit", value: "Double-layer rib" },
      { label: "Size", value: "One size" },
      { label: "Colour", value: "Signal grey" },
      { label: "Made in", value: "Scotland" },
      { label: "Care", value: "Hand wash cold" },
    ],
  },
  {
    slug: "desk-print-02",
    name: "Desk Print — No. 02",
    category: "prints",
    amount: 4500,
    soldOut: false,
    tagline: "Section drawings from the studio archive.",
    description: [
      "The second print in the series: three sections through objects from past projects, set on one sheet at matching scale.",
      "Giclée on 308 g cotton rag, unframed and shipped rolled. Numbered and blind-stamped.",
    ],
    specs: [
      { label: "Size", value: "30 × 40 cm" },
      { label: "Paper", value: "308 g cotton rag" },
      { label: "Process", value: "Giclée, pigment inks" },
      { label: "Edition", value: "Open, numbered" },
      { label: "Framing", value: "Unframed" },
    ],
  },
  {
    slug: "dossier-poster",
    name: "Dossier Poster 50x70",
    category: "prints",
    amount: 3200,
    soldOut: false,
    tagline: "The studio's reference sheet, in full.",
    description: [
      "Every mark, typeface, grid and colour value in the Kansliet system, laid out on one sheet the way we pin it above the desk.",
      "Offset-printed in two Pantone colours on uncoated 170 g stock. Shipped rolled.",
    ],
    specs: [
      { label: "Size", value: "50 × 70 cm" },
      { label: "Paper", value: "170 g uncoated" },
      { label: "Process", value: "Offset, 2 Pantone" },
      { label: "Edition", value: "250" },
      { label: "Made in", value: "Sweden" },
    ],
  },
  {
    slug: "work-shirt",
    name: "Work Shirt",
    category: "apparel",
    amount: 9500,
    soldOut: false,
    tagline: "A studio uniform, cut boxy enough to layer.",
    description: [
      "Heavy cotton twill overshirt with two flap chest pockets, a pen slot on the left sleeve and horn buttons. Garment-washed so it arrives already broken in.",
      "Cut straight and short in the body to wear open over a tee or closed as a light jacket.",
    ],
    specs: [
      { label: "Material", value: "12 oz cotton twill" },
      { label: "Fit", value: "Boxy, cropped" },
      { label: "Sizes", value: "S – XL" },
      { label: "Buttons", value: "Horn" },
      { label: "Made in", value: "Portugal" },
      { label: "Care", value: "Wash 30°, line dry" },
    ],
  },
  {
    slug: "logo-tee",
    name: "Logo Tee",
    category: "apparel",
    amount: 3800,
    soldOut: true,
    tagline: "The K(DC) mark, small, on the chest.",
    description: [
      "Organic cotton jersey in a 220 g weight, with a ribbed collar that keeps its shape wash after wash.",
      "The mark is printed small on the left chest. Nothing on the back.",
    ],
    specs: [
      { label: "Material", value: "220 g organic cotton" },
      { label: "Fit", value: "Regular" },
      { label: "Sizes", value: "XS – XXL" },
      { label: "Print", value: "Water-based" },
      { label: "Care", value: "Wash 30°" },
    ],
  },
  {
    slug: "document-folder",
    name: "Document Folder",
    category: "stationery",
    amount: 2400,
    soldOut: false,
    tagline: "For drawings that shouldn't be folded.",
    description: [
      "An A4 folder in 2 mm grey board with a black elastic closure and a printed index label on the spine, the same one we send client presentations in.",
      "Holds around 60 sheets. The board is recycled and the corners are left raw.",
    ],
    specs: [
      { label: "Format", value: "A4, holds ~60 sheets" },
      { label: "Material", value: "2 mm recycled board" },
      { label: "Closure", value: "Elastic band" },
      { label: "Made in", value: "Sweden" },
    ],
  },
  {
    slug: "brass-pen-tray",
    name: "Brass Pen Tray",
    category: "objects",
    amount: 6500,
    soldOut: false,
    tagline: "A single piece of brass, machined and left to age.",
    description: [
      "Milled from solid brass bar with a shallow radius that holds three pens and a scalpel. Left uncoated, so it darkens and takes on the marks of the desk.",
      "Heavy enough to stay put, with a felt base that won't scratch the surface underneath.",
    ],
    specs: [
      { label: "Material", value: "Solid brass, uncoated" },
      { label: "Dimensions", value: "220 × 60 × 12 mm" },
      { label: "Weight", value: "780 g" },
      { label: "Base", value: "Wool felt" },
      { label: "Made in", value: "Sweden" },
    ],
  },
  {
    slug: "concrete-bookend",
    name: "Concrete Bookend",
    category: "objects",
    amount: 5500,
    soldOut: false,
    tagline: "Cast by hand. Each one is slightly different.",
    description: [
      "A solid block of fibre-reinforced concrete, cast in a plywood mould and sanded by hand. Air bubbles and colour variation are part of the process, not flaws.",
      "Sold individually. Two make a pair; one holds up a short shelf of monographs on its own.",
    ],
    specs: [
      { label: "Material", value: "Fibre-reinforced concrete" },
      { label: "Dimensions", value: "150 × 100 × 180 mm" },
      { label: "Weight", value: "2.4 kg" },
      { label: "Base", value: "Wool felt" },
      { label: "Sold", value: "Individually" },
    ],
  },
  {
    slug: "desk-tray",
    name: "Desk Tray",
    category: "homeware",
    amount: 4800,
    soldOut: false,
    tagline: "Folded from one sheet of steel.",
    description: [
      "Laser-cut and press-braked from 1.5 mm steel, then powder-coated in signal grey. The folded edges are low enough to slide paper out from the side.",
      "Takes A4 flat, or stacks two high for an in/out pair.",
    ],
    specs: [
      { label: "Material", value: "1.5 mm steel" },
      { label: "Finish", value: "Powder-coated, signal grey" },
      { label: "Dimensions", value: "330 × 250 × 30 mm" },
      { label: "Fits", value: "A4, stackable" },
      { label: "Made in", value: "Sweden" },
    ],
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
      // Keep what Stripe Checkout shows in sync with the catalog copy.
      await stripe.products.update(stripeProductId, {
        name: product.name,
        description: product.tagline,
      });
    } else {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.tagline,
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
      // stock and image_url are set on first insert only; after that /admin/products and
      // paid orders own them, so a re-run never resets live stock or photos.
      `INSERT INTO shop_products (slug, name, tagline, description, specs, image_url, stripe_product_id, stripe_price_id, stock, category)
       VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         tagline = EXCLUDED.tagline,
         description = EXCLUDED.description,
         specs = EXCLUDED.specs,
         category = EXCLUDED.category
       RETURNING id, slug`,
      [
        product.slug,
        product.name,
        product.tagline,
        product.description.join("\n\n"),
        JSON.stringify(product.specs),
        stripeProductId,
        stripePriceId,
        product.soldOut ? 0 : 10,
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
