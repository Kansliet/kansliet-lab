import { cache } from "react";
import { pool } from "@/lib/db";

// Every read of the store catalog goes through here, so the row shape and
// ordering are defined once. (Table names keep their original shop_* prefix.)

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
  "id, slug, name, tagline, description, specs, image_url, stripe_price_id, stock, hidden, (stock <= 0 OR hidden) AS sold_out, category";

// Newest first; id breaks ties between rows seeded in the same instant.
const CATALOG_ORDER = "ORDER BY created_at DESC, id DESC";

/** The /store grid, optionally filtered to one category. */
export async function getProducts(category?: string): Promise<Product[]> {
  const { rows } = await pool.query<Product>(
    `SELECT ${COLUMNS} FROM shop_products
     WHERE NOT hidden AND ($1::text IS NULL OR category = $1)
     ${CATALOG_ORDER}`,
    [category ?? null]
  );
  return rows;
}

/** Every product, hidden ones included, for /admin/products. */
export async function getAdminProducts(): Promise<Product[]> {
  const { rows } = await pool.query<Product>(
    `SELECT ${COLUMNS} FROM shop_products ${CATALOG_ORDER}`
  );
  return rows;
}

export async function getCategories(): Promise<string[]> {
  const { rows } = await pool.query<{ category: string }>(
    "SELECT DISTINCT category FROM shop_products WHERE NOT hidden ORDER BY category"
  );
  return rows.map((row) => row.category);
}

/**
 * React cache(): a product page calls this from both generateMetadata and the
 * page itself. pg queries aren't deduped like fetch(), so without cache() that
 * is two identical round-trips per request.
 */
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const { rows } = await pool.query<Product>(
    `SELECT ${COLUMNS} FROM shop_products WHERE slug = $1 AND NOT hidden`,
    [slug]
  );
  return rows[0] ?? null;
});

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

/** Slugs in grid order, for a product page's P. xx / yy strip and prev/next. */
export async function getCatalogSlugs(): Promise<string[]> {
  const { rows } = await pool.query<{ slug: string }>(
    `SELECT slug FROM shop_products WHERE NOT hidden ${CATALOG_ORDER}`
  );
  return rows.map((row) => row.slug);
}
