import type Stripe from "stripe";
import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { Resend } from "resend";
import { stripe } from "@/lib/stripe";
import { COMPANY } from "@/lib/shop-info";
import { buildOrderEmail, orderRef, type OrderEmailInput } from "@/lib/order-email";

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}

// shop_orders.shop_product_id is no longer set — it assumed one product per
// order, which a multi-item cart breaks. shop_order_items (one row per
// purchased line) is now the source of truth for what was bought, for both
// buyNow's single-item sessions and cart checkouts alike.
/** Returns what the confirmation email needs, or null for an already-recorded session. */
async function recordOrder(
  client: PoolClient,
  session: Stripe.Checkout.Session
): Promise<(OrderEmailInput & { to: string }) | null> {
  const shippingDetails = session.collected_information?.shipping_details;

  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO shop_orders (
      stripe_checkout_session_id,
      customer_email,
      shipping_name,
      shipping_address,
      amount_total,
      currency
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (stripe_checkout_session_id) DO NOTHING
    RETURNING id`,
    [
      session.id,
      session.customer_details?.email ?? null,
      shippingDetails?.name ?? null,
      shippingDetails?.address ? JSON.stringify(shippingDetails.address) : null,
      session.amount_total ?? 0,
      session.currency ?? "usd",
    ]
  );

  const orderId = rows[0]?.id;
  if (!orderId) {
    // Redelivered event for a session we've already recorded — the items
    // were already inserted the first time, so there's nothing more to do.
    return null;
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price"],
  });

  const priceIds = lineItems.data
    .map((line) => line.price?.id)
    .filter((id): id is string => Boolean(id));

  const { rows: products } = priceIds.length
    ? await client.query<{ id: number; stripe_price_id: string }>(
        "SELECT id, stripe_price_id FROM shop_products WHERE stripe_price_id = ANY($1)",
        [priceIds]
      )
    : { rows: [] as { id: number; stripe_price_id: string }[] };
  const productIdByPriceId = new Map(products.map((p) => [p.stripe_price_id, p.id]));

  for (const line of lineItems.data) {
    const priceId = line.price?.id;
    const productId = priceId ? (productIdByPriceId.get(priceId) ?? null) : null;
    await client.query(
      `INSERT INTO shop_order_items (shop_order_id, shop_product_id, quantity, unit_amount, currency)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        orderId,
        productId,
        line.quantity ?? 0,
        line.price?.unit_amount ?? 0,
        session.currency ?? "usd",
      ]
    );

    // Same transaction as the order insert and the event-id marker, so a
    // redelivered event can't decrement twice. Clamped at 0: two buyers can
    // race for the last unit (stock is checked at checkout, not reserved);
    // the loser is refunded by hand rather than the row going negative.
    if (productId !== null) {
      await client.query(
        "UPDATE shop_products SET stock = GREATEST(stock - $1, 0) WHERE id = $2",
        [line.quantity ?? 0, productId]
      );
    }
  }

  const email = session.customer_details?.email;
  if (!email) return null;
  return {
    to: email,
    orderRef: orderRef(orderId),
    date: new Date(session.created * 1000),
    lines: lineItems.data.map((line) => ({
      name: line.description ?? "Item",
      quantity: line.quantity ?? 0,
      amountCents: line.amount_total,
    })),
    shippingCents: session.shipping_cost?.amount_total ?? 0,
    totalCents: session.amount_total ?? 0,
    // Adaptive Pricing: amount_total stays in SEK; what the customer actually
    // paid in their own currency is in presentment_details.
    charged:
      session.presentment_details &&
      session.presentment_details.presentment_currency !== session.currency
        ? {
            amountCents: session.presentment_details.presentment_amount,
            currency: session.presentment_details.presentment_currency,
          }
        : null,
    shippingName: shippingDetails?.name ?? null,
    shippingAddress: shippingDetails?.address ?? null,
  };
}

/**
 * Sent after the order is committed, and never allowed to fail the webhook:
 * the event is already marked processed, so a Stripe retry would not resend
 * it anyway. A failure is logged; desk@ is BCC'd on every confirmation, so a
 * missing copy there is the signal to resend by hand.
 */
async function sendOrderConfirmation(order: OrderEmailInput & { to: string }) {
  if (!process.env.RESEND_API_KEY?.trim()) {
    console.error(`Order ${order.orderRef}: RESEND_API_KEY not set, confirmation not sent`);
    return;
  }
  try {
    const { subject, text } = buildOrderEmail(order);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Kansliet <onboarding@resend.dev>",
      to: order.to,
      bcc: COMPANY.email,
      replyTo: COMPANY.email,
      subject,
      text,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error(`Order ${order.orderRef}: confirmation email failed`, err);
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotency: mark this Stripe event id as seen and do the actual
  // processing in the SAME transaction. If anything below throws, the whole
  // transaction rolls back — including the "seen" marker — so Stripe's retry
  // will see the event as unprocessed and try again. Without this, a crash
  // between "mark seen" and "do the work" would silently drop the order,
  // since Stripe never redelivers an event we've already returned 200 for.
  let confirmation: Awaited<ReturnType<typeof recordOrder>> = null;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rowCount } = await client.query(
      "INSERT INTO stripe_webhook_events (id, type) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
      [event.id, event.type]
    );
    const alreadyProcessed = rowCount === 0;

    if (!alreadyProcessed) {
      // Card payments settle immediately and land here with payment_status
      // "paid". Some payment methods (bank debits/redirects) are
      // asynchronous: this event can fire before money has actually moved,
      // so only record the order once payment_status confirms it. The async
      // case is confirmed later via checkout.session.async_payment_succeeded.
      if (
        event.type === "checkout.session.completed" &&
        (event.data.object as Stripe.Checkout.Session).payment_status === "paid"
      ) {
        confirmation = await recordOrder(client, event.data.object as Stripe.Checkout.Session);
      }

      if (event.type === "checkout.session.async_payment_succeeded") {
        confirmation = await recordOrder(client, event.data.object as Stripe.Checkout.Session);
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  if (confirmation) await sendOrderConfirmation(confirmation);

  return new Response(null, { status: 200 });
}
