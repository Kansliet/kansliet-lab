// The decisions checkout and the refund webhook make, kept pure (no DB, no
// Stripe) so they're tested; the server action and the webhook just call them.

/**
 * Whether the cart can be bought as it stands, checked against live rows:
 * "unavailable" for a variant that's gone, sold out, hidden (`product.sold_out`
 * covers hidden products) or out of stock; "insufficient_stock" for a quantity
 * over what's in stock; null when every line is fine. The first problem wins.
 */
export function cartProblem(
  cart: { variantId: number; quantity: number }[],
  variants: Map<number, { variant: { stock: number }; product: { sold_out: boolean } }>,
): "unavailable" | "insufficient_stock" | null {
  for (const item of cart) {
    const found = variants.get(item.variantId);
    if (!found || found.product.sold_out || found.variant.stock <= 0) return "unavailable";
    if (item.quantity > found.variant.stock) return "insufficient_stock";
  }
  return null;
}

/**
 * The goods total in öre. `unitAmounts` are the cart lines' prices in kronor,
 * in cart order (what `getPrice` returns as `amount`).
 */
export function subtotalCents(cart: { quantity: number }[], unitAmounts: number[]): number {
  return cart.reduce((sum, item, i) => sum + Math.round(unitAmounts[i] * 100) * item.quantity, 0);
}

/**
 * What a charge.refunded event does to an order. `refunded` is the cumulative
 * refunded amount in the order's currency. `skip`: nothing new (a redelivered
 * or out-of-order event). A full refund sets the status to "refunded" and puts
 * the stock back unless the order had shipped (the goods are still out there).
 */
export function refundUpdate(
  order: { fulfillment_status: string; shipped_at: Date | null; amount_refunded: number },
  refunded: number,
  chargeRefunded: boolean,
): { skip: boolean; status: string; restock: boolean } {
  if (refunded <= order.amount_refunded) {
    return { skip: true, status: order.fulfillment_status, restock: false };
  }
  return {
    skip: false,
    status: chargeRefunded ? "refunded" : order.fulfillment_status,
    restock: chargeRefunded && order.shipped_at === null,
  };
}
