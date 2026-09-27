import {
  COMPANY,
  COUNTRY_NAMES,
  DISPATCH_DAYS,
  TERMS_VERSION,
  VAT_RATE_PERCENT,
  formatMoney,
  regionForCountry,
} from "@/lib/shop-info";
import {
  COMPLAINT_SUMMARY,
  MODEL_WITHDRAWAL_FORM,
  SELLER_LINES,
  WITHDRAWAL_PARAGRAPHS,
} from "@/lib/legal-text";

// The order confirmation doubles as the legally required confirmation "on a
// durable medium" (distansavtalslagen 2 kap 12 §): the email itself must carry
// the seller's details, what was bought and paid, the withdrawal right with
// the model form, and complaint rights. A link to the website is not enough.

export type OrderEmailInput = {
  orderRef: string;
  date: Date;
  lines: { name: string; quantity: number; amountCents: number }[];
  shippingCents: number;
  totalCents: number;
  /** Set when Stripe Adaptive Pricing charged the customer in their own currency. */
  charged?: { amountCents: number; currency: string } | null;
  shippingName: string | null;
  shippingAddress: {
    line1?: string | null;
    line2?: string | null;
    postal_code?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
};

export function orderRef(orderId: number): string {
  return `KDC-${String(orderId).padStart(5, "0")}`;
}

/**
 * The order id in a reference as a customer might type it: "KDC-00042",
 * "kdc 42", "#42", "42". Null for anything else.
 */
export function parseOrderRef(input: string): number | null {
  const match = /^\s*#?\s*(?:KDC[\s-]*)?0*(\d{1,9})\s*$/i.exec(input);
  if (!match) return null;
  const id = Number(match[1]);
  return id > 0 ? id : null;
}

/** VAT contained in a VAT-inclusive amount, in cents. */
export function includedVat(totalCents: number, ratePercent = VAT_RATE_PERCENT): number {
  return Math.round(totalCents - totalCents / (1 + ratePercent / 100));
}

export function buildOrderEmail(input: OrderEmailInput): { subject: string; text: string } {
  const country = input.shippingAddress?.country ?? "";
  const exported = regionForCountry(country)?.customs ?? false;
  const address = [
    input.shippingName,
    input.shippingAddress?.line1,
    input.shippingAddress?.line2,
    [input.shippingAddress?.postal_code, input.shippingAddress?.city].filter(Boolean).join(" "),
    COUNTRY_NAMES[country] ?? country,
  ].filter(Boolean);

  const text = [
    "Thank you for your order. This email confirms your purchase; please keep it.",
    "",
    `ORDER ${input.orderRef} · ${input.date.toISOString().slice(0, 10)}`,
    "",
    ...input.lines.map(
      (line) => `${line.quantity} × ${line.name}  ${formatMoney(line.amountCents)}`
    ),
    `Shipping to ${COUNTRY_NAMES[country] ?? country}  ${formatMoney(input.shippingCents)}`,
    `TOTAL PAID  ${formatMoney(input.totalCents)}`,
    ...(input.charged
      ? [`Charged in your currency: ${formatMoney(input.charged.amountCents, input.charged.currency)}`]
      : []),
    exported
      ? "Exported outside the EU without Swedish VAT. Import VAT, duty and carrier fees in your country are paid by you on delivery."
      : `Including ${VAT_RATE_PERCENT}% Swedish VAT: ${formatMoney(includedVat(input.totalCents))}`,
    "",
    "DELIVERY TO",
    ...address,
    `We dispatch within ${DISPATCH_DAYS} business days.`,
    "",
    "SELLER",
    ...SELLER_LINES,
    "",
    "YOUR RIGHT OF WITHDRAWAL",
    ...WITHDRAWAL_PARAGRAPHS.flatMap((p) => [p, ""]),
    "MODEL WITHDRAWAL FORM (complete and return only if you wish to withdraw)",
    ...MODEL_WITHDRAWAL_FORM,
    "",
    "FAULTY GOODS",
    COMPLAINT_SUMMARY,
    "",
    "DISPUTES",
    `Contact us first at ${COMPANY.email}. If we can't agree, you can turn to the Swedish National Board for Consumer Disputes (ARN), Box 174, 101 23 Stockholm, arn.se.`,
    "",
    `Full terms of sale (version ${TERMS_VERSION}): https://${COMPANY.website}/terms`,
    `Privacy policy: https://${COMPANY.website}/privacy`,
  ].join("\n");

  return { subject: `Order confirmation ${input.orderRef} — ${COMPANY.tradingName}`, text };
}
