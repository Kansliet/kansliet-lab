import type { Metadata } from "next";
import { pool } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { formatPrice } from "@/lib/stripe";
import { logout } from "@/app/(main)/login/actions";
import { markShipped } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "KANSLIET (ORDERS)",
  robots: { index: false },
};

type Order = {
  id: number;
  stripe_checkout_session_id: string;
  customer_email: string | null;
  shipping_name: string | null;
  shipping_address: {
    line1?: string;
    line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  } | null;
  amount_total: number;
  currency: string;
  fulfillment_status: string;
  created_at: string;
};

async function getOrders(): Promise<Order[]> {
  const { rows } = await pool.query<Order>(
    "SELECT id, stripe_checkout_session_id, customer_email, shipping_name, shipping_address, amount_total, currency, fulfillment_status, created_at FROM shop_orders ORDER BY created_at DESC"
  );
  return rows;
}

function formatAddress(address: Order["shipping_address"]): string {
  if (!address) return "—";
  return [address.line1, address.line2, address.city, address.postal_code, address.country]
    .filter(Boolean)
    .join(", ");
}

function formatDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

// Plain uppercase, not .text-caps: its display: inline-block breaks table cell layout.
const TH = "px-4 py-3 text-sm font-light uppercase tracking-wider opacity-60";

export default async function StoreOrdersPage() {
  await requireSession();
  const orders = await getOrders();

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet">
          <div className="mb-12 flex items-baseline justify-between gap-6">
            <h1 className="dossier-label">ORDERS</h1>
            <form action={logout}>
              <Button type="submit" variant="ghost" className="px-0 py-0">
                LOG OUT
              </Button>
            </form>
          </div>

          {orders.length === 0 ? (
            <div className="border-brutal p-10 text-center">
              <p className="text-caps text-sm font-light tracking-wider opacity-60">
                NO ORDERS YET.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-brutal">
              <table className="w-full text-left text-sm">
                <thead className="border-b-brutal">
                  <tr>
                    <th className={TH}>DATE</th>
                    <th className={TH}>CUSTOMER</th>
                    <th className={TH}>SHIPPING ADDRESS</th>
                    <th className={TH}>AMOUNT</th>
                    <th className={TH}>STATUS</th>
                    <th className={TH}>
                      <span className="sr-only">ACTIONS</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr key={order.id} className={index > 0 ? "border-t-brutal" : ""}>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div>{order.shipping_name ?? "—"}</div>
                        <div className="font-light opacity-60">
                          {order.customer_email ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-light">
                        {formatAddress(order.shipping_address)}
                      </td>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                        {formatPrice(order.amount_total / 100, order.currency.toUpperCase())}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={order.fulfillment_status === "paid" ? "solid" : "default"}>
                          {order.fulfillment_status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {order.fulfillment_status === "paid" && (
                          <form action={markShipped}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="status" value="shipped" />
                            <Button type="submit" variant="secondary" size="sm" className="whitespace-nowrap">
                              MARK SHIPPED
                            </Button>
                          </form>
                        )}
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
