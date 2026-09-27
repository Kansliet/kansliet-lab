import { describe, it, expect } from "vitest";
import { imagesFor, variantCover, variantLabel, variantName } from "./variants";

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
