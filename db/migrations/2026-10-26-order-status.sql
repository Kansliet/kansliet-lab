-- Tighter order status. shipped_at records when an order was marked shipped, so
-- "was it shipped?" survives a later 'refunded' status (a full refund restocks
-- only orders that never shipped). The CHECK keeps cancelled in the list so it
-- cannot fail on old data; check beforehand with
--   SELECT DISTINCT fulfillment_status FROM shop_orders;
ALTER TABLE shop_orders
  ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone;

-- Orders already marked shipped: the moment they shipped wasn't recorded, so
-- use the order date (only whether it shipped matters for restocking). A re-run
-- also catches orders marked shipped by the old code between the first run and
-- the deploy.
UPDATE shop_orders SET shipped_at = created_at
  WHERE fulfillment_status = 'shipped' AND shipped_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shop_orders_status_check') THEN
    ALTER TABLE shop_orders ADD CONSTRAINT shop_orders_status_check
      CHECK (fulfillment_status IN ('paid', 'shipped', 'refunded', 'cancelled'));
  END IF;
END
$$;
