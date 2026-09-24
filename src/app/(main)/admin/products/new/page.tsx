import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { getCategories } from "@/lib/products";
import { AdminNav } from "../../admin-nav";
import { ProductForm } from "../product-form";

export const metadata: Metadata = {
  title: "KANSLIET (NEW PRODUCT)",
  robots: { index: false },
};

export default async function NewProductPage() {
  await requireSession();
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet">
          <AdminNav active="PRODUCTS" />
          <h2 className="text-caps mb-8 text-lg font-light tracking-wider">NEW PRODUCT</h2>
          <ProductForm
            categories={categories}
            initial={{
              name: "",
              slug: "",
              category: "",
              price: "",
              stock: "1",
              tagline: "",
              description: "",
              specs: "",
            }}
          />
        </div>
      </section>
    </div>
  );
}
