-- DESTRUCTIVE (audit P2-08). Drops columns nothing reads or writes any more:
-- shop_products' own stock / sold_out / image_url / Stripe ids (all moved to
-- shop_variants on 2026-09-27, or derived), and shop_orders.shop_product_id /
-- user_id (one product per order, and accounts, never used). Their foreign
-- keys and indexes go with them. Re-runnable. Take a Neon snapshot first.
-- Check nothing still uses them before running (see the PR):
--   grep -rnE "shop_products\.(stock|sold_out|image_url|stripe_product_id|stripe_price_id)|o\.(shop_product_id|user_id)" src *.mjs
ALTER TABLE shop_products
  DROP COLUMN IF EXISTS stock,
  DROP COLUMN IF EXISTS sold_out,
  DROP COLUMN IF EXISTS image_url,
  DROP COLUMN IF EXISTS stripe_product_id,
  DROP COLUMN IF EXISTS stripe_price_id;

ALTER TABLE shop_orders
  DROP COLUMN IF EXISTS shop_product_id,
  DROP COLUMN IF EXISTS user_id;
