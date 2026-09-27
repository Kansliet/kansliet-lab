import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getCategories, getProductById } from "@/lib/products";
import { getPrice } from "@/lib/stripe";
import { specsToText } from "@/lib/product-form";
import { productRef } from "@/components/store/ProductImage";
import { AdminNav } from "../../admin-nav";
import { ProductForm } from "../product-form";

export const metadata: Metadata = {
  title: "KANSLIET (EDIT PRODUCT)",
  robots: { index: false },
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const product = await getProductById(Number((await params).id));
  if (!product) notFound();

  const [categories, price] = await Promise.all([
    getCategories(),
    getPrice(product.stripe_price_id),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet">
          <AdminNav active="PRODUCTS" />
          <div className="mb-8 flex items-baseline justify-between gap-6">
            <h2 className="text-caps text-lg font-light tracking-wider">
              {productRef(product.id)} — {product.name}
            </h2>
            {!product.hidden && (
              <Link
                href={`/store/${product.slug}`}
                className="text-caps text-sm font-light tracking-wider opacity-60 transition-opacity hover:opacity-100"
              >
                VIEW IN STORE →
              </Link>
            )}
          </div>
          <ProductForm
            productId={product.id}
            images={product.images}
            categories={categories}
            options={product.options}
            variants={product.variants.map(({ id, option1, option2, stock }) => ({ id, option1, option2, stock }))}
            initial={{
              name: product.name,
              slug: product.slug,
              category: product.category,
              price: price.amount.toFixed(2),
              stock: String(product.stock),
              tagline: product.tagline ?? "",
              description: product.description ?? "",
              specs: specsToText(product.specs),
              hidden: product.hidden ? "on" : "",
            }}
          />
        </div>
      </section>
    </div>
  );
}
