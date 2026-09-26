import { describe, it, expect } from "vitest";
import { buildOrderEmail, includedVat, orderRef, type OrderEmailInput } from "./order-email";
import { COMPANY } from "./shop-info";

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
