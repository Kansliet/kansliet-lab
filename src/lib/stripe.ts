import Stripe from "stripe";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { formatMoney } from "@/lib/shop-info";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
  ["stripe-price-map"],
  { revalidate: 300, tags: ["stripe-prices"] }
));

export async function getPrice(stripePriceId: string): Promise<Price> {
  const cached = (await getPriceMap())[stripePriceId];
  if (cached) return cached;
  // Not in the map: archived price, or created within the cache window.
  return toPrice(await stripe.prices.retrieve(stripePriceId));
}

export function formatPrice(amount: number, currency: string): string {
  return formatMoney(Math.round(amount * 100), currency);
}

export async function getDisplayPrice(stripePriceId: string): Promise<string> {
  const { amount, currency } = await getPrice(stripePriceId);
  return formatPrice(amount, currency);
}
