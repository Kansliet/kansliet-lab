Implement the email work in `docs/store/EMAILS.md`, cards **E-01 to E-05** (E-06 is the owner's review).

Before you start:
- Read `docs/store/EMAILS.md` in full, especially "Design rules for the HTML". The design is **approved**. Match the reference mockup `docs/store/email-previews/order-confirmation.html` closely, but build it from blocks; don't paste the file into code.
- Read `docs/store/README.md` ("How we ship") and the current `src/lib/mail.ts`, `order-email.ts`, `withdrawal-email.ts`, `legal-text.ts` and `shop-info.ts`.
- The Phase 2 PR must already be merged into `main`, because E-04 builds on P2-04's `markShipped` and `shipped_at`. If `main` has no `db/migrations/2026-10-26-order-status.sql`, stop and tell me.

Rules:
- Create the branch `store/emails` from the latest `main` (`git pull` first).
- Do the cards **in this order: E-01, E-02, E-03, E-05, E-04**, one at a time. For each card:
  1. Re-read the card and the files it names. If the code doesn't match the card, or the card is ambiguous, stop and ask me.
  2. Change only what the card describes. No new dependencies (no React Email, MJML or template engines), no refactors outside the card.
  3. Add the tests the card lists.
  4. Run `npm run typecheck`, `npm run lint` and `npm test`. All must pass.
  5. Commit with a message that starts with the card ID (`E-02: …`).
- **The legal content must not shrink.** Every element the order confirmation and the withdrawal acknowledgement contain today (EMAILS.md section 2) must still be in **both** the HTML and the text part. The existing tests for `order-email` and `withdrawal-email` are the guard: change them only to match the new structure, never to drop content.
- **No marketing** in any customer email. No tracking pixels. No images; the wordmark is a text chip.
- Internal emails to desk@ (`[NEW ORDER]`, `[WITHDRAWAL]`, `[OVERSOLD]`, `[WEBHOOK FAILED]`) stay plain text.
- **Migration (E-04):** write `db/migrations/<date>-shipping-tracking.sql` (re-runnable), update `db/schema.sql`, and list it as an owner action. Do NOT run it.
- Never call the live Stripe API, the production database or Resend. Never print secrets.
- Write the rendered HTML of each customer email, from fixed test data, to `docs/store/email-previews/<name>.html` with a small script or test helper, so I can open the previews before merging. Files: `order-confirmation`, `withdrawal-received`, `shipped`, `refund`.

When all cards are done:
1. In `docs/store/EMAILS.md`, mark E-01 to E-05 "done on branch `store/emails`, not merged" and commit that.
2. Push the branch and open ONE pull request into `main` with `gh pr create`. Do not merge.
3. Start the PR body with **"Needs migration"** and the file to run on Neon `main` before merging. Then list:
   - the cards;
   - the four preview files;
   - the owner checklist: open each preview, send test emails to desk@ from a local run, and check Gmail, Apple Mail, Outlook web and dark mode.

Finish with a short summary: each card, its commit hash, the PR link, and every owner action.
