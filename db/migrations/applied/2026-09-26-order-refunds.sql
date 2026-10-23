-- Refunds: Stripe refunds were invisible to the site (orders stayed "paid",
-- stock wasn't restored, and the moms report would overcount). The webhook
-- now handles charge.refunded, which refers to the PaymentIntent, so orders
-- keep its id too.
ALTER TABLE shop_orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  -- Cumulative refunded amount in öre (Stripe's charge.amount_refunded).
  ADD COLUMN IF NOT EXISTS amount_refunded integer NOT NULL DEFAULT 0,
  -- When the latest refund happened: the moms report books refunds in that month.
  ADD COLUMN IF NOT EXISTS refunded_at timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS shop_orders_payment_intent_key
  ON shop_orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
