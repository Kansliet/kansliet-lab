import { describe, it, expect } from "vitest";
import { escapeHtml, footerBlock, renderEmail, sellerColumn, type EmailContent } from "./email-layout";
import { COMPANY } from "./shop-info";

const content: EmailContent = {
  subject: "Test KDC-00042",
  preheader: "Preheader line",
  reference: "KDC-00042",
  blocks: [
    { type: "title", title: "Order confirmed", subtitle: "2026-09-24 · Thank you" },
    { type: "paragraph", text: "A plain paragraph." },
    {
      type: "box",
      rows: [
        { kind: "item", text: "2 × Canvas Tote", amount: "780 kr" },
        { kind: "muted", text: "Shipping to Sweden", amount: "59 kr" },
        { kind: "kv", label: "Tracking", value: "JJD0001", href: "https://example.com/track?id=JJD0001" },
        { kind: "total", label: "Total paid", amount: "839 kr" },
      ],
      notes: ["Including 25% Swedish VAT: 167,80 kr"],
    },
    {
      type: "columns",
      columns: [
        { chip: "Delivery to", lines: ["Anna Andersson", "Storgatan 1"], note: "Dispatched soon." },
        sellerColumn(),
      ],
    },
    {
      type: "section",
      heading: "Your right of withdrawal",
      paragraphs: ["First paragraph.", "Second paragraph."],
      button: { label: "Withdraw from contract here", href: "https://kansliet.co/store/withdraw" },
    },
    { type: "section", heading: "Model withdrawal form", lines: ["Line one", "Line two"], subdued: true },
    footerBlock(),
  ],
};

describe("renderEmail", () => {
  const { subject, html, text } = renderEmail(content);

  it("returns the subject unchanged", () => {
    expect(subject).toBe("Test KDC-00042");
    expect(html).toContain("<title>Test KDC-00042</title>");
  });

  it("puts every block in both the html and the text", () => {
    const shared = [
      "2026-09-24 · Thank you",
      "A plain paragraph.",
      "2 × Canvas Tote",
      "780 kr",
      "Shipping to Sweden",
      "JJD0001",
      "839 kr",
      "Including 25% Swedish VAT: 167,80 kr",
      "Anna Andersson",
      "Storgatan 1",
      "Dispatched soon.",
      COMPANY.legalName,
      COMPANY.orgNr,
      COMPANY.vatNr,
      COMPANY.email,
      "First paragraph.",
      "Second paragraph.",
      "Line one",
      "Line two",
      "https://kansliet.co/store/withdraw",
      "https://kansliet.co/terms",
      "https://kansliet.co/privacy",
    ];
    for (const part of shared) {
      expect(html, `html: ${part}`).toContain(part);
      expect(text, `text: ${part}`).toContain(part);
    }
    // Titles, chips and headings are uppercase in the text, small caps (CSS) in the html.
    for (const heading of ["Order confirmed", "Delivery to", "Seller", "Your right of withdrawal", "Model withdrawal form"]) {
      expect(html).toContain(heading);
    }
    for (const heading of ["DELIVERY TO", "SELLER", "YOUR RIGHT OF WITHDRAWAL", "MODEL WITHDRAWAL FORM", "ORDER CONFIRMED"]) {
      expect(text).toContain(heading);
    }
  });

  it("writes the text rows the way the plain-text emails always did", () => {
    expect(text).toContain("2 × Canvas Tote  780 kr");
    expect(text).toContain("Total paid  839 kr");
    expect(text).toContain("Tracking: JJD0001 (https://example.com/track?id=JJD0001)");
    expect(text.startsWith("KANSLIET (STORE) · KDC-00042\n\nORDER CONFIRMED")).toBe(true);
    expect(text).toContain("Withdraw from contract here: https://kansliet.co/store/withdraw");
    expect(text).toContain("Full terms of sale (version ");
  });

  it("has the preheader, the reference and the wordmark chip in the html", () => {
    expect(html).toContain("Preheader line");
    expect(html).toContain("KDC-00042");
    expect(html).toContain("KANSLIET (STORE)");
    expect(html).toContain('<meta name="color-scheme" content="light">');
  });

  it("escapes customer-supplied strings in the html", () => {
    const rendered = renderEmail({
      ...content,
      subject: "Hi <b>x</b>",
      preheader: "<script>pre()</script>",
      blocks: [
        {
          type: "columns",
          columns: [{ chip: "Delivery to", lines: ['<script>alert("x")</script> & Co', "O'Neil"] }],
        },
        { type: "box", rows: [{ kind: "kv", label: "Name", value: "<img src=x onerror=y>" }] },
      ],
    });
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).not.toContain("<img");
    expect(rendered.html).not.toContain("<b>");
    expect(rendered.html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; Co");
    expect(rendered.html).toContain("O&#39;Neil");
    // The text part is not HTML: it keeps the characters as typed.
    expect(rendered.text).toContain('<script>alert("x")</script> & Co');
  });

  it("refuses links that are not https or mailto", () => {
    const bad = (href: string) =>
      renderEmail({
        ...content,
        blocks: [{ type: "box", rows: [{ kind: "kv", label: "x", value: "y", href }] }],
      });
    expect(() => bad("javascript:alert(1)")).toThrow(/Unsafe email link/);
    expect(() => bad("http://example.com")).toThrow(/Unsafe email link/);
    expect(() => bad("https://example.com/ok")).not.toThrow();
  });

  it("loads nothing external except the Google Fonts stylesheet", () => {
    expect(html).not.toMatch(/<img|<script|<iframe|<video|<audio|@import|url\(|\ssrc=/i);
    const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
    expect(links).toHaveLength(1);
    expect(links[0]).toContain('href="https://fonts.googleapis.com/');
    // Every other absolute URL is a link the reader clicks, never a resource.
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.every((h) => /^(https:\/\/|mailto:)/.test(h))).toBe(true);
  });
});

describe("escapeHtml", () => {
  it("escapes the five characters that matter", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
});
