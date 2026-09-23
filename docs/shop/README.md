# Shop

Webshop at `/shop`, with the orders admin at `/shop/orders` (login at `/login`). The Stripe webhook is `/api/shop/webhook`. It was built as a standalone app (`kansliet-app`) and moved in here. `SPEC.md` and `CART-SPEC.md` in this folder are the original design notes.

- Stripe (test mode), pure server-redirect Checkout Sessions. There's no `@stripe/stripe-js` (see `src/lib/stripe.ts`).
- Postgres via `pg` (`src/lib/db.ts`). `src/lib/db.ts` throws at import if `DATABASE_URL` is unset, so every environment that builds the site needs it, including Vercel Preview.
- Env vars: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (see `.env.example`).
- Remote product image hosts must be listed in `images.remotePatterns` in `next.config.ts`.

## Local setup
1. Postgres 17 runs in Docker (container `kansliet-pg`, db `kansliet`). On a fresh database, load the schema: `docker exec -i kansliet-pg psql -U postgres -d kansliet < db/schema.sql`
2. Fill in the shop vars in `.env.local`. Locally, `STRIPE_WEBHOOK_SECRET` is the Stripe CLI's signing secret (`stripe listen --print-secret`), not a dashboard endpoint's. Without it the webhook route throws on load and every event gets a 500, so no orders are recorded.
3. Seed a new database: `node seed-shop-products.mjs` (creates Stripe test products and prices, plus the DB rows; safe to re-run) and `node seed-admin.mjs` (creates the one admin user).
4. `npm run dev`. For the webhook: `stripe listen --forward-to localhost:3000/api/shop/webhook`
5. Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## Schema
There's no migrations system. `db/schema.sql` is a `pg_dump --schema-only` of the shop tables, so re-dump it whenever the schema changes.

- `shop_products`: catalog rows. `slug` is UNIQUE. `category` is plain TEXT (the catalog is too small to justify a categories table) and drives the grid's category nav and `?category=` filter. `stripe_product_id`/`stripe_price_id` point at Stripe, which is the source of truth for the chargeable price: it's always resolved live at checkout and never trusted from a local cache. `sold_out` is flipped by hand and not derived from any stock system.
- `shop_orders`: one row per completed Checkout Session, written by the webhook on `checkout.session.completed` (payment_status "paid") or `checkout.session.async_payment_succeeded`. `stripe_checkout_session_id` is UNIQUE (`ON CONFLICT DO NOTHING`), as a backstop alongside `stripe_webhook_events`. `fulfillment_status` is a plain TEXT enum (`paid` | `shipped` | `cancelled`). `shop_product_id` is vestigial, kept for pre-cart rows (see `shop_order_items`). `user_id` is a nullable FK to `users` kept for forward-compatibility; nothing sets it.
- `shop_order_items`: one row per purchased line (product + quantity + price actually paid). This is the source of truth for what was bought. The webhook fills it from `stripe.checkout.sessions.listLineItems` and never from client metadata. `shop_product_id` is nullable (`ON DELETE SET NULL`), so order history survives product deletion.
- `stripe_webhook_events`: idempotency ledger, `id` = Stripe `event.id`. The webhook inserts this row and does its processing in one transaction, so redeliveries are no-ops and a crash rolls back for Stripe to retry.
- `users` / `sessions`: hand-rolled admin auth (see `SPEC.md` for why there's no next-auth). `password_hash` is `scryptSync` output (`salt:hash` hex). `sessions.id` is `SHA-256(token)`, and the raw token lives only in the cookie. Exactly one admin user exists, created by `seed-admin.mjs`, and there's no signup route.
- Cart: a `cart` cookie (`httpOnly`, 30 days) holding `{productId: quantity}` (see `src/lib/cart.ts`). It never stores a price. Price and availability are re-resolved from Stripe/Postgres on render and at checkout.
