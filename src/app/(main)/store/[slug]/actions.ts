"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/site";
import { withError } from "@/lib/error-codes";
import { getProductById } from "@/lib/products";

export async function buyNow(formData: FormData) {
  const product = await getProductById(Number(formData.get("productId")));

  if (!product) {
    redirect("/store");
  }

  if (product.sold_out) {
    redirect(withError(`/store/${product.slug}`, "sold_out"));
  }

  const baseUrl = getAppBaseUrl();

  let sessionUrl: string | null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: product.stripe_price_id, quantity: 1 }],
      shipping_address_collection: {
        allowed_countries: ["SE", "NO", "DK", "FI", "DE", "GB", "US"],
      },
      success_url: `${baseUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/store/${product.slug}`,
      metadata: { shop_product_id: String(product.id) },
      integration_identifier: "kansliet-shop-vqxmzrtl",
    });
    sessionUrl = session.url;
  } catch (err) {
    console.error("Stripe checkout session failed", err);
    redirect(withError(`/store/${product.slug}`, "checkout_failed"));
  }

  if (!sessionUrl) {
    redirect(withError(`/store/${product.slug}`, "checkout_failed"));
  }

  redirect(sessionUrl);
}
