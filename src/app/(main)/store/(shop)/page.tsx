import Link from "next/link";
import type { Metadata } from "next";
import { getDisplayPrice } from "@/lib/stripe";
import { getCategories, getProducts } from "@/lib/products";
import { quickAddToCart } from "@/app/(main)/store/(shop)/cart/actions";
import { Grid, GridItem, GridItemTitle, GridItemMeta } from "@/components/ui/grid";
import { ProductImage } from "@/components/store/ProductImage";
import { SignupForm } from "@/components/newsletter/signup-form";
import { mintFormToken } from "@/lib/form-token";

export const metadata: Metadata = {
  title: "KANSLIET (STORE)",
  alternates: { canonical: "/store" },
};

type StorePageProps = {
  searchParams: Promise<{ category?: string }>;
};

async function getProductsWithPrices(category?: string) {
  const products = await getProducts(category);
  return Promise.all(
    products.map(async (product) => ({
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
  // scroll={false}: switching category keeps your place on the page.
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`text-caps text-sm font-light tracking-wide transition-opacity hover:opacity-60 whitespace-nowrap ${
        active ? "opacity-100 border-b border-foreground" : "opacity-60"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    getProductsWithPrices(category),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet">
          <div className="mb-12 flex items-baseline justify-between gap-6">
            <h1 className="dossier-label">STORE</h1>
            <span className="text-caps text-sm font-light tracking-wider opacity-60 tabular-nums">
              {String(products.length).padStart(2, "0")}{" "}
              {products.length === 1 ? "OBJECT" : "OBJECTS"}
            </span>
          </div>

          <nav
            aria-label="Product categories"
            className="mb-8 flex flex-wrap gap-x-8 gap-y-3"
          >
            <FilterLink href="/store" active={!category}>
              ALL
            </FilterLink>
            {categories.map((cat) => (
              <FilterLink
                key={cat}
                href={`/store?category=${encodeURIComponent(cat)}`}
                active={category === cat}
              >
                {cat}
              </FilterLink>
            ))}
          </nav>

          <div>
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
                        href={`/store/${product.slug}`}
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
                        <Link href={`/store/${product.slug}`} className="min-w-0">
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

          <div className="mt-20 max-w-xl border-t-brutal pt-8">
            <h2 className="dossier-label mb-4">NEWSLETTER</h2>
            <p className="text-normal-case mb-6 text-sm font-light leading-relaxed">
              New objects in the store, and the occasional note from the studio. No spam;
              unsubscribe any time. See the{" "}
              <Link href="/privacy#purposes" className="underline hover:opacity-60">
                privacy policy
              </Link>
              .
            </p>
            <SignupForm formToken={mintFormToken()} />
          </div>
        </div>
      </section>
    </div>
  );
}
