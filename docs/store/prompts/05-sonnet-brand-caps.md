Make the brand name **always uppercase**: `KANSLIET`, `KANSLIET (STORE)`, `KANSLIET (DESIGN COMPANY)`, `KANSLIET STUDIO AB` and any other `KANSLIET (…)` form. This is the owner's rule, with **no exceptions** in anything a person can read: page text, headings, page titles and meta descriptions, Open Graph and JSON-LD names, alt text and aria-labels, email sender names, subjects and bodies, newsletter text, form placeholders, error messages, project descriptions in `src/data/projects.ts`, and the prose in `README.md` and `docs/`.

Start only when the email PR (`store/emails`) is merged into `main`. If `docs/store/EMAILS.md` still lists E-01 to E-05 as "not merged", stop and tell me.

## What changes and what doesn't
**Change** (examples found on 2026-10-23; find them all with a case-sensitive search for `Kansliet`):
- `src/lib/mail.ts`: the sender `Kansliet Store <store@kansliet.co>` becomes `KANSLIET (STORE) <store@kansliet.co>` (the README already documents that name), and update `src/lib/mail.test.ts` to match.
- `src/lib/shop-info.ts`: `tradingName: "Kansliet"` becomes `"KANSLIET"`. Check every place that uses `tradingName`, for example email subjects like "… — KANSLIET".
- `src/app/(main)/contact/actions.ts`: the fallback sender `Kansliet Form` becomes `KANSLIET (FORM)`.
- `src/app/layout.tsx`: metadata `authors`, `creator`, `siteName`, the OG image alt `Kansliet Design Company` (becomes `KANSLIET (DESIGN COMPANY)`), and the JSON-LD `name` / `alternateName`.
- JSON-LD `brand` / `creator` names in the product page and the works page.
- The visible text in `home-view.tsx` (sr-only h1), `studio/page.tsx`, `terms/page.tsx`, `privacy`, `legal`, `contact`, `store/withdraw`, `newsletter/confirm`, `cart/checkout-panel.tsx`, `src/lib/newsletter.ts`, and `src/data/projects.ts` (including possessives: `Kansliet's` becomes `KANSLIET'S`).
- `axis-nav.tsx`: `aria-label="Kansliet, home"` becomes `"KANSLIET, home"`.
- `seed-store-products.mjs`, `README.md` and the docs prose.
- Any lowercase `kansliet` used **as a name in prose** (e.g. "the kansliet store").

**Do not change** (these are not the brand name in text, and changing them breaks things):
- The domain and URLs: `kansliet.co`, `https://kansliet.co/...`, `SITE_URL`.
- Email addresses: `desk@kansliet.co`, `store@kansliet.co`.
- Code identifiers, file and folder names, the package name `kansliet-lab`, CSS classes, CSS variables, cache keys, env var names, slugs, `integration_identifier` values, test IDs, Git/GitHub names (`Kansliet/kansliet-lab`).
- Third-party names that only contain the word, and anything inside `node_modules` or `.next`.
- Historical audit text that quotes earlier output, e.g. an old email subject in `docs/store/AUDIT-2026-10.md`. Leave quoted strings as they were.

## Guard test
Add `src/lib/brand-caps.test.ts`:
- It reads every file under `src/` (`.ts`, `.tsx`, `.mjs`, `.css`, `.json`), plus `seed-store-products.mjs`.
- It fails if any of them contains `Kansliet` with that exact casing (capital K, lowercase rest), and the failure message lists file and line.
- The test file itself is exempt, by checking its own path.
- The domain, email addresses and identifiers are all lowercase `kansliet`, so they don't trigger it. Don't try to police lowercase `kansliet` automatically; review those by hand in the step above.

## Rules
- Create the branch `brand/kansliet-caps` from the latest `main` (`git pull` first).
- Change only the casing of the brand name. Do not reword sentences, and do not touch layout or styling. If uppercasing reads badly in a sentence, still uppercase it, and list the spot in your summary so I can reword it later.
- Run `npm run typecheck`, `npm run lint` and `npm test`. All must pass. Update tests that assert the old casing.
- Regenerate the email previews in `docs/store/email-previews/` if the email work added a script for that.
- Commit in two parts: `brand: KANSLIET in caps in code and UI` (src, seed, tests) and `brand: KANSLIET in caps in docs` (README, docs).
- Push the branch and open ONE pull request into `main` with `gh pr create`. Do not merge. No migration.
- Never call live Stripe, the production database or Resend.

## Outside the code (list these for me; you can't change them)
These are set in dashboards, not in the repo. Check and list them in your summary as owner actions:
- Stripe → Settings → Business details: the public business name (Checkout already shows `KANSLIET (DESIGN COMPANY)`).
- Stripe product names and descriptions: they come from the admin. List any product whose name or tagline in the database or seed contains `Kansliet`, so I can re-save it in `/admin/products`.
- Resend: the newsletter or audience sender name, if one is set there.
- Google Workspace: the display name of desk@ and store@.
- The OG image `public/og-image.jpg`, if it contains the word in mixed case.

Finish with a short summary:
- the number of occurrences changed and the files touched;
- any sentence that now reads oddly;
- the PR link;
- the owner actions list above.
