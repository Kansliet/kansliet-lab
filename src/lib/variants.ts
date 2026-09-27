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

/** "Colour" → "colour", "Sand Grey" → "sand-grey": URL parameter names and values. */
export function optionSlug(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** What the rules need of a variant (the product page's client gets no Stripe ids). */
type StockedVariant = Pick<Variant, "id" | "option1" | "option2" | "stock">;
type Options<V extends StockedVariant = StockedVariant> = Pick<Product, "options"> & { variants: V[] };

/** The variant for a pick; option2 is ignored for a product with one option. */
export function variantFor<V extends StockedVariant>(
  product: Options<V>,
  option1: string | null,
  option2: string | null,
): V | undefined {
  const two = product.options.length > 1;
  return product.variants.find(
    (v) => v.option1 === option1 && (!two || v.option2 === option2),
  );
}

/** A first-option value (colour) with nothing in stock in any size. */
export function option1SoldOut(product: Options, option1: string): boolean {
  return !product.variants.some((v) => v.option1 === option1 && v.stock > 0);
}

/** A second-option value (size) that can't be bought in the picked colour. */
export function option2SoldOut(product: Options, option1: string | null, option2: string): boolean {
  const variant = product.variants.find((v) => v.option1 === option1 && v.option2 === option2);
  return !variant || variant.stock <= 0;
}

export type Selection = { option1: string | null; option2: string | null };

/**
 * What the product page opens on, from ?colour=sand&size=m (parameter names
 * are the option names, slugged). Colour: the one asked for, else the first
 * with stock, else the first. Size: the one asked for, else the only one;
 * otherwise none yet ("SELECT SIZE").
 */
export function resolveSelection(product: Options, params: Record<string, string | undefined>): Selection {
  const [first, second] = product.options;
  if (!first) return { option1: null, option2: null };

  const pick = (option: typeof first) => {
    const wanted = params[optionSlug(option.name)];
    return wanted ? option.values.find((v) => optionSlug(v.value) === wanted)?.value : undefined;
  };

  const option1 =
    pick(first) ??
    first.values.find((v) => !option1SoldOut(product, v.value))?.value ??
    first.values[0]?.value ??
    null;
  const option2 = second
    ? (pick(second) ?? (second.values.length === 1 ? second.values[0].value : null))
    : null;
  return { option1, option2 };
}

/** The query string for a pick, e.g. "colour=sand&size=m". */
export function selectionQuery(product: Pick<Product, "options">, selection: Selection): string {
  const params = new URLSearchParams();
  const [first, second] = product.options;
  if (first && selection.option1) params.set(optionSlug(first.name), optionSlug(selection.option1));
  if (second && selection.option2) params.set(optionSlug(second.name), optionSlug(selection.option2));
  return params.toString();
}

/** Every combination of option values, in display order (for the admin stock table). */
export function combinations(options: Pick<Product, "options">["options"]): Selection[] {
  const [first, second] = options;
  if (!first) return [{ option1: null, option2: null }];
  return first.values.flatMap((a): Selection[] =>
    second
      ? second.values.map((b) => ({ option1: a.value, option2: b.value }))
      : [{ option1: a.value, option2: null }],
  );
}

/** The grid cover: the first colour in stock (or the first colour), else the shared cover. */
export function productCover(product: Options & Pick<Product, "images">): string | null {
  const { option1 } = resolveSelection(product, {});
  return imagesFor(product, option1)[0] ?? null;
}

/** "3 COLOURS" for a product whose first option has several values, else null. */
export function optionCountLabel(product: Pick<Product, "options">): string | null {
  const first = product.options[0];
  if (!first || first.values.length < 2) return null;
  return `${first.values.length} ${first.name.toUpperCase()}S`;
}
