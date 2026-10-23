import { describe, expect, it } from "vitest";
import { orderEmailFromSession } from "./order-confirmation";

const session = {
  created: 1_790_000_000,
  amount_total: 15900,
  currency: "sek",
  customer_details: { email: "kund@example.com" },
  shipping_cost: { amount_total: 5900 },
  presentment_details: null,
  collected_information: {
    shipping_details: {
      name: "Anna Andersson",
      address: { line1: "Storgatan 1", postal_code: "111 22", city: "Stockholm", country: "SE" },
    },
  },
};
const lines = [
  { description: "Desk Tray — Sand / M", quantity: 2, amount_total: 6000 },
  { description: "Pen Cup", quantity: 1, amount_total: 4000 },
];

describe("orderEmailFromSession", () => {
  it("builds the same totals and lines as the webhook always has for a 2-line session", () => {
    expect(orderEmailFromSession(session, lines, 42)).toEqual({
      to: "kund@example.com",
      orderRef: "KDC-00042",
      date: new Date(1_790_000_000 * 1000),
      lines: [
        { name: "Desk Tray — Sand / M", quantity: 2, amountCents: 6000 },
        { name: "Pen Cup", quantity: 1, amountCents: 4000 },
      ],
      shippingCents: 5900,
      totalCents: 15900,
      charged: null,
      shippingName: "Anna Andersson",
      shippingAddress: { line1: "Storgatan 1", postal_code: "111 22", city: "Stockholm", country: "SE" },
    });
  });

  it("adds what the customer was charged under Adaptive Pricing", () => {
    const email = orderEmailFromSession(
      { ...session, presentment_details: { presentment_amount: 1450, presentment_currency: "eur" } },
      lines,
      42,
    );
    expect(email?.charged).toEqual({ amountCents: 1450, currency: "eur" });
  });

  it("has no charged field when the presentment currency is the order's", () => {
    const email = orderEmailFromSession(
      { ...session, presentment_details: { presentment_amount: 15900, presentment_currency: "sek" } },
      lines,
      42,
    );
    expect(email?.charged).toBeNull();
  });

  it("falls back for missing line text, shipping and address", () => {
    const email = orderEmailFromSession(
      { ...session, shipping_cost: null, collected_information: null },
      [{ description: null, quantity: null, amount_total: 100 }],
      7,
    );
    expect(email).toMatchObject({
      lines: [{ name: "Item", quantity: 0, amountCents: 100 }],
      shippingCents: 0,
      shippingName: null,
      shippingAddress: null,
    });
  });

  it("returns null when the customer left no email", () => {
    expect(orderEmailFromSession({ ...session, customer_details: null }, lines, 42)).toBeNull();
  });
});
