import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPrice, formatPrice } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";
import { productRef } from "@/components/store/ProductImage";
import { errorMessage } from "@/lib/error-codes";
import { getProductBySlug, getProducts } from "@/lib/products";
import {
  VariantAddToCart,
  VariantGallery,
  VariantOptions,
  VariantProvider,
  VariantStatus,
  type PickerProduct,
} from "@/components/store/variant-picker";
import {
  imagesFor,
  optionSlug,
  productCover,
  resolveSelection,
  selectionQuery,
  variantLabel,
} from "@/lib/variants";
import { SpecSheet } from "@/components/spec-sheet";
import { SiblingRow } from "@/components/sibling-row";
import { ScrollRail } from "@/components/scroll-rail";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  // error, plus one parameter per option (?colour=sand&size=m).
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }
  return {
    title: `${product.name.toUpperCase()} — KANSLIET (STORE)`,
    description: product.tagline ?? paragraphs(product.description)[0],
    alternates: { canonical: `/store/${product.slug}` },
  };
}

function paragraphs(text: string | null): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const error = errorMessage(query.error);

  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const [price, catalog] = await Promise.all([
    getPrice(product.stripe_price_id),
    getProducts(),
  ]);
  const displayPrice = formatPrice(price.amount, price.currency);

  const selection = resolveSelection(product, query);
  const picker: PickerProduct = {
    id: product.id,
    name: product.name,
    hidden: product.hidden,
    images: product.images,
    options: product.options,
    variants: product.variants.map(({ id, option1, option2, stock }) => ({ id, option1, option2, stock })),
  };

  // Structured data, so search results can show price and stock: a Product,
  // or for a product with options a ProductGroup listing every variant.
  const url = `${SITE_URL}/store/${product.slug}`;
  const offer = (inStock: boolean, offerUrl: string) => ({
    "@type": "Offer",
    url: offerUrl,
    price: price.amount.toFixed(2),
    priceCurrency: price.currency,
    availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
  });
  const base = {
    "@context": "https://schema.org",
    name: product.name,
    description: product.tagline ?? paragraphs(product.description)[0],
    category: product.category,
    brand: { "@type": "Brand", name: "Kansliet" },
  };
  const jsonLd =
    product.options.length === 0
      ? {
          ...base,
          "@type": "Product",
          sku: productRef(product.id),
          ...(product.images.length ? { image: product.images } : {}),
          offers: offer(!product.sold_out, url),
        }
      : {
          ...base,
          "@type": "ProductGroup",
          productGroupID: productRef(product.id),
          url,
          variesBy: product.options.map((option) =>
            optionSlug(option.name) === "colour" || optionSlug(option.name) === "color"
              ? "https://schema.org/color"
              : optionSlug(option.name) === "size"
                ? "https://schema.org/size"
                : option.name
          ),
          hasVariant: product.variants.map((variant) => {
            const images = imagesFor(product, variant.option1);
            return {
              "@type": "Product",
              sku: `${productRef(product.id)}-${variant.id}`,
              name: `${product.name}, ${variantLabel(variant)}`,
              ...(images.length ? { image: images } : {}),
              offers: offer(
                !product.hidden && variant.stock > 0,
                `${url}?${selectionQuery(product, variant)}`
              ),
            };
          }),
        };

  return (
    // Every page-level part that follows the colour / size pick is a client
    // piece under this provider; the rest stays server-rendered.
    <VariantProvider product={picker} initial={selection}>
    {/* Same split as /works/[id]: MainLayoutShell locks this to one viewport
        on desktop, so the image fills the left half and the info pane scrolls. */}
    <div className="scroll-pane-scope relative flex min-h-0 w-full flex-col bg-background lg:h-full lg:flex-row">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <aside className="flex aspect-4/5 min-h-0 w-full shrink-0 flex-col lg:aspect-auto lg:h-full lg:w-1/2 lg:border-r lg:border-foreground">
        <VariantGallery />
      </aside>

      {/* Desktop: the pane scrolls, not the page, so it drives its own rail. */}
      <ScrollRail source="pane" />

      {/* Right: centred on the site's axis — identity and spec above, the
          row of sibling products on the axis, text and buying below. */}
      <div className="scroll-pane min-h-0 min-w-0 flex-1 lg:h-full lg:overflow-y-auto">
        {/* The pane runs to the window's right edge at every width, so it takes
            the full axis gutter there (clear of the INDEX tab), and only a
            modest gap on the left, beside the photos. Own padding rather than
            .container-kansliet, whose desktop gutter assumes a full-width page.
            Desktop: the sibling row is pinned to the axis (50vh) and the top
            block hugs it from above, so clicking between products never
            shifts the row, whatever each product's text length. The row is
            4rem tall (h-14 plates + py-1), hence 50vh − 2rem − gap. */}
        <div className="flex min-h-full flex-col gap-10 px-3 py-12 md:px-6 lg:pt-0 lg:pb-16 lg:pl-10 lg:pr-(--axis-gutter)">
          <div className="flex flex-col justify-end space-y-6 lg:min-h-[calc(50vh-2rem-2.5rem)]">
            <h1 className="text-lg font-normal uppercase tracking-wide">{product.name}</h1>
            <SpecSheet
              title={`SPEC — ${productRef(product.id)}`}
              rows={[
                ["Status", <VariantStatus key="status" />],
                ["Category", product.category],
                ...product.specs.map((spec): [string, string] => [spec.label, spec.value]),
              ]}
            />
          </div>

          <SiblingRow
            label="All objects"
            items={catalog.map((item) => ({
              href: `/store/${item.slug}`,
              label: item.name,
              image: productCover(item),
              current: item.id === product.id,
            }))}
          />

          <div className="max-w-xl space-y-6">
            {product.tagline && (
              <h2 className="text-base font-light uppercase leading-snug tracking-wide">
                {product.tagline}
              </h2>
            )}
            {paragraphs(product.description).map((paragraph) => (
              <p key={paragraph} className="text-normal-case text-base font-light leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {error && (
            <div role="alert" className="max-w-xl border border-red-500 bg-red-500/5 p-4 text-red-600">
              <p className="text-caps text-sm font-bold tracking-wide">ERROR: {error}</p>
            </div>
          )}

          <VariantOptions />
          <VariantAddToCart displayPrice={displayPrice} />
        </div>
      </div>
    </div>
    </VariantProvider>
  );
}
