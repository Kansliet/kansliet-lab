import { Link } from "next-view-transitions";
import type { Metadata } from "next";
import { getCart } from "@/lib/cart";
import { getProductsByIds } from "@/lib/products";
import { getPrice, formatPrice } from "@/lib/stripe";
import { updateQuantity, removeFromCart, checkoutCart } from "./actions";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/store/ProductImage";

export const metadata: Metadata = {
  title: "KANSLIET (CART)",
  robots: { index: false },
};

type CartPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function QuantityButton({
  productId,
  quantity,
  label,
  children,
}: {
  productId: number;
  quantity: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <form action={updateQuantity}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button
        type="submit"
        aria-label={label}
        className="flex h-8 w-8 cursor-pointer items-center justify-center text-sm transition-opacity hover:opacity-60"
      >
        {children}
      </button>
    </form>
  );
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const { error } = await searchParams;
  const cart = await getCart();

  const products = await getProductsByIds(cart.map((item) => item.productId));
  const productsById = new Map(products.map((product) => [product.id, product]));

  const lines = await Promise.all(
    cart
      .filter((item) => productsById.has(item.productId))
      .map(async (item) => {
        const product = productsById.get(item.productId)!;
        const { amount, currency } = await getPrice(product.stripe_price_id);
        return { item, product, amount, currency };
      })
  );

  const currency = lines[0]?.currency ?? "EUR";
  const total = lines.reduce((sum, line) => sum + line.amount * line.item.quantity, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet">
          <Link
            href="/store"
            className="text-caps text-sm font-light tracking-wider mb-10 inline-block transition-opacity hover:opacity-60"
          >
            ← STORE
          </Link>

          <div className="mb-12 flex items-baseline justify-between gap-6">
            <h1 className="dossier-label">CART</h1>
            <span className="text-caps text-sm font-light tracking-wider opacity-60 tabular-nums">
              {String(itemCount).padStart(2, "0")} {itemCount === 1 ? "ITEM" : "ITEMS"}
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 border border-red-500 bg-red-500/5 p-4 text-red-600"
            >
              <p className="text-caps text-sm font-bold tracking-wide">ERROR: {error}</p>
            </div>
          )}

          {lines.length === 0 ? (
            <div className="border-brutal p-10 text-center">
              <p className="text-caps text-sm font-light tracking-wider opacity-60">
                YOUR CART IS EMPTY.
              </p>
            </div>
          ) : (
            <>
              <ul className="border-brutal">
                {lines.map(({ item, product, amount, currency: lineCurrency }, index) => (
                  <li
                    key={product.id}
                    className={`flex items-center gap-4 p-4 ${index > 0 ? "border-t-brutal" : ""}`}
                  >
                    <Link href={`/store/${product.slug}`} className="shrink-0">
                      <ProductImage
                        id={product.id}
                        name={product.name}
                        imageUrl={product.image_url}
                        className="aspect-5/6 w-16 md:w-20"
                        sizes="80px"
                        compact
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/store/${product.slug}`}
                        className="text-caps text-sm font-normal tracking-wider transition-opacity hover:opacity-60"
                      >
                        {product.name}
                      </Link>
                      <p className="text-normal-case mt-1 text-sm font-light opacity-60">
                        {formatPrice(amount, lineCurrency)}
                        {product.sold_out && " — sold out, remove to check out"}
                      </p>

                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center border-brutal">
                          <QuantityButton
                            productId={product.id}
                            quantity={item.quantity - 1}
                            label="Decrease quantity"
                          >
                            −
                          </QuantityButton>
                          <span className="w-6 text-center text-sm tabular-nums">
                            {item.quantity}
                          </span>
                          <QuantityButton
                            productId={product.id}
                            quantity={item.quantity + 1}
                            label="Increase quantity"
                          >
                            +
                          </QuantityButton>
                        </div>

                        <form action={removeFromCart}>
                          <input type="hidden" name="productId" value={product.id} />
                          <button
                            type="submit"
                            className="text-caps text-sm font-light tracking-wider cursor-pointer opacity-60 transition-opacity hover:opacity-100"
                          >
                            REMOVE
                          </button>
                        </form>
                      </div>
                    </div>

                    <p className="text-sm tabular-nums">
                      {formatPrice(amount * item.quantity, lineCurrency)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-baseline justify-between gap-6 border-b-brutal pb-8">
                <span className="dossier-label">TOTAL</span>
                <span className="text-lg tabular-nums">{formatPrice(total, currency)}</span>
              </div>
              <p className="text-normal-case mt-3 text-sm font-light opacity-60">
                Payment and shipping address on the next step (Stripe).
              </p>

              <form action={checkoutCart} className="mt-8 flex justify-end">
                <Button type="submit" size="lg" className="w-full md:w-auto">
                  CHECKOUT →
                </Button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
