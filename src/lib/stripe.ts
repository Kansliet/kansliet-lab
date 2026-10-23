import Stripe from "stripe";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { CACHE_SCOPE } from "@/lib/cache-scope";
import { formatMoney } from "@/lib/shop-info";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Pinned: payload shapes (e.g. session.collected_information) depend on it.
// When upgrading the `stripe` package, TypeScript flags this line: read
// Stripe's changelog for the new version, check the webhook, then bump it here
// and on the webhook endpoint (Stripe dashboard) together.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-08-26.dahlia" });

type Price = { amount: number; currency: string };

function toPrice(price: Stripe.Price): Price {
  return {
    amount: (price.unit_amount ?? 0) / 100,
    currency: price.currency.toUpperCase(),
  };
}

// Every active price in ONE list call, cached for 5 minutes. Before this, each
// catalog render did one prices.retrieve per product — N Stripe calls per page
// view, uncached, sharing a rate limit with checkout. Safe to cache because it
// is display-only: Checkout charges whatever the Stripe price object says at
// session creation, never this number. revalidateTag("stripe-prices") busts it.
// React cache() on top: unstable_cache doesn't coalesce concurrent misses, so
// on a cold cache the grid's N parallel getPrice calls would each fire the list
// call (measured: 14 on one render). cache() makes them share one promise.
const getPriceMap = cache(unstable_cache(
  async (): Promise<Record<string, Price>> => {
    const map: Record<string, Price> = {};
    for await (const price of stripe.prices.list({ active: true, limit: 100 })) {
      map[price.id] = toPrice(price);
    }
    return map;
  },
  ["stripe-price-map", CACHE_SCOPE],
  { revalidate: 300, tags: ["stripe-prices"] }
));

/**
 * The price a variant sells at, or null when it can't be charged: archived or
 * deleted in the Stripe dashboard. Callers treat null as "not for sale" (hidden
 * in the store, a cart line that blocks checkout, an empty price in the admin)
 * so one broken price can't take a whole page down. Saving the product in the
 * admin creates a fresh price and fixes it.
 */
export async function getPrice(stripePriceId: string): Promise<Price | null> {
  const cached = (await getPriceMap())[stripePriceId];
  if (cached) return cached;
  // Not in the map: created within the cache window, archived, or deleted.
  try {
    const price = await stripe.prices.retrieve(stripePriceId);
    if (price.active) return toPrice(price);
  } catch (err) {
    if (!(err instanceof Stripe.errors.StripeInvalidRequestError && err.code === "resource_missing")) throw err;
  }
  console.error(`Stripe price ${stripePriceId} is archived or deleted; its product is not for sale until saved in the admin`);
  return null;
}

export function formatPrice(amount: number, currency: string): string {
  return formatMoney(Math.round(amount * 100), currency);
}

export async function getDisplayPrice(stripePriceId: string): Promise<string | null> {
  const price = await getPrice(stripePriceId);
  return price && formatPrice(price.amount, price.currency);
}
