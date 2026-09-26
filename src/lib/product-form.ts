import type { ProductSpec } from "@/lib/products";

// Parsing for the /admin/products form. Pure (no server imports) so the
// client form can share the constants and the rules stay unit-testable.

/**
 * Stripe caps uploads with a linkable purpose (business_logo) at 512 KB; the
 * form shrinks photos below this in the browser before submitting.
 */
export const MAX_PHOTO_BYTES = 500 * 1024;

export const MAX_STOCK = 100_000;

/** Photos per product. */
export const MAX_IMAGES = 6;

/** Every photo the admin uploads lands here (Stripe Files public links). */
export const PHOTO_URL_PREFIX = "https://files.stripe.com/links/";

/**
 * The admin form submits the photo list as JSON URLs, in display order.
 * Photos are uploaded one by one as they're picked, so a URL is either one
 * the product already had or a fresh Stripe file link; anything else is
 * dropped, so the form can't attach arbitrary images.
 */
export function sanitizeImages(submitted: unknown, existing: readonly string[]): string[] {
  if (!Array.isArray(submitted)) return [...existing];
  const result: string[] = [];
  for (const url of submitted) {
    if (typeof url !== "string") continue;
    if (!existing.includes(url) && !url.startsWith(PHOTO_URL_PREFIX)) continue;
    if (!result.includes(url)) result.push(url);
  }
  return result.slice(0, MAX_IMAGES);
}

/** "Desk Print — No. 03" → "desk-print-no-03". */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** One "Label: value" per line; lines without a colon or a value are skipped. */
export function parseSpecs(text: string): ProductSpec[] {
  return text
    .split("\n")
    .map((line) => {
      const colon = line.indexOf(":");
      if (colon === -1) return null;
      const label = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim();
      return label && value ? { label, value } : null;
    })
    .filter((spec): spec is ProductSpec => spec !== null);
}

export function specsToText(specs: ProductSpec[]): string {
  return specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n");
}

/** "450", "450.5", "450,50" → öre (the smallest unit, like cents). Null for anything else or non-positive. */
export function parsePriceToCents(input: string): number | null {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return cents > 0 ? cents : null;
}

/**
 * Stock forms submit the number they were loaded with next to the new one,
 * and the save applies the difference. A sale landing while the form was
 * open then still counts, instead of being overwritten by a stale total.
 */
export function stockDelta(formData: FormData, newStock: number): number {
  const previous = parseStock(String(formData.get("previousStock") ?? ""));
  return previous === null ? 0 : newStock - previous;
}

export function parseStock(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const stock = Number(trimmed);
  return stock <= MAX_STOCK ? stock : null;
}

/** Raw form text, echoed back on a validation error so nothing typed is lost. */
export type ProductFields = {
  name: string;
  slug: string;
  category: string;
  price: string;
  stock: string;
  tagline: string;
  description: string;
  specs: string;
  /** Checkbox: "on" when ticked, "" otherwise. */
  hidden: string;
};

export type ParsedProduct = {
  name: string;
  slug: string;
  category: string;
  priceCents: number;
  stock: number;
  tagline: string | null;
  /** Normalized to paragraphs separated by one blank line, as the store renders it. */
  description: string | null;
  specs: ProductSpec[];
  hidden: boolean;
};

export function readProductFields(formData: FormData): ProductFields {
  const text = (key: keyof ProductFields) => String(formData.get(key) ?? "");
  return {
    name: text("name"),
    slug: text("slug"),
    category: text("category"),
    price: text("price"),
    stock: text("stock"),
    tagline: text("tagline"),
    description: text("description"),
    specs: text("specs"),
    hidden: text("hidden"),
  };
}

export function parseProductFields(
  fields: ProductFields
): { ok: true; product: ParsedProduct } | { ok: false; error: string } {
  const name = fields.name.trim();
  if (!name) return { ok: false, error: "Name is required." };

  const slug = fields.slug.trim() || slugify(name);
  if (!SLUG_PATTERN.test(slug)) {
    return { ok: false, error: "Slug may only contain a–z, 0–9 and single dashes." };
  }

  const category = slugify(fields.category);
  if (!category) return { ok: false, error: "Category is required." };

  const priceCents = parsePriceToCents(fields.price);
  if (priceCents === null) return { ok: false, error: "Price must be a number above 0, like 45 or 45.50." };

  const stock = parseStock(fields.stock);
  if (stock === null) return { ok: false, error: `Stock must be a whole number from 0 to ${MAX_STOCK}.` };

  const paragraphs = fields.description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    ok: true,
    product: {
      name,
      slug,
      category,
      priceCents,
      stock,
      tagline: fields.tagline.trim() || null,
      description: paragraphs.length ? paragraphs.join("\n\n") : null,
      specs: parseSpecs(fields.specs),
      hidden: fields.hidden === "on",
    },
  };
}
