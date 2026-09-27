import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import { MAX_QUANTITY } from "@/lib/cart-limits";

export { MAX_QUANTITY, maxLineQuantity } from "@/lib/cart-limits";

export const CART_COOKIE = "cart";
const CART_COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60; // 30 days, matches the session cookie's lifetime

/** One cart line: a variant (a product's colour/size, or its only variant) and how many. */
export type CartItem = {
  variantId: number;
  quantity: number;
};

function toItems(record: unknown): CartItem[] {
  if (!record || typeof record !== "object" || Array.isArray(record)) return [];
  return Object.entries(record as Record<string, unknown>)
    .map(([id, quantity]) => ({
      variantId: Number(id),
      quantity: Math.min(Number(quantity), MAX_QUANTITY),
    }))
    .filter((item) => Number.isInteger(item.variantId) && Number.isInteger(item.quantity) && item.quantity > 0);
}

/**
 * The cookie is {"v": {variantId: qty}}. Carts from before variants were
 * {productId: qty}; those come back as `legacy` (ids are product ids) for
 * getCart to convert. Pure, for tests.
 */
export function parseCartCookie(raw: string | undefined): { items: CartItem[]; legacy: CartItem[] } {
  if (!raw) return { items: [], legacy: [] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && "v" in parsed) {
      return { items: toItems((parsed as { v: unknown }).v), legacy: [] };
    }
    return { items: [], legacy: toItems(parsed) };
  } catch {
    return { items: [], legacy: [] };
  }
}

// The cart never stores a price — only {variantId, quantity}. Price is
// always re-resolved from Stripe (see getPrice) both when the cart renders
// and when checkout line_items are built, so a tampered or stale cookie can
// never produce an incorrect charge — at worst it names a variant id that
// gets filtered out server-side.
export async function getCart(): Promise<CartItem[]> {
  const { items, legacy } = parseCartCookie((await cookies()).get(CART_COOKIE)?.value);
  if (legacy.length === 0) return items;

  // A cart saved before variants: each product id becomes that product's only
  // variant. Products that have several by now are dropped (no way to know
  // which colour was meant). Written back in the new shape on the next change.
  const { rows } = await pool.query<{ product_id: number; variant_id: number }>(
    `SELECT product_id, min(id) AS variant_id FROM shop_variants
     WHERE product_id = ANY($1) GROUP BY product_id HAVING count(*) = 1`,
    [legacy.map((item) => item.variantId)]
  );
  const variantByProduct = new Map(rows.map((row) => [row.product_id, row.variant_id]));
  return legacy
    .filter((item) => variantByProduct.has(item.variantId))
    .map((item) => ({ variantId: variantByProduct.get(item.variantId)!, quantity: item.quantity }));
}

export function cartToCookieValue(cart: CartItem[]): string {
  const record: Record<string, number> = {};
  for (const item of cart) {
    record[item.variantId] = Math.min(item.quantity, MAX_QUANTITY);
  }
  return JSON.stringify({ v: record });
}

export const cartCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: CART_COOKIE_MAX_AGE_S,
};

export function cartItemCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
