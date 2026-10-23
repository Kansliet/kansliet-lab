/** Stripe's line.price.product: an id, or an expanded (possibly deleted) product. */
export function stripeProductId(product: string | { id: string } | null | undefined): string | null {
  if (!product) return null;
  return typeof product === "string" ? product : product.id;
}

/**
 * The variant a paid line belongs to: by price id, else by Stripe product id.
 * A price edited in the admin gets a new price id, but the variant keeps its
 * Stripe product, so a checkout opened before the edit still maps back.
 */
export function matchVariant<V extends { stripe_price_id: string; stripe_product_id: string }>(
  variants: V[],
  priceId: string | null,
  productId: string | null,
): V | null {
  return (
    (priceId ? variants.find((v) => v.stripe_price_id === priceId) : undefined) ??
    (productId ? variants.find((v) => v.stripe_product_id === productId) : undefined) ??
    null
  );
}
