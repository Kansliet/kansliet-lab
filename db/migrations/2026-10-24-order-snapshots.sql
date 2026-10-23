-- What an order looked like when it was placed, kept on the order itself:
-- the terms version the customer accepted, whether the confirmation email
-- went out (NULL = not sent, send it by hand), and each line's name as
-- Stripe Checkout showed it ("Desk Tray — Sand / M").
ALTER TABLE shop_orders
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamp with time zone;
ALTER TABLE shop_order_items
  ADD COLUMN IF NOT EXISTS item_name text;

-- Orders recorded before this change (terms_version was never stored then):
-- their confirmations went out as desk@'s [NEW ORDER] copies show; count them
-- as sent. New orders always get terms_version, so a re-run never touches them.
UPDATE shop_orders SET confirmation_sent_at = created_at
  WHERE confirmation_sent_at IS NULL AND terms_version IS NULL AND customer_email IS NOT NULL;

-- Past lines: the best name available now.
UPDATE shop_order_items i
  SET item_name = p.name || COALESCE(' — ' || i.variant_label, '')
  FROM shop_products p
  WHERE i.item_name IS NULL AND p.id = i.shop_product_id;
