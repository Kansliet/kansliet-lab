"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { getPrice, stripe } from "@/lib/stripe";
import {
  COMPANY,
  COUNTRY_NAMES,
  DISPATCH_DAYS,
  STORE_CURRENCY,
  TERMS_VERSION,
  WITHDRAWAL_DAYS,
  regionForCountry,
  shippingCost,
} from "@/lib/shop-info";
import { getAppBaseUrl } from "@/lib/site";
import { withError } from "@/lib/error-codes";
import { getProductById, getVariantsByIds } from "@/lib/products";
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

/**
 * The variant a form means: `variantId`, or for a product with a single
 * variant, `productId` (the grid's quick add, and pages rendered before
 * variants existed).
 */
async function variantFromForm(formData: FormData): Promise<number | null> {
  const variantId = Number(formData.get("variantId"));
  if (formData.has("variantId") && Number.isInteger(variantId)) return variantId;
  const product = await getProductById(Number(formData.get("productId")));
  return product && product.variants.length === 1 ? product.variants[0].id : null;
}

async function addItemToCart(formData: FormData): Promise<void> {
  const variantId = await variantFromForm(formData);
  const requestedQuantity = Number(formData.get("quantity"));
  const quantity =
    Number.isInteger(requestedQuantity) && requestedQuantity > 0 ? requestedQuantity : 1;

  const found = variantId === null ? undefined : (await getVariantsByIds([variantId])).get(variantId);
  if (!found || found.product.sold_out || found.variant.stock <= 0) {
    return;
  }

  // Never hold more than is in stock, however many times "add" is pressed.
  const cap = maxLineQuantity(found.variant.stock);
  const cart = await getCart();
  const existing = cart.find((item) => item.variantId === found.variant.id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, cap);
  } else {
    cart.push({ variantId: found.variant.id, quantity: Math.min(quantity, cap) });
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
  const variantId = Number(formData.get("variantId"));
  const quantity = Number(formData.get("quantity"));

  const found = (await getVariantsByIds([variantId])).get(variantId);
  const cap = found ? maxLineQuantity(found.variant.stock) : 0;

  const cart = await getCart();
  const next =
    Number.isInteger(quantity) && quantity > 0
      ? cart.map((item) =>
          item.variantId === variantId ? { ...item, quantity: Math.min(quantity, cap) } : item
        )
      : cart.filter((item) => item.variantId !== variantId);

  // A cap of 0 (sold out meanwhile) leaves a zero line; drop it.
  await writeCart(next.filter((item) => item.quantity > 0));
  revalidatePath("/store/cart");
}

export async function removeFromCart(formData: FormData) {
  await assertStoreOpen();
  const variantId = Number(formData.get("variantId"));
  const cart = await getCart();
  await writeCart(cart.filter((item) => item.variantId !== variantId));
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

  const variants = await getVariantsByIds(cart.map((item) => item.variantId));

  // Defense in depth, same principle as buyNow re-checking sold_out
  // server-side: if anything in the cart is no longer purchasable, don't
  // create a Checkout Session for a partial order — bounce back so the
  // customer can fix their cart first, rather than silently charging for
  // fewer items than they saw.
  for (const item of cart) {
    const found = variants.get(item.variantId);
    if (!found || found.product.sold_out || found.variant.stock <= 0) {
      redirect(withError("/store/cart", "unavailable"));
    }
    if (item.quantity > found.variant.stock) {
      redirect(withError("/store/cart", "insufficient_stock"));
    }
  }

  // Free shipping is decided here from Stripe's prices (the same cached map the
  // cart shows, so the two always agree), never from anything the browser sent.
  // A price edited in the admin busts that cache at once; one edited directly
  // in the Stripe dashboard can lag up to 5 minutes.
  const prices = await Promise.all(
    cart.map((item) => getPrice(variants.get(item.variantId)!.variant.stripe_price_id))
  );
  const subtotalCents = cart.reduce(
    (sum, item, i) => sum + Math.round(prices[i].amount * 100) * item.quantity,
    0
  );
  const shipping = shippingCost(region, subtotalCents);

  // Unticked by default; buyers who tick it are added to the list by the
  // webhook once the payment goes through (see lib/newsletter).
  const newsletter = formData.get("newsletter") === "on";

  const baseUrl = getAppBaseUrl();

  let sessionUrl: string | null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: cart.map((item) => ({
        price: variants.get(item.variantId)!.variant.stripe_price_id,
        quantity: item.quantity,
      })),
      shipping_address_collection: {
        allowed_countries: [country as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: `${shipping === 0 ? "Free shipping" : "Shipping"} to ${COUNTRY_NAMES[country] ?? country}`,
            fixed_amount: { amount: shipping, currency: STORE_CURRENCY },
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
      metadata: {
        terms_version: TERMS_VERSION,
        ship_country: country,
        ...(newsletter ? { newsletter: "1" } : {}),
      },
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
