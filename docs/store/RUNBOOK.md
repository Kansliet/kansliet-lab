# Store runbook

What to do when something goes wrong, and the routine upkeep. Plain steps, in order. See [README.md](README.md) for how the store works.

## Missed order

Use this after a `[WEBHOOK FAILED]` email, or when Stripe shows a payment with no order in `/admin/orders`.

1. Fix the cause. Check the Vercel logs for the error (Hobby keeps logs only briefly, so the email text is the main clue).
2. Stripe dashboard → Developers → Webhooks → the kansliet.co endpoint → find the event → Resend. Events can be resent for 30 days.
3. Older than that: fulfil the order from the Stripe payment details and book the sale by hand in Fortnox.

## EMAIL NOT SENT

The order is recorded, but the customer's confirmation did not go out.

1. Fix the cause if there is one (Resend key, domain).
2. In `/admin/orders`, press RESEND CONFIRMATION beside the badge. The badge goes away when it is sent.
3. If the button fails again, send the confirmation from desk@ by hand, using the `[NEW ORDER]` copy in the desk@ inbox or Stripe's payment page as the source. Include the order number (`KDC-…`).

## [OVERSOLD]

Two customers paid for the last unit.

1. Email the customer who can't be served.
2. Refund the unavailable part in Stripe. A full refund of an unshipped order restores its stock automatically. A partial refund does not, so fix the stock in `/admin/products`.

## Backups

1. **Neon history:** the Free plan keeps **6 hours**. A mistake noticed within 6 hours can be undone from Neon itself (restore the branch to a point in time). Anything older needs a backup.
2. **Weekly backup (automatic):** `.github/workflows/db-backup.yml` dumps Neon `main` every Sunday at 03:00 UTC. It encrypts the dump with GPG (AES-256) and keeps it for 90 days as an artifact of the "Database backup" workflow. The repo is public, so the file is only stored encrypted.
   - **Secrets:** `BACKUP_DATABASE_URL` (Neon `main`, direct connection) and `BACKUP_PASSPHRASE`. **Keep the passphrase in your password manager: without it the backups can't be opened.**
   - **Run one now:** GitHub → Actions → Database backup → Run workflow.
   - **Rotating the database password:** update `BACKUP_DATABASE_URL` too, or the next backup fails. A failed run sends GitHub's failure email to the repo owner.
   - **Inactivity:** GitHub pauses scheduled workflows in a repo with no commits for 60 days. A push, or "Enable workflow" in the Actions tab, turns it back on.
3. **Restore:**
   1. Download the artifact (a `.zip` containing `kansliet-YYYY-MM-DD.dump.gpg`).
   2. Decrypt it: `gpg -d kansliet-YYYY-MM-DD.dump.gpg > kansliet.dump` (asks for the passphrase).
   3. Create a new empty Neon branch, or a new project.
   4. Load the dump: `pg_restore --no-owner --no-privileges -d "<new branch's direct URL>" kansliet.dump`. Use pg_restore 18 or newer, e.g. `docker run --rm -i -v "$PWD:/b" postgres:18-alpine pg_restore --no-owner --no-privileges -d "<url>" /b/kansliet.dump`.
   5. Point Vercel's Production `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` at the new branch, and redeploy.
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
