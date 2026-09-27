import type { Metadata } from "next";
import { pool } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { formatPrice } from "@/lib/stripe";
import { markShipped } from "./actions";
import { AdminNav } from "../admin-nav";
import Link from "next/link";
import { orderRef } from "@/lib/order-email";
import { formatStockholmTime } from "@/lib/withdrawal-email";
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
  amount_refunded: number;
  currency: string;
  fulfillment_status: string;
  created_at: string;
  withdrawn_at: string | null;
};

type Withdrawal = {
  id: number;
  shop_order_id: number | null;
  order_ref: string;
  name: string;
  email: string;
  created_at: Date;
  acknowledged_at: Date | null;
};

async function getOrders(): Promise<Order[]> {
  const { rows } = await pool.query<Order>(
    `SELECT o.id, o.stripe_checkout_session_id, o.customer_email, o.shipping_name, o.shipping_address,
            o.amount_total, o.amount_refunded, o.currency, o.fulfillment_status, o.created_at,
            (SELECT min(w.created_at) FROM shop_withdrawals w WHERE w.shop_order_id = o.id) AS withdrawn_at
     FROM shop_orders o ORDER BY o.created_at DESC`
  );
  return rows;
}

async function getWithdrawals(): Promise<Withdrawal[]> {
  const { rows } = await pool.query<Withdrawal>(
    "SELECT id, shop_order_id, order_ref, name, email, created_at, acknowledged_at FROM shop_withdrawals ORDER BY created_at DESC"
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
  const [orders, withdrawals] = await Promise.all([getOrders(), getWithdrawals()]);

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet">
          <AdminNav active="ORDERS" />

          {withdrawals.length > 0 && (
            <div className="mb-12">
              <h2 className="dossier-label mb-4">WITHDRAWALS</h2>
              <div className="overflow-x-auto border-brutal">
                <table className="w-full text-left text-sm">
                  <thead className="border-b-brutal">
                    <tr>
                      <th className={TH}>RECEIVED</th>
                      <th className={TH}>ORDER</th>
                      <th className={TH}>CUSTOMER</th>
                      <th className={TH}>RECEIPT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w, index) => (
                      <tr key={w.id} className={index > 0 ? "border-t-brutal" : ""}>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                          {formatStockholmTime(w.created_at)}
                        </td>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                          <div>{w.order_ref}</div>
                          {/* Order number and email didn't both match an order: find it by hand. */}
                          {w.shop_order_id === null && (
                            <div className="font-light opacity-60">NO MATCH</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>{w.name}</div>
                          <div className="font-light opacity-60">{w.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          {w.acknowledged_at ? (
                            <Badge>SENT</Badge>
                          ) : (
                            <Badge variant="solid">NOT SENT, EMAIL BY HAND</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                    <th className={TH}>ORDER</th>
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
                        <div>{orderRef(order.id)}</div>
                        <div className="font-light opacity-60">{formatDate(order.created_at)}</div>
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
                        {order.amount_refunded > 0 && (
                          <div className="font-light opacity-60">
                            −{formatPrice(order.amount_refunded / 100, order.currency.toUpperCase())} REFUNDED
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={order.fulfillment_status === "paid" ? "solid" : "default"}>
                          {order.fulfillment_status.toUpperCase()}
                        </Badge>
                        {order.withdrawn_at && (
                          <div className="mt-1 font-light whitespace-nowrap opacity-60">
                            WITHDRAWN {formatDate(order.withdrawn_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`/admin/orders/${order.id}/slip`}
                            className="text-caps text-sm font-light tracking-wider whitespace-nowrap transition-opacity hover:opacity-60"
                          >
                            SLIP
                          </Link>
                          {order.fulfillment_status === "paid" && (
                            <form action={markShipped}>
                              <input type="hidden" name="orderId" value={order.id} />
                              <input type="hidden" name="status" value="shipped" />
                              <Button type="submit" variant="secondary" size="sm" className="whitespace-nowrap">
                                MARK SHIPPED
                              </Button>
                            </form>
                          )}
                        </div>
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
