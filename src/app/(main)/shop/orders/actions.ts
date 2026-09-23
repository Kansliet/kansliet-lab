"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const VALID_STATUSES = ["paid", "shipped", "cancelled"] as const;

export async function markShipped(formData: FormData) {
  await requireSession();

  const orderId = Number(formData.get("orderId"));
  const status = String(formData.get("status") ?? "");

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return;
  }

  await pool.query("UPDATE shop_orders SET fulfillment_status = $1 WHERE id = $2", [
    status,
    orderId,
  ]);

  revalidatePath("/shop/orders");
}
