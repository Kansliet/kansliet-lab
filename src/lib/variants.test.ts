import { describe, it, expect } from "vitest";
import {
  combinations,
  imagesFor,
  option1SoldOut,
  option2SoldOut,
  optionCountLabel,
  optionSlug,
  productCover,
  resolveSelection,
  selectionQuery,
  variantCover,
  variantFor,
  variantLabel,
  variantName,
} from "./variants";

const product = {
  images: ["shared-1", "shared-2"],
  options: [
    {
      name: "Colour",
      values: [
        { value: "Sand", images: ["sand-1", "sand-2"] },
        { value: "Black", images: [] },
      ],
    },
    { name: "Size", values: [{ value: "S" }, { value: "M" }] },
  ],
};

describe("variantLabel / variantName", () => {
  it("joins the option values", () => {
    expect(variantLabel({ option1: "Sand", option2: "M" })).toBe("Sand / M");
    expect(variantLabel({ option1: "Sand", option2: null })).toBe("Sand");
    expect(variantName("Tee", { option1: "Sand", option2: "M" })).toBe("Tee — Sand / M");
  });

  it("is plain for a product without options", () => {
    expect(variantLabel({ option1: null, option2: null })).toBeNull();
    expect(variantName("Desk Tray", { option1: null, option2: null })).toBe("Desk Tray");
  });
});

describe("imagesFor / variantCover", () => {
  it("puts the colour's own photos before the shared ones", () => {
    expect(imagesFor(product, "Sand")).toEqual(["sand-1", "sand-2", "shared-1", "shared-2"]);
    expect(variantCover(product, { option1: "Sand" })).toBe("sand-1");
  });

  it("falls back to the shared photos for a colour without its own, or no colour", () => {
    expect(imagesFor(product, "Black")).toEqual(["shared-1", "shared-2"]);
    expect(imagesFor(product, null)).toEqual(["shared-1", "shared-2"]);
    expect(imagesFor({ images: [], options: [] }, null)).toEqual([]);
    expect(variantCover({ images: [], options: [] }, { option1: null })).toBeNull();
  });
});


const v = (id: number, option1: string | null, option2: string | null, stock: number) => ({
  id,
  option1,
  option2,
  stock,
  stripe_product_id: `prod_${id}`,
  stripe_price_id: `price_${id}`,
});

// Sand: S sold out, M in stock. Black: sold out in every size.
const tee = {
  ...product,
  variants: [v(1, "Sand", "S", 0), v(2, "Sand", "M", 3), v(3, "Black", "S", 0), v(4, "Black", "M", 0)],
};

describe("resolveSelection", () => {
  it("opens on the first colour in stock, with no size picked", () => {
    expect(resolveSelection({ ...tee, variants: [v(3, "Black", "S", 0), ...tee.variants] }, {})).toEqual({
      option1: "Sand",
      option2: null,
    });
  });

  it("reads ?colour=&size= by slug, ignoring unknown values", () => {
    expect(resolveSelection(tee, { colour: "black", size: "m" })).toEqual({ option1: "Black", option2: "M" });
    expect(resolveSelection(tee, { colour: "pink", size: "xl" })).toEqual({ option1: "Sand", option2: null });
  });

  it("picks a lone size automatically, and nothing for a product without options", () => {
    const oneSize = { ...tee, options: [tee.options[0], { name: "Size", values: [{ value: "One size" }] }] };
    expect(resolveSelection(oneSize, {}).option2).toBe("One size");
    expect(resolveSelection({ options: [], variants: [v(9, null, null, 1)] }, {})).toEqual({
      option1: null,
      option2: null,
    });
  });

  it("falls back to the first colour when everything is sold out", () => {
    const soldOut = { ...tee, variants: tee.variants.map((x) => ({ ...x, stock: 0 })) };
    expect(resolveSelection(soldOut, {}).option1).toBe("Sand");
  });
});

describe("sold-out rules", () => {
  it("marks a colour sold out only when no size has stock", () => {
    expect(option1SoldOut(tee, "Sand")).toBe(false);
    expect(option1SoldOut(tee, "Black")).toBe(true);
  });

  it("marks a size sold out for the picked colour", () => {
    expect(option2SoldOut(tee, "Sand", "S")).toBe(true);
    expect(option2SoldOut(tee, "Sand", "M")).toBe(false);
    expect(option2SoldOut(tee, "Sand", "XL")).toBe(true);
  });
});

describe("variantFor / selectionQuery / combinations", () => {
  it("finds the variant for a pick", () => {
    expect(variantFor(tee, "Sand", "M")?.id).toBe(2);
    expect(variantFor(tee, "Sand", null)).toBeUndefined();
    const colourOnly = { options: [tee.options[0]], variants: [v(5, "Sand", null, 1)] };
    expect(variantFor(colourOnly, "Sand", "ignored")?.id).toBe(5);
  });

  it("builds the query string from slugs", () => {
    expect(selectionQuery(tee, { option1: "Sand", option2: "M" })).toBe("colour=sand&size=m");
    expect(selectionQuery(tee, { option1: "Sand", option2: null })).toBe("colour=sand");
    expect(optionSlug("Sand Grey")).toBe("sand-grey");
  });

  it("lists every combination", () => {
    expect(combinations(tee.options)).toEqual([
      { option1: "Sand", option2: "S" },
      { option1: "Sand", option2: "M" },
      { option1: "Black", option2: "S" },
      { option1: "Black", option2: "M" },
    ]);
    expect(combinations([])).toEqual([{ option1: null, option2: null }]);
  });
});

describe("grid helpers", () => {
  it("covers with the first colour in stock", () => {
    expect(productCover(tee)).toBe("sand-1");
    expect(productCover({ options: [], variants: [v(9, null, null, 1)], images: ["x"] })).toBe("x");
  });

  it("counts the first option's values", () => {
    expect(optionCountLabel(tee)).toBe("2 COLOURS");
    expect(optionCountLabel({ options: [] })).toBeNull();
  });
});
