"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { sendCustomerEmail } from "@/lib/mail";
import { buildOrderEmail, orderRef } from "@/lib/order-email";
import { buildShippedEmail, parseShippingInput } from "@/lib/shipped-email";
import { orderEmailFromSession } from "@/lib/order-confirmation";

/** The order's lines, named as on the packing slip. */
async function orderItems(orderId: number): Promise<{ name: string; quantity: number }[]> {
  const { rows } = await pool.query<{ name: string; quantity: number }>(
    `SELECT i.quantity,
            COALESCE(i.item_name, p.name || COALESCE(' — ' || i.variant_label, ''), 'Item') AS name
     FROM shop_order_items i
     LEFT JOIN shop_products p ON p.id = i.shop_product_id
     WHERE i.shop_order_id = $1 ORDER BY i.id`,
    [orderId]
  );
  return rows;
}

export async function markShipped(formData: FormData) {
  await requireSession();

  const orderId = Number(formData.get("orderId"));
  if (!Number.isInteger(orderId)) return;
  const { carrier, trackingNumber } = parseShippingInput(
    formData.get("carrier"),
    formData.get("trackingNumber")
  );

  // Only a paid order ships: a stale form can't mark a refunded one shipped.
  // RETURNING is empty when nothing changed (a double click, an order that was
  // refunded meanwhile), and then no email goes out.
  const { rows } = await pool.query<{ customer_email: string | null; shipped_at: Date }>(
    `UPDATE shop_orders
     SET fulfillment_status = 'shipped', shipped_at = now(), carrier = $2, tracking_number = $3
     WHERE id = $1 AND fulfillment_status = 'paid'
     RETURNING customer_email, shipped_at`,
    [orderId, carrier, trackingNumber]
  );
  revalidatePath("/admin/orders");

  const shipped = rows[0];
  if (!shipped?.customer_email) return;

  // A failed email is logged and shown, never undoes the shipped mark.
  const ref = orderRef(orderId);
  try {
    await sendCustomerEmail(
      {
        to: shipped.customer_email,
        ...buildShippedEmail({
          orderRef: ref,
          shippedAt: shipped.shipped_at,
          items: await orderItems(orderId),
          carrier,
          trackingNumber,
        }),
      },
      { tag: "SHIPPED", orderRef: ref }
    );
  } catch (err) {
    console.error(`Order ${ref}: shipped email failed`, err);
    redirect(`/admin/orders?shipEmail=failed&order=${ref}`);
  }
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
