Implement the action plan in `docs/store/AUDIT-2026-10.md`, **Phase 1 only**, unless I name other tasks.

Rules:
- Before starting, create a branch `store/plateau-1` from `main`. Never push and never merge; I review first.
- Work through the Phase 1 task cards in order, one at a time. For each task:
  1. Re-read the card and the files it names. If the code no longer matches what the card describes, or the card is ambiguous, stop and ask me instead of guessing.
  2. Make only the changes the card describes. No unrelated refactors, renames, formatting sweeps or dependency upgrades.
  3. Add or update the tests the card lists.
  4. Run `npm run typecheck`, `npm run lint` and `npm test`. All must pass.
  5. Commit with a message that starts with the task ID (e.g. `S-03: …`).
- If a card needs a database migration or a new environment variable, write the SQL/variable into the card's section of `docs/store/AUDIT-2026-10.md` under "Owner actions" and do NOT run it against any real database.
- Never call the live Stripe API, the production database or Resend. Never print secrets.
- Skip anything listed under "Explicitly not recommended" or "Open questions for the owner".

When Phase 1 is done, give me a short summary: each task ID, what changed, the commit hash, and every owner action I must do by hand (migrations to run in Neon, env vars to set in Vercel, things to test on the live site).
