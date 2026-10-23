import { describe, it, expect } from "vitest";
import { buildOrderEmail, includedVat, orderRef, type OrderEmailInput } from "./order-email";
import { COMPANY, TERMS_VERSION } from "./shop-info";
import { COMPLAINT_SUMMARY, MODEL_WITHDRAWAL_FORM, WITHDRAWAL_PARAGRAPHS } from "./legal-text";

const order: OrderEmailInput = {
  orderRef: orderRef(42),
  date: new Date("2026-09-24T10:00:00Z"),
  lines: [
    { name: "Canvas Tote", quantity: 2, amountCents: 78000 },
    { name: "Grid Notebook A5", quantity: 1, amountCents: 20000 },
  ],
  shippingCents: 5900,
  totalCents: 103900,
  shippingName: "Anna Andersson",
  shippingAddress: { line1: "Storgatan 1", postal_code: "111 22", city: "Stockholm", country: "SE" },
};

describe("includedVat", () => {
  it("extracts 25% VAT from a VAT-inclusive total", () => {
    expect(includedVat(12500)).toBe(2500);
    expect(includedVat(103900)).toBe(20780);
  });
});

describe("buildOrderEmail", () => {
  const { subject, text } = buildOrderEmail(order);

  it("identifies the order", () => {
    expect(subject).toContain("KDC-00042");
    expect(text).toContain("2 × Canvas Tote");
    expect(text).toMatch(/TOTAL PAID  1\s039\skr/);
    expect(text).toMatch(/Including 25% Swedish VAT: 207,80\skr/);
    expect(text).not.toContain("Charged in your currency");
  });

  it("carries what the law requires on a durable medium", () => {
    expect(text).toContain(COMPANY.orgNr);
    expect(text).toContain("YOUR RIGHT OF WITHDRAWAL");
    expect(text).toContain("MODEL WITHDRAWAL FORM");
    expect(text).toContain("3 years");
    expect(text).toContain("ARN");
  });

  it("carries the same legal content in the html part", () => {
    const { html } = buildOrderEmail(order);
    expect(html).toContain("Your right of withdrawal");
    expect(html).toContain("You have the right to withdraw from your purchase within 14 days");
    expect(html).toContain("Model withdrawal form");
    expect(html).toContain("Signature of consumer(s) (only if this form is sent on paper):");
    expect(html).toContain(COMPANY.legalName);
    expect(html).toContain(COMPANY.orgNr);
    expect(html).toContain(COMPANY.vatNr);
    expect(html).toContain("3 years");
    expect(html).toContain("ARN");
    expect(html).toContain("Anna Andersson");
    expect(html).toContain("Storgatan 1");
    expect(html).toContain("We dispatch within 2 business days.");
    expect(html).toContain("Including 25% Swedish VAT: 207,80");
    expect(html).toContain(`https://${COMPANY.website}/store/withdraw`);
    expect(html).toContain(`(version ${TERMS_VERSION})`);
    expect(html).toContain("2 × Canvas Tote");
  });

  it("has every legal element of the html in the text part too", () => {
    const { text } = buildOrderEmail(order);
    for (const part of [
      ...WITHDRAWAL_PARAGRAPHS,
      ...MODEL_WITHDRAWAL_FORM,
      COMPLAINT_SUMMARY,
      COMPANY.legalName,
      COMPANY.orgNr,
      COMPANY.vatNr,
      ...COMPANY.address,
      COMPANY.email,
      COMPANY.phone.display,
      "We dispatch within 2 business days.",
      "Shipping to Sweden",
      `Full terms of sale (version ${TERMS_VERSION}): https://${COMPANY.website}/terms`,
      `Privacy policy: https://${COMPANY.website}/privacy`,
      `https://${COMPANY.website}/store/withdraw`,
    ]) {
      expect(text).toContain(part);
    }
  });

  it("escapes the customer's name and address in the html", () => {
    const { html, text } = buildOrderEmail({ ...order, shippingName: "<script>x()</script>" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;x()&lt;/script&gt;");
    expect(text).toContain("<script>x()</script>");
  });

  it("adds what Adaptive Pricing charged in the customer's currency", () => {
    const text = buildOrderEmail({ ...order, charged: { amountCents: 9120, currency: "eur" } }).text;
    expect(text).toContain("Charged in your currency: €91.20");
  });

  it("states export without VAT for non-EU deliveries", () => {
    const norway = buildOrderEmail({
      ...order,
      shippingAddress: { ...order.shippingAddress, country: "NO" },
    }).text;
    expect(norway).toContain("without Swedish VAT");
    expect(norway).not.toContain("Including 25%");
  });
});
