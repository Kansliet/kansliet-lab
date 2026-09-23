import { pool } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logout } from "@/app/(main)/login/actions";
import { markShipped } from "./actions";
import { Button } from "@/components/shop/Button";
import { PAGE_SHELL, HEADING } from "@/lib/design-tokens";

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

export default async function ShopOrdersPage() {
  await requireSession();
  const orders = await getOrders();

  return (
    <div className={PAGE_SHELL.data}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className={HEADING}>Orders</h1>
        <form action={logout}>
          <Button variant="tertiary" type="submit">
            Log out
          </Button>
        </form>
      </div>

      {orders.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">No orders yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Date</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Customer</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Shipping address</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Amount</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                    <div>{order.shipping_name ?? "—"}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {order.customer_email ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                    {formatAddress(order.shipping_address)}
                  </td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: order.currency.toUpperCase(),
                    }).format(order.amount_total / 100)}
                  </td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                    {order.fulfillment_status}
                  </td>
                  <td className="px-4 py-3">
                    {order.fulfillment_status !== "shipped" && (
                      <form action={markShipped}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="status" value="shipped" />
                        <Button variant="tertiary" type="submit">
                          Mark shipped
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
  );
}
