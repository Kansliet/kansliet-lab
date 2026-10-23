import { describe, expect, it } from "vitest";
import { refundedInOrderCurrency } from "./refunds";

describe("refundedInOrderCurrency", () => {
  it("returns the charge's refunded amount unchanged when the currencies match", () => {
    const order = { amount_total: 52000, currency: "sek" };
    const charge = { amount: 52000, amount_refunded: 10000, currency: "sek", refunded: false };
    expect(refundedInOrderCurrency(order, charge)).toBe(10000);
  });

  it("books the whole order for a full refund in another currency", () => {
    const order = { amount_total: 52000, currency: "sek" };
    const charge = { amount: 4720, amount_refunded: 4720, currency: "eur", refunded: true };
    expect(refundedInOrderCurrency(order, charge)).toBe(52000);
  });

  it("converts a partial refund in another currency in proportion", () => {
    const order = { amount_total: 52000, currency: "sek" };
    const charge = { amount: 4720, amount_refunded: 2360, currency: "eur", refunded: false };
    expect(refundedInOrderCurrency(order, charge)).toBe(26000);
  });

  it("returns 0 when the charge amount is 0", () => {
    const order = { amount_total: 52000, currency: "sek" };
    const charge = { amount: 0, amount_refunded: 0, currency: "eur", refunded: false };
    expect(refundedInOrderCurrency(order, charge)).toBe(0);
  });
});
