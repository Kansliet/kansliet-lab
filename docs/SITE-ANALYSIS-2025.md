# Kansliet site — full analysis & production checklist (2025)

**Date:** February 2025  
**Scope:** Entire site — performance, redundancy, latest best practices, files safe to remove.

---

## 1. Executive summary

| Area | Status | Notes |
|------|--------|--------|
| **Next.js / React** | ✅ Up to date | Next 16.1.6, React 19, App Router |
| **Rendering** | ✅ Good | Server pages + client islands (home-view, carousel, etc.) |
| **Security** | ✅ Good | Headers, env checks, no sensitive data in client |
| **SEO** | ✅ Good | Metadata, sitemap, robots, OG |
| **Accessibility** | ✅ Good | Skip link, ARIA, focus, reduced motion |
| **Bundle / weight** | ✅ Lean | Motion only heavy client lib; no unused UI on main routes |
| **Redundant files** | ⚠️ Cleaned | Reference folder & dead component removed (see §5) |

---

## 2. Architecture & rendering

### What’s in good shape

- **Server-first:** Home, Works, Studio, Contact, Works/[id] are server pages; they pass data as props to client components (`HomeView`, `ProjectCarousel`, etc.), so static data doesn’t ship in the client bundle.
- **Client boundaries:** Only interactive parts use `"use client"`: `home-view`, `fancy-image-trail`, `cursor-follower`, `text-disperse`, `contact-form`, `project-carousel`, `cookie-banner`, `header` (mobile menu).
- **Loading & error:** `loading.tsx` (root + works + works/[id]), `error.tsx`, `not-found.tsx` are in place.
- **View transitions:** `next-view-transitions` with named groups so dossier strip, header, and footer stay static; only main content slides. Pages scroll to top on navigation.

### Optional improvements (non-blocking)

- **global-error.tsx:** Next.js recommends `app/global-error.tsx` for a top-level error boundary. You have `error.tsx`; adding `global-error.tsx` gives a consistent fallback for uncaught errors (e.g. full-page “Something went wrong” + retry).
- **Caching:** All data is static TS; no `fetch` caching to tune. If you add API or CMS data later, use `cache: 'force-cache'` or `revalidate` where appropriate.

---

## 3. Production settings & config

### next.config.ts — current vs recommended

| Setting | Current | Recommendation |
|--------|---------|----------------|
| **poweredByHeader** | `false` | ✅ Keep |
| **compress** | `true` | ✅ Keep |
| **images.formats** | `["image/avif", "image/webp"]` | ✅ Keep (AVIF first is best) |
| **images.deviceSizes** | Standard set | ✅ Keep |
| **Security headers** | X-Frame-Options, X-Content-Type-Options, Referrer-Policy | ✅ Keep |
| **optimizePackageImports** | Not set | Optional: add `motion` if you want smaller client chunks (see below) |

### Optional: bundle trimming

- **optimizePackageImports:** Next.js can tree-shake some packages. `motion` (ex-Framer Motion) is your main client dependency. If the docs support it, you can add in `next.config.ts`:
  ```ts
  experimental: {
    optimizePackageImports: ['motion'],
  },
  ```
  Only add if your Next.js version documents it for `motion`; otherwise leave as-is.
- **Bundle analysis:** To see what’s heavy, run:
  ```bash
  npx next build
  npx next experimental-analyze   # if available in your version
  ```
  or use `@next/bundle-analyzer` (Webpack) for a visual report.

### TypeScript / ESLint

- **ignoreBuildErrors: false** — ✅ Correct for production.
- ESLint and `eslint-config-next` are in use — ✅ Keep running before deploy.

---

## 4. Dependencies & weight

### Production dependencies (relevant to “heavy” feeling)

| Package | Role | Notes |
|---------|------|--------|
| **next** | Framework | ✅ Required |
| **react** / **react-dom** | Core | ✅ Required |
| **motion** | Animations (home hero, disperse, carousel, etc.) | ✅ Needed; main client cost |
| **next-view-transitions** | Route transitions | ✅ Small, view-transition API wrapper |
| **resend** | Contact form email | ✅ Server-only (actions) |
| **class-variance-authority** | Button/link variants | ✅ Light |
| **clsx** + **tailwind-merge** | Class names | ✅ Light |
| **@next/third-parties** | GA | ✅ Only loads when GA ID set |

Nothing stands out as redundant; the only “heavier” client dependency is `motion`, which is justified by the hero trail, text disperse, and carousel.

### Scripts & docs

- **docs/** — All current docs (DEPLOY-VERCEL, DNS, etc.) are useful; no need to remove.

---

## 5. Files and folders safe to delete (redundant / heavy)

### ✅ Removed in this pass

1. **`src/components/rotating-logo.tsx`**  
   - **Why:** Never imported. Root and works/[id] loading UIs use inline `<Image>` + `animate-spin-slow`, not `RotatingLogo`.  
   - **Impact:** Less dead code; no behavior change.

2. **`text-dispersion-effect-main/` (entire folder)**  
   - **Why:** Reference only. Dispersion logic is already in `src/lib/disperse-anim.ts` and `src/components/text-disperse.tsx`.  
   - **Impact:** Fewer files in repo and on disk; no impact on build or runtime.

### Optional (keep if you use the catalog)

3. **`src/app/(main)/_catalog/page.tsx`**  
   - **What:** Dev-only catalog UI (redirects to `/` when `NODE_ENV !== "development"`).  
   - **Uses:** Badge, Card, Dialog, Select, Tabs, Grid, Button, Input, Textarea, Carousel.  
   - **If you delete _catalog:** You can later remove UI components that are **only** used there: `badge`, `card`, `dialog`, `select`, `tabs`. Contact form and error/cookie banner would keep using `button`, `input`, `textarea`; works use `grid` and `carousel`. Only remove these UI components after confirming nothing else imports them.

Recommendation: keep `_catalog` and the UI set for now unless you’re sure you won’t use the catalog again; then you can remove the route and the listed UI components in one go.

---

## 6. Public assets

- **public/images/projects/** — Per-project images; all referenced in `data/projects.ts` (paths checked). No stray folders.
- **public/images/trail/** — Used by home hero trail; list in `trail-images.ts` matches files. ✅
- **public/clients/** — Client logos; referenced from Studio (or similar). ✅
- **public/*.svg, og-image.jpg** — In use. ✅  

No redundant assets identified; safe to leave as-is.

---

## 7. SEO, metadata, security

- **Metadata:** Root + per-route (works, works/[id], contact, studio, not-found) with titles and descriptions. ✅  
- **Sitemap / robots:** `sitemap.ts` and `robots.ts` point to production URL; legal and project routes included. ✅  
- **Security:** Env vars for Resend/GA; security headers in `next.config.ts`; no secrets in client. ✅  

No changes required for “state of the art” baseline.

---

## 8. Accessibility & UX

- Skip link, ARIA on mobile menu, `useReducedMotion` in motion-based components (e.g. text disperse), focus styles. ✅  
- Cookie banner link goes to `/legal`. ✅  

No urgent gaps.

---

## 9. Summary of actions taken

1. **Removed redundant files:**  
   - `src/components/rotating-logo.tsx`  
   - `text-dispersion-effect-main/` (entire folder)

2. **Documented:**  
   - This analysis in `docs/SITE-ANALYSIS-2025.md`  
   - Optional next.config (e.g. `optimizePackageImports`) and optional future cleanups (_catalog + unused UI components)

3. **No breaking changes:**  
   - All production routes and features unchanged; only dead code and reference material removed.

---

## 10. Quick reference — production checklist

Before each deploy:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Env vars set in hosting (e.g. Vercel): `RESEND_API_KEY`, `NEXT_PUBLIC_GA_ID` (optional)
- [ ] DNS / domain and OG image URL match production (e.g. `metadataBase`, sitemap, robots)
- [ ] Run Lighthouse (or similar) occasionally for LCP, INP, CLS

You’re in good shape for production; this doc can be reused for the next full pass or onboarding.
