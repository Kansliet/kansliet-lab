"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { sendCustomerEmail } from "@/lib/mail";
import { buildOrderEmail } from "@/lib/order-email";
import { orderEmailFromSession } from "@/lib/order-confirmation";

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

  revalidatePath("/admin/orders");
}

/** Sends the order confirmation again, built from Stripe's session, for an order marked EMAIL NOT SENT. */
export async function resendConfirmation(formData: FormData) {
  await requireSession();

  const orderId = Number(formData.get("orderId"));
  if (!Number.isInteger(orderId)) return;

  const { rows } = await pool.query<{ id: number; stripe_checkout_session_id: string }>(
    "SELECT id, stripe_checkout_session_id FROM shop_orders WHERE id = $1",
    [orderId]
  );
  const order = rows[0];
  if (!order) return;

  const session = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
  if (lineItems.has_more) throw new Error(`Session ${session.id}: more than 100 line items`);

  const email = orderEmailFromSession(session, lineItems.data, order.id);
  if (!email) return;

  try {
    await sendCustomerEmail(
      { to: email.to, ...buildOrderEmail(email) },
      { tag: "NEW ORDER", orderRef: email.orderRef }
    );
    await pool.query("UPDATE shop_orders SET confirmation_sent_at = now() WHERE id = $1", [order.id]);
  } catch (err) {
    // The badge stays, so the button can be pressed again once the cause is fixed.
    console.error(`Order ${email.orderRef}: resending the confirmation failed`, err);
  }

  revalidatePath("/admin/orders");
}
