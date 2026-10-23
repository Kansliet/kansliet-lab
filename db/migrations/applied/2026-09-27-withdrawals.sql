-- Withdrawals: notices sent through the online withdrawal function at
-- /store/withdraw (EU directive 2023/2673, the "ångerknapp"). Every notice is
-- kept, matched to an order or not: the customer has withdrawn once they've
-- sent it, whether or not what they typed finds the order.
CREATE TABLE IF NOT EXISTS shop_withdrawals (
  id serial PRIMARY KEY,
  -- Set when the order number and email match an order; NULL means look it up by hand.
  shop_order_id integer REFERENCES shop_orders(id) ON DELETE SET NULL,
  -- As the customer typed it.
  order_ref text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  -- When the acknowledgement email went out; NULL means it failed, send one by hand.
  acknowledged_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS shop_withdrawals_order_key ON shop_withdrawals (shop_order_id);
