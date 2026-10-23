import { describe, it, expect } from "vitest";
import { buildWithdrawalEmail, formatStockholmTime } from "./withdrawal-email";
import { parseOrderRef } from "./order-email";
import { COMPANY } from "./shop-info";

describe("parseOrderRef", () => {
  it("reads the reference however the customer types it", () => {
    expect(parseOrderRef("KDC-00042")).toBe(42);
    expect(parseOrderRef(" kdc 42 ")).toBe(42);
    expect(parseOrderRef("KDC00042")).toBe(42);
    expect(parseOrderRef("#42")).toBe(42);
    expect(parseOrderRef("42")).toBe(42);
  });

  it("rejects anything else", () => {
    expect(parseOrderRef("")).toBeNull();
    expect(parseOrderRef("KDC-0")).toBeNull();
    expect(parseOrderRef("ABC-42")).toBeNull();
    expect(parseOrderRef("42; DROP TABLE")).toBeNull();
    expect(parseOrderRef("1234567890")).toBeNull();
  });
});

describe("formatStockholmTime", () => {
  it("shows Swedish local time, summer and winter", () => {
    expect(formatStockholmTime(new Date("2026-09-27T08:31:00Z"))).toBe("2026-09-27 10:31");
    expect(formatStockholmTime(new Date("2026-12-01T08:31:00Z"))).toBe("2026-12-01 09:31");
  });
});

describe("buildWithdrawalEmail", () => {
  const { subject, text, html } = buildWithdrawalEmail({
    orderRef: "KDC-00042",
    name: "Anna Andersson",
    email: "anna@example.com",
    receivedAt: new Date("2026-09-27T08:31:00Z"),
  });

  it("confirms what was received and when", () => {
    expect(subject).toContain("KDC-00042");
    expect(text).toContain("Name: Anna Andersson");
    expect(text).toContain("Email: anna@example.com");
    expect(text).toContain("Received: 2026-09-27 10:31 (Swedish time)");
  });

  it("says where to send the goods and when the refund comes", () => {
    expect(text).toContain(COMPANY.address.join(", "));
    expect(text).toContain("within 14 days");
    expect(text).toContain(COMPANY.orgNr);
  });

  it("shows what was received and when in the html too", () => {
    expect(html).toContain("Withdrawal received");
    expect(html).toContain("KDC-00042");
    expect(html).toContain("Anna Andersson");
    expect(html).toContain("anna@example.com");
    expect(html).toContain("2026-09-27 10:31 (Swedish time)");
    expect(html).toContain(COMPANY.legalName);
    expect(html).toContain(COMPANY.orgNr);
    expect(html).toContain(COMPANY.address.join(", "));
    expect(html).toContain("within 14 days");
    expect(html).toContain("reply to this email");
  });

  it("escapes what the customer typed in the html but not in the text", () => {
    const email = buildWithdrawalEmail({
      orderRef: "KDC-00042",
      name: "<b>Anna</b> & Co",
      email: "anna@example.com",
      receivedAt: new Date("2026-09-27T08:31:00Z"),
    });
    expect(email.html).not.toContain("<b>Anna</b>");
    expect(email.html).toContain("&lt;b&gt;Anna&lt;/b&gt; &amp; Co");
    expect(email.text).toContain("Name: <b>Anna</b> & Co");
  });
});
