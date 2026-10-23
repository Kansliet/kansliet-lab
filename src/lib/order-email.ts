import {
  COMPANY,
  COUNTRY_NAMES,
  DISPATCH_DAYS,
  VAT_RATE_PERCENT,
  WITHDRAW_PATH,
  formatMoney,
  regionForCountry,
} from "@/lib/shop-info";
import { COMPLAINT_SUMMARY, MODEL_WITHDRAWAL_FORM, WITHDRAWAL_PARAGRAPHS } from "@/lib/legal-text";
import { footerBlock, renderEmail, sellerColumn } from "@/lib/email-layout";

// The order confirmation doubles as the legally required confirmation "on a
// durable medium" (distansavtalslagen 2 kap 12 §): the email itself must carry
// the seller's details, what was bought and paid, the withdrawal right with
// the model form, and complaint rights. A link to the website is not enough.
// Built from blocks (email-layout.ts), so the HTML and the text part carry
// exactly the same content.

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

export function buildOrderEmail(input: OrderEmailInput): { subject: string; html: string; text: string } {
  const country = input.shippingAddress?.country ?? "";
  const exported = regionForCountry(country)?.customs ?? false;
  const address = [
    input.shippingName,
    input.shippingAddress?.line1,
    input.shippingAddress?.line2,
    [input.shippingAddress?.postal_code, input.shippingAddress?.city].filter(Boolean).join(" "),
    COUNTRY_NAMES[country] ?? country,
  ].filter((line): line is string => Boolean(line));
  const itemCount = input.lines.reduce((sum, line) => sum + line.quantity, 0);

  return renderEmail({
    subject: `Order confirmation ${input.orderRef} — ${COMPANY.tradingName}`,
    preheader: `Order ${input.orderRef} confirmed. ${itemCount} ${itemCount === 1 ? "item" : "items"}, ${formatMoney(input.totalCents)}. Dispatched within ${DISPATCH_DAYS} business days.`,
    reference: input.orderRef,
    blocks: [
      {
        type: "title",
        title: "Order confirmed",
        subtitle: `${input.date.toISOString().slice(0, 10)} · Thank you for your order. This email confirms your purchase; please keep it.`,
      },
      {
        type: "box",
        rows: [
          ...input.lines.map((line) => ({
            kind: "item" as const,
            text: `${line.quantity} × ${line.name}`,
            amount: formatMoney(line.amountCents),
          })),
          {
            kind: "muted",
            text: `Shipping to ${COUNTRY_NAMES[country] ?? country}`,
            amount: formatMoney(input.shippingCents),
          },
          { kind: "total", label: "Total paid", amount: formatMoney(input.totalCents) },
        ],
        notes: [
          ...(input.charged
            ? [`Charged in your currency: ${formatMoney(input.charged.amountCents, input.charged.currency)}`]
            : []),
          exported
            ? "Exported outside the EU without Swedish VAT. Import VAT, duty and carrier fees in your country are paid by you on delivery."
            : `Including ${VAT_RATE_PERCENT}% Swedish VAT: ${formatMoney(includedVat(input.totalCents))}`,
        ],
      },
      {
        type: "columns",
        columns: [
          {
            chip: "Delivery to",
            lines: address,
            note: `We dispatch within ${DISPATCH_DAYS} business days.`,
          },
          sellerColumn(),
        ],
      },
      {
        type: "section",
        heading: "Your right of withdrawal",
        paragraphs: WITHDRAWAL_PARAGRAPHS,
        button: { label: "Withdraw from contract here", href: `https://${COMPANY.website}${WITHDRAW_PATH}` },
      },
      {
        type: "section",
        heading: "Model withdrawal form",
        lines: ["(Complete and return only if you wish to withdraw.)", ...MODEL_WITHDRAWAL_FORM],
        subdued: true,
      },
      { type: "section", heading: "Faulty goods", paragraphs: [COMPLAINT_SUMMARY] },
      {
        type: "section",
        heading: "Disputes",
        paragraphs: [
          `Contact us first at ${COMPANY.email}. If we can't agree, you can turn to the Swedish National Board for Consumer Disputes (ARN), Box 174, 101 23 Stockholm, arn.se.`,
        ],
      },
      footerBlock(),
    ],
  });
}
