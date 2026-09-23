import { Link } from "next-view-transitions";
import type { Metadata } from "next";
import { pool } from "@/lib/db";
import { getDisplayPrice } from "@/lib/stripe";
import { quickAddToCart } from "@/app/(main)/shop/cart/actions";
import { Grid, GridItem, GridItemTitle, GridItemMeta } from "@/components/ui/grid";
import { ProductImage } from "@/components/shop/ProductImage";

export const metadata: Metadata = {
  title: "KANSLIET (SHOP)",
  alternates: { canonical: "/shop" },
};

type Product = {
  id: number;
  slug: string;
  name: string;
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
        "SELECT id, slug, name, image_url, stripe_price_id, sold_out, category FROM shop_products WHERE category = $1 ORDER BY created_at DESC, id DESC",
        [category]
      )
    : await pool.query<Product>(
        "SELECT id, slug, name, image_url, stripe_price_id, sold_out, category FROM shop_products ORDER BY created_at DESC, id DESC"
      );
  return Promise.all(
    rows.map(async (product) => ({
      ...product,
      displayPrice: await getDisplayPrice(product.stripe_price_id),
    }))
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`text-caps text-sm font-light tracking-wide transition-opacity hover:opacity-60 whitespace-nowrap ${
        active ? "opacity-100 border-b border-foreground" : "opacity-60"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(category),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet">
          <div className="mb-12 flex items-baseline justify-between gap-6">
            <h1 className="dossier-label">SHOP</h1>
            <span className="text-caps text-sm font-light tracking-wider opacity-60 tabular-nums">
              {String(products.length).padStart(2, "0")}{" "}
              {products.length === 1 ? "OBJECT" : "OBJECTS"}
            </span>
          </div>

          <nav
            aria-label="Product categories"
            className="mb-8 flex flex-wrap gap-x-8 gap-y-3"
          >
            <FilterLink href="/shop" active={!category}>
              ALL
            </FilterLink>
            {categories.map((cat) => (
              <FilterLink
                key={cat}
                href={`/shop?category=${encodeURIComponent(cat)}`}
                active={category === cat}
              >
                {cat}
              </FilterLink>
            ))}
          </nav>

          {products.length === 0 ? (
            <p className="text-caps text-sm font-light tracking-wider opacity-60">
              NOTHING HERE YET.
            </p>
          ) : (
            <Grid cols={3} gap={6}>
              {products.map((product, index) => (
                <GridItem key={product.id}>
                  <div className="flex aspect-5/6 flex-col overflow-hidden">
                    <Link
                      href={`/shop/${product.slug}`}
                      className="relative min-h-0 flex-1"
                    >
                      <ProductImage
                        id={product.id}
                        name={product.name}
                        imageUrl={product.image_url}
                        className="h-full"
                        sizes="(max-width: 768px) 100vw, (max-width: 1400px) 33vw, 400px"
                        priority={index === 0}
                      />
                      {product.sold_out && (
                        <span className="dossier-label absolute top-2 right-2">
                          SOLD OUT
                        </span>
                      )}
                    </Link>
                    <div className="flex shrink-0 items-start justify-between gap-4 border-t-brutal bg-background p-4">
                      <Link href={`/shop/${product.slug}`} className="min-w-0">
                        <GridItemTitle className="truncate">
                          {product.name}
                        </GridItemTitle>
                        <GridItemMeta>
                          <span className="capitalize">{product.category}</span>, {product.displayPrice}
                        </GridItemMeta>
                      </Link>
                      {!product.sold_out && (
                        <form action={quickAddToCart} className="shrink-0">
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="quantity" value={1} />
                          <button
                            type="submit"
                            aria-label={`Add ${product.name} to cart`}
                            className="text-caps text-sm font-light tracking-wider cursor-pointer transition-opacity hover:opacity-60"
                          >
                            + ADD
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </GridItem>
              ))}
            </Grid>
          )}
        </div>
      </section>
    </div>
  );
}
