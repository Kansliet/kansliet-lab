import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { orderRef } from "@/lib/order-email";
import { COMPANY, COUNTRY_NAMES, WITHDRAWAL_DAYS } from "@/lib/shop-info";
import { PrintButton } from "./print-button";

export const metadata: Metadata = {
  title: "KANSLIET (PACKING SLIP)",
  robots: { index: false },
};

type SlipOrder = {
  id: number;
  created_at: string;
  customer_email: string | null;
  shipping_name: string | null;
  shipping_address: {
    line1?: string;
    line2?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  } | null;
};

/**
 * A packing slip to print and put in the parcel: what's inside and how to
 * return it. No prices, since orders can be gifts. The shipping label itself
 * comes from the carrier's own tool.
 */
export default async function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [{ rows: orders }, { rows: items }] = await Promise.all([
    pool.query<SlipOrder>(
      "SELECT id, created_at, customer_email, shipping_name, shipping_address FROM shop_orders WHERE id = $1",
      [id]
    ),
    pool.query<{ name: string | null; quantity: number }>(
      `SELECT p.name, i.quantity FROM shop_order_items i
       LEFT JOIN shop_products p ON p.id = i.shop_product_id
       WHERE i.shop_order_id = $1 ORDER BY i.id`,
      [id]
    ),
  ]);
  const order = orders[0];
  if (!order) notFound();

  const address = order.shipping_address;
  const country = address?.country ?? "";
  const shipTo = [
    order.shipping_name,
    address?.line1,
    address?.line2,
    [address?.postal_code, address?.city].filter(Boolean).join(" "),
    COUNTRY_NAMES[country] ?? country,
  ].filter(Boolean);

  return (
    <div className="bg-background py-10 print:py-0">
      <div className="container-kansliet max-w-2xl">
        <div className="mb-8 flex items-center justify-between print:hidden">
          <Link
            href="/admin/orders"
            className="text-caps text-sm font-light tracking-wider transition-opacity hover:opacity-60"
          >
            ← ORDERS
          </Link>
          <PrintButton />
        </div>

        <article className="border border-foreground p-8 text-sm print:border-0 print:p-0">
          <header className="mb-10 flex items-start justify-between gap-6">
            <div>
              <p className="dossier-label mb-3">PACKING SLIP</p>
              <p className="text-lg tabular-nums">{orderRef(order.id)}</p>
              <p className="font-light opacity-60">
                Ordered {new Date(order.created_at).toISOString().slice(0, 10)}
              </p>
            </div>
            <div className="text-right font-light">
              <p className="font-normal">{COMPANY.legalName}</p>
              {COMPANY.address.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>{COMPANY.email}</p>
            </div>
          </header>

          <section className="mb-10">
            <p className="dossier-label mb-2">SHIP TO</p>
            {shipTo.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </section>

          <section className="mb-10">
            <p className="dossier-label mb-2">CONTENTS</p>
            <table className="w-full text-left">
              <thead className="border-b-brutal">
                <tr>
                  <th className="w-16 py-2 pr-4 font-light uppercase tracking-wider opacity-60">QTY</th>
                  <th className="py-2 font-light uppercase tracking-wider opacity-60">ITEM</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-foreground/15">
                    <td className="py-2 pr-4 tabular-nums">{item.quantity}</td>
                    <td className="py-2">{item.name ?? "Item no longer in catalog"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="text-normal-case font-light">
            <p className="dossier-label mb-2">RETURNS</p>
            <p>
              You can return this order within {WITHDRAWAL_DAYS} days of receiving it. Email{" "}
              {COMPANY.email} with {orderRef(order.id)} first, then send it to the address above.
              Full terms: {COMPANY.website}/terms
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
