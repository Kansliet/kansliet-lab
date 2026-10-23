import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

const { listMock, retrieveMock, MissingError } = vi.hoisted(() => {
  class MissingError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  }
  return { listMock: vi.fn(), retrieveMock: vi.fn(), MissingError };
});

vi.mock("stripe", () => {
  class Stripe {
    static errors = { StripeInvalidRequestError: MissingError };
    prices = { list: listMock, retrieve: retrieveMock };
  }
  return { default: Stripe };
});
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: (fn: unknown) => fn,
}));

let getPrice: typeof import("./stripe").getPrice;

beforeAll(async () => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
  ({ getPrice } = await import("./stripe"));
  vi.unstubAllEnvs();
});

beforeEach(() => {
  listMock.mockReset().mockImplementation(async function* () {
    yield { id: "price_listed", active: true, unit_amount: 5000, currency: "sek" };
  });
  retrieveMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getPrice", () => {
  it("returns an active price from the cached list", async () => {
    expect(await getPrice("price_listed")).toEqual({ amount: 50, currency: "SEK" });
    expect(retrieveMock).not.toHaveBeenCalled();
  });

  it("falls back to retrieve for a price created within the cache window", async () => {
    retrieveMock.mockResolvedValue({ id: "price_new", active: true, unit_amount: 4000, currency: "sek" });
    expect(await getPrice("price_new")).toEqual({ amount: 40, currency: "SEK" });
  });

  it("returns null for an archived price, which Checkout would refuse", async () => {
    retrieveMock.mockResolvedValue({ id: "price_old", active: false, unit_amount: 4000, currency: "sek" });
    expect(await getPrice("price_old")).toBeNull();
  });

  it("returns null for a price deleted in the dashboard", async () => {
    retrieveMock.mockRejectedValue(new MissingError("resource_missing"));
    expect(await getPrice("price_gone")).toBeNull();
  });

  it("still throws on other Stripe errors, such as an outage", async () => {
    retrieveMock.mockRejectedValue(new Error("connection reset"));
    await expect(getPrice("price_x")).rejects.toThrow("connection reset");
  });
});
