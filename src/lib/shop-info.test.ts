import { describe, it, expect } from "vitest";
import { SHIP_COUNTRIES, formatMoney, regionForCountry, shippingCost } from "./shop-info";

describe("shipping regions", () => {
  it("ships to the launch countries only", () => {
    expect(SHIP_COUNTRIES).toEqual(["SE", "DK", "FI", "DE", "NO"]);
    expect(regionForCountry("GB")).toBeNull();
    expect(regionForCountry("US")).toBeNull();
  });

  it("marks Norway as outside the EU VAT area", () => {
    expect(regionForCountry("NO")?.customs).toBe(true);
    expect(regionForCountry("DE")?.customs).toBe(false);
  });
});

describe("formatMoney", () => {
  it("shows kronor without decimals unless there are öre", () => {
    expect(formatMoney(45000)).toMatch(/^450\skr$/);
    expect(formatMoney(105000)).toMatch(/^1\s050\skr$/);
    expect(formatMoney(45050)).toMatch(/^450,50\skr$/);
  });

  it("formats other currencies the international way", () => {
    expect(formatMoney(4720, "eur")).toBe("€47.20");
  });
});

describe("shippingCost", () => {
  const se = regionForCountry("SE")!;
  const eu = regionForCountry("DE")!;

  it("is free to Sweden from 800 kr", () => {
    expect(shippingCost(se, 79999)).toBe(se.amount);
    expect(shippingCost(se, 80000)).toBe(0);
  });

  it("never waives shipping where no threshold is set", () => {
    expect(shippingCost(eu, 10_000_000)).toBe(eu.amount);
  });
});
