-- Hidden products drop out of the store (grid, product page, prev/next) but
-- keep their row, order history and Stripe objects; toggled in the admin
-- edit form. A hidden product in someone's cart counts as unavailable.
-- Apply: docker exec -i kansliet-pg psql -U postgres -d kansliet < db/migrations/2026-09-24-product-hidden.sql

ALTER TABLE shop_products
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;
