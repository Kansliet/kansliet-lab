import { describe, expect, it } from "vitest";
import { refundedInOrderCurrency, refundLedgerRows } from "./refunds";

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

describe("refundLedgerRows", () => {
  const sekOrder = { amount_total: 52000, currency: "sek" };
  const refund = (id: string, amount: number, status = "succeeded", currency = "sek") => ({
    id,
    amount,
    currency,
    created: 1_790_000_000,
    status,
  });

  it("makes one row per succeeded refund, in the order's currency", () => {
    const rows = refundLedgerRows(sekOrder, { amount: 52000 }, [refund("re_1", 10000), refund("re_2", 5000)]);
    expect(rows).toEqual([
      { stripeRefundId: "re_1", amount: 10000, created: 1_790_000_000 },
      { stripeRefundId: "re_2", amount: 5000, created: 1_790_000_000 },
    ]);
  });

  it("counts pending refunds (Klarna), like charge.amount_refunded does", () => {
    const rows = refundLedgerRows(sekOrder, { amount: 52000 }, [refund("re_1", 10000, "pending")]);
    expect(rows).toEqual([{ stripeRefundId: "re_1", amount: 10000, created: 1_790_000_000 }]);
  });

  it("skips refunds that failed or were canceled", () => {
    const rows = refundLedgerRows(sekOrder, { amount: 52000 }, [refund("re_1", 10000, "failed"), refund("re_2", 5000, "canceled")]);
    expect(rows).toEqual([]);
  });

  it("converts each refund in proportion when the charge is in another currency", () => {
    const rows = refundLedgerRows(sekOrder, { amount: 4720 }, [refund("re_1", 2360, "succeeded", "eur")]);
    expect(rows[0].amount).toBe(26000);
  });

  it("counts a refund of the whole charge as the whole order", () => {
    const rows = refundLedgerRows(sekOrder, { amount: 4720 }, [refund("re_1", 4720, "succeeded", "eur")]);
    expect(rows[0].amount).toBe(52000);
  });
});
