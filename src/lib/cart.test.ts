import { describe, it, expect, vi, beforeEach } from "vitest";
import { cartToCookieValue, getCart, maxLineQuantity, parseCartCookie, MAX_QUANTITY } from "./cart";

const { cookieValue } = vi.hoisted(() => ({
  cookieValue: { current: undefined as string | undefined },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (cookieValue.current === undefined ? undefined : { value: cookieValue.current }),
  }),
}));

beforeEach(() => {
  cookieValue.current = undefined;
});

describe("parseCartCookie", () => {
  it("reads {v: {variantId: quantity}}", () => {
    expect(parseCartCookie(JSON.stringify({ v: { 3: 2, 7: 1 } }))).toEqual([
      { variantId: 3, quantity: 2 },
      { variantId: 7, quantity: 1 },
    ]);
  });

  it("reads a pre-variants cart ({productId: quantity}) as empty", () => {
    expect(parseCartCookie(JSON.stringify({ 3: 2 }))).toEqual([]);
  });

  it("caps a tampered quantity at MAX_QUANTITY", () => {
    expect(parseCartCookie(JSON.stringify({ v: { 3: 1_000_000 } }))).toEqual([
      { variantId: 3, quantity: MAX_QUANTITY },
    ]);
  });

  it("drops non-integer ids and non-positive or fractional quantities", () => {
    const raw = JSON.stringify({ v: { abc: 1, 4: 0, 5: -2, 6: 1.5, 8: "2", 9: 1 } });
    expect(parseCartCookie(raw)).toEqual([
      { variantId: 8, quantity: 2 },
      { variantId: 9, quantity: 1 },
    ]);
  });

  it("treats a missing or malformed cookie as an empty cart", () => {
    expect(parseCartCookie(undefined)).toEqual([]);
    expect(parseCartCookie("{not json")).toEqual([]);
    expect(parseCartCookie(JSON.stringify({ v: [1, 2] }))).toEqual([]);
  });
});

describe("getCart", () => {
  it("returns an empty cart without a cookie", async () => {
    expect(await getCart()).toEqual([]);
  });

  it("returns the cookie's variant lines", async () => {
    cookieValue.current = JSON.stringify({ v: { 12: 2 } });
    expect(await getCart()).toEqual([{ variantId: 12, quantity: 2 }]);
  });

  it("returns an empty cart for a pre-variants cookie", async () => {
    cookieValue.current = JSON.stringify({ 3: 2, 7: 1 });
    expect(await getCart()).toEqual([]);
  });
});

describe("cartToCookieValue", () => {
  it("writes the variant shape and caps quantities", () => {
    expect(JSON.parse(cartToCookieValue([{ variantId: 1, quantity: 500 }]))).toEqual({
      v: { 1: MAX_QUANTITY },
    });
  });
});

describe("maxLineQuantity", () => {
  it("caps a cart line at stock, and at MAX_QUANTITY above that", () => {
    expect(maxLineQuantity(3)).toBe(3);
    expect(maxLineQuantity(0)).toBe(0);
    expect(maxLineQuantity(500)).toBe(MAX_QUANTITY);
    expect(maxLineQuantity(-2)).toBe(0);
  });
});
