"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { pool } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { stripe, getPrice } from "@/lib/stripe";
import { STORE_CURRENCY } from "@/lib/shop-info";
import { CATALOG_TAG, type ProductOption } from "@/lib/products";
import { combinations, imagesFor, variantName } from "@/lib/variants";
import {
  MAX_PHOTO_BYTES,
  parseOptions,
  parseProductFields,
  parseVariantRows,
  parseStock,
  readProductFields,
  sanitizeImages,
  stockDelta,
  type ParsedProduct,
  type ProductFields,
  type VariantRow,
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
  // expire: 0, so the next visit (yours, checking the change) gets fresh data.
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidatePath("/store");
  for (const slug of slugs) revalidatePath(`/store/${slug}`);
  revalidatePath("/admin/products");
}

// Stripe Checkout shows product images; its API takes at most 8.
const stripeImages = (images: string[]) => images.slice(0, 8);

type ExistingVariant = {
  id: number;
  option1: string | null;
  option2: string | null;
  stock: number;
  stripe_product_id: string;
  stripe_price_id: string;
};

/** Stripe calls in small parallel batches: up to 100 variants shouldn't take 100 round trips in a row. */
async function inBatches<T>(items: T[], run: (item: T) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += 8) {
    await Promise.all(items.slice(i, i + 8).map(run));
  }
}

/**
 * Creates (id null) or updates a product together with its variants: one per
 * combination of option values, or a single default variant without options.
 *
 * Matching: a table row carrying an existing variant's id keeps that variant
 * (so renaming "Sand" to "Beige" keeps its stock and Stripe product); other
 * combinations are created with their own Stripe product and price; variants
 * no longer listed are deleted (order lines keep their label) and their
 * Stripe products archived. Stripe is written first, then everything in the
 * database in one transaction; on failure, Stripe products created here are
 * archived again.
 */
async function saveCatalogProduct(
  id: number | null,
  product: ParsedProduct,
  options: ProductOption[],
  rows: VariantRow[],
  stockChange: number,
  buildImages: (current: string[]) => string[]
): Promise<string> {
  const current = id
    ? (
        await pool.query<{ slug: string; images: string[] }>(
          "SELECT slug, images FROM shop_products WHERE id = $1",
          [id]
        )
      ).rows[0]
    : null;
  if (id && !current) throw new Error("That product no longer exists.");
  const existing = id
    ? (
        await pool.query<ExistingVariant>(
          `SELECT id, option1, option2, stock, stripe_product_id, stripe_price_id
           FROM shop_variants WHERE product_id = $1 ORDER BY position, id`,
          [id]
        )
      ).rows
    : [];

  const images = buildImages(current?.images ?? []);
  const catalog = { options, images };

  // What each combination becomes: an existing variant kept (with its stock
  // change), or a new one.
  type Keep = { variant: ExistingVariant; option1: string | null; option2: string | null; position: number; delta: number };
  type Create = { option1: string | null; option2: string | null; position: number; stock: number };
  const keep: Keep[] = [];
  const create: Create[] = [];
  if (options.length === 0) {
    // No options: one default variant, stocked from the form's STOCK field.
    const [first] = existing;
    if (first) {
      // Collapsing several variants into one: STOCK is the new total.
      const delta = existing.length === 1 ? stockChange : product.stock - first.stock;
      keep.push({ variant: first, option1: null, option2: null, position: 0, delta });
    } else {
      create.push({ option1: null, option2: null, position: 0, stock: product.stock });
    }
  } else {
    const byId = new Map(existing.map((variant) => [variant.id, variant]));
    combinations(options).forEach(({ option1, option2 }, position) => {
      const row = rows.find((r) => r.option1 === option1 && r.option2 === option2);
      const variant = row?.id !== null && row?.id !== undefined ? byId.get(row.id) : undefined;
      if (row && variant) {
        byId.delete(variant.id);
        const delta = row.previous === null ? row.stock - variant.stock : row.stock - row.previous;
        keep.push({ variant, option1, option2, position, delta });
      } else {
        create.push({ option1, option2, position, stock: row?.stock ?? 0 });
      }
    });
  }
  const keptIds = new Set(keep.map((k) => k.variant.id));
  const remove = existing.filter((variant) => !keptIds.has(variant.id));

  // One price per product. Stripe prices are immutable: a new amount (or
  // currency) means a new price object for every kept variant. Old ones are
  // archived after the save, not deleted, so past orders still resolve them.
  let priceChanged = false;
  if (existing.length > 0) {
    const currentPrice = await getPrice(existing[0].stripe_price_id);
    priceChanged =
      Math.round(currentPrice.amount * 100) !== product.priceCents ||
      currentPrice.currency.toLowerCase() !== STORE_CURRENCY;
  }

  const stripeProduct = (variant: { option1: string | null; option2: string | null }) => ({
    name: variantName(product.name, variant),
    description: product.tagline ?? undefined,
    images: stripeImages(imagesFor(catalog, variant.option1)),
  });

  const created: { plan: Create; productId: string; priceId: string }[] = [];
  const newPrices = new Map<number, string>();
  try {
    await inBatches(create, async (plan) => {
      const made = await stripe.products.create(stripeProduct(plan));
      const price = await stripe.prices.create({
        product: made.id,
        unit_amount: product.priceCents,
        currency: STORE_CURRENCY,
      });
      created.push({ plan, productId: made.id, priceId: price.id });
    });
    await inBatches(keep, async ({ variant, option1, option2 }) => {
      await stripe.products.update(variant.stripe_product_id, {
        ...stripeProduct({ option1, option2 }),
        description: product.tagline ?? "",
      });
      if (priceChanged) {
        const price = await stripe.prices.create({
          product: variant.stripe_product_id,
          unit_amount: product.priceCents,
          currency: STORE_CURRENCY,
        });
        newPrices.set(variant.id, price.id);
      }
    });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const values = [
        product.slug,
        product.name,
        product.tagline,
        product.description,
        JSON.stringify(product.specs),
        JSON.stringify(images),
        product.category,
        product.hidden,
        JSON.stringify(options),
      ];
      const productId = id
        ? (await client.query(
            `UPDATE shop_products SET
               slug = $1, name = $2, tagline = $3, description = $4, specs = $5,
               images = $6, category = $7, hidden = $8, options = $9
             WHERE id = $10`,
            [...values, id]
          ),
          id)
        : (
            await client.query<{ id: number }>(
              `INSERT INTO shop_products (slug, name, tagline, description, specs, images, category, hidden, options)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
              values
            )
          ).rows[0].id;

      if (remove.length > 0) {
        await client.query("DELETE FROM shop_variants WHERE id = ANY($1)", [remove.map((v) => v.id)]);
      }
      // Two passes, so renames that swap values (Sand ↔ Black) never collide
      // on the (product, option1, option2) unique key mid-update.
      for (const { variant } of keep) {
        await client.query("UPDATE shop_variants SET option1 = $1, option2 = NULL WHERE id = $2", [
          `__renaming_${variant.id}`,
          variant.id,
        ]);
      }
      for (const { variant, option1, option2, position, delta } of keep) {
        await client.query(
          `UPDATE shop_variants SET option1 = $1, option2 = $2, position = $3,
             stock = GREATEST(stock + $4, 0), stripe_price_id = $5
           WHERE id = $6`,
          [option1, option2, position, delta, newPrices.get(variant.id) ?? variant.stripe_price_id, variant.id]
        );
      }
      for (const { plan, productId: stripeId, priceId } of created) {
        await client.query(
          `INSERT INTO shop_variants (product_id, option1, option2, stock, stripe_product_id, stripe_price_id, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [productId, plan.option1, plan.option2, plan.stock, stripeId, priceId, plan.position]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    // Don't leave orphans in the Stripe dashboard.
    await Promise.all(
      created.map(({ productId }) => stripe.products.update(productId, { active: false }).catch(() => {}))
    );
    throw err;
  }

  await Promise.all([
    ...remove.map((variant) =>
      stripe.products.update(variant.stripe_product_id, { active: false }).catch(() => {})
    ),
    ...(priceChanged
      ? keep.map(({ variant }) => stripe.prices.update(variant.stripe_price_id, { active: false }).catch(() => {}))
      : []),
  ]);
  if (priceChanged || created.length > 0) revalidateTag("stripe-prices", { expire: 0 });

  return current?.slug ?? product.slug;
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

  // Photos a colour may keep: the ones any colour or the product had.
  const known = id
    ? (
        await pool.query<{ options: ProductOption[]; images: string[] }>(
          "SELECT options, images FROM shop_products WHERE id = $1",
          [id]
        )
      ).rows[0]
    : undefined;
  const knownImages = [
    ...(known?.images ?? []),
    ...(known?.options[0]?.values.flatMap((value) => value.images ?? []) ?? []),
  ];
  const options = parseOptions(String(formData.get("options") ?? "[]"), knownImages);
  if (!options.ok) return { error: options.error, fields };
  const variantRows = parseVariantRows(String(formData.get("variants") ?? "[]"), options.options);
  if (!variantRows.ok) return { error: variantRows.error, fields };

  let submittedImages: unknown = null;
  try {
    submittedImages = JSON.parse(String(formData.get("images") ?? "null"));
  } catch {
    // Malformed: sanitizeImages keeps the current photos.
  }

  let previousSlug = product.slug;
  try {
    previousSlug = await saveCatalogProduct(
      id,
      product,
      options.options,
      variantRows.rows,
      stockDelta(formData, product.stock),
      (current) => sanitizeImages(submittedImages, current)
    );
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

/**
 * The inline refill control on the product list: a variant (`variantId`), or
 * a product without options (`productId`, its only variant).
 */
export async function setStock(formData: FormData) {
  await requireSession();

  const stock = parseStock(String(formData.get("stock") ?? ""));
  if (stock === null) return;
  const delta = stockDelta(formData, stock);

  const variantId = Number(formData.get("variantId"));
  const productId = Number(formData.get("productId"));
  const { rows } = formData.has("variantId")
    ? await pool.query<{ slug: string }>(
        `UPDATE shop_variants v SET stock = GREATEST(v.stock + $1, 0)
         FROM shop_products p WHERE v.id = $2 AND p.id = v.product_id
         RETURNING p.slug`,
        [delta, Number.isInteger(variantId) ? variantId : null]
      )
    : await pool.query<{ slug: string }>(
        `UPDATE shop_variants v SET stock = GREATEST(v.stock + $1, 0)
         FROM shop_products p
         WHERE p.id = $2 AND v.product_id = p.id
           AND (SELECT count(*) FROM shop_variants WHERE product_id = p.id) = 1
         RETURNING p.slug`,
        [delta, Number.isInteger(productId) ? productId : null]
      );
  if (rows[0]) revalidateStore(rows[0].slug);
}
