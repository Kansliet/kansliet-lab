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

/**
 * One ledger row per Stripe refund that is going through, with the amount in
 * the order's own currency. A refund that covers the whole charge counts as the
 * whole order. Pending refunds count (Klarna refunds start pending, and
 * charge.amount_refunded already includes them; we get no further event when
 * they settle), so only failed or canceled ones are left out.
 */
export function refundLedgerRows(
  order: { amount_total: number; currency: string },
  charge: { amount: number },
  refunds: { id: string; amount: number; currency: string; created: number; status: string | null }[],
): { stripeRefundId: string; amount: number; created: number }[] {
  return refunds
    .filter((refund) => refund.status !== "failed" && refund.status !== "canceled")
    .map((refund) => ({
      stripeRefundId: refund.id,
      amount: refundedInOrderCurrency(order, {
        amount: charge.amount,
        amount_refunded: refund.amount,
        currency: refund.currency,
        refunded: refund.amount >= charge.amount,
      }),
      created: refund.created,
    }));
}
