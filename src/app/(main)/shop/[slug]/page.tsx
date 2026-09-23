import { notFound } from "next/navigation";
import { Link } from "next-view-transitions";
import type { Metadata } from "next";
import { pool } from "@/lib/db";
import { getDisplayPrice } from "@/lib/stripe";
import { addToCart } from "@/app/(main)/shop/cart/actions";
import { buyNow } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductImage, productRef } from "@/components/shop/ProductImage";

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

  const displayPrice = await getDisplayPrice(product.stripe_price_id);

  return (
    <div className="flex w-full flex-col bg-background lg:flex-row">
      {/* Only one image per product today (shop_products.image_url is a
          single column), so no carousel like /works/[id] has. */}
      <aside className="w-full shrink-0 lg:w-1/2 lg:border-r lg:border-foreground">
        <ProductImage
          id={product.id}
          name={product.name}
          imageUrl={product.image_url}
          className="aspect-4/5 w-full"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="dossier-label w-full rounded-none px-4 py-2 lg:px-6">
          REF: {productRef(product.id)}
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
            <Button type="button" disabled className="w-full max-w-xl">
              SOLD OUT
            </Button>
          ) : (
            <div className="flex max-w-xl flex-col gap-3">
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
                    className="border-signal"
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
        </div>
      </div>
    </div>
  );
}
