import { describe, expect, it } from "vitest";
import { matchVariant, stripeProductId } from "./order-lines";

const variants = [
  { id: 1, stripe_price_id: "price_a", stripe_product_id: "prod_a" },
  { id: 2, stripe_price_id: "price_b", stripe_product_id: "prod_b" },
];

describe("matchVariant", () => {
  it("prefers the price-id match over a product-id match", () => {
    expect(matchVariant(variants, "price_a", "prod_b")?.id).toBe(1);
  });

  it("falls back to the product id when the price id is unknown", () => {
    expect(matchVariant(variants, "price_old", "prod_b")?.id).toBe(2);
  });

  it("falls back to the product id when the line has no price id", () => {
    expect(matchVariant(variants, null, "prod_a")?.id).toBe(1);
  });

  it("returns null when neither matches", () => {
    expect(matchVariant(variants, "price_x", "prod_x")).toBeNull();
    expect(matchVariant(variants, null, null)).toBeNull();
  });
});

describe("stripeProductId", () => {
  it("handles a string, an object and null", () => {
    expect(stripeProductId("prod_a")).toBe("prod_a");
    expect(stripeProductId({ id: "prod_b" })).toBe("prod_b");
    expect(stripeProductId(null)).toBeNull();
    expect(stripeProductId(undefined)).toBeNull();
  });
});
