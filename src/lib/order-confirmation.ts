import { orderRef, type OrderEmailInput } from "@/lib/order-email";

/** The parts of a Stripe Checkout Session the confirmation email reads. */
type SessionForEmail = {
  created: number;
  amount_total: number | null;
  currency: string | null;
  customer_details?: { email?: string | null } | null;
  shipping_cost?: { amount_total: number } | null;
  presentment_details?: { presentment_amount: number; presentment_currency: string } | null;
  collected_information?: {
    shipping_details?: {
      name?: string | null;
      address?: OrderEmailInput["shippingAddress"];
    } | null;
  } | null;
};

type LineForEmail = { description: string | null; quantity: number | null; amount_total: number };

/**
 * The confirmation email for a paid Checkout Session, or null when the customer
 * left no email. Used by the webhook and by RESEND CONFIRMATION in the admin,
 * so both send the same thing.
 */
export function orderEmailFromSession(
  session: SessionForEmail,
  lineItems: LineForEmail[],
  orderId: number,
): (OrderEmailInput & { to: string }) | null {
  const to = session.customer_details?.email;
  if (!to) return null;
  const shippingDetails = session.collected_information?.shipping_details;
  return {
    to,
    orderRef: orderRef(orderId),
    date: new Date(session.created * 1000),
    lines: lineItems.map((line) => ({
      name: line.description ?? "Item",
      quantity: line.quantity ?? 0,
      amountCents: line.amount_total,
    })),
    shippingCents: session.shipping_cost?.amount_total ?? 0,
    totalCents: session.amount_total ?? 0,
    // Adaptive Pricing: amount_total stays in SEK; what the customer actually
    // paid in their own currency is in presentment_details.
    charged:
      session.presentment_details &&
      session.presentment_details.presentment_currency !== session.currency
        ? {
            amountCents: session.presentment_details.presentment_amount,
            currency: session.presentment_details.presentment_currency,
          }
        : null,
    shippingName: shippingDetails?.name ?? null,
    shippingAddress: shippingDetails?.address ?? null,
  };
}
