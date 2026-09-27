import { cache } from "react";
import { unstable_cache } from "next/cache";
import { pool } from "@/lib/db";

// Every read of the store catalog goes through here, so the row shape and
// ordering are defined once. (Table names keep their original shop_* prefix.)

/**
 * The public catalog (grid, product pages, categories) is cached across
 * requests, so a store visit usually skips the database. Everything that
 * changes a product or its stock (admin saves and refills, paid orders and
 * refunds in the webhook) calls revalidateTag(CATALOG_TAG, { expire: 0 }).
 * The 5-minute revalidate is only a backstop for edits made outside the site
 * (seed and copy scripts). Cart and checkout read live rows instead
 * (getProductsByIds, getProductById), so stock is always checked fresh
 * before anyone pays.
 */
export const CATALOG_TAG = "store-catalog";
const CATALOG_CACHE = { revalidate: 300, tags: [CATALOG_TAG] };

/** A labelled product fact (MATERIAL / DIMENSIONS / …), shown like /works specs. */
export type ProductSpec = { label: string; value: string };

/** One value of an option, e.g. Colour "Sand" with its own photos. */
export type OptionValue = { value: string; images?: string[] };

/** An option such as Colour or Size (at most two per product). */
export type ProductOption = { name: string; values: OptionValue[] };

/**
 * The sellable unit: one per combination of option values, or a single
 * "default" variant (both options null) for a product without options. It
 * holds the stock and its own Stripe product and price.
 */
export type Variant = {
  id: number;
  option1: string | null;
  option2: string | null;
  stock: number;
  stripe_product_id: string;
  stripe_price_id: string;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  /** One-line statement shown large on the product page, like a /works tagline. */
  tagline: string | null;
  /** Paragraphs separated by a blank line. */
  description: string | null;
  specs: ProductSpec[];
  /** Ordered photo URLs; the first is the cover. */
  images: string[];
  /** Derived: images[0], the cover used by the grid, cart and Checkout. */
  image_url: string | null;
  /** Colour / Size and their values; empty for a product without options. */
  options: ProductOption[];
  /** In display order; at least one. */
  variants: Variant[];
  /**
   * Derived: the first variant's price. A product has one price, so every
   * variant's price object carries the same amount; this one is for display.
   */
  stripe_price_id: string;
  /** Derived: units on hand across all variants. Paid orders decrement the variant's. */
  stock: number;
  /** Kept out of the store; only the admin lists it. */
  hidden: boolean;
  /** Derived: every variant out of stock, or hidden (so a hidden product in a cart can't be bought). */
  sold_out: boolean;
  category: string;
};

const COLUMNS =
  "p.id, p.slug, p.name, p.tagline, p.description, p.specs, p.images, p.images->>0 AS image_url, p.options, v.variants, v.stripe_price_id, v.stock, p.hidden, (v.stock <= 0 OR p.hidden) AS sold_out, p.category";

// Each product with its variants in one row: the list, their total stock and
// the first one's price. Old shop_products.stock / stripe_price_id are unused.
const FROM_PRODUCTS = `shop_products p CROSS JOIN LATERAL (
  SELECT
    COALESCE(json_agg(json_build_object(
      'id', sv.id, 'option1', sv.option1, 'option2', sv.option2, 'stock', sv.stock,
      'stripe_product_id', sv.stripe_product_id, 'stripe_price_id', sv.stripe_price_id
    ) ORDER BY sv.position, sv.id), '[]') AS variants,
    COALESCE(SUM(sv.stock), 0)::int AS stock,
    (array_agg(sv.stripe_price_id ORDER BY sv.position, sv.id))[1] AS stripe_price_id
  FROM shop_variants sv WHERE sv.product_id = p.id
) v`;

// Newest first; id breaks ties between rows seeded in the same instant.
const CATALOG_ORDER = "ORDER BY p.created_at DESC, p.id DESC";

/** The /store grid, optionally filtered to one category. */
export const getProducts = unstable_cache(
  async (category?: string): Promise<Product[]> => {
    const { rows } = await pool.query<Product>(
      `SELECT ${COLUMNS} FROM ${FROM_PRODUCTS}
       WHERE NOT p.hidden AND ($1::text IS NULL OR p.category = $1)
       ${CATALOG_ORDER}`,
      [category ?? null]
    );
    return rows;
  },
  ["store-products"],
  CATALOG_CACHE
);

/** Every product, hidden ones included, for /admin/products. */
export async function getAdminProducts(): Promise<Product[]> {
  const { rows } = await pool.query<Product>(
    `SELECT ${COLUMNS} FROM ${FROM_PRODUCTS} ${CATALOG_ORDER}`
  );
  return rows;
}

export const getCategories = unstable_cache(
  async (): Promise<string[]> => {
    const { rows } = await pool.query<{ category: string }>(
      "SELECT DISTINCT category FROM shop_products WHERE NOT hidden ORDER BY category"
    );
    return rows.map((row) => row.category);
  },
  ["store-categories"],
  CATALOG_CACHE
);

/**
 * React cache() on top: a product page calls this from both generateMetadata
 * and the page itself, and unstable_cache doesn't coalesce concurrent misses,
 * so on a cold cache that would be two identical queries.
 */
export const getProductBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<Product | null> => {
      const { rows } = await pool.query<Product>(
        `SELECT ${COLUMNS} FROM ${FROM_PRODUCTS} WHERE p.slug = $1 AND NOT p.hidden`,
        [slug]
      );
      return rows[0] ?? null;
    },
    ["store-product-by-slug"],
    CATALOG_CACHE
  )
);

/**
 * Ids come from form fields; a tampered non-integer is "not found", not a pg
 * error/500. Hidden rows are included (cart, admin); sold_out covers them.
 */
export async function getProductById(id: number): Promise<Product | null> {
  if (!Number.isInteger(id)) return null;
  const { rows } = await pool.query<Product>(
    `SELECT ${COLUMNS} FROM ${FROM_PRODUCTS} WHERE p.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { rows } = await pool.query<Product>(
    `SELECT ${COLUMNS} FROM ${FROM_PRODUCTS} WHERE p.id = ANY($1)`,
    [ids]
  );
  return rows;
}

/** A cart line's variant with its product (live rows, for cart and checkout). */
export type VariantWithProduct = { variant: Variant; product: Product };

/**
 * Live, uncached: stock must be current when a cart renders or checks out.
 * Ids come from the cart cookie; unknown ones are simply missing.
 */
export async function getVariantsByIds(ids: number[]): Promise<Map<number, VariantWithProduct>> {
  const valid = ids.filter(Number.isInteger);
  if (valid.length === 0) return new Map();
  const { rows } = await pool.query<{ id: number; product_id: number }>(
    "SELECT id, product_id FROM shop_variants WHERE id = ANY($1)",
    [valid]
  );
  const products = await getProductsByIds([...new Set(rows.map((row) => row.product_id))]);
  const result = new Map<number, VariantWithProduct>();
  for (const product of products) {
    for (const variant of product.variants) {
      if (valid.includes(variant.id)) result.set(variant.id, { variant, product });
    }
  }
  return result;
}
