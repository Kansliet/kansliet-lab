import { cookies } from "next/headers";

export const CART_COOKIE = "cart";
const CART_COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60; // 30 days, matches the session cookie's lifetime

// Per-line cap, enforced here (on every read and write) rather than per action,
// so no code path can hand Stripe an absurd quantity. Matches the qty input's max.
export const MAX_QUANTITY = 99;

/** Largest quantity one cart line may hold: the per-line cap, or what's in stock. */
export function maxLineQuantity(stock: number): number {
  return Math.max(0, Math.min(MAX_QUANTITY, stock));
}

export type CartItem = {
  productId: number;
  quantity: number;
};

// The cart never stores a price — only {productId, quantity}. Price is
// always re-resolved live from Stripe (see getDisplayPrice) both when the
// cart renders and when checkout line_items are built, so a tampered or
// stale cookie can never produce an incorrect charge — at worst it names a
// product id that gets filtered out server-side.
export async function getCart(): Promise<CartItem[]> {
  const raw = (await cookies()).get(CART_COOKIE)?.value;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return Object.entries(parsed)
      .map(([productId, quantity]) => ({
        productId: Number(productId),
        quantity: Math.min(Number(quantity), MAX_QUANTITY),
      }))
      .filter((item) => Number.isInteger(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch {
    return [];
  }
}

export function cartToCookieValue(cart: CartItem[]): string {
  const record: Record<string, number> = {};
  for (const item of cart) {
    record[item.productId] = Math.min(item.quantity, MAX_QUANTITY);
  }
  return JSON.stringify(record);
}

export const cartCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: CART_COOKIE_MAX_AGE_S,
};
