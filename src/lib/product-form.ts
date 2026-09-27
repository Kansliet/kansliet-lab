import type { ProductOption, ProductSpec } from "@/lib/products";

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

/** Colour × Size at most; enough values for a real range, few enough to manage. */
export const MAX_OPTIONS = 2;
export const MAX_OPTION_VALUES = 30;
export const MAX_COMBINATIONS = 100;
const MAX_OPTION_TEXT = 40;

/** A stock row from the admin's variant table. `id` is set for a variant that already exists. */
export type VariantRow = {
  id: number | null;
  option1: string | null;
  option2: string | null;
  stock: number;
  /** The stock the form loaded with, so the save applies only the change (see stockDelta). */
  previous: number | null;
};

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/**
 * The options editor's JSON: [{ name, values: [{ value, images? }] }].
 * Photos only on the first option's values, cleaned like the product's own
 * (sanitizeImages: existing URLs or fresh Stripe links).
 */
export function parseOptions(
  raw: string,
  existingImages: readonly string[],
): { ok: true; options: ProductOption[] } | { ok: false; error: string } {
  let submitted: unknown;
  try {
    submitted = JSON.parse(raw || "[]");
  } catch {
    return { ok: false, error: "The options could not be read. Reload and try again." };
  }
  if (!Array.isArray(submitted)) return { ok: false, error: "The options could not be read." };
  if (submitted.length > MAX_OPTIONS) return { ok: false, error: `At most ${MAX_OPTIONS} options (e.g. Colour and Size).` };

  const options: ProductOption[] = [];
  for (const [index, entry] of submitted.entries()) {
    const name = text(entry?.name);
    if (!name || name.length > MAX_OPTION_TEXT) return { ok: false, error: "Every option needs a name (e.g. Colour)." };
    const rawValues: unknown[] = Array.isArray(entry?.values) ? entry.values : [];
    const values = rawValues.map((value) => ({
      value: text((value as { value?: unknown })?.value),
      images: (value as { images?: unknown })?.images,
    }));
    if (values.length === 0) return { ok: false, error: `Add at least one ${name} value, or remove the option.` };
    if (values.length > MAX_OPTION_VALUES) return { ok: false, error: `At most ${MAX_OPTION_VALUES} values per option.` };
    const seen = new Set<string>();
    for (const { value } of values) {
      if (!value || value.length > MAX_OPTION_TEXT) return { ok: false, error: `Every ${name} value needs a name.` };
      if (seen.has(value.toLowerCase())) return { ok: false, error: `${name} "${value}" is listed twice.` };
      seen.add(value.toLowerCase());
    }
    options.push({
      name,
      values: values.map(({ value, images }) =>
        index === 0 ? { value, images: sanitizeImages(images ?? [], existingImages) } : { value },
      ),
    });
  }
  if (options.length === 2 && options[0].name.toLowerCase() === options[1].name.toLowerCase()) {
    return { ok: false, error: "The two options need different names." };
  }
  const combinations = options.reduce((count, option) => count * option.values.length, 1);
  if (options.length > 0 && combinations > MAX_COMBINATIONS) {
    return { ok: false, error: `That makes ${combinations} combinations; at most ${MAX_COMBINATIONS}.` };
  }
  return { ok: true, options };
}

/** The variant table's JSON rows, checked against the options just parsed. */
export function parseVariantRows(
  raw: string,
  options: ProductOption[],
): { ok: true; rows: VariantRow[] } | { ok: false; error: string } {
  let submitted: unknown;
  try {
    submitted = JSON.parse(raw || "[]");
  } catch {
    return { ok: false, error: "The stock table could not be read. Reload and try again." };
  }
  if (!Array.isArray(submitted)) return { ok: false, error: "The stock table could not be read." };

  const valid = (option: ProductOption | undefined, value: unknown) =>
    option ? option.values.some((v) => v.value === value) : value === null;
  const rows: VariantRow[] = [];
  const seen = new Set<string>();
  const ids = new Set<number>();
  for (const entry of submitted as Record<string, unknown>[]) {
    const option1 = entry?.option1 ?? null;
    const option2 = entry?.option2 ?? null;
    if (!valid(options[0], option1) || !valid(options[1], option2)) {
      return { ok: false, error: "The stock table doesn't match the options. Reload and try again." };
    }
    const key = JSON.stringify([option1, option2]);
    if (seen.has(key)) return { ok: false, error: "A combination is listed twice in the stock table." };
    seen.add(key);
    const stock = parseStock(String(entry?.stock ?? ""));
    if (stock === null) return { ok: false, error: `Stock must be a whole number from 0 to ${MAX_STOCK}.` };
    const id = Number.isInteger(entry?.id) ? (entry.id as number) : null;
    if (id !== null) {
      if (ids.has(id)) return { ok: false, error: "The stock table could not be read. Reload and try again." };
      ids.add(id);
    }
    const previous = parseStock(String(entry?.previous ?? ""));
    rows.push({ id, option1: option1 as string | null, option2: option2 as string | null, stock, previous });
  }
  return { ok: true, rows };
}
