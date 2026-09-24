import { describe, it, expect } from "vitest";
import { errorMessage, withError } from "./error-codes";

describe("errorMessage", () => {
  it("maps known codes to our own copy", () => {
    expect(errorMessage("sold_out")).toBe("This item is sold out.");
    expect(errorMessage("invalid_credentials")).toBe("Invalid email or password.");
  });

  it("renders nothing for arbitrary text from a crafted link", () => {
    expect(errorMessage("Your payment failed, call +46 70 000 00 00")).toBeNull();
    expect(errorMessage("")).toBeNull();
    expect(errorMessage(undefined)).toBeNull();
  });

  it("ignores inherited object keys", () => {
    for (const key of ["__proto__", "toString", "constructor", "hasOwnProperty"]) {
      expect(errorMessage(key)).toBeNull();
    }
  });
});

describe("withError", () => {
  it("appends the code as the error param", () => {
    expect(withError("/store/cart", "unavailable")).toBe("/store/cart?error=unavailable");
  });
});
