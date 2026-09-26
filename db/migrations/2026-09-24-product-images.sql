-- Several photos per product. images is an ordered JSON array of URLs; the
-- first is the cover (grid, cart, Stripe Checkout). src/lib/products.ts
-- selects image_url as images->>0, so the old image_url column is no longer
-- read or written; it stays until a cleanup drops it.
-- Apply: docker exec -i kansliet-pg psql -U postgres -d kansliet < db/migrations/2026-09-24-product-images.sql

ALTER TABLE shop_products
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE shop_products
  SET images = jsonb_build_array(image_url)
  WHERE image_url IS NOT NULL AND images = '[]'::jsonb;
