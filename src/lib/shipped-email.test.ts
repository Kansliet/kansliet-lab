import { describe, it, expect } from "vitest";
import { buildShippedEmail, parseShippingInput, trackingUrl } from "./shipped-email";
import { COMPANY } from "./shop-info";

const base = {
  orderRef: "KDC-00042",
  shippedAt: new Date("2026-10-23T09:00:00Z"),
  items: [
    { name: "Canvas Tote — Sand", quantity: 2 },
    { name: "Grid Notebook A5", quantity: 1 },
  ],
};

describe("trackingUrl", () => {
  it("links the carriers we know, with the number encoded", () => {
    expect(trackingUrl("PostNord", "AB 123/4")).toBe("https://tracking.postnord.com/tracking?id=AB%20123%2F4");
    expect(trackingUrl("DHL", "123")).toContain("tracking-id=123");
    expect(trackingUrl("Budbee", "123")).toBe("https://track.budbee.com/123");
  });

  it("has no link for Other or no carrier", () => {
    expect(trackingUrl("Other", "123")).toBeNull();
    expect(trackingUrl(null, "123")).toBeNull();
  });
});

describe("parseShippingInput", () => {
  it("keeps a known carrier and a trimmed number", () => {
    expect(parseShippingInput("PostNord", "  00123  ")).toEqual({ carrier: "PostNord", trackingNumber: "00123" });
  });

  it("turns empty or unknown input into null", () => {
    expect(parseShippingInput("", "")).toEqual({ carrier: null, trackingNumber: null });
    expect(parseShippingInput("FedEx", "   ")).toEqual({ carrier: null, trackingNumber: null });
    expect(parseShippingInput(null, null)).toEqual({ carrier: null, trackingNumber: null });
  });

  it("strips control characters and caps the length", () => {
    expect(parseShippingInput("DHL", "AB\r\nCD").trackingNumber).toBe("AB  CD");
    expect(parseShippingInput("DHL", "x".repeat(200)).trackingNumber).toHaveLength(64);
  });
});

describe("buildShippedEmail", () => {
  const withTracking = buildShippedEmail({ ...base, carrier: "PostNord", trackingNumber: "00123456789" });

  it("names the order, the items, the carrier and the tracking number in both parts", () => {
    for (const part of [withTracking.html, withTracking.text]) {
      expect(part).toContain("KDC-00042");
      expect(part).toContain("2 × Canvas Tote — Sand");
      expect(part).toContain("1 × Grid Notebook A5");
      expect(part).toContain("PostNord");
      expect(part).toContain("00123456789");
      expect(part).toContain("https://tracking.postnord.com/tracking?id=00123456789");
    }
    expect(withTracking.subject).toBe("Shipped KDC-00042 — KANSLIET");
  });

  it("reminds of the withdrawal right with the link, in both parts", () => {
    for (const part of [withTracking.html, withTracking.text]) {
      expect(part).toContain("within 14 days from when you receive it");
      expect(part).toContain(`https://${COMPANY.website}/store/withdraw`);
      expect(part).toContain(COMPANY.orgNr);
    }
  });

  it("works without tracking: no carrier or tracking rows", () => {
    const plain = buildShippedEmail({ ...base, carrier: null, trackingNumber: null });
    for (const part of [plain.html, plain.text]) {
      expect(part).toContain("2 × Canvas Tote — Sand");
      expect(part.toLowerCase()).not.toContain("tracking number");
      expect(part).not.toContain("PostNord");
    }
  });

  it("shows a number without a link for Other, and hides the word Other", () => {
    const other = buildShippedEmail({ ...base, carrier: "Other", trackingNumber: "ZZ9" });
    expect(other.text).toContain("Tracking number: ZZ9");
    expect(other.text).not.toContain("(https://");
    expect(other.text).not.toContain("Other");
  });

  it("escapes the tracking number in the html and in the link", () => {
    const evil = buildShippedEmail({ ...base, carrier: "DHL", trackingNumber: '"><script>x()</script>' });
    expect(evil.html).not.toContain("<script>");
    expect(evil.html).toContain("&lt;script&gt;");
    expect(evil.html).toContain("tracking-id=%22%3E%3Cscript%3E");
  });

  it("carries no promotion", () => {
    expect(withTracking.text.toLowerCase()).not.toMatch(/discount|newsletter|you might also like|% off/);
  });
});
