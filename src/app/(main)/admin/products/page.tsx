import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getAdminProducts } from "@/lib/products";
import { getDisplayPrice } from "@/lib/stripe";
import { MAX_STOCK } from "@/lib/product-form";
import { setStock } from "./actions";
import { AdminNav } from "../admin-nav";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductImage, productRef } from "@/components/store/ProductImage";
import { QuantityStepper } from "@/components/store/QuantityStepper";

export const metadata: Metadata = {
  title: "KANSLIET (PRODUCTS)",
  robots: { index: false },
};

// Plain uppercase, not .text-caps: its display: inline-block breaks table cell layout.
const TH = "px-4 py-3 text-sm font-light uppercase tracking-wider opacity-60";

export default async function AdminProductsPage() {
  await requireSession();
  const products = await getAdminProducts();
  const prices = await Promise.all(products.map((p) => getDisplayPrice(p.stripe_price_id)));

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet">
          <AdminNav active="PRODUCTS" />

          <div className="mb-6 flex justify-end">
            <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
              + NEW PRODUCT
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="border-brutal p-10 text-center">
              <p className="text-caps text-sm font-light tracking-wider opacity-60">
                NO PRODUCTS YET.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-brutal">
              <table className="w-full text-left text-sm">
                <thead className="border-b-brutal">
                  <tr>
                    <th className={TH}>PRODUCT</th>
                    <th className={TH}>CATEGORY</th>
                    <th className={TH}>PRICE</th>
                    <th className={TH}>STOCK</th>
                    <th className={TH}>
                      <span className="sr-only">ACTIONS</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.id} className={index > 0 ? "border-t-brutal" : ""}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            id={product.id}
                            name={product.name}
                            imageUrl={product.image_url}
                            sizes="48px"
                            compact
                            className="h-12 w-12 shrink-0"
                          />
                          <div className={product.hidden ? "opacity-50" : undefined}>
                            <div>{product.name}</div>
                            <div className="font-light opacity-60">
                              {productRef(product.id)} · /{product.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-light uppercase">{product.category}</td>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                        {prices[index]}
                      </td>
                      <td className="px-4 py-3">
                        {/* key: remount on a new stock value so the stepper
                            shows what the server saved, not stale local state. */}
                        <form
                          key={product.stock}
                          action={setStock}
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="previousStock" value={product.stock} />
                          <QuantityStepper
                            id={`stock-${product.id}`}
                            name="stock"
                            min={0}
                            max={MAX_STOCK}
                            defaultValue={product.stock}
                            editable
                            className="w-32"
                          />
                          <Button type="submit" variant="secondary" size="sm" className="py-3.5">
                            SAVE
                          </Button>
                          {product.hidden ? (
                            <Badge>HIDDEN</Badge>
                          ) : (
                            product.sold_out && <Badge variant="solid">SOLD OUT</Badge>
                          )}
                        </form>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-caps text-sm font-light tracking-wider transition-opacity hover:opacity-60"
                        >
                          EDIT →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
