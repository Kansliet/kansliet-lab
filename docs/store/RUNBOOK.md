# Store runbook

What to do when something goes wrong, and the routine upkeep. Plain steps, in order. See [README.md](README.md) for how the store works.

## Missed order

Use this after a `[WEBHOOK FAILED]` email, or when Stripe shows a payment with no order in `/admin/orders`.

1. Fix the cause. Check the Vercel logs for the error (Hobby keeps logs only briefly, so the email text is the main clue).
2. Stripe dashboard → Developers → Webhooks → the kansliet.co endpoint → find the event → Resend. Events can be resent for 30 days.
3. Older than that: fulfil the order from the Stripe payment details and book the sale by hand in Fortnox.

## EMAIL NOT SENT

The order is recorded, but the customer's confirmation did not go out.

1. Send the confirmation from desk@. Use the `[NEW ORDER]` copy in the desk@ inbox, or Stripe's payment page, as the source.
2. Include the order number (`KDC-…`).

## [OVERSOLD]

Two customers paid for the last unit.

1. Email the customer who can't be served.
2. Refund the unavailable part in Stripe. A full refund of an unshipped order restores its stock automatically. A partial refund does not, so fix the stock in `/admin/products`.

## Backups

1. Note the Neon plan's point-in-time restore window here: ______ days. (Open question Q5; fill it in.)
2. On the 1st of each month, run `pg_dump "$DATABASE_URL_UNPOOLED" --no-owner -Fc -f kansliet-YYYY-MM.dump` from a local machine and store the file encrypted off-site.
3. Restore = a new Neon branch from a point in time, or `pg_restore` into a new branch, then swap `DATABASE_URL` in Vercel.
4. Keep the original product photos outside Stripe. The site only has the Stripe Files links.

## Rotating keys

| Variable | Where to roll it | Then |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe → API keys → roll | Vercel env → redeploy |
| `STRIPE_WEBHOOK_SECRET` | Stripe → endpoint → roll secret, choosing an overlap period | Update Vercel → redeploy within the overlap |
| `RESEND_API_KEY` | Resend | Vercel env → redeploy |
| `CONTACT_FORM_SECRET` | Any new random value | Open forms fail for up to 6 h |
| `DATABASE_URL` | Neon → reset password | Update Production env → redeploy |

## Admin login

1. Confirm the Vercel Firewall rule for `POST /login` exists. Firewall rate limits are not on the Hobby plan, so set the rule up when moving to Pro.
2. To reset the password, re-run `node seed-admin.mjs`.

## Stripe API version

The site pins `apiVersion` in `src/lib/stripe.ts`. The live webhook endpoint is on `2025-12-15.clover`, which is new enough (shipping addresses are present). Leave the endpoint alone; move it to the pinned version only in a planned Stripe upgrade, together with a bump of `apiVersion`, then place one test order.
