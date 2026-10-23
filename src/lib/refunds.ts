/**
 * The refunded amount in the order's own currency (öre for a SEK order).
 * With Stripe Adaptive Pricing the charge can be in the customer's currency
 * while the order is recorded in SEK; then convert in proportion to what the
 * order recorded. A full refund is the whole order.
 */
export function refundedInOrderCurrency(
  order: { amount_total: number; currency: string },
  charge: { amount: number; amount_refunded: number; currency: string; refunded: boolean },
): number {
  if (charge.currency.toLowerCase() === order.currency.toLowerCase()) return charge.amount_refunded;
  if (charge.refunded) return order.amount_total;
  if (charge.amount <= 0) return 0;
  return Math.round((order.amount_total * charge.amount_refunded) / charge.amount);
}
