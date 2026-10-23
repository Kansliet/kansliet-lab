-- Product options (colour × size). A variant is the sellable unit: it has the
-- stock and the Stripe product/price, one per combination. A product without
-- options has exactly one "default" variant (option1 and option2 NULL), so the
-- cart, checkout and webhook only ever deal with variants.
--
-- shop_products.stock and shop_products.stripe_price_id are no longer read or
-- written after this; they stay until a cleanup drops them.

CREATE TABLE IF NOT EXISTS shop_variants (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  -- The first option's value (Colour), or NULL for the default variant.
  option1 text,
  -- The second option's value (Size), or NULL.
  option2 text,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  -- One Stripe product + price per variant, so Checkout shows "Name — Sand / M"
  -- and a paid price maps back to exactly one variant.
  stripe_product_id text NOT NULL,
  stripe_price_id text NOT NULL UNIQUE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  -- NULLS NOT DISTINCT: a product can have only one default variant.
  CONSTRAINT shop_variants_options_key UNIQUE NULLS NOT DISTINCT (product_id, option1, option2)
);

CREATE INDEX IF NOT EXISTS shop_variants_product_key ON shop_variants (product_id);

-- [{ "name": "Colour", "values": [{ "value": "Sand", "images": [...] }] },
--  { "name": "Size", "values": [{ "value": "S" }] }]
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS options jsonb NOT NULL DEFAULT '[]';

-- New products keep their Stripe ids on their variants only.
ALTER TABLE shop_products
  ALTER COLUMN stripe_product_id DROP NOT NULL,
  ALTER COLUMN stripe_price_id DROP NOT NULL;

-- Every existing product becomes a product with one default variant. Only
-- products without variants yet, so a re-run skips products created since
-- (their Stripe ids live on their variants; the product row's are NULL).
INSERT INTO shop_variants (product_id, stock, stripe_product_id, stripe_price_id)
SELECT p.id, p.stock, p.stripe_product_id, p.stripe_price_id FROM shop_products p
WHERE p.stripe_price_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM shop_variants v WHERE v.product_id = p.id)
ON CONFLICT DO NOTHING;

ALTER TABLE shop_order_items
  ADD COLUMN IF NOT EXISTS shop_variant_id integer REFERENCES shop_variants(id) ON DELETE SET NULL,
  -- Snapshot of the options bought ("Sand / M"), so history survives later edits.
  ADD COLUMN IF NOT EXISTS variant_label text;

UPDATE shop_order_items i SET shop_variant_id = v.id
FROM shop_variants v
WHERE i.shop_variant_id IS NULL AND v.product_id = i.shop_product_id
  AND v.option1 IS NULL AND v.option2 IS NULL;
