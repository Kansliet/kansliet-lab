# Next.js Production Deployment Audit — Kansliet Lab

**Audit date:** February 2026  
**Next.js:** 16.1.6 | **React:** 19.2.3  
**Scope:** Production readiness for Vercel deployment per current Next.js and Vercel best practices.

---

## 1. Executive Summary

| Area | Status | Priority |
|------|--------|----------|
| next.config & build | ✅ Good | — |
| Environment variables | ⚠️ Minor gaps | P2 |
| Rendering & data | ✅ Good | — |
| Images | ✅ Good | — |
| i18n / locale | ✅ N/A (en only) | — |
| CSS (Tailwind) | ✅ Good | — |
| API / Server Actions | ✅ Good | — |
| Client/Server boundaries | ✅ Good | — |
| TypeScript | ✅ Good | — |
| Linting / formatting | ✅ Good | — |
| Tests | ❌ None | P1 |
| Security (headers, CSP) | ⚠️ CSP missing | P2 |
| Accessibility | ✅ Good | — |
| Bundle / performance | ✅ No budget; optional analysis | P3 |
| Caching | ✅ Static by default | — |
| Logging / monitoring | ⚠️ Minimal | P3 |

---

## 2. next.config and Build

**File:** `next.config.ts`

**Current:**
- `poweredByHeader: false` ✅
- `compress: true` ✅
- `typescript.ignoreBuildErrors: false` ✅
- `images.formats: ["image/avif", "image/webp"]` ✅
- `images.deviceSizes` (defaults) ✅
- `images.minimumCacheTTL: 60` ✅
- Custom headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) ✅

**Gaps / recommendations:**

1. **No `images.remotePatterns`**  
   All images are from `/public` (relative paths). If you later add external images (e.g. CMS), configure `remotePatterns` per [Image Optimization](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns).  
   **Action:** None required until you use remote images.

2. **Optional: `experimental.optimizePackageImports`**  
   For large icon/UI libraries this can reduce bundle size. Your main client dependency is `motion`; support is package-dependent.  
   **Action:** Optional; run `npx next build` and consider `npx next experimental-analyze` (if available) to inspect bundles.

**Ref:** [Next.js Config](https://nextjs.org/docs/app/api-reference/config/next-config-js) | [Production Checklist](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist)

---

## 3. Environment Variables and Safety

**Usage:**

| Variable | Where | Purpose |
|----------|--------|---------|
| `RESEND_API_KEY` | `src/app/(main)/contact/actions.ts` | Server Action only; checked before use ✅ |
| `NEXT_PUBLIC_GA_ID` | `src/app/layout.tsx` | GA only rendered when truthy ✅ |
| `NEXT_PUBLIC_SITE_URL` | `src/app/(main)/works/[id]/page.tsx` | OG image base URL; fallback `https://kansliet.co` ✅ |
| `NODE_ENV` | `src/app/(main)/_catalog/page.tsx` | Dev-only redirect ✅ |

**Findings:**

1. **Resend initialized at module load**  
   `const resend = new Resend(process.env.RESEND_API_KEY);` runs when the module loads. If `RESEND_API_KEY` is missing, Resend may still construct (API calls fail later). The action correctly checks and returns a user message.  
   **Action (optional):** Lazy-init inside the action to avoid any edge-case behavior when env is missing.

2. **No `.env.example`**  
   Deployers don’t have a single reference for required/optional vars.  
   **Action (P2):** Add `.env.example` with `RESEND_API_KEY`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_SITE_URL` and short comments. Keep `.env*` in `.gitignore` (already done).

**Ref:** [Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

## 4. Static vs Dynamic Rendering and Data

**Rendering:**

- **Home:** Server Component; passes `projects` and `trailImages` to client `HomeView`. ✅
- **Works list:** Server Component; reads `projects` from TS. ✅
- **Works [id]:** Server Component; `generateMetadata` and page use `projects`. ✅
- **Contact:** Server Component; `searchParams` as `Promise` (Next 15+). ✅
- **Studio, Legal:** Server Components; static. ✅
- **_catalog:** Redirect when `NODE_ENV !== "development"`. ✅

**Data:**

- No `fetch`; all data from static TS (`projects.ts`, `trail-images.ts`). No caching configuration needed. ✅  
- Contact form uses Server Action; no Route Handlers. ✅

**Ref:** [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) | [Caching](https://nextjs.org/docs/app/building-your-application/caching)

---

## 5. Image Optimization and Domains

**Usage:**

- `next/image` used in: header logo, footer logo, home trail, works grid, studio clients, carousel, loading. ✅
- All `src` values are local (e.g. `/images/...`, `/kansliet-logo-...`). No `remotePatterns` or `domains` required. ✅
- `sizes` and `fill` / dimensions used appropriately. ✅

**Action:** None. When adding external images, set `images.remotePatterns` in `next.config.ts`.

**Ref:** [Image](https://nextjs.org/docs/app/api-reference/components/image)

---

## 6. i18n and Locale

- Single locale (en); `metadataBase` and OG use `en_US`. No i18n routing. ✅  
- **Action:** None unless you add locales (then use Next.js i18n or middleware).

---

## 7. CSS (Tailwind, Global)

**Setup:**

- Tailwind v4 via `@tailwindcss/postcss` in `postcss.config.mjs`. ✅
- Single global CSS: `src/app/globals.css` with `@import "tailwindcss"`, `@theme`, `@layer base`, `@layer utilities`, view-transition keyframes. ✅
- No CSS Modules in use. ✅

**Action:** None.

**Ref:** [Tailwind CSS](https://tailwindcss.com/docs) | [Next.js Styling](https://nextjs.org/docs/app/building-your-application/styling)

---

## 8. API Routing and Backend

- **Route Handlers:** None (`app/api/` absent). ✅
- **Server Actions:** One file `src/app/(main)/contact/actions.ts` with `submitContact`; validation, length limits, and env check in place. ✅

**Action:** None.

**Ref:** [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) | [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 9. Client vs Server Component Delineation

**Server (no "use client"):** Root layout, (main) layout, home page, works list, works [id] page, contact page, studio, legal, not-found, sitemap, robots. ✅

**Client ("use client"):** HomeView, contact form, header (mobile menu), dossier strip, cookie banner, cursor follower, text-disperse, fancy-image-trail, project carousel, carousel/dialog/tabs UI, error.tsx. ✅

Data flow: server pages pass props to client components; no static data in client bundles. ✅

**Action:** None.

**Ref:** [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

---

## 10. TypeScript

**tsconfig.json:**

- `strict: true` ✅
- `skipLibCheck: true` ✅
- `paths: { "@/*": ["./src/*"] }` ✅
- Next.js plugin enabled. ✅

**Action:** None.

**Ref:** [TypeScript](https://nextjs.org/docs/app/building-your-application/configuring/typescript)

---

## 11. Linting and Preflight

- **ESLint:** `eslint.config.mjs` uses `eslint-config-next` (core-web-vitals, typescript). ✅
- **Script:** `"lint": "next lint"`. ✅
- **Pre-commit/pre-push:** No Husky/lint-staged in repo.  
  **Action (P3):** Optionally add a pre-push hook that runs `npm run lint` and `npm run build`.

**Ref:** [ESLint](https://nextjs.org/docs/app/building-your-application/configuring/eslint)

---

## 12. Tests and Coverage

**Current:** No test files (`*.test.*`, `*.spec.*`), no Jest/Vitest/Playwright config. ❌

**Recommendations:**

1. **P1 — Critical paths:** Add a few tests for:
   - Server Action `submitContact` (validation, env guard, redirect on success).
   - Optional: one integration test for contact form submit (e.g. Playwright or React Testing Library).
2. **P3:** Unit tests for pure utils (e.g. `cn`, disperse helpers) if you add more logic.
3. **Coverage:** Not required for launch; add later if you want a threshold.

**Ref:** [Testing](https://nextjs.org/docs/app/building-your-application/testing) | [Vercel Deployment Checks](https://vercel.com/docs/deployment-checks)

---

## 13. Security

**Headers (next.config.ts):**

- `X-Frame-Options: DENY` ✅
- `X-Content-Type-Options: nosniff` ✅
- `Referrer-Policy: strict-origin-when-cross-origin` ✅

**Missing:**

1. **Content-Security-Policy (CSP)**  
   Not set. For a strict posture you can add a CSP header (script-src, style-src, img-src, etc.). Third-party scripts (e.g. GA) must be allowed in `script-src`.  
   **Action (P2):** Add a CSP that allows your origin and required third parties; start in report-only if you prefer.  
   **Ref:** [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) | [Vercel Security](https://vercel.com/docs/security).

2. **Permissions-Policy**  
   Optional; restrict features (camera, microphone, etc.) if not needed.  
   **Action:** Optional.

**Application:**

- Server Action validates length and email; no raw HTML rendered from user input. ✅
- No `dangerouslySetInnerHTML` with user data. ✅
- Env vars: server-only secrets not exposed to client. ✅

---

## 14. Accessibility

- Skip link to `#main-content` in root layout. ✅
- Header: mobile menu with `aria-expanded`, `aria-controls`, `role="dialog"`, `hidden`. ✅
- External links: `rel="noopener noreferrer"` (e.g. footer, studio). ✅
- Motion: `useReducedMotion` in text-disperse. ✅
- Form labels associated with inputs. ✅

**Action:** Optional: run `eslint-plugin-jsx-a11y` (included in eslint-config-next) and fix any reported issues; add `global-error.tsx` for full-page error recovery.

**Ref:** [Accessibility](https://nextjs.org/docs/app/building-your-application/configuring/accessibility) | [WCAG](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 15. Bundle Size and Performance Budgets

- No performance budget or bundle analyzer in config. ✅ Acceptable for current size.
- **Optional:** Run `npx next build` and, if available, `npx next experimental-analyze` or `@next/bundle-analyzer` to inspect client bundles.  
**Action (P3):** Optional; add a budget only if you add heavy dependencies.

**Ref:** [Analyzing bundles](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)

---

## 16. Caching

- No `fetch`; no data cache to configure. ✅
- Static pages and metadata; dynamic only where needed (e.g. contact `searchParams`). ✅
- Images: default Next.js image optimization and `minimumCacheTTL: 60`. ✅

**Action:** None. If you add API or CMS fetch, consider `revalidate` or `cache: 'force-cache'` per [Caching](https://nextjs.org/docs/app/building-your-application/caching).

---

## 17. Logging and Monitoring

- **Error:** `error.tsx` logs with `console.error(error)`. ✅
- **Contact action:** `console.error` on Resend failure. ✅
- No structured logging, no error-tracking service (e.g. Sentry), no RUM.  
**Action (P3):** For production, consider:
- Error tracking (e.g. Vercel Analytics + Sentry/LogRocket).
- Optional: `useReportWebVitals` to send Core Web Vitals to your analytics.

**Ref:** [Logging](https://nextjs.org/docs/app/building-your-application/configuring/logging) | [Vercel Analytics](https://vercel.com/docs/analytics)

---

## 18. Additional Gaps

1. **global-error.tsx**  
   Not present. `error.tsx` covers route-level errors; `global-error.tsx` catches errors in the root layout and replaces the entire UI.  
   **Action (P2):** Add `app/global-error.tsx` with a simple fallback and “Try again” / “Home” for full recovery.  
   **Ref:** [Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts).

2. **Sitemap baseUrl**  
   Sitemap uses hardcoded `https://kansliet.co`. Matches `metadataBase`. If you use multiple domains, drive from `process.env.NEXT_PUBLIC_SITE_URL` or `metadataBase`.  
   **Action:** Optional; fine as-is for single domain.

---

## 19. Deployment Checklist

Use this before each production deploy.

### Build and quality

- [ ] **`npm run build`** — Completes without errors.
- [ ] **`npm run lint`** — No ESLint errors.
- [ ] **TypeScript** — No type errors (build implies this).

### Environment (Vercel)

- [ ] **`RESEND_API_KEY`** — Set in Production (and Preview if you test contact there).
- [ ] **`NEXT_PUBLIC_GA_ID`** — Set only if you use GA.
- [ ] **`NEXT_PUBLIC_SITE_URL`** — Optional; default in code is `https://kansliet.co`.

### Security and resilience

- [ ] **Headers** — Already set (X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
- [ ] **CSP** — Optional; add if you want stricter policy.
- [ ] **global-error.tsx** — Optional but recommended for root-level errors.

### SEO and metadata

- [ ] **metadataBase** — Set to production URL.
- [ ] **Sitemap** — `/sitemap.xml` returns correct URLs.
- [ ] **Robots** — `/robots.txt` allows crawling and points to sitemap.
- [ ] **OG image** — `/og-image.jpg` exists and is correct size (e.g. 1200×630).

### Functionality

- [ ] **Contact form** — Submit succeeds and email is received when `RESEND_API_KEY` is set.
- [ ] **Links and navigation** — All main nav and key links work (including view transitions if used).
- [ ] **Images** — All project and trail images load (paths in `projects.ts` and `trail-images.ts`).

### Observability (optional)

- [ ] **Error tracking** — Configured if you use a provider.
- [ ] **Analytics** — GA or Vercel Analytics if desired.

### Post-deploy

- [ ] **DNS** — Domain points to Vercel (A/CNAME as per [Vercel DNS](https://vercel.com/docs/concepts/projects/domains)).
- [ ] **HTTPS** — Certificate active.
- [ ] **Smoke test** — Home, Works, one project, Contact, submit form once.

---

## 20. Priority Action Items

| Priority | Item | Effort |
|----------|------|--------|
| **P1** | Add tests for contact Server Action (and optionally contact form flow) | Medium |
| **P2** | Add `.env.example` with documented env vars | Low |
| **P2** | Add `app/global-error.tsx` for root layout error boundary | Low |
| **P2** | Consider Content-Security-Policy header (report-only first) | Medium |
| **P3** | Optional: pre-push hook for `lint` + `build` | Low |
| **P3** | Optional: error tracking and/or Core Web Vitals reporting | Medium |

---

## 21. References

- [Next.js Production Checklist](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist)
- [Next.js Config](https://nextjs.org/docs/app/api-reference/config/next-config-js)
- [Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Vercel Production Checklist](https://vercel.com/docs/production-checklist)
- [Vercel Deployment Checks](https://vercel.com/docs/deployment-checks)

---

*End of audit.*
