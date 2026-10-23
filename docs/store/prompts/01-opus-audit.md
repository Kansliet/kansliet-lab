You are auditing the STORE of this repository (kansliet-lab, kansliet.co). Be a strict, objective senior reviewer: no flattery, no hedging, no invented problems. Every claim must be backed by evidence from the code (file:line) or by a check you actually ran. If you are unsure, label it SUSPECTED and say what would confirm it.

## Goal: "Plateau 1"
The owner (a one-person design studio) wants to be sure the store will run **20–30 products (with variants) reliably for at least 3 years** with minimal maintenance, before any bigger scaling. Judge everything against that target, not against Shopify-scale. Recommending infrastructure the plateau does not need (queues, Redis, microservices, a CMS, a new framework, moving off Vercel) is a failure unless you prove it is necessary.

## Context
- Next.js 16 (App Router, server actions, Turbopack), React 19, TypeScript, deployed on Vercel (fra1), Node 24.
- Postgres on Neon via `pg` (`src/lib/db.ts`, pooled URL, pool max 5 per function instance).
- Stripe Checkout (`src/lib/stripe.ts`, `src/app/(main)/store/(shop)/cart/actions.ts`), webhook at `src/app/api/store/webhook/route.ts`.
- Email via Resend (`src/lib/mail.ts`, `order-email.ts`, `withdrawal-email.ts`).
- Swedish shop in SEK: moms/VAT reporting (`src/lib/moms*.ts`, `/admin/moms`), right of withdrawal (`/store/withdraw`), terms/privacy.
- Admin: `src/app/(main)/admin/**` (products, photos, variants/options, orders, packing slips, moms CSV), auth in `src/lib/auth.ts`.
- Schema: `db/schema.sql`. Seeds: `seed-store-products.mjs`, `seed-admin.mjs`. Preview DB script: `prepare-preview-db.mjs`.

## Read first
`AGENTS.md`, `docs/store/README.md`, `docs/store/SPEC.md`, `docs/store/CART-SPEC.md`, `db/schema.sql`. `AUDIT.md` at the root is an older whole-site audit (Feb 2025); treat it as possibly stale and verify before repeating anything from it. Then read every file under `src/app/(main)/store`, `src/app/(main)/admin`, `src/app/api/store`, `src/components/store`, and the store-related files in `src/lib` (cart, cart-limits, products, variants, stripe, db, auth, mail, order-email, withdrawal-email, moms, moms-data, shop-info, legal-text, store-flag, cache-scope, product-form, form-token, error-codes) plus their tests.

## Hard rules
- **Read-only.** Do not edit, create or delete any file except the single report file below. Do not commit, push, install or upgrade packages.
- Never call the live Stripe API, the production database, Resend or any other external service. Never print or copy secrets from env files.
- You may run `npm test`, `npm run typecheck` and `npm run lint`. If they fail for environment reasons (e.g. native binaries installed on Windows while you run in WSL), say so and continue; do not try to fix the environment.
- Quantify where you can (e.g. expected rows after 3 years at N orders/week, queries per page view, images per product, bytes per page).

## What to audit
1. **Money flow correctness**: prices and totals computed server-side only; shipping and VAT math; rounding; currency; what happens on async payments, failed payments, expired sessions, partial and full refunds; webhook signature check, idempotency (`stripe_webhook_events`), transactionality, retries, out-of-order events; order state machine.
2. **Stock and concurrency**: can two buyers oversell the last item? Are stock reservations or decrements race-safe? What happens to stock on expiry/refund/withdrawal?
3. **Data model fit for 20–30 products over 3 years**: tables, constraints, foreign keys, unique slugs, indexes vs the actual queries, nullable columns that should not be, soft-delete/archiving of products that have past orders, variant/option design, migrations story (is there one?).
4. **Performance at plateau size**: N+1 queries, unbounded queries (admin orders list after 3 years, moms CSV), caching/revalidation choices, image sizes and delivery, cold starts, Neon connection usage under the pool settings, function durations.
5. **Admin usability for one person managing 30 products**: creating/editing products, variants, photos, reordering, stock edits, order handling, packing slips; anything slow, error-prone or confusing.
6. **Security**: admin authentication and authorization on every admin route, server action and route handler; session handling; CSRF/origin on server actions; input validation; file upload handling; rate limiting on checkout, withdrawal and login; information leaks in errors; webhook endpoint hardening.
7. **Legal/compliance basics for a Swedish/EU web shop** as implemented in code: withdrawal flow, order confirmation content, VAT reporting data, terms acceptance record. Flag gaps; do not give legal advice beyond pointing at what the code does or misses.
8. **Reliability and operations**: what alerts the owner when something breaks (failed webhook, failed email, failed checkout)? Logging, error reporting, backups/restore path for Neon, how to recover a missed order, how to rotate keys.
9. **3-year maintenance burden**: dependency surface, Stripe API version pinning, Next.js upgrade exposure, dead code, duplicated logic, test coverage of the critical paths (checkout, webhook, refunds, stock, moms).
10. **Convoluted or weird**: anything over-engineered, duplicated, surprising, inconsistent naming, logic spread across too many places, clever code a future maintainer (or a smaller model) would trip on. Say what the simpler version is.

Also state explicitly **what is good and should NOT be changed**, so the follow-up implementation does not churn it.

## Output
Write ONE file: `docs/store/AUDIT-2026-10.md`, structured as:

1. **Verdict** (5 lines max): is it ready for Plateau 1? Yes / Yes with fixes / No, and the top 3 reasons.
2. **Plateau readiness scorecard**: table of the 10 areas above, each rated Solid / Needs work / At risk, one-line reason.
3. **Findings**: table with ID (S-01…), area, severity (Critical / High / Medium / Low), VERIFIED or SUSPECTED, evidence (file:line), impact at plateau scale, fix in one line.
4. **Convoluted / weird list**: each item with location, why it is a problem, the simpler alternative.
5. **Keep as is**: what is well built.
6. **Action plan** in phases: Phase 1 (must fix before relying on it), Phase 2 (should fix within months), Phase 3 (nice to have before Plateau 2). Every task is a self-contained card written for a less capable implementation model:
   - Task ID and title, linked finding IDs
   - Exact files to touch
   - What to change, step by step, with no ambiguity
   - Acceptance criteria and the tests to add or update
   - Risk, how to verify on Vercel, and whether it needs a DB migration or env change
   - Size: S / M / L
7. **Explicitly not recommended**: tempting changes you considered and rejected for this plateau, with why.
8. **Open questions for the owner**: business decisions the code cannot answer (e.g. expected order volume, shipping zones, whether stock is shared between variants).

When the report is written, print the Verdict and the Phase 1 task list in the terminal and stop.
