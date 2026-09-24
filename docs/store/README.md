# Store

Webstore at `/store`, with the orders admin at `/admin/orders` (login at `/login`). The Stripe webhook is `/api/store/webhook`. It was built as a standalone app (`kansliet-app`) and moved in here. `SPEC.md` and `CART-SPEC.md` in this folder are the original design notes.

- Stripe (test mode), pure server-redirect Checkout Sessions. There's no `@stripe/stripe-js` (see `src/lib/stripe.ts`).
- Postgres via `pg` (`src/lib/db.ts`). `src/lib/db.ts` throws at import if `DATABASE_URL` is unset, so every environment that builds the site needs it, including Vercel Preview. On Vercel, point `DATABASE_URL` at the provider's **pooled** connection string (e.g. Neon's `-pooler` host), not the direct one: each function instance opens its own pool (capped at 5 there).
- Display prices come from one cached `prices.list` call (5 min, tag `stripe-prices`; see `src/lib/stripe.ts`). A price change in the Stripe dashboard shows on the site within 5 minutes; checkout always charges the live price immediately.
- Env vars: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (see `.env.example`).
- Remote product image hosts must be listed in `images.remotePatterns` in `next.config.ts`.

## Local setup
1. Postgres 17 runs in Docker (container `kansliet-pg`, db `kansliet`). On a fresh database, load the schema: `docker exec -i kansliet-pg psql -U postgres -d kansliet < db/schema.sql`
2. Fill in the store vars in `.env.local`. Locally, `STRIPE_WEBHOOK_SECRET` is the Stripe CLI's signing secret (`stripe listen --print-secret`), not a dashboard endpoint's. Without it the webhook route throws on load and every event gets a 500, so no orders are recorded.
3. Seed a new database: `node seed-store-products.mjs` (creates Stripe test products and prices, plus the DB rows; safe to re-run) and `node seed-admin.mjs` (creates the one admin user).
4. `npm run dev`. For the webhook: `stripe listen --forward-to localhost:3000/api/store/webhook`
5. Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## Deploying (checklist)
**Blockers before taking real money:**
- [ ] **Terms of sale + privacy notice.** EU/Swedish distance-selling rules require purchase terms, the 14-day right of withdrawal, delivery/returns info and a privacy notice (we store customer names, emails and addresses). `/legal` currently covers cookies only. Link the terms from the cart, and set the Terms of Service URL in Stripe Checkout settings.
- [ ] **VAT.** Either VAT-inclusive prices (and say so) or Stripe Tax (`automatic_tax`).
- [ ] **Shipping costs.** Checkout collects an address but charges no shipping. Add Stripe shipping rates, or state "free shipping".
- [ ] **Sizes.** Apparel shows sizes in its specs, but there is no size selector: each size needs its own price/SKU before apparel can be sold.
- [ ] **Stock.** `sold_out` is manual; two buyers can pay for the last item.

**Infrastructure (Vercel):**
1. Hosted Postgres (e.g. Neon via Vercel Marketplace). Load `db/schema.sql`, run `node seed-store-products.mjs` and `node seed-admin.mjs <email>` against it (prompts for a 16+ char password).
2. Env vars for **Production and Preview** (the build evaluates the webhook, DB and Stripe modules, so a missing var fails the build): `DATABASE_URL` (the *pooled* connection string), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Plus the portfolio's `CONTACT_FORM_SECRET` (the contact form refuses submissions on production without it) and `RESEND_*`.
3. Stripe dashboard: add a webhook endpoint `https://kansliet.co/api/store/webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`; its signing secret is the production `STRIPE_WEBHOOK_SECRET`. Test mode and live mode are separate endpoints with separate secrets.
4. Stripe settings: turn on customer receipt emails, and payment notification emails to desk@kansliet.co (the site sends no order emails itself).
5. Vercel Firewall: rate-limit `POST /login` (e.g. 10/min per IP).
6. Before deploying this code, apply `db/migrations/*.sql` in date order to the production database.
7. After deploy: one real test-mode purchase end to end on the preview URL, then switch to live keys. **Switching to live:** every row still points at test-mode Stripe products/prices, which live keys can't see, so run `copy-products-to-live.mjs` once against the production database (dry run first, then `--apply`; usage at the top of the file). It copies each product, price and photo into the live account, is safe to re-run, and leaves stock, copy and orders alone. Then swap `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to live on Vercel and redeploy.

**Managing the catalog:** `/admin/products` (log in first) lists every product with an inline stock stepper for refills (saves apply the change made, +10 / −3, so a sale landing while the page is open isn't overwritten), a "hide from store" toggle per product (hidden products drop out of the grid and 404, but keep orders and Stripe objects), and a form to create or edit a product: copy, specs (`Label: value` per line), price, and photo. Saving creates or updates the Stripe product and price (a new amount makes a new Stripe price and archives the old one), and photos are shrunk in the browser to under 500 KB and uploaded to Stripe Files (`business_logo` purpose, which Stripe caps at 512 KB) as a public `files.stripe.com` link. On a new database, apply `db/migrations/*.sql` in date order after `db/schema.sql`, or load a fresh dump.

**Known gaps (fine for launch):** refunds done in the Stripe dashboard don't update the order status in `/admin/orders`; scripts CSP still allows `'unsafe-inline'` (a nonce-based CSP is the next hardening step).

## Schema
There's no migrations system. `db/schema.sql` is a `pg_dump --schema-only` of the store tables, so re-dump it whenever the schema changes.

- `shop_products`: catalog rows. `slug` is UNIQUE. `category` is plain TEXT (the catalog is too small to justify a categories table) and drives the grid's category nav and `?category=` filter. `stripe_product_id`/`stripe_price_id` point at Stripe, which is the source of truth for the chargeable price: it's always resolved live at checkout and never trusted from a local cache. `stock` (INT, `CHECK >= 0`) is units on hand: set in `/admin/products`, decremented by the webhook in the same transaction as the order insert, and the store treats `stock <= 0` as sold out (`src/lib/products.ts` selects `(stock <= 0) AS sold_out`). Carts are capped at stock, but stock isn't reserved during Checkout, so two buyers can race for the last unit (refund the loser by hand). `hidden` (BOOL) takes a product out of the store without deleting it; `sold_out` as selected is `stock <= 0 OR hidden`. The old stored `sold_out` column is unused, kept until a cleanup drops it (added 2026-09-24, `db/migrations/2026-09-24-product-stock.sql`). `tagline` (TEXT, nullable) is the large one-liner on the product page and the Stripe product description; `description` holds paragraphs separated by a blank line; `specs` (JSONB, default `[]`) is an array of `{label, value}` shown as labelled rows (added 2026-09-24: `ALTER TABLE shop_products ADD COLUMN tagline TEXT, ADD COLUMN specs JSONB NOT NULL DEFAULT '[]'`).
- `shop_orders`: one row per completed Checkout Session, written by the webhook on `checkout.session.completed` (payment_status "paid") or `checkout.session.async_payment_succeeded`. `stripe_checkout_session_id` is UNIQUE (`ON CONFLICT DO NOTHING`), as a backstop alongside `stripe_webhook_events`. `fulfillment_status` is a plain TEXT enum (`paid` | `shipped` | `cancelled`). `shop_product_id` is vestigial, kept for pre-cart rows (see `shop_order_items`). `user_id` is a nullable FK to `users` kept for forward-compatibility; nothing sets it.
- `shop_order_items`: one row per purchased line (product + quantity + price actually paid). This is the source of truth for what was bought. The webhook fills it from `stripe.checkout.sessions.listLineItems` and never from client metadata. `shop_product_id` is nullable (`ON DELETE SET NULL`), so order history survives product deletion.
- `stripe_webhook_events`: idempotency ledger, `id` = Stripe `event.id`. The webhook inserts this row and does its processing in one transaction, so redeliveries are no-ops and a crash rolls back for Stripe to retry.
- `users` / `sessions`: hand-rolled admin auth (see `SPEC.md` for why there's no next-auth). `password_hash` is `scryptSync` output (`salt:hash` hex). `sessions.id` is `SHA-256(token)`, and the raw token lives only in the cookie. Exactly one admin user exists, created by `seed-admin.mjs`, and there's no signup route.
- Cart: a `cart` cookie (`httpOnly`, 30 days) holding `{productId: quantity}` (see `src/lib/cart.ts`). It never stores a price. Price and availability are re-resolved from Stripe/Postgres on render and at checkout.
