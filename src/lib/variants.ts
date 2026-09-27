import type { Product, Variant } from "@/lib/products";

// Rules for a product's options and variants. Pure (no server imports), so
// the product page's client picker can share them and they stay unit-testable.

/** "Sand / M", or null for a product without options. */
export function variantLabel(variant: Pick<Variant, "option1" | "option2">): string | null {
  const parts = [variant.option1, variant.option2].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" / ") : null;
}

/** "Desk Tray — Sand / M": how a variant is named in the cart and at Stripe Checkout. */
export function variantName(productName: string, variant: Pick<Variant, "option1" | "option2">): string {
  const label = variantLabel(variant);
  return label ? `${productName} — ${label}` : productName;
}

/**
 * Photos for one value of the first option (a colour): that colour's own
 * photos first, then the product's shared ones. Without a colour, the shared
 * photos only.
 */
export function imagesFor(product: Pick<Product, "options" | "images">, option1: string | null): string[] {
  const own =
    option1 === null
      ? []
      : (product.options[0]?.values.find((value) => value.value === option1)?.images ?? []);
  return [...own, ...product.images.filter((url) => !own.includes(url))];
}

/** The photo shown for a variant in the cart and the grid. */
export function variantCover(
  product: Pick<Product, "options" | "images">,
  variant: Pick<Variant, "option1">,
): string | null {
  return imagesFor(product, variant.option1)[0] ?? null;
}
