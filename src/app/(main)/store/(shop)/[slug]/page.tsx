import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPrice, formatPrice } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";
import { productRef } from "@/components/store/ProductImage";
import { errorMessage } from "@/lib/error-codes";
import { getProductBySlug, getProducts } from "@/lib/products";
import { addToCart } from "@/app/(main)/store/(shop)/cart/actions";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/store/ProductImage";
import { Carousel } from "@/components/ui/carousel";
import { QuantityStepper } from "@/components/store/QuantityStepper";
import { maxLineQuantity } from "@/lib/cart";
import { SpecSheet } from "@/components/spec-sheet";
import { SiblingRow } from "@/components/sibling-row";
import { ScrollRail } from "@/components/scroll-rail";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
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
  const error = errorMessage((await searchParams).error);

  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const [price, catalog] = await Promise.all([
    getPrice(product.stripe_price_id),
    getProducts(),
  ]);
  const displayPrice = formatPrice(price.amount, price.currency);

  // Product structured data, so search results can show price and stock.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline ?? paragraphs(product.description)[0],
    sku: productRef(product.id),
    category: product.category,
    ...(product.images.length ? { image: product.images } : {}),
    brand: { "@type": "Brand", name: "Kansliet" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/store/${product.slug}`,
      price: price.amount.toFixed(2),
      priceCurrency: price.currency,
      availability: product.sold_out
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  return (
    // Same split as /works/[id]: MainLayoutShell locks this to one viewport
    // on desktop, so the image fills the left half and the info pane scrolls.
    <div className="scroll-pane-scope relative flex min-h-0 w-full flex-col bg-background lg:h-full lg:flex-row">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <aside className="flex aspect-4/5 min-h-0 w-full shrink-0 flex-col lg:aspect-auto lg:h-full lg:w-1/2 lg:border-r lg:border-foreground">
        {product.images.length > 1 ? (
          // Same carousel as /works/[id]: click or arrows to advance, dots below.
          <Carousel
            images={product.images.map((src, index) => ({
              src,
              alt: `${product.name}, photo ${index + 1} of ${product.images.length}`,
            }))}
            variant="fullHeight"
            aria-label={`${product.name} photos`}
            className="grain h-full min-h-0 flex-1"
          />
        ) : (
          <ProductImage
            id={product.id}
            name={product.name}
            imageUrl={product.image_url}
            tone="grain"
            className="h-full w-full"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        )}
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
                ["Status", product.sold_out ? "Sold out" : "In stock"],
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
              image: item.image_url,
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

          {product.sold_out ? (
            <Button type="button" disabled className="w-full max-w-xl">
              SOLD OUT — {displayPrice}
            </Button>
          ) : (
            <div className="flex max-w-xl flex-col gap-2">
              <form action={addToCart} className="flex items-end gap-3">
                <input type="hidden" name="productId" value={product.id} />
                <div className="w-32 shrink-0">
                  <label htmlFor="quantity" className="dossier-label mb-2 block">
                    QTY
                  </label>
                  <QuantityStepper
                    id="quantity"
                    name="quantity"
                    max={maxLineQuantity(product.stock)}
                  />
                </div>
                <Button type="submit" className="flex-1 justify-between gap-4 py-3.5">
                  <span>ADD TO CART</span>
                  <span className="tabular-nums">{displayPrice}</span>
                </Button>
              </form>
              {/* Prices include VAT (prisinformationslagen) without saying so, the
                  Swedish norm for consumer shops. Extra delivery costs must be
                  flagged before purchase, hence this line. */}
              <p className="text-normal-case text-sm font-light opacity-60 sm:text-right">
                Shipping is calculated in the cart.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
