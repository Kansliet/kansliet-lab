import { cookies } from "next/headers";

export const CART_COOKIE = "cart";
const CART_COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60; // 30 days, matches the session cookie's lifetime

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
        quantity: Number(quantity),
      }))
      .filter((item) => Number.isInteger(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch {
    return [];
  }
}

export function cartToCookieValue(cart: CartItem[]): string {
  const record: Record<string, number> = {};
  for (const item of cart) {
    record[item.productId] = item.quantity;
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
