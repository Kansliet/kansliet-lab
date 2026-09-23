"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/site";
import {
  CART_COOKIE,
  cartCookieOptions,
  cartToCookieValue,
  getCart,
  type CartItem,
} from "@/lib/cart";

type Product = {
  id: number;
  slug: string;
  stripe_price_id: string;
  sold_out: boolean;
};

async function writeCart(cart: CartItem[]) {
  const store = await cookies();
  if (cart.length === 0) {
    store.delete(CART_COOKIE);
  } else {
    store.set(CART_COOKIE, cartToCookieValue(cart), cartCookieOptions);
  }
}

async function addItemToCart(formData: FormData): Promise<void> {
  const productId = Number(formData.get("productId"));
  const requestedQuantity = Number(formData.get("quantity"));
  const quantity =
    Number.isInteger(requestedQuantity) && requestedQuantity > 0 ? requestedQuantity : 1;

  const { rows } = await pool.query<Pick<Product, "id" | "sold_out">>(
    "SELECT id, sold_out FROM shop_products WHERE id = $1",
    [productId]
  );
  const product = rows[0];
  if (!product || product.sold_out) {
    return;
  }

  const cart = await getCart();
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }

  await writeCart(cart);
}

// Used by the product detail page's "Add to cart" form — takes you to the
// cart so you can see what you just added.
export async function addToCart(formData: FormData) {
  await addItemToCart(formData);
  redirect("/store/cart");
}

// Used by the store grid's inline "+" — adds the item without navigating
// away, so browsing stays uninterrupted.
export async function quickAddToCart(formData: FormData) {
  await addItemToCart(formData);
  revalidatePath("/store");
}

export async function updateQuantity(formData: FormData) {
  const productId = Number(formData.get("productId"));
  const quantity = Number(formData.get("quantity"));

  const cart = await getCart();
  const next =
    Number.isInteger(quantity) && quantity > 0
      ? cart.map((item) => (item.productId === productId ? { ...item, quantity } : item))
      : cart.filter((item) => item.productId !== productId);

  await writeCart(next);
  revalidatePath("/store/cart");
}

export async function removeFromCart(formData: FormData) {
  const productId = Number(formData.get("productId"));
  const cart = await getCart();
  await writeCart(cart.filter((item) => item.productId !== productId));
  revalidatePath("/store/cart");
}

export async function clearCart() {
  (await cookies()).delete(CART_COOKIE);
}

export async function checkoutCart() {
  const cart = await getCart();
  if (cart.length === 0) {
    redirect("/store/cart");
  }

  const { rows: products } = await pool.query<Product>(
    "SELECT id, slug, stripe_price_id, sold_out FROM shop_products WHERE id = ANY($1)",
    [cart.map((item) => item.productId)]
  );
  const productsById = new Map(products.map((product) => [product.id, product]));

  // Defense in depth, same principle as buyNow re-checking sold_out
  // server-side: if anything in the cart is no longer purchasable, don't
  // create a Checkout Session for a partial order — bounce back so the
  // customer can fix their cart first, rather than silently charging for
  // fewer items than they saw.
  for (const item of cart) {
    const product = productsById.get(item.productId);
    if (!product || product.sold_out) {
      redirect(
        `/store/cart?error=${encodeURIComponent(
          "One of the items in your cart is no longer available — remove it to continue"
        )}`
      );
    }
  }

  const baseUrl = getAppBaseUrl();

  let sessionUrl: string | null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: cart.map((item) => ({
        price: productsById.get(item.productId)!.stripe_price_id,
        quantity: item.quantity,
      })),
      shipping_address_collection: {
        allowed_countries: ["SE", "NO", "DK", "FI", "DE", "GB", "US"],
      },
      success_url: `${baseUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/store/cart`,
      integration_identifier: "kansliet-shop-vqxmzrtl",
    });
    sessionUrl = session.url;
  } catch (err) {
    console.error("Stripe checkout session failed", err);
    redirect(
      `/store/cart?error=${encodeURIComponent("Something went wrong, try again")}`
    );
  }

  if (!sessionUrl) {
    redirect(
      `/store/cart?error=${encodeURIComponent("Something went wrong, try again")}`
    );
  }

  redirect(sessionUrl);
}
