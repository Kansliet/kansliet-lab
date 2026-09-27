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
  stripe_price_id: string;
  /** Units on hand. Paid orders decrement it (Stripe webhook). */
  stock: number;
  /** Kept out of the store; only the admin lists it. */
  hidden: boolean;
  /** Derived: out of stock, or hidden (so a hidden product in a cart can't be bought). */
  sold_out: boolean;
  category: string;
};

const COLUMNS =
  "id, slug, name, tagline, description, specs, images, images->>0 AS image_url, stripe_price_id, stock, hidden, (stock <= 0 OR hidden) AS sold_out, category";

// Newest first; id breaks ties between rows seeded in the same instant.
const CATALOG_ORDER = "ORDER BY created_at DESC, id DESC";

/** The /store grid, optionally filtered to one category. */
export const getProducts = unstable_cache(
  async (category?: string): Promise<Product[]> => {
    const { rows } = await pool.query<Product>(
      `SELECT ${COLUMNS} FROM shop_products
       WHERE NOT hidden AND ($1::text IS NULL OR category = $1)
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
    `SELECT ${COLUMNS} FROM shop_products ${CATALOG_ORDER}`
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
        `SELECT ${COLUMNS} FROM shop_products WHERE slug = $1 AND NOT hidden`,
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
    `SELECT ${COLUMNS} FROM shop_products WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { rows } = await pool.query<Product>(
    `SELECT ${COLUMNS} FROM shop_products WHERE id = ANY($1)`,
    [ids]
  );
  return rows;
}
