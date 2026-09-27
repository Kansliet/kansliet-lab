// Per-line cap, enforced in lib/cart (on every read and write) rather than per
// action, so no code path can hand Stripe an absurd quantity. Pure, so the
// product page's client picker can use it too.
export const MAX_QUANTITY = 99;

/** Largest quantity one cart line may hold: the per-line cap, or what's in stock. */
export function maxLineQuantity(stock: number): number {
  return Math.max(0, Math.min(MAX_QUANTITY, stock));
}
