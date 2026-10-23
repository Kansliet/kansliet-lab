-- Refund ledger: one row per Stripe refund, dated when it happened, so the moms
-- report books each partial refund in its own month. shop_orders keeps the
-- cumulative amount_refunded / refunded_at (the admin list uses them).
-- `amount` is in the order's own currency (öre for a SEK order).
CREATE TABLE IF NOT EXISTS shop_refunds (
  id serial PRIMARY KEY,
  shop_order_id integer NOT NULL REFERENCES shop_orders(id),
  stripe_refund_id text NOT NULL UNIQUE,
  amount integer NOT NULL,
  created_at timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS shop_refunds_order_key ON shop_refunds (shop_order_id);

-- Refunds recorded before the ledger existed: one 'legacy-<order id>' row per
-- order, from the cumulative amount and the date of the latest refund. The
-- webhook replaces it with the real Stripe refunds when the order's next refund
-- arrives. Safe to re-run, also right after the deploy: it refreshes a legacy
-- row (a refund recorded by the old code in between) and skips any order that
-- already has real Stripe refund rows.
INSERT INTO shop_refunds (shop_order_id, stripe_refund_id, amount, created_at)
SELECT o.id, 'legacy-' || o.id, o.amount_refunded, COALESCE(o.refunded_at, o.created_at)
FROM shop_orders o
WHERE o.amount_refunded > 0
  AND NOT EXISTS (
    SELECT 1 FROM shop_refunds r
    WHERE r.shop_order_id = o.id AND r.stripe_refund_id NOT LIKE 'legacy-%'
  )
ON CONFLICT (stripe_refund_id) DO UPDATE
  SET amount = EXCLUDED.amount, created_at = EXCLUDED.created_at;
