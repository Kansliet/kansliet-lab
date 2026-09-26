import { pool } from "@/lib/db";
import { orderRef } from "@/lib/order-email";
import { momsRows, swedishDate, type MomsRow } from "@/lib/moms";

/** An order the report leaves out because it isn't in SEK (listed, so nothing vanishes silently). */
export type OtherCurrencyOrder = { ref: string; date: string; currency: string };

/**
 * Every SEK order as moms rows (a sale, plus a refund row if any), for the
 * moms report and its CSV. Orders in any other currency are returned
 * separately so the report can flag them. Cancelled orders stay in: money was
 * taken unless it was refunded, and refunds come through as their own rows.
 */
export async function loadMomsRows(): Promise<{ rows: MomsRow[]; otherCurrency: OtherCurrencyOrder[] }> {
  const { rows } = await pool.query<{
    id: number;
    created_at: Date;
    country: string | null;
    amount_total: number;
    amount_refunded: number;
    refunded_at: Date | null;
    items_total: string;
    currency: string;
  }>(
    `SELECT o.id, o.created_at, o.shipping_address->>'country' AS country, o.currency,
            o.amount_total, o.amount_refunded, o.refunded_at,
            COALESCE(SUM(i.unit_amount * i.quantity), 0) AS items_total
     FROM shop_orders o
     LEFT JOIN shop_order_items i ON i.shop_order_id = o.id
     GROUP BY o.id
     ORDER BY o.id`
  );
  const sek = rows.filter((r) => r.currency === "sek");
  const otherCurrency = rows
    .filter((r) => r.currency !== "sek")
    .map((r) => ({ ref: orderRef(r.id), date: swedishDate(new Date(r.created_at)), currency: r.currency.toUpperCase() }));
  const sekRows = momsRows(
    sek.map((r) => ({
      ref: orderRef(r.id),
      createdAt: new Date(r.created_at),
      country: r.country,
      amountTotal: r.amount_total,
      itemsTotal: Number(r.items_total),
      amountRefunded: r.amount_refunded,
      refundedAt: r.refunded_at ? new Date(r.refunded_at) : null,
    }))
  );
  return { rows: sekRows, otherCurrency };
}

/** This month in Swedish time, as a period id ("2026-09"). */
export function currentMonth(): string {
  return swedishDate(new Date()).slice(0, 7);
}
