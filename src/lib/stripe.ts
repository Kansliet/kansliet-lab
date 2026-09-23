import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function getPrice(
  stripePriceId: string
): Promise<{ amount: number; currency: string }> {
  const price = await stripe.prices.retrieve(stripePriceId);
  return {
    amount: (price.unit_amount ?? 0) / 100,
    currency: price.currency.toUpperCase(),
  };
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export async function getDisplayPrice(stripePriceId: string): Promise<string> {
  const { amount, currency } = await getPrice(stripePriceId);
  return formatPrice(amount, currency);
}
