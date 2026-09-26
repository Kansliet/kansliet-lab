"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { pool } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { stripe, getPrice } from "@/lib/stripe";
import { STORE_CURRENCY } from "@/lib/shop-info";
import {
  MAX_PHOTO_BYTES,
  parseProductFields,
  parseStock,
  readProductFields,
  sanitizeImages,
  stockDelta,
  type ParsedProduct,
  type ProductFields,
} from "@/lib/product-form";

export type ProductFormState = {
  error: string | null;
  /** What was submitted, so the form re-renders with it after an error. */
  fields?: ProductFields;
};

const PHOTO_TYPES = ["image/jpeg", "image/png"];

/**
 * Uploads to Stripe Files and returns a public files.stripe.com link.
 * business_logo is the linkable purpose that fits an image (512 KB cap,
 * checked here too since the browser-side shrink can be bypassed).
 */
async function uploadPhoto(photo: File): Promise<string> {
  if (!PHOTO_TYPES.includes(photo.type) || photo.size > MAX_PHOTO_BYTES) {
    throw new Error("Photo must be a JPEG or PNG under 500 KB.");
  }
  const file = await stripe.files.create({
    purpose: "business_logo",
    file: {
      data: Buffer.from(await photo.arrayBuffer()),
      name: photo.name,
      type: photo.type,
    },
    file_link_data: { create: true },
  });
  const url = file.links?.data[0]?.url;
  if (!url) throw new Error("Stripe did not return a link for the photo.");
  return url;
}

async function slugTaken(slug: string, exceptId: number | null): Promise<boolean> {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM shop_products WHERE slug = $1 AND ($2::int IS NULL OR id <> $2)",
    [slug, exceptId]
  );
  return (rowCount ?? 0) > 0;
}

function revalidateStore(...slugs: string[]) {
  revalidatePath("/store");
  for (const slug of slugs) revalidatePath(`/store/${slug}`);
  revalidatePath("/admin/products");
}

// Stripe Checkout shows product images; its API takes at most 8.
const stripeImages = (images: string[]) => images.slice(0, 8);

async function createProduct(product: ParsedProduct, images: string[]) {
  const stripeProduct = await stripe.products.create({
    name: product.name,
    description: product.tagline ?? undefined,
    images: stripeImages(images),
  });

  try {
    const price = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.priceCents,
      currency: STORE_CURRENCY,
    });

    await pool.query(
      `INSERT INTO shop_products
         (slug, name, tagline, description, specs, images, stripe_product_id, stripe_price_id, stock, category, hidden)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        product.slug,
        product.name,
        product.tagline,
        product.description,
        JSON.stringify(product.specs),
        JSON.stringify(images),
        stripeProduct.id,
        price.id,
        product.stock,
        product.category,
        product.hidden,
      ]
    );
  } catch (err) {
    // Don't leave an orphan behind in the Stripe dashboard.
    await stripe.products.update(stripeProduct.id, { active: false }).catch(() => {});
    throw err;
  }
}

async function updateProduct(
  id: number,
  product: ParsedProduct,
  stockChange: number,
  buildImages: (current: string[]) => string[]
) {
  const { rows } = await pool.query<{
    slug: string;
    images: string[];
    stripe_product_id: string;
    stripe_price_id: string;
  }>(
    "SELECT slug, images, stripe_product_id, stripe_price_id FROM shop_products WHERE id = $1",
    [id]
  );
  const current = rows[0];
  if (!current) throw new Error("That product no longer exists.");

  const images = buildImages(current.images);

  // Stripe prices are immutable: a new amount means a new price object. The
  // old one is archived, not deleted, so past orders still resolve it.
  let priceId = current.stripe_price_id;
  const currentPrice = await getPrice(current.stripe_price_id);
  // Also on a currency change: a price object's currency can't be edited either.
  if (
    Math.round(currentPrice.amount * 100) !== product.priceCents ||
    currentPrice.currency.toLowerCase() !== STORE_CURRENCY
  ) {
    const price = await stripe.prices.create({
      product: current.stripe_product_id,
      unit_amount: product.priceCents,
      currency: STORE_CURRENCY,
    });
    priceId = price.id;
  }

  await stripe.products.update(current.stripe_product_id, {
    name: product.name,
    description: product.tagline ?? "",
    images: stripeImages(images),
  });

  await pool.query(
    `UPDATE shop_products SET
       slug = $1, name = $2, tagline = $3, description = $4, specs = $5,
       images = $6, stripe_price_id = $7, stock = GREATEST(stock + $8, 0),
       category = $9, hidden = $10
     WHERE id = $11`,
    [
      product.slug,
      product.name,
      product.tagline,
      product.description,
      JSON.stringify(product.specs),
      JSON.stringify(images),
      priceId,
      stockChange,
      product.category,
      product.hidden,
      id,
    ]
  );

  if (priceId !== current.stripe_price_id) {
    await stripe.prices.update(current.stripe_price_id, { active: false });
    revalidateTag("stripe-prices", { expire: 0 });
  }

  return current.slug;
}

/** Create (no productId) or update (productId set). Used with useActionState. */
export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireSession();

  const fields = readProductFields(formData);
  const parsed = parseProductFields(fields);
  if (!parsed.ok) return { error: parsed.error, fields };
  const product = parsed.product;

  const rawId = formData.get("productId");
  const id = rawId ? Number(rawId) : null;
  if (id !== null && !Number.isInteger(id)) return { error: "Invalid product.", fields };

  if (await slugTaken(product.slug, id)) {
    return { error: `Another product already uses the slug "${product.slug}".`, fields };
  }

  let submittedImages: unknown = null;
  try {
    submittedImages = JSON.parse(String(formData.get("images") ?? "null"));
  } catch {
    // Malformed: sanitizeImages keeps the current photos.
  }

  let previousSlug = product.slug;
  try {
    const buildImages = (current: string[]) => sanitizeImages(submittedImages, current);

    if (id === null) {
      await createProduct(product, buildImages([]));
    } else {
      previousSlug = await updateProduct(id, product, stockDelta(formData, product.stock), buildImages);
    }
  } catch (err) {
    console.error("Saving product failed", err);
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { error: `Could not save: ${message} Your photos are kept; try saving again.`, fields };
  }

  revalidateStore(product.slug, previousSlug);
  redirect("/admin/products");
}

/**
 * Called by the form as each photo is picked, so a save only carries URLs
 * (and stays under the 1 MB server action limit, however many photos).
 */
export async function uploadProductPhoto(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  await requireSession();
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return { error: "No photo received." };
  try {
    return { url: await uploadPhoto(photo) };
  } catch (err) {
    console.error("Photo upload failed", err);
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
}

/** The inline refill control on the product list. */
export async function setStock(formData: FormData) {
  await requireSession();

  const id = Number(formData.get("productId"));
  const stock = parseStock(String(formData.get("stock") ?? ""));
  if (!Number.isInteger(id) || stock === null) return;

  const { rows } = await pool.query<{ slug: string }>(
    "UPDATE shop_products SET stock = GREATEST(stock + $1, 0) WHERE id = $2 RETURNING slug",
    [stockDelta(formData, stock), id]
  );
  if (rows[0]) revalidateStore(rows[0].slug);
}
