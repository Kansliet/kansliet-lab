"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { stripe } from "@/lib/stripe";

type Product = {
  id: number;
  slug: string;
  stripe_price_id: string;
  sold_out: boolean;
};

async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

export async function buyNow(formData: FormData) {
  const productId = Number(formData.get("productId"));

  const { rows } = await pool.query<Product>(
    "SELECT id, slug, stripe_price_id, sold_out FROM shop_products WHERE id = $1",
    [productId]
  );
  const product = rows[0];

  if (!product) {
    redirect("/store");
  }

  if (product.sold_out) {
    redirect(`/store/${product.slug}?error=${encodeURIComponent("Sold out")}`);
  }

  const baseUrl = await getBaseUrl();

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
  } catch {
    redirect(
      `/store/${product.slug}?error=${encodeURIComponent(
        "Something went wrong, try again"
      )}`
    );
  }

  if (!sessionUrl) {
    redirect(
      `/store/${product.slug}?error=${encodeURIComponent(
        "Something went wrong, try again"
      )}`
    );
  }

  redirect(sessionUrl);
}
