-- Real stock counts replace the hand-set sold_out flag. A product is sold out
-- when stock hits 0 (src/lib/products.ts derives sold_out from it); paid
-- orders decrement it in the Stripe webhook. The old sold_out column stays
-- until a later cleanup, but nothing reads it anymore.
-- Apply: docker exec -i kansliet-pg psql -U postgres -d kansliet < db/migrations/2026-09-24-product-stock.sql

ALTER TABLE shop_products
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0);

-- Starting point only; real numbers are set in /admin/products.
UPDATE shop_products SET stock = CASE WHEN sold_out THEN 0 ELSE 10 END;
