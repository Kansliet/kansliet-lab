# Deployment readiness & Shopify (store.kansliet.co)

**Senior-dev view:** Is the site healthy, snappy, and ready to deploy? What’s left? What about adding a Shopify store on a subdomain?

---

## 1. Is it ready to deploy?

**Yes.** The site is in good shape for production:

- Next.js 16, React 19, TypeScript strict, App Router
- Server/client split is correct (home = server shell + client islands)
- Metadata, sitemap, robots, skip link, basic a11y
- Contact: server action, env check, input limits, email validation
- GA only when `NEXT_PUBLIC_GA_ID` is set; security headers added (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- All project image paths resolve; reduced motion respected on home
- `.env.example` added for deployment

You can deploy as-is. The items below are **improvements**, not blockers.

---

## 2. Snappiness & industry standards — done vs optional

### Already in place

| Area | Status |
|------|--------|
| **Images** | Next/Image, AVIF/WebP, `sizes`, lazy load; hero logo `priority` |
| **Fonts** | `next/font` (Martian Mono), no FOUT |
| **Compression** | `compress: true` in Next config |
| **Security** | `poweredByHeader: false`, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| **SEO** | metadataBase, per-page metadata, sitemap, robots |
| **A11y** | Skip link, ARIA on menu, `rel="noopener noreferrer"` on external links, reduced motion |

### Optional improvements (when you have time)

| What | Why |
|------|-----|
| **Cookie consent → GA** | Load GA only after “Accept” so you’re clearly compliant with consent expectations. |
| **`public/og-image.jpg`** | Add 1200×630 so social previews don’t fall back to a missing image. |
| **Rate limit contact form** | Per IP or per session to reduce abuse; simple with Vercel Edge or a small API. |
| **Lighthouse / CI** | Run Lighthouse in CI (e.g. on PRs) to guard LCP, CLS, FID and catch regressions. |
| **Blur placeholders** | Optional: `placeholder="blur"` on project cards for a smoother feel. |

None of these are required for a “healthy, snappy, industry-standard” launch; they’re the next level of polish.

---

## 3. Shopify: store.kansliet.co — recommendation

**Use the subdomain.** `store.kansliet.co` is a solid, standard approach.

### Why subdomain works well

1. **Separation of concerns**  
   - kansliet.co = brand, portfolio, contact (this Next.js app).  
   - store.kansliet.co = Shopify (checkout, cart, inventory, payments).  
   No need to mix e‑commerce into this codebase.

2. **Shopify supports it natively**  
   You add the custom domain in Shopify (e.g. store.kansliet.co), point DNS (CNAME to Shopify), and they handle SSL and routing. No code changes on this site for the subdomain itself.

3. **Performance**  
   Main site stays light and fast; heavy e‑commerce runs on Shopify’s infra.

4. **Maintenance**  
   Updates to the store (products, themes, apps) happen in Shopify; this repo stays focused on the main site.

### What to do when you add the store

1. **DNS**  
   Create a CNAME: `store` → Shopify’s host (e.g. `shops.myshopify.com` or whatever Shopify gives you).

2. **Shopify**  
   In Shopify admin, add the custom domain `store.kansliet.co` and follow their verification steps.

3. **Navigation**  
   Add a “SHOP” or “STORE” link in the header (and optionally footer) that goes to `https://store.kansliet.co`. No subdomain logic needed in Next.js—just a normal external link. You can use `rel="noopener noreferrer"` and `target="_blank"` if you want the store in a new tab, or same tab for a more integrated feel.

4. **Optional later**  
   If you want “featured products” or a small shop teaser on kansliet.co, you can use Shopify’s Storefront API from this app later. Not required for launch.

### Alternative (not recommended for you)

Embedding the full store inside this Next.js app (iframe or full Storefront API build) is more work, more to maintain, and doesn’t buy you much for a design-studio site. Subdomain is simpler and aligns with how most brands run “main site + Shopify store.”

**TL;DR:** Deploy this site as-is; it’s healthy and ready. Use **store.kansliet.co** for Shopify; add a “Shop” link to that URL when the store is live. Optional improvements (cookie→GA, og-image, rate limit, Lighthouse) can follow after launch.
