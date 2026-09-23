import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { pool } from "@/lib/db";
import { getDisplayPrice } from "@/lib/stripe";
import { addToCart } from "@/app/(main)/shop/cart/actions";
import { buyNow } from "./actions";
import { Button } from "@/components/shop/Button";
import { PAGE_SHELL, HEADING, PRICE_PRIMARY, buttonClasses } from "@/lib/design-tokens";

type Product = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  stripe_price_id: string;
  sold_out: boolean;
};

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
};

async function getProduct(slug: string): Promise<Product | null> {
  const { rows } = await pool.query<Product>(
    "SELECT id, slug, name, description, image_url, stripe_price_id, sold_out FROM shop_products WHERE slug = $1",
    [slug]
  );
  return rows[0] ?? null;
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
    <div className={PAGE_SHELL.full}>
      <Link href="/shop" className={`mb-6 inline-block ${buttonClasses("tertiary")}`}>
        ← Back to shop
      </Link>

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-5">
        {/* Only one image per product today (shop_products.image_url is a
            single column) — no prev/next or dot pagination to build. A
            multi-image carousel is a schema gap, not a styling one. */}
        <div className="relative aspect-square overflow-hidden bg-white sm:col-span-2 dark:bg-zinc-900">
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain"
              sizes="(min-width: 640px) 40vw, 100vw"
            />
          )}
        </div>

        <div className="sm:col-span-3">
          <h1 className={HEADING}>{product.name}</h1>
          <p className={`mt-1 ${PRICE_PRIMARY}`}>{displayPrice}</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {product.sold_out ? "sold out" : "In stock"}
          </p>

          <form action={buyNow} className="mt-8">
            <input type="hidden" name="productId" value={product.id} />

            {product.sold_out ? (
              <Button variant="primary" type="button" disabled className="w-full">
                Sold out
              </Button>
            ) : (
              <Button variant="primary" type="submit" className="w-full">
                Buy now
              </Button>
            )}

            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </form>

          {product.description && (
            <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-300">
              {product.description}
            </p>
          )}

          {!product.sold_out && (
            <form action={addToCart} className="mt-6 flex items-center gap-3">
              <input type="hidden" name="productId" value={product.id} />
              <label className="sr-only" htmlFor="quantity">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                name="quantity"
                min={1}
                defaultValue={1}
                className="w-16 border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              />
              <Button variant="tertiary" type="submit">
                Add to cart
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
