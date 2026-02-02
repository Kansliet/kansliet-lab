# DNS changes for kansliet.co (Squarespace → Vercel)

From your current DNS table, here’s what to change and what to leave.

---

## Change these (so the main site points to Vercel)

### 1. Root domain — A records for `@`

**Current:** Two A records for `@` with:
- `31.43.160.6`
- `31.43.161.6`

**Do this:**
- **Delete** both of those A records.
- **Add one** new A record:
  - **HOST:** `@`
  - **TYPE:** `A`
  - **DATA:** `76.76.21.21`

That points kansliet.co (no www) to Vercel.

---

### 2. www — CNAME for `www`

**Current:** CNAME for `www` → `sites.framer.app` (Framer).

**Do this:**
- **Edit** that CNAME record (or delete and add new):
  - **HOST:** `www`
  - **TYPE:** `CNAME`
  - **DATA:** `cname.vercel-dns.com`

So www.kansliet.co goes to Vercel instead of Framer.

---

## Do not change these (email and other services)

| HOST            | TYPE | Keep? | Why |
|-----------------|------|------|-----|
| `@`             | TXT  | Yes  | OpenAI verification |
| `@`             | TXT  | Yes  | SPF for Google (email) |
| `_dmarc`        | TXT  | Yes  | DMARC (email security) |
| `resend._domainkey` | TXT | Yes  | Resend DKIM (contact form email) |
| `google._domainkey` | TXT | Yes  | Google DKIM (email) |
| `send`          | MX   | Yes  | Mail for send.kansliet.co |
| `send`          | TXT  | Yes  | SPF for send subdomain |
| **`store`**     | CNAME| Yes  | Already points to Vercel (for future Shopify) |

Leave all of these exactly as they are.

---

## Summary

| Action   | HOST | TYPE | DATA (new value)     |
|----------|------|------|----------------------|
| Replace  | `@`  | A    | `76.76.21.21`        |
| Edit     | `www`| CNAME| `cname.vercel-dns.com`|

After saving:
1. Wait 5–60 minutes (sometimes up to 24h).
2. In Vercel → Settings → Domains, check that kansliet.co and www.kansliet.co show **Valid**.
3. Open https://kansliet.co and https://www.kansliet.co and confirm you see the Vercel (Next.js) site.
4. Then you can cancel Framer.
