import { COMPANY, REFUND_DAYS, WITHDRAWAL_DAYS } from "@/lib/shop-info";
import { SELLER_LINES } from "@/lib/legal-text";

// The acknowledgement the withdrawal function must send "without undue delay,
// on a durable medium" (directive 2023/2673): what was received and when, and
// what happens next. The notice is valid from when it was sent; this email is
// the customer's proof of that.

export type WithdrawalEmailInput = {
  orderRef: string;
  name: string;
  email: string;
  receivedAt: Date;
};

/** "2026-09-27 10:31" in Swedish time, the time zone the deadlines run in. */
export function formatStockholmTime(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function buildWithdrawalEmail(input: WithdrawalEmailInput): { subject: string; text: string } {
  const text = [
    "We have received your withdrawal. This email confirms it; please keep it.",
    "",
    "WITHDRAWAL RECEIVED",
    `Order: ${input.orderRef}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Received: ${formatStockholmTime(input.receivedAt)} (Swedish time)`,
    "",
    "WHAT HAPPENS NEXT",
    `Send the goods back within ${WITHDRAWAL_DAYS} days to ${COMPANY.legalName}, ${COMPANY.address.join(", ")}. Mark the parcel with your order number. You pay the cost of returning them, and we recommend a tracked service.`,
    "",
    `We refund everything you paid, including the standard shipping cost, within ${REFUND_DAYS} days of receiving your withdrawal, to the same payment method. We may wait to refund until the goods are back with us or you have shown that you have sent them, whichever comes first.`,
    "",
    "If you didn't send this, or the order number is wrong, reply to this email.",
    "",
    "SELLER",
    ...SELLER_LINES,
  ].join("\n");

  return { subject: `Withdrawal received ${input.orderRef} — ${COMPANY.tradingName}`, text };
}
