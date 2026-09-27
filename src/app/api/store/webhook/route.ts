import type Stripe from "stripe";
import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { sendCustomerEmail } from "@/lib/mail";
import { buildOrderEmail, orderRef, type OrderEmailInput } from "@/lib/order-email";

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
      currency,
      stripe_payment_intent_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (stripe_checkout_session_id) DO NOTHING
    RETURNING id`,
    [
      session.id,
      session.customer_details?.email ?? null,
      shippingDetails?.name ?? null,
      shippingDetails?.address ? JSON.stringify(shippingDetails.address) : null,
      session.amount_total ?? 0,
      session.currency ?? "usd",
      // Refund events (charge.refunded) refer to the PaymentIntent, not the session.
      typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
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
 * A refund made in the Stripe dashboard (charge.refunded). Records the
 * cumulative refunded amount and when, so the moms report books it in the
 * right month. A full refund marks the order "refunded", and if nothing had
 * shipped yet puts the stock back; for a shipped order the goods are still out
 * there, so stock is left for the admin to restore when they come back.
 * Idempotent: the refunded amount only ever moves forward, so a redelivered
 * or out-of-order event changes nothing.
 */
async function recordRefund(client: PoolClient, charge: Stripe.Charge, refundedAt: number) {
  const paymentIntent =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntent) return;

  type Row = { id: number; fulfillment_status: string; amount_refunded: number };
  let { rows } = await client.query<Row>(
    "SELECT id, fulfillment_status, amount_refunded FROM shop_orders WHERE stripe_payment_intent_id = $1 FOR UPDATE",
    [paymentIntent]
  );
  if (rows.length === 0) {
    // Orders recorded before payment intents were stored: find the session
    // that owns this payment and fill the id in (the UPDATE also locks the row).
    const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent, limit: 1 });
    const sessionId = sessions.data[0]?.id;
    if (!sessionId) return; // not a store payment
    ({ rows } = await client.query<Row>(
      `UPDATE shop_orders SET stripe_payment_intent_id = $1
       WHERE stripe_checkout_session_id = $2
       RETURNING id, fulfillment_status, amount_refunded`,
      [paymentIntent, sessionId]
    ));
    if (rows.length === 0) return;
  }

  const order = rows[0];
  if (charge.amount_refunded <= order.amount_refunded) return; // already recorded

  const fullyRefunded = charge.refunded;
  await client.query(
    `UPDATE shop_orders
     SET amount_refunded = $1,
         refunded_at = to_timestamp($2),
         fulfillment_status = CASE WHEN $3 THEN 'refunded' ELSE fulfillment_status END
     WHERE id = $4`,
    [charge.amount_refunded, refundedAt, fullyRefunded, order.id]
  );
  if (fullyRefunded && order.fulfillment_status === "paid") {
    await client.query(
      `UPDATE shop_products p SET stock = p.stock + i.quantity
       FROM shop_order_items i
       WHERE i.shop_order_id = $1 AND i.shop_product_id = p.id`,
      [order.id]
    );
  }
}

/**
 * Sent after the order is committed, and never allowed to fail the webhook:
 * the event is already marked processed, so a Stripe retry would not resend
 * it anyway. A failure is logged, and desk@'s [NEW ORDER] copy, sent either
 * way, says NOT SENT: the signal to resend by hand.
 */
async function sendOrderConfirmation(order: OrderEmailInput & { to: string }) {
  try {
    await sendCustomerEmail(
      { to: order.to, ...buildOrderEmail(order) },
      { tag: "NEW ORDER", orderRef: order.orderRef },
    );
  } catch (err) {
    console.error(`Order ${order.orderRef}: confirmation email failed`, err);
  }
}

export async function POST(req: Request) {
  // Checked per request, not at module load: Next loads this module during the
  // build, and Preview deployments (which never receive Stripe's webhooks)
  // don't carry the secret. Without it here, fail loudly so Stripe retries.
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("store webhook: STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }

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
      secret
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
      if (event.type === "charge.refunded") {
        await recordRefund(client, event.data.object as Stripe.Charge, event.created);
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
