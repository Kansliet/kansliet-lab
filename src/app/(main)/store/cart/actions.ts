"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  COMPANY,
  COUNTRY_NAMES,
  DISPATCH_DAYS,
  STORE_CURRENCY,
  TERMS_VERSION,
  WITHDRAWAL_DAYS,
  regionForCountry,
} from "@/lib/shop-info";
import { getAppBaseUrl } from "@/lib/site";
import { withError } from "@/lib/error-codes";
import { getProductById, getProductsByIds } from "@/lib/products";
import { getSession } from "@/lib/auth";
import { STORE_ENABLED } from "@/lib/store-flag";
import {
  CART_COOKIE,
  cartCookieOptions,
  cartToCookieValue,
  getCart,
  maxLineQuantity,
  type CartItem,
} from "@/lib/cart";

// Server actions can be called directly, not only from the (hidden) pages:
// while the store is closed, only a logged-in admin may use them.
async function assertStoreOpen() {
  if (!STORE_ENABLED && !(await getSession())) redirect("/");
}

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

  const product = await getProductById(productId);
  if (!product || product.sold_out) {
    return;
  }

  // Never hold more than is in stock, however many times "add" is pressed.
  const cap = maxLineQuantity(product.stock);
  const cart = await getCart();
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, cap);
  } else {
    cart.push({ productId, quantity: Math.min(quantity, cap) });
  }

  await writeCart(cart);
}

// Used by the product detail page's "Add to cart" form — takes you to the
// cart so you can see what you just added.
export async function addToCart(formData: FormData) {
  await assertStoreOpen();
  await addItemToCart(formData);
  redirect("/store/cart");
}

// Used by the store grid's inline "+" — adds the item without navigating
// away, so browsing stays uninterrupted.
export async function quickAddToCart(formData: FormData) {
  await assertStoreOpen();
  await addItemToCart(formData);
  revalidatePath("/store");
}

export async function updateQuantity(formData: FormData) {
  await assertStoreOpen();
  const productId = Number(formData.get("productId"));
  const quantity = Number(formData.get("quantity"));

  const product = await getProductById(productId);
  const cap = product ? maxLineQuantity(product.stock) : 0;

  const cart = await getCart();
  const next =
    Number.isInteger(quantity) && quantity > 0
      ? cart.map((item) =>
          item.productId === productId ? { ...item, quantity: Math.min(quantity, cap) } : item
        )
      : cart.filter((item) => item.productId !== productId);

  // A cap of 0 (sold out meanwhile) leaves a zero line; drop it.
  await writeCart(next.filter((item) => item.quantity > 0));
  revalidatePath("/store/cart");
}

export async function removeFromCart(formData: FormData) {
  await assertStoreOpen();
  const productId = Number(formData.get("productId"));
  const cart = await getCart();
  await writeCart(cart.filter((item) => item.productId !== productId));
  revalidatePath("/store/cart");
}

export async function clearCart() {
  (await cookies()).delete(CART_COOKIE);
}

export async function checkoutCart(formData: FormData) {
  await assertStoreOpen();
  const cart = await getCart();
  if (cart.length === 0) {
    redirect("/store/cart");
  }

  // The checkbox is `required` in the browser; this is the check that counts.
  if (formData.get("acceptTerms") !== "on") {
    redirect(withError("/store/cart", "terms_required"));
  }

  // Stripe Checkout can't price shipping by country on its own, so the cart
  // asks first; the session then offers only that country and its one rate.
  const country = String(formData.get("country") ?? "");
  const region = regionForCountry(country);
  if (!region) {
    redirect(withError("/store/cart", "unsupported_country"));
  }
  const [minDays, maxDays] = region.deliveryDays;

  const products = await getProductsByIds(cart.map((item) => item.productId));
  const productsById = new Map(products.map((product) => [product.id, product]));

  // Defense in depth, same principle as buyNow re-checking sold_out
  // server-side: if anything in the cart is no longer purchasable, don't
  // create a Checkout Session for a partial order — bounce back so the
  // customer can fix their cart first, rather than silently charging for
  // fewer items than they saw.
  for (const item of cart) {
    const product = productsById.get(item.productId);
    if (!product || product.sold_out) {
      redirect(withError("/store/cart", "unavailable"));
    }
    if (item.quantity > product.stock) {
      redirect(withError("/store/cart", "insufficient_stock"));
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
        allowed_countries: [country as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: `Shipping to ${COUNTRY_NAMES[country] ?? country}`,
            fixed_amount: { amount: region.amount, currency: STORE_CURRENCY },
            delivery_estimate: {
              minimum: { unit: "business_day", value: minDays + DISPATCH_DAYS },
              maximum: { unit: "business_day", value: maxDays + DISPATCH_DAYS },
            },
          },
        },
      ],
      custom_text: {
        submit: {
          message: `By paying you accept our terms of sale (${COMPANY.website}/terms), including the ${WITHDRAWAL_DAYS}-day right of withdrawal.`,
        },
      },
      // Which terms the customer accepted, for the record.
      metadata: { terms_version: TERMS_VERSION, ship_country: country },
      success_url: `${baseUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/store/cart`,
      integration_identifier: "kansliet-shop-vqxmzrtl",
    });
    sessionUrl = session.url;
  } catch (err) {
    console.error("Stripe checkout session failed", err);
    redirect(withError("/store/cart", "checkout_failed"));
  }

  if (!sessionUrl) {
    redirect(withError("/store/cart", "checkout_failed"));
  }

  redirect(sessionUrl);
}
