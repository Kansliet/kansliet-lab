import { describe, it, expect, vi, beforeEach } from "vitest";
import { cartToCookieValue, getCart, MAX_QUANTITY } from "./cart";

const { cookieValue } = vi.hoisted(() => ({ cookieValue: { current: undefined as string | undefined } }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (cookieValue.current === undefined ? undefined : { value: cookieValue.current }),
  }),
}));

beforeEach(() => {
  cookieValue.current = undefined;
});

describe("getCart", () => {
  it("returns an empty cart without a cookie", async () => {
    expect(await getCart()).toEqual([]);
  });

  it("parses {productId: quantity}", async () => {
    cookieValue.current = JSON.stringify({ 3: 2, 7: 1 });
    expect(await getCart()).toEqual([
      { productId: 3, quantity: 2 },
      { productId: 7, quantity: 1 },
    ]);
  });

  it("caps a tampered quantity at MAX_QUANTITY", async () => {
    cookieValue.current = JSON.stringify({ 3: 1_000_000 });
    expect(await getCart()).toEqual([{ productId: 3, quantity: MAX_QUANTITY }]);
  });

  it("drops non-integer ids and non-positive or fractional quantities", async () => {
    cookieValue.current = JSON.stringify({ abc: 1, 4: 0, 5: -2, 6: 1.5, 8: "2", 9: 1 });
    expect(await getCart()).toEqual([
      { productId: 8, quantity: 2 },
      { productId: 9, quantity: 1 },
    ]);
  });

  it("treats a malformed cookie as an empty cart", async () => {
    cookieValue.current = "{not json";
    expect(await getCart()).toEqual([]);
  });
});

describe("cartToCookieValue", () => {
  it("caps quantities when writing", () => {
    expect(JSON.parse(cartToCookieValue([{ productId: 1, quantity: 500 }]))).toEqual({ 1: MAX_QUANTITY });
  });
});
