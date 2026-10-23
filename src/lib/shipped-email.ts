import { COMPANY, WITHDRAWAL_DAYS, WITHDRAW_PATH } from "@/lib/shop-info";
import { footerBlock, renderEmail, sellerColumn } from "@/lib/email-layout";

// Sent when an order is marked shipped in /admin/orders. Not legally required,
// but it is the email customers notice when it's missing. A transactional
// email only: no promotion. The withdrawal reminder is the one legal line.

/** The carriers offered in MARK SHIPPED. "Other" has no tracking link. */
export const CARRIERS = ["PostNord", "DHL", "Budbee", "Other"] as const;
export type Carrier = (typeof CARRIERS)[number];

const MAX_TRACKING_LENGTH = 64;

/** The carrier's public tracking page for a number, or null when we don't know one. */
export function trackingUrl(carrier: Carrier | null, trackingNumber: string): string | null {
  const id = encodeURIComponent(trackingNumber);
  switch (carrier) {
    case "PostNord":
      return `https://tracking.postnord.com/tracking?id=${id}`;
    case "DHL":
      return `https://www.dhl.com/global-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=${id}`;
    case "Budbee":
      return `https://track.budbee.com/${id}`;
    default:
      return null;
  }
}

/** The MARK SHIPPED form's optional fields, cleaned: a known carrier or null, a trimmed number or null. */
export function parseShippingInput(
  carrier: unknown,
  trackingNumber: unknown,
): { carrier: Carrier | null; trackingNumber: string | null } {
  const knownCarrier = CARRIERS.find((c) => c === carrier) ?? null;
  const number =
    typeof trackingNumber === "string"
      ? trackingNumber.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, MAX_TRACKING_LENGTH)
      : "";
  return { carrier: knownCarrier, trackingNumber: number || null };
}

export type ShippedEmailInput = {
  orderRef: string;
  shippedAt: Date;
  items: { name: string; quantity: number }[];
  carrier: Carrier | null;
  trackingNumber: string | null;
};

export function buildShippedEmail(input: ShippedEmailInput): { subject: string; html: string; text: string } {
  const link = input.trackingNumber ? trackingUrl(input.carrier, input.trackingNumber) : null;
  const carrierName = input.carrier && input.carrier !== "Other" ? input.carrier : null;
  return renderEmail({
    subject: `Shipped ${input.orderRef} — ${COMPANY.tradingName}`,
    preheader: `Order ${input.orderRef} is on its way${carrierName ? ` with ${carrierName}` : ""}${input.trackingNumber ? `. Tracking number ${input.trackingNumber}` : ""}.`,
    reference: input.orderRef,
    blocks: [
      {
        type: "title",
        title: "Order shipped",
        subtitle: `${input.shippedAt.toISOString().slice(0, 10)} · Your order is on its way.`,
      },
      {
        type: "box",
        rows: [
          { kind: "kv", label: "Order", value: input.orderRef },
          ...input.items.map((item) => ({
            kind: "item" as const,
            text: `${item.quantity} × ${item.name}`,
          })),
          ...(carrierName ? [{ kind: "kv" as const, label: "Carrier", value: carrierName }] : []),
          ...(input.trackingNumber
            ? [
                {
                  kind: "kv" as const,
                  label: "Tracking number",
                  value: input.trackingNumber,
                  ...(link ? { href: link } : {}),
                },
              ]
            : []),
        ],
      },
      {
        type: "section",
        heading: "Your right of withdrawal",
        paragraphs: [
          `You can withdraw from your purchase within ${WITHDRAWAL_DAYS} days from when you receive it, without giving any reason. The full conditions and the model withdrawal form are in your order confirmation and in the terms of sale.`,
        ],
        button: { label: "Cancel or return a purchase", href: `https://${COMPANY.website}${WITHDRAW_PATH}` },
      },
      { type: "columns", columns: [sellerColumn()] },
      footerBlock(),
    ],
  });
}
