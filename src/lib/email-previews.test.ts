import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildOrderEmail } from "./order-email";
import { buildWithdrawalEmail } from "./withdrawal-email";
import { buildShippedEmail } from "./shipped-email";
import { buildRefundEmail } from "./refund-email";

// Renders each customer email from fixed data. Normal runs only check that
// they render; to (re)write the files the owner opens in a browser, run
//   WRITE_EMAIL_PREVIEWS=1 npx vitest run src/lib/email-previews.test.ts
// which writes docs/store/email-previews/<name>.html.

const PREVIEW_DIR = path.join(process.cwd(), "docs/store/email-previews");

const previews = {
  "order-confirmation": buildOrderEmail({
    orderRef: "KDC-00005",
    date: new Date("2026-10-23T09:00:00Z"),
    lines: [{ name: "Kuumba International // Queen", quantity: 1, amountCents: 4000 }],
    shippingCents: 5900,
    totalCents: 9900,
    shippingName: "Emil Karlsson",
    shippingAddress: { line1: "Allévägen 30C", postal_code: "311 45", city: "Falkenberg", country: "SE" },
  }),
  "withdrawal-received": buildWithdrawalEmail({
    orderRef: "KDC-00005",
    name: "Emil Karlsson",
    email: "emil@example.com",
    receivedAt: new Date("2026-10-30T08:31:00Z"),
  }),
  shipped: buildShippedEmail({
    orderRef: "KDC-00005",
    shippedAt: new Date("2026-10-25T10:00:00Z"),
    items: [{ name: "Kuumba International // Queen", quantity: 1 }],
    carrier: "PostNord",
    trackingNumber: "00370123456789012345",
  }),
  refund: buildRefundEmail({
    orderRef: "KDC-00005",
    date: new Date("2026-11-02T09:00:00Z"),
    refundedNowCents: 4000,
    totalRefundedCents: 9900,
    currency: "sek",
    full: false,
  }),
};

describe("email previews", () => {
  for (const [name, email] of Object.entries(previews)) {
    it(`${name} renders html and text`, () => {
      expect(email.html.startsWith("<!doctype html>")).toBe(true);
      expect(email.html).toContain("KDC-00005");
      expect(email.text).toContain("KDC-00005");
    });
  }

  it.runIf(process.env.WRITE_EMAIL_PREVIEWS === "1")("writes the preview files", () => {
    mkdirSync(PREVIEW_DIR, { recursive: true });
    for (const [name, email] of Object.entries(previews)) {
      writeFileSync(path.join(PREVIEW_DIR, `${name}.html`), email.html);
    }
  });
});
