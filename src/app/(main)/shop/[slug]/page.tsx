import { notFound } from "next/navigation";
import { Link } from "next-view-transitions";
import type { Metadata } from "next";
import { pool } from "@/lib/db";
import { getDisplayPrice } from "@/lib/stripe";
import { addToCart } from "@/app/(main)/shop/cart/actions";
import { buyNow } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductImage } from "@/components/shop/ProductImage";

type Product = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  stripe_price_id: string;
  sold_out: boolean;
  category: string;
};

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
};

async function getProduct(slug: string): Promise<Product | null> {
  const { rows } = await pool.query<Product>(
    "SELECT id, slug, name, description, image_url, stripe_price_id, sold_out, category FROM shop_products WHERE slug = $1",
    [slug]
  );
  return rows[0] ?? null;
}

/** Catalog order, matching the /shop grid, for the P. xx / yy strip and prev/next. */
async function getCatalogSlugs(): Promise<string[]> {
  const { rows } = await pool.query<{ slug: string }>(
    "SELECT slug FROM shop_products ORDER BY created_at DESC, id DESC"
  );
  return rows.map((row) => row.slug);
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }
  return {
    title: `${product.name.toUpperCase()} — KANSLIET (SHOP)`,
    description: product.description ?? undefined,
    alternates: { canonical: `/shop/${product.slug}` },
  };
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="dossier-label shrink-0">{label}</span>
      <span className="text-caps text-sm font-light tracking-wider">{children}</span>
    </div>
  );
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { slug } = await params;
  const { error } = await searchParams;

  const product = await getProduct(slug);
  if (!product) {
    notFound();
  }

  const [displayPrice, slugs] = await Promise.all([
    getDisplayPrice(product.stripe_price_id),
    getCatalogSlugs(),
  ]);
  const currentIndex = slugs.indexOf(product.slug);
  const prevSlug = currentIndex > 0 ? slugs[currentIndex - 1] : null;
  const nextSlug =
    currentIndex >= 0 && currentIndex < slugs.length - 1 ? slugs[currentIndex + 1] : null;

  return (
    // Same split as /works/[id]: MainLayoutShell locks this to one viewport
    // on desktop, so the image fills the left half and the info pane scrolls.
    <div className="flex min-h-0 w-full flex-col bg-background lg:h-full lg:flex-row">
      {/* Only one image per product today (shop_products.image_url is a
          single column), so no carousel like /works/[id] has. */}
      <aside className="flex aspect-4/5 min-h-0 w-full shrink-0 flex-col lg:aspect-auto lg:h-full lg:w-1/2 lg:border-r lg:border-foreground">
        <ProductImage
          id={product.id}
          name={product.name}
          imageUrl={product.image_url}
          className="h-full w-full"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:h-full lg:overflow-y-auto">
        <p className="dossier-label w-full rounded-none px-4 py-2 tabular-nums lg:px-6">
          P. {String(currentIndex + 1).padStart(2, "0")} /{" "}
          {String(slugs.length).padStart(2, "0")}
        </p>

        <div className="container-kansliet flex flex-1 flex-col py-10 lg:py-20">
          <Link
            href="/shop"
            className="text-caps text-sm font-light tracking-wider mb-10 self-start transition-opacity hover:opacity-60"
          >
            ← SHOP
          </Link>

          <h1 className="mb-10 text-3xl font-normal uppercase tracking-tight lg:mb-12 lg:text-4xl">
            {product.name}
          </h1>

          <div className="mb-8 grid gap-6 border-b-brutal pb-8 sm:grid-cols-2 lg:mb-10 lg:grid-cols-3 lg:pb-10">
            <Spec label="PRICE">{displayPrice}</Spec>
            <Spec label="CATEGORY">{product.category}</Spec>
            <Spec label="STATUS">{product.sold_out ? "SOLD OUT" : "IN STOCK"}</Spec>
          </div>

          {product.description && (
            <p className="text-normal-case mb-10 max-w-xl text-base font-light leading-relaxed lg:mb-12">
              {product.description}
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="mb-6 max-w-xl border border-red-500 bg-red-500/5 p-4 text-red-600"
            >
              <p className="text-caps text-sm font-bold tracking-wide">ERROR: {error}</p>
            </div>
          )}

          {product.sold_out ? (
            <Button type="button" disabled className="mb-10 w-full max-w-xl lg:mb-12">
              SOLD OUT
            </Button>
          ) : (
            <div className="mb-10 flex max-w-xl flex-col gap-3 lg:mb-12">
              <form action={addToCart} className="flex items-end gap-3">
                <input type="hidden" name="productId" value={product.id} />
                <div className="w-24 shrink-0">
                  <label htmlFor="quantity" className="dossier-label mb-2 block">
                    QTY
                  </label>
                  <Input
                    id="quantity"
                    type="number"
                    name="quantity"
                    min={1}
                    max={99}
                    defaultValue={1}
                  />
                </div>
                <Button type="submit" className="flex-1 py-3.5">
                  ADD TO CART
                </Button>
              </form>
              <form action={buyNow}>
                <input type="hidden" name="productId" value={product.id} />
                <Button type="submit" variant="secondary" className="w-full">
                  BUY NOW
                </Button>
              </form>
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t-brutal pt-10 lg:pt-12">
            {prevSlug ? (
              <Link
                href={`/shop/${prevSlug}`}
                className="text-caps text-sm font-light tracking-wider transition-opacity hover:opacity-60"
              >
                ← PREVIOUS
              </Link>
            ) : (
              <span aria-hidden />
            )}
            {nextSlug ? (
              <Link
                href={`/shop/${nextSlug}`}
                className="text-caps text-sm font-light tracking-wider transition-opacity hover:opacity-60"
              >
                NEXT →
              </Link>
            ) : (
              <span aria-hidden />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
