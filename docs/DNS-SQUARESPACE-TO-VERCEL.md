# DNS: Squarespace → Vercel (before cancelling Framer)

Do the DNS change **first**, confirm kansliet.co loads from Vercel, **then** cancel Framer. That way there’s no gap.

---

## 1. In Vercel (get the targets)

1. Open your project on [vercel.com](https://vercel.com).
2. Go to **Settings → Domains**.
3. Add **kansliet.co** (and **www.kansliet.co** if you use www).
4. Vercel will show **“Configure DNS”** with the exact records you need. Note:
   - **Apex (kansliet.co):** usually an **A** record → **76.76.21.21** (or the IP Vercel shows).
   - **www:** usually a **CNAME** → **cname.vercel-dns.com** (or the host Vercel shows).

Keep this tab open; you’ll match these in Squarespace.

---

## 2. In Squarespace (where your domain DNS is)

Where is kansliet.co actually managed?

- **Domain registered with Squarespace** (bought through Squarespace): use **Squarespace Domains**.
- **Domain registered elsewhere** but DNS was pointed to Framer: you might be using **Squarespace DNS** or your **registrar’s DNS**. Adjust the steps to where your DNS really lives.

### If DNS is in Squarespace (Domains or connected domain)

1. Log in to [Squarespace](https://www.squarespace.com) → **Settings** (or **Website** / **Domains**).
2. Open **Domains** and select **kansliet.co**.
3. Go to **DNS Settings** (or **Advanced Settings** → **DNS**).
4. You’ll see existing records (some may point to Framer). You need to **point the domain to Vercel** instead.

**For the root domain (kansliet.co):**

- Find any **A** records that point to Framer (or other hosts). **Edit** them or **Delete** and add new:
  - **Type:** A  
  - **Host:** `@` (or “apex” / leave blank—Squarespace wording varies)  
  - **Value / Data:** `76.76.21.21` (use the IP Vercel shows in step 1)

**For www (www.kansliet.co):**

- Find any **CNAME** for `www` that points to Framer. **Edit** it or **Delete** and add new:
  - **Type:** CNAME  
  - **Host:** `www`  
  - **Value / Points to:** `cname.vercel-dns.com` (use the host Vercel shows in step 1)

5. Remove or leave any other records (e.g. MX for email) as they are—only change what’s needed for the **website** (A and CNAME above).
6. **Save** DNS.

---

## 3. Wait and verify

- DNS can take **5–60 minutes** (sometimes up to 24–48 hours).
- In Vercel → **Settings → Domains**, the domain should change to **Valid** when DNS is correct.
- Open **https://kansliet.co** in a private/incognito window and confirm you see the **Vercel** (Next.js) site, not Framer.

---

## 4. Then cancel Framer

- Once kansliet.co loads from Vercel and stays that way, cancel the Framer subscription.
- No need to change DNS again; it’s already pointing at Vercel.

---

## Quick checklist

- [ ] Domain **kansliet.co** (and www) added in Vercel → **Settings → Domains**
- [ ] In Squarespace DNS: **A** for `@` → **76.76.21.21**
- [ ] In Squarespace DNS: **CNAME** for `www` → **cname.vercel-dns.com**
- [ ] Saved DNS in Squarespace
- [ ] Waited for propagation; Vercel shows domain **Valid**
- [ ] Checked https://kansliet.co in browser → Vercel site loads
- [ ] Then cancelled Framer

---

## If the domain is not on Squarespace

If kansliet.co was **registered with another registrar** (e.g. GoDaddy, Namecheap, Loopia, one.com):

- Log in at **that** registrar and open **DNS** / **Name servers** for kansliet.co.
- Do the same: set **A** for `@` to **76.76.21.21** and **CNAME** for `www` to **cname.vercel-dns.com** (or whatever Vercel shows).
- Remove or update any A/CNAME that pointed to Framer.

If you’re unsure where DNS is: run `nslookup kansliet.co` or use [whatsmydns.net](https://www.whatsmydns.net) and see which nameservers are listed; that tells you who controls DNS.
