# Admin authentication for /shop/orders

## Context

`/shop/orders` (built earlier this session) is currently fully unauthenticated — it has a literal on-page warning ("Internal only — not access-controlled yet") because there's no auth system in the app at all. The user wants signup/login/logout/protected routes, and eventually to link `shop_orders` to logged-in users.

Interviewed the user directly on the four things that actually needed a decision (not the obvious "should routes be protected" — that was already an established blocker):

1. **Auth provider** — chose **Auth.js (NextAuth) on your own Postgres** over Supabase Auth (second cloud service, own pricing, pairs best with Supabase's own DB) and Clerk (proprietary SaaS billed per MAU — the subscription/lock-in pattern avoided all session).
2. **Session strategy** — chose **database sessions** over stateless JWT, for one-command revocation and consistency with how every other table in this app is just Postgres.
3. **Access scope** — chose **admin-only**: just you need to log in, to see `/shop/orders`. Not customer accounts, not mandatory login to buy. This is a much smaller scope than "signup" implies — there is no public registration flow, only one admin account.
4. **Order linking** — chose **nullable `user_id`, set only going forward, no backfill** of the zero existing order rows.

**Then a real conflict surfaced during design, not before:** Auth.js's Credentials provider (the only relevant provider here — no OAuth, one hardcoded admin) is architecturally built around JWT sessions. Combining it with database sessions is Auth.js's own community-documented rough edge ("manual session management", "systemic issues"), not a supported combination. Given the scope is now known to be "one hardcoded admin account, no OAuth, no multi-provider ecosystem" — none of Auth.js's actual value-adds apply. Asked the user how to resolve this; **chose to drop Auth.js entirely and hand-roll it**: a `users` table (one row, you), a `sessions` table, one server action, stdlib crypto. This keeps the database-sessions property they actually wanted, adds zero new dependencies, and matches this repo's established YAGNI doctrine (`stdlib/native before new dependencies`) better than adopting a framework for a single-user login.

## Architecture

Two new tables, one new lib file, one new route, two small edits to existing files. No new npm dependencies — password hashing and session tokens both use Node's built-in `node:crypto`.

### Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,                          -- the opaque token, also the cookie value
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shop_orders ADD COLUMN user_id INTEGER REFERENCES users(id);
```

Be honest about that last line: it adds the column for forward-compatibility per the user's own choice, but **no code path sets it yet** — the only user who can ever log in is the admin, not a customer, so there's no meaningful "logged-in customer" to attach to an order in this scope. Wiring it for real is future work if customer accounts ever get built (explicitly out of scope, same as the original webshop plan said).

### Password hashing — stdlib only, no bcrypt/bcryptjs

```ts
// src/lib/auth.ts
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(":");
  const derived = scryptSync(password, salt, 64);
  return timingSafeEqual(derived, Buffer.from(hashHex, "hex"));
}
```
`scrypt` is a legitimate, standard password-hashing KDF built into Node — no native bindings to install (unlike `bcrypt`), no new dependency to justify (unlike `bcryptjs`). `timingSafeEqual` avoids a timing side-channel on the comparison.

### Sessions — opaque random token, no signing needed

```ts
const token = randomBytes(32).toString("hex"); // 256 bits, unguessable
```
Because this is a database-session lookup key (not a self-contained JWT), there's **no `AUTH_SECRET` env var to manage at all** — one fewer secret than a JWT-based approach would need. Validity is entirely "does this exact token exist in `sessions` and is it unexpired," checked via the existing `pool`.

`src/lib/auth.ts` also exports:
```ts
const SESSION_COOKIE = "session";

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { rows } = await pool.query(
    `SELECT sessions.user_id, users.email FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.id = $1 AND sessions.expires_at > now()`,
    [token]
  );
  return rows[0] ?? null;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
```

`requireSession()` is called in **both** `src/app/shop/orders/page.tsx` (gates the render) **and** inside the `markShipped` server action in `src/app/shop/orders/actions.ts` (gates the mutation directly — a Server Action is independently callable, so guarding only the page it's normally submitted from isn't sufficient; defense in depth, same principle as re-checking `sold_out` server-side in `buyNow` rather than trusting the UI).

### Routes

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | `hashPassword`/`verifyPassword`, `getSession`/`requireSession`, cookie constant |
| `src/app/login/page.tsx` | Plain email+password form (mirrors `projects/page.tsx`'s form styling/error-via-query-param pattern) |
| `src/app/login/actions.ts` | `login(formData)`: verify password, insert a `sessions` row (`expires_at` = now + 30 days), set an `httpOnly`, `sameSite: "lax"`, `secure` (in production) cookie, redirect to `/shop/orders`. `logout()`: delete the `sessions` row by cookie value, clear the cookie, redirect to `/login`. |
| `src/app/shop/orders/page.tsx` (edit) | Add `await requireSession()` at the top; remove the now-inaccurate "not access-controlled yet" warning; add a small logout button/form |
| `src/app/shop/orders/actions.ts` (edit) | Add `await requireSession()` at the top of `markShipped` |
| `CLAUDE.md` (edit) | Document `users`/`sessions` schema and the `shop_orders.user_id` column next to the existing shop schema notes |

**No `/signup` route.** A public registration form is both unneeded (there is exactly one admin: you) and a bigger attack surface than this needs. The one admin user is created via a local one-off script (same pattern already used for `create-test-product.js` this session) — you either run it yourself locally, or tell me the email/password to run it for you. Forgot-password story: rerun the same script to overwrite the row (no email-sending infra needed for a single admin).

## Explicitly out of scope

- Public signup / customer accounts (per the "admin-only" access-scope decision)
- Actually setting `shop_orders.user_id` on checkout (column exists, forward-compatible, unwired — see above)
- Login rate-limiting / brute-force protection on `/login` — fine while this stays a local/private app; **flag as a pre-launch blocker** if this ever gets deployed publicly, same category as the original `/shop/orders` access-control flag
- Password reset via email — rerun the seed script instead
- "Remember me" / multiple concurrent sessions UI, session listing — out of scope, only one session realistically ever exists at a time

## Verification

1. Run the seed script to create the one admin user (`users` row with a scrypt-hashed password).
2. `npm run dev`; visit `/shop/orders` while logged out → redirected to `/login`.
3. Submit wrong credentials at `/login` → error shown, no `sessions` row created, `/shop/orders` still redirects.
4. Submit correct credentials → redirected to `/shop/orders`; confirm a `sessions` row now exists (`SELECT * FROM sessions;` via `psql`/`mcp__postgres`) and a `session` cookie is set (httpOnly, so check via the request, not `document.cookie`).
5. Click "Log out" → `sessions` row for that token is deleted, cookie cleared, `/shop/orders` redirects to `/login` again.
6. Confirm the existing checkout flow (`buyNow`, `/api/shop/webhook`) is unaffected — `shop_orders.user_id` column exists (`\d shop_orders`) and stays `NULL` on a fresh test order, since no code path sets it.
7. `npm run lint` and `npx tsc --noEmit` both pass (per CLAUDE.md's definition of done).
