import Link from "next/link";
import Image from "next/image";
import { pool } from "@/lib/db";
import { getCart } from "@/lib/cart";
import { getPrice, formatPrice } from "@/lib/stripe";
import { updateQuantity, removeFromCart, checkoutCart } from "./actions";
import { Button } from "@/components/shop/Button";
import {
  PAGE_SHELL,
  HEADING,
  PRICE_PRIMARY,
  PRICE_SECONDARY,
  buttonClasses,
} from "@/lib/design-tokens";

type Product = {
  id: number;
  slug: string;
  name: string;
  image_url: string | null;
  stripe_price_id: string;
  sold_out: boolean;
};

type CartPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function CartPage({ searchParams }: CartPageProps) {
  const { error } = await searchParams;
  const cart = await getCart();

  const { rows: products } = cart.length
    ? await pool.query<Product>(
        "SELECT id, slug, name, image_url, stripe_price_id, sold_out FROM shop_products WHERE id = ANY($1)",
        [cart.map((item) => item.productId)]
      )
    : { rows: [] as Product[] };
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

  const currency = lines[0]?.currency ?? "USD";
  const total = lines.reduce((sum, line) => sum + line.amount * line.item.quantity, 0);

  return (
    <div className={PAGE_SHELL.full}>
      <Link href="/shop" className={`mb-6 inline-block ${buttonClasses("tertiary")}`}>
        ← Back to shop
      </Link>

      <h1 className={`mb-8 ${HEADING}`}>Cart</h1>

      {error && (
        <p className="mb-6 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {lines.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          Your cart is empty.{" "}
          <Link href="/shop" className={buttonClasses("tertiary")}>
            Continue shopping
          </Link>
          .
        </p>
      ) : (
        <>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {lines.map(({ item, product, amount, currency: lineCurrency }) => (
              <li key={product.id} className="flex items-center gap-4 py-6">
                <Link
                  href={`/shop/${product.slug}`}
                  className="relative aspect-square w-20 shrink-0 overflow-hidden bg-white dark:bg-zinc-900"
                >
                  {product.image_url && (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="80px"
                    />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/shop/${product.slug}`}
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
                  >
                    {product.name}
                  </Link>
                  <p className={`mt-1 ${PRICE_SECONDARY}`}>
                    {formatPrice(amount, lineCurrency)}
                  </p>

                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <form action={updateQuantity}>
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="quantity" value={item.quantity - 1} />
                        <button
                          type="submit"
                          aria-label="Decrease quantity"
                          className="cursor-pointer text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-50"
                        >
                          −
                        </button>
                      </form>
                      <span className="w-4 text-center text-sm text-zinc-900 dark:text-zinc-50">
                        {item.quantity}
                      </span>
                      <form action={updateQuantity}>
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="quantity" value={item.quantity + 1} />
                        <button
                          type="submit"
                          aria-label="Increase quantity"
                          className="cursor-pointer text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-50"
                        >
                          +
                        </button>
                      </form>
                    </div>

                    <form action={removeFromCart}>
                      <input type="hidden" name="productId" value={product.id} />
                      <Button variant="tertiary" type="submit">
                        Remove
                      </Button>
                    </form>
                  </div>
                </div>

                <p className={PRICE_SECONDARY}>
                  {formatPrice(amount * item.quantity, lineCurrency)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <span className="text-base font-medium text-zinc-900 dark:text-zinc-50">
              Total
            </span>
            <span className={PRICE_PRIMARY}>{formatPrice(total, currency)}</span>
          </div>

          <form action={checkoutCart} className="mt-6">
            <Button variant="primary" type="submit" className="w-full">
              Checkout
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
