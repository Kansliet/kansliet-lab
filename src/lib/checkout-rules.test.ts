import { describe, expect, it } from "vitest";
import { cartProblem, refundUpdate, subtotalCents } from "./checkout-rules";
import { regionForCountry, shippingCost } from "./shop-info";

const stocked = (stock: number, sold_out = false) => ({ variant: { stock }, product: { sold_out } });

describe("cartProblem", () => {
  it("is null when every line is in stock", () => {
    const variants = new Map([[1, stocked(3)], [2, stocked(1)]]);
    expect(cartProblem([{ variantId: 1, quantity: 3 }, { variantId: 2, quantity: 1 }], variants)).toBeNull();
  });

  it("flags a hidden (sold-out) product, however much stock it has", () => {
    expect(cartProblem([{ variantId: 1, quantity: 1 }], new Map([[1, stocked(5, true)]]))).toBe("unavailable");
  });

  it("flags a variant that no longer exists", () => {
    expect(cartProblem([{ variantId: 9, quantity: 1 }], new Map())).toBe("unavailable");
  });

  it("flags stock 0", () => {
    expect(cartProblem([{ variantId: 1, quantity: 1 }], new Map([[1, stocked(0)]]))).toBe("unavailable");
  });

  it("flags a quantity over stock, but accepts exactly the stock", () => {
    const variants = new Map([[1, stocked(2)]]);
    expect(cartProblem([{ variantId: 1, quantity: 3 }], variants)).toBe("insufficient_stock");
    expect(cartProblem([{ variantId: 1, quantity: 2 }], variants)).toBeNull();
  });

  it("reports the first problem line", () => {
    const variants = new Map([[1, stocked(1)], [2, stocked(0)]]);
    const cart = [{ variantId: 1, quantity: 2 }, { variantId: 2, quantity: 1 }];
    expect(cartProblem(cart, variants)).toBe("insufficient_stock");
  });
});

describe("subtotalCents", () => {
  it("sums price × quantity in öre", () => {
    expect(subtotalCents([{ quantity: 2 }, { quantity: 1 }], [450, 129.5])).toBe(2 * 45000 + 12950);
  });

  it("rounds kronor floats to the öre before multiplying", () => {
    expect(subtotalCents([{ quantity: 3 }], [19.99])).toBe(3 * 1999);
    expect(subtotalCents([{ quantity: 1 }], [0.29])).toBe(29);
  });

  it("is 0 for an empty cart", () => {
    expect(subtotalCents([], [])).toBe(0);
  });

  it("puts the free-shipping boundary at exactly 80000 öre for Sweden", () => {
    const se = regionForCountry("SE")!;
    expect(shippingCost(se, subtotalCents([{ quantity: 1 }, { quantity: 1 }], [500, 300]))).toBe(0);
    expect(shippingCost(se, subtotalCents([{ quantity: 1 }, { quantity: 1 }], [500, 299.99]))).toBe(se.amount);
  });
});

describe("refundUpdate", () => {
  const paid = { fulfillment_status: "paid", shipped_at: null, amount_refunded: 0 };

  it("records a partial refund without changing status or stock", () => {
    expect(refundUpdate(paid, 5000, false)).toEqual({ skip: false, status: "paid", restock: false });
  });

  it("marks a full refund after a partial one refunded, and restocks an unshipped order", () => {
    const afterPartial = { ...paid, amount_refunded: 5000 };
    expect(refundUpdate(afterPartial, 10900, true)).toEqual({ skip: false, status: "refunded", restock: true });
  });

  it("does not restock a shipped order, but still marks it refunded", () => {
    const shipped = { fulfillment_status: "shipped", shipped_at: new Date("2026-10-20T10:00:00Z"), amount_refunded: 0 };
    expect(refundUpdate(shipped, 10900, true)).toEqual({ skip: false, status: "refunded", restock: false });
  });

  it("skips an event that adds nothing (redelivered or out of order)", () => {
    const refunded = { fulfillment_status: "refunded", shipped_at: null, amount_refunded: 10900 };
    expect(refundUpdate(refunded, 10900, true)).toEqual({ skip: true, status: "refunded", restock: false });
    expect(refundUpdate({ ...paid, amount_refunded: 5000 }, 3000, false).skip).toBe(true);
  });
});
