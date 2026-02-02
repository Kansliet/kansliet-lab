# Kansliet Lab — Codebase Audit

**Date:** February 2025  
**Scope:** Full critical audit for production-grade Next.js (App Router) project.

---

## 1. Project structure and folder conventions

### Diagnosis
- **Good:** App Router with route group `(main)`, private route `_catalog`, clear separation of `app/`, `components/`, `data/`, `lib/`. Single path alias `@/*`.
- **Bad:** No feature-based grouping; `data/` mixes type definitions and static arrays in one file; `components/` is flat (header, footer, cookie-banner, cursor-follower, etc. in one list).
- **Risky:** `RotatingLogo` exists but Footer uses inline Image with animation — inconsistent reuse.

### Severity
**Acceptable but suboptimal**

### Concrete improvements
- Keep current structure for this scale; if the app grows, consider `components/layout/`, `components/forms/`, `components/features/`.
- Either use `RotatingLogo` in Footer or remove the component to avoid dead code.
- Consider splitting `data/projects.ts` into `types/project.ts` and `data/projects.ts` (data only) for clearer imports.

---

## 2. Next.js version and App Router patterns

### Diagnosis
- **Good:** Next.js 16.1.6, React 19; `metadata` and `generateMetadata` used; `loading.tsx` and `error.tsx` at app level; `notFound()` in dynamic route; `searchParams` as Promise in contact page.
- **Bad:** Root layout previously rendered `GoogleAnalytics` with `gaId={process.env.NEXT_PUBLIC_GA_ID || ""}`, injecting a script with an empty ID when env is unset. Comment clutter ("1. IMPORT ADDED") left in layout.
- **Risky:** `_catalog` uses `process.env.NODE_ENV !== "development"` then `redirect("/")` — correct but brittle if someone expects a 404.

### Severity
**Needs improvement** (GA); **Good** (rest)

### Code changes applied
- GA is now rendered only when `NEXT_PUBLIC_GA_ID` is set.
- Layout comments removed.
- No change to `_catalog`; behaviour is acceptable.

---

## 3. Server vs client component boundaries

### Diagnosis
- **Good:** Contact page is server; form is client with `useActionState`. Works `[id]` is server; `ProjectCarousel` is client. Works list and Studio are server.
- **Bad:** Home page is entirely `"use client"`. All content (hero + project list) is client-rendered; `projects` and `trailImages` are imported in the client component, so they ship in the client bundle. For static data this is unnecessary — a server shell could pass data as props to client islands (e.g. hero trail, cursor follower).

### Severity
**Needs improvement**

### Concrete improvements
- Refactor home into a server page that fetches/imports `projects` and `trailImages` and passes them as props to client components (e.g. `<HomeHero trailImages={trailImages} />`, `<ProjectList projects={projects} />`). This reduces client JS and keeps data on the server.
- Keep only interactive pieces as client: `ImageTrail`, `CursorFollower`, and the list hover state.

---

## 4. Data fetching strategy

### Diagnosis
- **Good:** No unnecessary client fetch; data is static TS. Works `[id]` uses server component + static data; no loading waterfalls.
- **Bad:** Data is imported in client on the home page (see §3). No caching layer; if this ever becomes API/CMS-driven, strategy would need revisiting.
- **Risky:** `data/projects.ts` references image paths (e.g. `waffries/flatlay.jpg`, `kallstorp/kitchen.jpg`) that do not exist under `public/images/projects/` for many projects. Only `laminar-01` and `waffries` have matching assets — others will 404.

### Severity
**Critical** (broken image paths); **Good** (strategy for current static setup)

### Concrete improvements
- Align `projects.ts` with actual files in `public/images/projects/`, or add placeholder assets, so project pages and grids do not show broken images.
- When moving to server-driven home, keep data in server components and pass as props.

---

## 5. State management

### Diagnosis
- **Good:** Minimal state; no global store. `useActionState` for contact form; local `useState` for menu, hover, cookie consent. Appropriate for scope.
- **Bad:** None.
- **Risky:** Cookie consent is `localStorage` only; no server-side or cookie flag. Fine for a simple banner; if you need to gate analytics on consent, you’d need a different approach.

### Severity
**Good**

---

## 6. Performance characteristics

### Diagnosis
- **Good:** Next/Image used with `sizes`; AVIF/WebP in config; `priority` on hero logo; lazy loading on trail images.
- **Bad:** Duplicate dependency: both `framer-motion` and `motion` in package.json; only `motion` is used. Home is full client page, so all home data and components are in the client bundle. `DossierStrip` runs `setInterval(..., 1000)` for a live clock — minor but constant work. Cursor follower subscribes to every `mousemove` with no throttling.
- **Risky:** Image trail renders many images; consider limiting or lazy-loading off-screen trail items if the list grows.

### Severity
**Needs improvement** (bundle/deps); **Acceptable** (rest)

### Code changes applied
- Removed `framer-motion`; only `motion` remains.

### Concrete improvements (optional)
- Throttle or use passive `mousemove` in cursor follower.
- Consider `requestAnimationFrame` or 1s tick for dossier clock if you want to reduce work.
- Split home into server + client islands to trim client bundle.

---

## 7. SEO and metadata handling

### Diagnosis
- **Good:** Root `metadata` and `metadataBase`; sitemap and robots; `generateMetadata` on works `[id]`; template title.
- **Bad:** Root metadata referenced `/og-image.jpg` and `/kansliet-favicon.png` — neither exists in `public/`. Custom `icons` pointed to missing file; Next.js already serves `app/icon.png` by default. Contact, Studio, and not-found had minimal or no metadata (title only, no description). Project metadata lacked description and OG image.
- **Risky:** Social previews will fail or fall back until `og-image.jpg` (1200×630) is added to `public/`.

### Severity
**Needs improvement**

### Code changes applied
- Removed custom `icons` override so Next uses default `app/icon.png`.
- Contact and Studio pages: added `description` to metadata.
- Not-found: added `metadata` with title and description.
- Works `[id]` `generateMetadata`: added `description`, `openGraph` (title, description, image with absolute URL). OG image URL built from `NEXT_PUBLIC_SITE_URL` or fallback `https://kansliet.co`.

### Concrete improvements
- Add `public/og-image.jpg` (1200×630) and optionally `public/kansliet-favicon.png` if you want to override the default icon.
- Consider `NEXT_PUBLIC_SITE_URL` in env for correct canonical/OG URLs in all environments.

---

## 8. Accessibility

### Diagnosis
- **Good:** Form labels with `htmlFor`; carousel buttons have `aria-label`; header nav has `aria-label="Main navigation"`; hamburger has `aria-label`.
- **Bad:** No skip link; external links in footer used `target="_blank"` without `rel="noopener noreferrer"`. Mobile menu had no `aria-expanded`, `aria-controls`, or `role="dialog"`; focus not trapped when open.
- **Risky:** Cookie banner links to `/legal` — that page did not exist (now added).

### Severity
**Needs improvement**

### Code changes applied
- Skip link added in root layout; target is `<main id="main-content">` in `(main)/layout.tsx`.
- Footer and `Link` component: external links now get `rel="noopener noreferrer"` (Footer explicitly; `Link` adds it when `target="_blank"` and `rel` not provided).
- Header: hamburger has `type="button"`, `aria-expanded`, `aria-controls="mobile-nav"`, dynamic `aria-label` (Open/Close). Mobile overlay has `id="mobile-nav"`, `role="dialog"`, `aria-modal="true"`, `aria-label="Mobile navigation"`, `hidden={!isOpen}`.
- Legal page added at `/legal` so cookie banner link does not 404.

### Concrete improvements (optional)
- Focus trap when mobile menu is open (focus first link, trap Tab, on close return focus to hamburger).
- Ensure focus-visible styling is consistent (e.g. ring) on all interactive elements.

---

## 9. Security basics

### Diagnosis
- **Good:** Server action for contact; Resend key only on server; no `dangerouslySetInnerHTML`; external links get `rel="noopener noreferrer"`.
- **Bad:** No validation that `RESEND_API_KEY` is set before calling Resend — build succeeds but runtime fails. No input length limits or email format check; long or malformed input could stress Resend or logs. No rate limiting on the contact action (abuse risk).
- **Risky:** Subject line uses `name` unsanitized — capped to 100 chars in implementation to reduce header injection risk.

### Severity
**Needs improvement**

### Code changes applied
- Contact action: check `RESEND_API_KEY` and return user-friendly error if missing.
- Input limits: name 200, email 254, company 300, message 10_000 chars; basic email regex validation.
- Subject line built from `name.slice(0, 100)`.
- Email body built from plain concatenation (no HTML); Resend receives plain text.

### Concrete improvements
- Add rate limiting (e.g. per IP or per session) to the contact action.
- Consider CAPTCHA or similar for production to reduce bots.

---

## 10. Build and runtime efficiency

### Diagnosis
- **Good:** TypeScript strict; `ignoreBuildErrors: false`; Next config with image formats and compression; `poweredByHeader: false`.
- **Bad:** No env validation at build (e.g. required vars for production). No explicit bundle analysis or size budgets.
- **Risky:** Missing `RESEND_API_KEY` only fails at runtime when form is submitted.

### Severity
**Acceptable but suboptimal**

### Concrete improvements
- Add a small env validation step (e.g. in `lib/env.ts` or at app startup) that checks required vars and fails fast in production.
- Optionally add `@next/bundle-analyzer` in development to watch client bundle size.

---

## 11. Scalability and future-proofing

### Diagnosis
- **Good:** Static data and server components scale fine for current size; route structure is clear.
- **Bad:** Projects live in a single TS array; no CMS or API. Adding many projects or non-technical editors would require code changes or a migration.
- **Risky:** No tests; refactors and dependency upgrades carry higher risk.

### Severity
**Acceptable for current scope**

### Concrete improvements
- If the project list or content grows, consider Markdown, CMS, or a simple API and keep the same UI.
- Introduce unit tests for server actions and critical UI (e.g. form, navigation).

---

## 12. Developer experience and maintainability

### Diagnosis
- **Good:** ESLint with Next config; path alias; consistent Tailwind and component patterns; CVA for variants.
- **Bad:** Commented-out notes in layout; inconsistent use of shared components (e.g. RotatingLogo); no test or E2E setup; no documented env vars (e.g. `.env.example`).
- **Risky:** `projects.ts` has many projects with image paths that don’t exist — easy to add new projects with typos or wrong paths.

### Severity
**Needs improvement**

### Code changes applied
- Removed comment clutter from root layout.
- Added `/legal` page and sitemap entry so cookie link is valid.

### Concrete improvements
- Add `.env.example` with `NEXT_PUBLIC_GA_ID`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL` and short descriptions.
- Add a README section on required env vars and how to run locally.
- Consider a simple script or test that validates that every `projects.ts` image path exists under `public/`.

---

## Summary of code changes made

| Area | Change |
|------|--------|
| **Layout** | GA only when `NEXT_PUBLIC_GA_ID` set; skip link; `id="main-content"` on main; removed comments and broken `icons` override. |
| **Contact action** | Env check for Resend; input length limits; email validation; subject capped; plain text body. |
| **Footer / Link** | `rel="noopener noreferrer"` on external links; `Link` adds it by default when `target="_blank"`. |
| **Metadata** | Contact, Studio, not-found: descriptions; works `[id]`: description + OG with absolute image URL. |
| **Dependencies** | Removed `framer-motion` (only `motion` used). |
| **Accessibility** | Skip link; header mobile menu ARIA and `hidden`; legal page. |
| **New route** | `/legal` page and sitemap entry for cookie banner link. |

---

## What to do next

1. **Critical:** Fix or add images for all projects referenced in `data/projects.ts` so paths under `public/images/projects/` exist (or point to placeholders).
2. **High:** Add `public/og-image.jpg` (1200×630) for social previews.
3. **High:** Refactor home into server page + client islands and pass `projects`/`trailImages` as props to reduce client bundle.
4. **Medium:** Add `.env.example` and document env vars; consider env validation at startup.
5. **Medium:** Rate limiting and/or CAPTCHA on contact action for production.
6. **Optional:** Focus trap in mobile menu; throttle cursor follower; tests for actions and critical UI.
