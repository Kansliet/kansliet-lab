Implement **Phase 2** of `docs/store/AUDIT-2026-10.md`: cards P2-01 to P2-07. **Skip P2-08** (the DESTRUCTIVE cleanup): it gets its own branch and PR later.

Read first: the **Status** block at the top of the audit, `docs/store/README.md` ("How we ship") and `docs/store/RUNBOOK.md`. The code has moved since the audit was written:
- Phase 1 is live (PR #16).
- `getPrice` in `src/lib/stripe.ts` now returns `Price | null` (PR #17). Line numbers in the cards are therefore approximate. Re-read each file and go by the code, not the line numbers.

Rules:
- Create the branch `store/plateau-1-phase-2` from the latest `main` (`git pull` first).
- Work through the cards **in order (P2-01 … P2-07)**, one at a time. For each card:
  1. Re-read the card and the files it names. If the code no longer matches the card, or the card is ambiguous, stop and ask me instead of guessing.
  2. Make only the changes the card describes. No unrelated refactors, renames, formatting sweeps or dependency upgrades.
  3. Add or update the tests the card lists.
  4. Run `npm run typecheck`, `npm run lint` and `npm test`. All must pass.
  5. Commit with a message that starts with the task ID (e.g. `P2-03: …`).
- **Migrations (P2-01, P2-04):**
  - Write them as re-runnable SQL files in `db/migrations/` and hand-edit `db/schema.sql` to match.
  - Do NOT run them anywhere.
  - List them under the card's "Owner actions" in the audit.
- **P2-01 touches the moms (VAT) report.** Keep the old and new output identical for orders with a single refund, and prove it with a test.
- Never call the live Stripe API, the production database or Resend. Never print secrets. Ignore Vercel previews; they are switched off.
- When all cards are done:
  1. In the audit's Status block, set the Phase 2 row to "Done on branch `store/plateau-1-phase-2`, not merged".
  2. Commit that change.
  3. Push the branch and open ONE pull request into `main` with `gh pr create`. Do not merge it.
  4. In the PR body, start with **"Needs migration"** and the exact files to run on Neon production before merging, then the list of tasks and tests.

Finish with a short summary:
- each task ID, what changed, and its commit hash;
- the PR link;
- every owner action I must do by hand (migrations to run in Neon `main` before merging, things to check on the live site after).
