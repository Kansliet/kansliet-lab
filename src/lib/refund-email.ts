import { COMPANY, formatMoney } from "@/lib/shop-info";
import { footerBlock, renderEmail, sellerColumn } from "@/lib/email-layout";
import { orderRef } from "@/lib/order-email";

// Sent by the webhook when Stripe reports a refund that changed the order.
// Not legally required, but a customer who withdrew expects to hear back. A
// transactional email only: no promotion (marknadsföringslagen).

export type RefundEmailInput = {
  orderRef: string;
  date: Date;
  /** Refunded by this event, in the order's currency (öre for SEK). */
  refundedNowCents: number;
  /** Refunded on the order so far, this event included. */
  totalRefundedCents: number;
  currency: string;
  /** Everything on the order is now refunded. */
  full: boolean;
};

/**
 * The email for one refund event, or null when it changed nothing (a
 * redelivered or out-of-order event: `refundedCents` is not above what the
 * order had already recorded) or the customer left no email.
 */
export function refundEmailForOrder(
  order: { id: number; amount_refunded: number; currency: string; customer_email: string | null },
  refundedCents: number,
  full: boolean,
  date: Date,
): (RefundEmailInput & { to: string }) | null {
  if (!order.customer_email || refundedCents <= order.amount_refunded) return null;
  return {
    to: order.customer_email,
    orderRef: orderRef(order.id),
    date,
    refundedNowCents: refundedCents - order.amount_refunded,
    totalRefundedCents: refundedCents,
    currency: order.currency,
    full,
  };
}

export function buildRefundEmail(input: RefundEmailInput): { subject: string; html: string; text: string } {
  const money = (cents: number) => formatMoney(cents, input.currency);
  const later = input.totalRefundedCents > input.refundedNowCents;
  return renderEmail({
    subject: `Refund ${input.orderRef} — ${COMPANY.tradingName}`,
    preheader: `${money(input.refundedNowCents)} refunded for order ${input.orderRef}. It can take 5–10 business days to show on your statement.`,
    reference: input.orderRef,
    blocks: [
      {
        type: "title",
        title: "Refund issued",
        subtitle: `${input.date.toISOString().slice(0, 10)} · ${input.full ? "Your order is now fully refunded." : "Part of your order has been refunded."}`,
      },
      {
        type: "box",
        rows: [
          { kind: "kv", label: "Order", value: input.orderRef },
          { kind: "kv", label: "Refund", value: input.full ? "Full refund" : "Partial refund" },
          ...(later
            ? [{ kind: "kv" as const, label: "Refunded in total", value: money(input.totalRefundedCents) }]
            : []),
          { kind: "total", label: "Refunded now", amount: money(input.refundedNowCents) },
        ],
      },
      {
        type: "section",
        heading: "When you get it",
        paragraphs: [
          "The money goes back to the card or other payment method you paid with. It can take 5–10 business days to show on your statement.",
          `Questions? Reply to this email or write to ${COMPANY.email}.`,
        ],
      },
      { type: "columns", columns: [sellerColumn()] },
      footerBlock(),
    ],
  });
}
