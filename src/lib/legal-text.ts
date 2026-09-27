import {
  COMPANY,
  COMPLAINT_YEARS,
  REFUND_DAYS,
  WITHDRAWAL_DAYS,
  WITHDRAW_PATH,
} from "@/lib/shop-info";

// Legal wording used in more than one place: the /terms page renders it, and
// the order confirmation email repeats it, because the law requires this
// information on a "durable medium" (the email), not only on a web page.

export const SELLER_LINES = [
  `${COMPANY.legalName} (org.nr ${COMPANY.orgNr}, VAT ${COMPANY.vatNr})`,
  COMPANY.address.join(", "),
  COMPANY.email,
  COMPANY.phone.display,
];

/** The right of withdrawal, in the order the email and the terms state it. */
export const WITHDRAWAL_PARAGRAPHS = [
  `You have the right to withdraw from your purchase within ${WITHDRAWAL_DAYS} days without giving any reason. The period starts the day you, or someone you name (not the carrier), receive the goods. If one order arrives in several parcels, it starts when you receive the last one.`,
  `To withdraw, send us a clear statement before the period ends: through the withdrawal form at ${COMPANY.website}${WITHDRAW_PATH}, by email to ${COMPANY.email}, or by post to ${COMPANY.legalName}, ${COMPANY.address.join(", ")}. Include your order number. You can use the model withdrawal form below, but you don't have to; any clear statement works.`,
  `Send the goods back to us within ${WITHDRAWAL_DAYS} days of telling us. You pay the cost of returning them.`,
  `We refund everything you paid, including the standard shipping cost, within ${REFUND_DAYS} days of receiving your notice, to the same payment method. We may wait to refund until the goods are back with us or you have shown that you have sent them, whichever comes first.`,
  `You are responsible for any loss in value caused by handling the goods beyond what is needed to establish their nature, characteristics and function, the way you could in a shop.`,
];

export const MODEL_WITHDRAWAL_FORM = [
  `To: ${COMPANY.legalName}, ${COMPANY.address.join(", ")}, ${COMPANY.email}`,
  "I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following goods (*):",
  "Order number:",
  "Ordered on (*) / received on (*):",
  "Name of consumer(s):",
  "Address of consumer(s):",
  "Signature of consumer(s) (only if this form is sent on paper):",
  "Date:",
  "(*) Delete as appropriate.",
];

export const COMPLAINT_SUMMARY = `If an item is faulty, you can make a complaint for up to ${COMPLAINT_YEARS} years after receiving it, under the Swedish Consumer Sales Act (konsumentköplagen). A complaint made within two months of discovering the fault is always in time. We cover the return shipping for justified complaints.`;
