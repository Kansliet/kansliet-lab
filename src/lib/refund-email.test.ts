import { describe, it, expect } from "vitest";
import { buildRefundEmail, refundEmailForOrder } from "./refund-email";
import { COMPANY } from "./shop-info";

const date = new Date("2026-10-23T09:00:00Z");
const base = { id: 42, currency: "sek", customer_email: "anna@example.com" };

describe("refundEmailForOrder", () => {
  it("full refund of an untouched order: the whole amount, marked full", () => {
    const input = refundEmailForOrder({ ...base, amount_refunded: 0 }, 103900, true, date);
    expect(input).toMatchObject({
      to: "anna@example.com",
      orderRef: "KDC-00042",
      refundedNowCents: 103900,
      totalRefundedCents: 103900,
      full: true,
    });
  });

  it("first partial refund: just that amount, not full", () => {
    const input = refundEmailForOrder({ ...base, amount_refunded: 0 }, 20000, false, date);
    expect(input).toMatchObject({ refundedNowCents: 20000, totalRefundedCents: 20000, full: false });
  });

  it("second partial refund: this time's amount and the total", () => {
    const input = refundEmailForOrder({ ...base, amount_refunded: 20000 }, 50000, false, date);
    expect(input).toMatchObject({ refundedNowCents: 30000, totalRefundedCents: 50000, full: false });
  });

  it("a partial refund that completes the order is a full refund of the rest", () => {
    const input = refundEmailForOrder({ ...base, amount_refunded: 20000 }, 103900, true, date);
    expect(input).toMatchObject({ refundedNowCents: 83900, totalRefundedCents: 103900, full: true });
  });

  it("sends nothing when nothing changed", () => {
    expect(refundEmailForOrder({ ...base, amount_refunded: 20000 }, 20000, false, date)).toBeNull();
    expect(refundEmailForOrder({ ...base, amount_refunded: 50000 }, 20000, false, date)).toBeNull();
    expect(refundEmailForOrder({ ...base, amount_refunded: 0 }, 0, false, date)).toBeNull();
  });

  it("sends nothing without a customer email", () => {
    expect(refundEmailForOrder({ ...base, customer_email: null, amount_refunded: 0 }, 100, false, date)).toBeNull();
  });
});

describe("buildRefundEmail", () => {
  const full = buildRefundEmail({
    orderRef: "KDC-00042",
    date,
    refundedNowCents: 103900,
    totalRefundedCents: 103900,
    currency: "sek",
    full: true,
  });
  const second = buildRefundEmail({
    orderRef: "KDC-00042",
    date,
    refundedNowCents: 30000,
    totalRefundedCents: 50000,
    currency: "sek",
    full: false,
  });

  it("states the order, the amount and the wait, in both parts", () => {
    for (const part of [full.html, full.text]) {
      expect(part).toContain("KDC-00042");
      expect(part).toContain("Full refund");
      expect(part).toMatch(/1\s039\skr/);
      expect(part).toContain("5–10 business days");
      expect(part).toContain("card or other payment method you paid with");
      expect(part).toContain(COMPANY.orgNr);
    }
    expect(full.subject).toContain("KDC-00042");
  });

  it("a full refund in one go shows no separate total", () => {
    expect(full.text).not.toContain("Refunded in total");
  });

  it("a second partial refund shows this time and the total", () => {
    for (const part of [second.html, second.text]) {
      expect(part).toContain("Partial refund");
      expect(part).toMatch(/300\skr/);
      expect(part).toMatch(/500\skr/);
    }
    expect(second.text).toContain("Refunded in total");
  });

  it("uses the order's currency", () => {
    const eur = buildRefundEmail({
      orderRef: "KDC-00042",
      date,
      refundedNowCents: 4720,
      totalRefundedCents: 4720,
      currency: "eur",
      full: false,
    });
    expect(eur.text).toContain("€47.20");
    expect(eur.text).not.toContain("kr");
  });

  it("is free of promotion", () => {
    expect(full.text.toLowerCase()).not.toMatch(/discount|newsletter|you might also like|% off/);
  });
});
