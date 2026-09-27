import { describe, it, expect } from "vitest";
import {
  parseOptions,
  parsePriceToCents,
  parseProductFields,
  parseSpecs,
  parseStock,
  parseVariantRows,
  sanitizeImages,
  slugify,
  stockDelta,
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
  hidden: "",
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
        hidden: false,
      },
    });
    const hidden = parseProductFields({ ...valid, hidden: "on" });
    expect(hidden.ok && hidden.product.hidden).toBe(true);
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

describe("stockDelta", () => {
  const form = (previousStock?: string) => {
    const data = new FormData();
    if (previousStock !== undefined) data.set("previousStock", previousStock);
    return data;
  };

  it("is the change made in the form, not the new total", () => {
    expect(stockDelta(form("3"), 13)).toBe(10);
    expect(stockDelta(form("10"), 7)).toBe(-3);
  });

  it("is 0 when the loaded value is missing or tampered", () => {
    expect(stockDelta(form(), 50)).toBe(0);
    expect(stockDelta(form("abc"), 50)).toBe(0);
  });
});

describe("sanitizeImages", () => {
  const link = (id: string) => `https://files.stripe.com/links/${id}`;
  const existing = ["https://files.stripe.com/files/legacy", link("a")];

  it("keeps the submitted order of existing and freshly uploaded photos", () => {
    expect(sanitizeImages([link("new"), link("a")], existing)).toEqual([link("new"), link("a")]);
  });

  it("drops unknown hosts, duplicates and non-strings", () => {
    expect(
      sanitizeImages(["https://evil.example/x.jpg", link("a"), link("a"), 42], existing)
    ).toEqual([link("a")]);
  });

  it("keeps an existing photo even from an older URL shape", () => {
    expect(sanitizeImages([existing[0]], existing)).toEqual([existing[0]]);
  });

  it("keeps the current photos when the list is missing or malformed", () => {
    expect(sanitizeImages(null, existing)).toEqual(existing);
  });

  it("caps the count", () => {
    const many = Array.from({ length: 10 }, (_, i) => link(String(i)));
    expect(sanitizeImages(many, [])).toHaveLength(6);
  });
});

describe("parseOptions", () => {
  const photo = "https://files.stripe.com/links/abc";

  it("keeps names and values, and photos only on the first option", () => {
    const raw = JSON.stringify([
      { name: " Colour ", values: [{ value: "Sand", images: [photo, "https://evil.example/x.jpg"] }, { value: "Black" }] },
      { name: "Size", values: [{ value: "S", images: [photo] }, { value: "M" }] },
    ]);
    expect(parseOptions(raw, [])).toEqual({
      ok: true,
      options: [
        { name: "Colour", values: [{ value: "Sand", images: [photo] }, { value: "Black", images: [] }] },
        { name: "Size", values: [{ value: "S" }, { value: "M" }] },
      ],
    });
  });

  it("allows no options", () => {
    expect(parseOptions("[]", [])).toEqual({ ok: true, options: [] });
    expect(parseOptions("", [])).toEqual({ ok: true, options: [] });
  });

  it("rejects duplicates, empties, too many and bad JSON", () => {
    const one = (values: unknown[]) => JSON.stringify([{ name: "Colour", values }]);
    expect(parseOptions(one([{ value: "Sand" }, { value: "sand" }]), []).ok).toBe(false);
    expect(parseOptions(one([{ value: "" }]), []).ok).toBe(false);
    expect(parseOptions(one([]), []).ok).toBe(false);
    expect(parseOptions(JSON.stringify([{ name: "", values: [{ value: "A" }] }]), []).ok).toBe(false);
    expect(parseOptions(JSON.stringify([1, 2, 3]), []).ok).toBe(false);
    expect(parseOptions("{nope", []).ok).toBe(false);
    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ value: `V${i}` }));
    expect(
      parseOptions(JSON.stringify([{ name: "Colour", values: many(11) }, { name: "Size", values: many(10) }]), []).ok,
    ).toBe(false);
    expect(
      parseOptions(JSON.stringify([{ name: "Colour", values: many(10) }, { name: "colour", values: many(2) }]), []).ok,
    ).toBe(false);
  });
});

describe("parseVariantRows", () => {
  const options = [
    { name: "Colour", values: [{ value: "Sand" }, { value: "Black" }] },
    { name: "Size", values: [{ value: "S" }] },
  ];

  it("reads rows, keeping ids and the stock the form loaded with", () => {
    const raw = JSON.stringify([
      { id: 4, option1: "Sand", option2: "S", stock: "7", previous: 5 },
      { option1: "Black", option2: "S", stock: 0 },
    ]);
    expect(parseVariantRows(raw, options)).toEqual({
      ok: true,
      rows: [
        { id: 4, option1: "Sand", option2: "S", stock: 7, previous: 5 },
        { id: null, option1: "Black", option2: "S", stock: 0, previous: null },
      ],
    });
  });

  it("rejects rows that don't match the options, duplicates and bad stock", () => {
    const rows = (entries: unknown[]) => parseVariantRows(JSON.stringify(entries), options).ok;
    expect(rows([{ option1: "Pink", option2: "S", stock: 1 }])).toBe(false);
    expect(rows([{ option1: "Sand", option2: null, stock: 1 }])).toBe(false);
    expect(rows([{ option1: "Sand", option2: "S", stock: 1 }, { option1: "Sand", option2: "S", stock: 2 }])).toBe(false);
    expect(rows([{ option1: "Sand", option2: "S", stock: -1 }])).toBe(false);
    expect(rows([{ id: 1, option1: "Sand", option2: "S", stock: 1 }, { id: 1, option1: "Black", option2: "S", stock: 1 }])).toBe(false);
  });
});
