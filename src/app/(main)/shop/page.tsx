import Link from "next/link";
import Image from "next/image";
import { pool } from "@/lib/db";
import { getDisplayPrice } from "@/lib/stripe";
import { quickAddToCart } from "@/app/(main)/shop/cart/actions";
import { PAGE_SHELL, HEADING, PRICE_SECONDARY } from "@/lib/design-tokens";

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

type ShopPageProps = {
  searchParams: Promise<{ category?: string }>;
};

async function getCategories(): Promise<string[]> {
  const { rows } = await pool.query<{ category: string }>(
    "SELECT DISTINCT category FROM shop_products ORDER BY category"
  );
  return rows.map((row) => row.category);
}

async function getProducts(
  category?: string
): Promise<(Product & { displayPrice: string })[]> {
  const { rows } = category
    ? await pool.query<Product>(
        "SELECT id, slug, name, description, image_url, stripe_price_id, sold_out, category FROM shop_products WHERE category = $1 ORDER BY created_at DESC",
        [category]
      )
    : await pool.query<Product>(
        "SELECT id, slug, name, description, image_url, stripe_price_id, sold_out, category FROM shop_products ORDER BY created_at DESC"
      );
  return Promise.all(
    rows.map(async (product) => ({
      ...product,
      displayPrice: await getDisplayPrice(product.stripe_price_id),
    }))
  );
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(category),
    getCategories(),
  ]);

  return (
    <div className={PAGE_SHELL.full}>
      <h1 className={`mb-6 ${HEADING}`}>Shop</h1>

      <div className="mb-10 flex items-center justify-between">
        <nav className="flex flex-wrap gap-6 text-sm">
          <Link
            href="/shop"
            className={
              category
                ? "text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                : "font-medium text-zinc-900 dark:text-zinc-50"
            }
          >
            all products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/shop?category=${encodeURIComponent(cat)}`}
              className={
                category === cat
                  ? "font-medium text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              }
            >
              {cat}
            </Link>
          ))}
        </nav>
        <span className="text-sm text-zinc-400 dark:text-zinc-500">
          {products.length} product{products.length === 1 ? "" : "s"}
        </span>
      </div>

      {products.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          Nothing in the shop yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10">
          {products.map((product) => (
            <div key={product.id}>
              <Link
                href={`/shop/${product.slug}`}
                className="group relative block aspect-square overflow-hidden bg-white dark:bg-zinc-900"
              >
                {product.image_url && (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-contain transition-transform group-hover:scale-105"
                    sizes="(min-width: 640px) 33vw, 50vw"
                  />
                )}
              </Link>

              <div className="mt-3 flex items-start justify-between gap-2">
                <Link href={`/shop/${product.slug}`} className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {product.name}
                  </p>
                  <p className={PRICE_SECONDARY}>
                    {product.sold_out ? "sold out" : product.displayPrice}
                  </p>
                </Link>

                {!product.sold_out && (
                  <form action={quickAddToCart}>
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="quantity" value={1} />
                    <button
                      type="submit"
                      aria-label={`Add ${product.name} to cart`}
                      className="mt-0.5 cursor-pointer text-lg leading-none text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-50"
                    >
                      +
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
