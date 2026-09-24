import { describe, it, expect } from "vitest";
import {
  parsePriceToCents,
  parseProductFields,
  parseSpecs,
  parseStock,
  slugify,
  specsToText,
  type ProductFields,
} from "./product-form";

const valid: ProductFields = {
  name: "Desk Print — No. 03",
  slug: "",
  category: "Prints",
  price: "45",
  stock: "12",
  tagline: "  A plan view.  ",
  description: "First paragraph.\n\n\n  Second paragraph.  \n",
  specs: "Size: 30 × 40 cm\nnot a spec\nPaper: 308 g: cotton rag",
};

describe("slugify", () => {
  it("makes URL-safe slugs from product names", () => {
    expect(slugify("Desk Print — No. 03")).toBe("desk-print-no-03");
    expect(slugify("Kaffekopp Rökt Ek")).toBe("kaffekopp-rokt-ek");
    expect(slugify("  --  ")).toBe("");
  });
});

describe("parseSpecs", () => {
  it("reads Label: value lines and skips the rest", () => {
    expect(parseSpecs("Size: 30 × 40 cm\n\nno colon\nEmpty:\nPaper: 308 g: rag")).toEqual([
      { label: "Size", value: "30 × 40 cm" },
      { label: "Paper", value: "308 g: rag" },
    ]);
  });

  it("round-trips through specsToText", () => {
    const specs = [
      { label: "Material", value: "Brass" },
      { label: "Made in", value: "Sweden" },
    ];
    expect(parseSpecs(specsToText(specs))).toEqual(specs);
  });
});

describe("parsePriceToCents", () => {
  it("accepts whole and decimal amounts, with dot or comma", () => {
    expect(parsePriceToCents("45")).toBe(4500);
    expect(parsePriceToCents("45.5")).toBe(4550);
    expect(parsePriceToCents("19,99")).toBe(1999);
  });

  it("rejects zero, negatives, and junk", () => {
    for (const input of ["0", "-5", "abc", "4.555", "", "1e3"]) {
      expect(parsePriceToCents(input)).toBeNull();
    }
  });
});

describe("parseStock", () => {
  it("accepts whole numbers from 0 up to the cap", () => {
    expect(parseStock("0")).toBe(0);
    expect(parseStock(" 250 ")).toBe(250);
    expect(parseStock("100001")).toBeNull();
    expect(parseStock("-1")).toBeNull();
    expect(parseStock("2.5")).toBeNull();
  });
});

describe("parseProductFields", () => {
  it("normalizes a valid submission", () => {
    const result = parseProductFields(valid);
    expect(result).toEqual({
      ok: true,
      product: {
        name: "Desk Print — No. 03",
        slug: "desk-print-no-03",
        category: "prints",
        priceCents: 4500,
        stock: 12,
        tagline: "A plan view.",
        description: "First paragraph.\n\nSecond paragraph.",
        specs: [
          { label: "Size", value: "30 × 40 cm" },
          { label: "Paper", value: "308 g: cotton rag" },
        ],
      },
    });
  });

  it("rejects a malformed hand-typed slug", () => {
    const result = parseProductFields({ ...valid, slug: "Desk Print/03" });
    expect(result.ok).toBe(false);
  });

  it("requires a name, category and valid price", () => {
    expect(parseProductFields({ ...valid, name: " " }).ok).toBe(false);
    expect(parseProductFields({ ...valid, category: "" }).ok).toBe(false);
    expect(parseProductFields({ ...valid, price: "free" }).ok).toBe(false);
  });

  it("stores empty optional copy as null", () => {
    const result = parseProductFields({ ...valid, tagline: " ", description: "\n\n" });
    expect(result.ok && result.product.tagline).toBeNull();
    expect(result.ok && result.product.description).toBeNull();
  });
});
