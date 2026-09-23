# Shopping cart — multiple items, quantities, before checkout

## Context

The shop currently only supports a single-item "buy now" flow (`src/app/shop/[slug]/actions.ts`): one product, quantity 1, straight to a Stripe Checkout Session. The user wants to add multiple items with quantities to a cart before checking out.

Interviewed the user directly on the open questions (storage, buy-now's fate, cart-clearing timing, quantity limits) before proposing anything. All four came back on the recommended option:

1. **Cart storage** — chose a **cookie-only cart** over a `cart_items` DB table. A plain cookie holding `{productId: quantity}` needs no new table, is stdlib-only, and matches this repo's YAGNI doctrine. The cart never stores a price — only `{productId, quantity}` — because CLAUDE.md already establishes that Stripe price is the source of truth, "always resolved live via Stripe at checkout, never trusted from a local cache." That rule extends naturally to the cart: price is re-resolved from Stripe every time the cart renders and again when checkout `line_items` are built, so a stale or tampered cookie can never produce a wrong charge.
2. **Buy-now's fate** — chose **keep it exactly as-is, cart is additive**. `buyNow` keeps bypassing the cart entirely; the cart is a new parallel path for people who want more than one item. Two independent checkout code paths, but zero risk to the existing flow.
3. **Cart clearing** — chose **clear on success-page load**, not webhook-driven. A cookie-only cart can't be cleared by the webhook (webhooks have no access to the browser's cookies), so the cart is cleared when the customer's browser lands on `/shop/success` after Stripe redirects them back.
4. **Quantity limits** — chose **no limit**. The shop has no real inventory/stock-count today — `sold_out` is a manually-flipped boolean, not a count — so quantity stays uncapped for in-stock items, same as the status quo. Adding real inventory tracking was explicitly floated and explicitly declined; it's a materially bigger feature than a cart.

**A fact discovered during research, not a question that needed asking:** `shop_orders` has a *singular* `shop_product_id` column — the schema assumes one product per order. This has to change regardless of how the cart itself is stored, since an order can now contain multiple products. See Schema below.

## Architecture

### Cart cookie

- Name: `cart`. Value: JSON, e.g. `{"3":2,"7":1}` — product id (string key) → quantity.
- `httpOnly: true` (nothing needs to read it from client JS — all cart rendering is server-side RSC), `sameSite: "lax"`, `secure` in production, `maxAge` 30 days (same lifetime convention as the existing session cookie in `src/lib/auth.ts`).
- Not signed. Same reasoning `SPEC.md` already uses for the session token needing no signing secret: the cookie is never trusted as a source of price or availability, only of *intent* ("customer wants 2 of product 3"). Every quantity and price is re-validated server-side against `shop_products` and live Stripe data before a charge is ever created, so a tampered cookie can't produce an incorrect order — at worst it names a product id that gets filtered out.
- `src/lib/cart.ts`: `getCart()` (read + parse, `[]` on missing/invalid JSON — this is a boundary, so it's defensive) and the `CartItem` type. Cookie *writes* only happen inside Server Actions (Next.js restriction — an RSC page can't set cookies during render), so all mutation lives in `src/app/shop/cart/actions.ts`.

### Routes

| File | Purpose |
|---|---|
| `src/lib/cart.ts` | `CartItem` type, `getCart()` cookie reader, cookie name constant |
| `src/app/shop/cart/actions.ts` | `addToCart`, `updateQuantity`, `removeFromCart`, `clearCart`, `checkoutCart` server actions |
| `src/app/shop/cart/page.tsx` | Cart page: line items (image, name, live-resolved price, quantity input, remove), subtotal/total, "Checkout" button |
| `src/app/shop/[slug]/page.tsx` (edit) | Add an "Add to cart" form (quantity input, default 1, no max) alongside the existing unchanged "Buy now" button |
| `src/app/shop/page.tsx` (edit) | Add a small "Cart (N)" link — computed by reading the cart cookie in that page's own server component, no new shared header needed |
| `src/app/shop/success/page.tsx` (edit) | Render `<ClearCartOnMount />` |
| `src/app/shop/success/clear-cart-on-mount.tsx` (new) | Tiny `"use client"` component — `useEffect` fires the `clearCart` server action once on mount. This is the only client component the feature needs, and only because Next.js won't let a Server Component write cookies during render |
| `src/app/api/shop/webhook/route.ts` (edit) | Generalize `recordOrder` — see below |
| `CLAUDE.md` (edit) | Document `shop_order_items`, the `cart` cookie, and that `shop_orders.shop_product_id` is now vestigial |

### Checkout — building multi-item `line_items`

`checkoutCart` (in `src/app/shop/cart/actions.ts`):

1. Read the cart cookie. Empty → redirect to `/shop/cart`.
2. Load the matching `shop_products` rows in one query (`WHERE id = ANY($1)`).
3. Validate every line: product still exists, not `sold_out`. **If any line fails, don't create a Checkout Session at all** — redirect back to `/shop/cart?error=...` naming the problem item. This mirrors `buyNow`'s existing behavior for a single sold-out item exactly (defense in depth, not new policy), and avoids the worse alternative of silently charging for fewer items than the customer saw.
4. Build `line_items = items.map(item => ({ price: product.stripe_price_id, quantity: item.quantity }))` — real Stripe price ids, quantities from the cart. No `price_data`, no ad hoc pricing.
5. Create the Checkout Session: same `shipping_address_collection`, same `integration_identifier` as `buyNow`. `success_url` → `/shop/success?session_id={CHECKOUT_SESSION_ID}`, `cancel_url` → `/shop/cart` (so an abandoned/failed checkout lands back on the still-intact cart, per decision #3 above). **No `metadata` needed for product ids** — the webhook reads the actual purchased line items straight off the Checkout Session via `stripe.checkout.sessions.listLineItems`, which is more robust than re-deriving them from hand-rolled metadata.
6. Redirect to `session.url`. The cart cookie is **not** cleared here — that happens on the success page.

### Webhook — generalizing `recordOrder`

Today `recordOrder` inserts one `shop_orders` row per session and stops. It becomes:

1. Insert the `shop_orders` row as today, but **stop passing `shop_product_id`** — it's meaningless once an order can span products. Use `... ON CONFLICT (stripe_checkout_session_id) DO NOTHING RETURNING id`. If no row comes back (a redelivered/duplicate event, the existing belt-and-suspenders case), skip step 2 entirely — the items were already inserted on the original delivery.
2. If a row *was* inserted: call `stripe.checkout.sessions.listLineItems(session.id, { expand: ["data.price"] })` to get what was actually purchased (works identically whether the session came from `checkoutCart` or the unchanged `buyNow` — `buyNow` already sends a one-item `line_items` array, so this generalization is transparent to it).
3. For each returned line item, look up the internal `shop_products.id` by `stripe_price_id` and insert a `shop_order_items` row (`shop_order_id`, `shop_product_id` — nullable, `quantity`, `unit_amount`, `currency`). A line item whose price no longer matches any current product (e.g. deleted from the catalog after purchase) still gets a row, just with a null product link — the historical amount/quantity isn't lost.
4. This all happens inside the same DB transaction as today. The extra Stripe API call (`listLineItems`) sits *before* any writes, so if it fails, the transaction rolls back exactly like any other failure here — Stripe retries the webhook later. Same safety property already documented in CLAUDE.md, just extended to cover one more failure point.

`buyNow` itself needs **no code changes** — it already produces a proper single-item `line_items` array; the webhook generalization handles it automatically.

### Schema

```sql
CREATE TABLE shop_order_items (
  id SERIAL PRIMARY KEY,
  shop_order_id INTEGER NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  shop_product_id INTEGER REFERENCES shop_products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_amount INTEGER NOT NULL,   -- price actually paid per unit, captured at order time — a historical snapshot, same reasoning as shop_orders.amount_total already being captured rather than re-derived
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Be honest about `shop_orders.shop_product_id`, same as `SPEC.md` was about `shop_orders.user_id`: it stays in the table for existing rows, but no code path sets it going forward. `shop_order_items` becomes the single source of truth for what was purchased, for both `buyNow` and cart-checkout orders alike.

## Explicitly out of scope

- **`/shop/orders` (admin) showing purchased line items.** Real gap once multi-item orders exist — but it didn't show product info for single-item orders either, so this isn't a regression this feature introduces. Flagged as an obvious near-term follow-up, not built now.
- **Real inventory/stock-count tracking.** Explicitly declined in the interview. `sold_out` stays the only stock signal, unlimited quantity for anything not sold out.
- **"Quick add to cart" from the `/shop` grid.** Add-to-cart only lives on the product detail page. The grid's cards are already full-card `<Link>`s; nesting an interactive add-to-cart form inside an anchor is invalid HTML and would mean restructuring the grid cards — not justified by this feature.
- **Persisted/cross-device cart.** Cookie-only, per the chosen storage option. Clearing cookies or switching devices loses the cart.
- **Authoritative webhook-side cart clearing.** Not possible with a cookie-only cart. Accepted tradeoff of "clear on success-page load."
- **Abandoned-cart cleanup/expiry job.** No cron/TTL. The cookie simply expires client-side after 30 days.

## Verification

1. Add two different products to the cart with different quantities; confirm the cart page shows correct live-resolved per-line price and a correct subtotal/total.
2. Remove one item, change the quantity on another; confirm the cart persists across a page reload (cookie survives navigation).
3. Checkout with 2+ items in cart (Stripe test mode) → confirm the Checkout Session shows both line items with correct quantities and prices.
4. Complete a test payment → confirm the webhook produces one `shop_orders` row and the matching number of `shop_order_items` rows, with quantities/amounts matching what was in the cart (`SELECT * FROM shop_order_items WHERE shop_order_id = ...`).
5. After landing on `/shop/success`, revisit `/shop/cart` → confirm it's empty.
6. Add an in-stock product to cart, then flip it to `sold_out` directly in the DB, then attempt checkout → confirm it's blocked with an error, no Checkout Session is created, and the item is still in the cart (so it can be removed).
7. Confirm `buyNow` still works completely unchanged, and that its resulting order also produces exactly one `shop_order_items` row (quantity 1) via the generalized webhook.
8. `npm run lint` and `npx tsc --noEmit` both pass.
