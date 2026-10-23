-- Optional carrier and tracking number, entered when an order is marked
-- shipped and sent to the customer in the shipped email. Both stay NULL for an
-- order shipped without tracking. Safe to re-run.
ALTER TABLE shop_orders
  ADD COLUMN IF NOT EXISTS carrier text,
  ADD COLUMN IF NOT EXISTS tracking_number text;
