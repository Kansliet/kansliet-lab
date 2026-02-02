# Homepage "use client" Refactor & Design Studio Gaps

## 1. Why the homepage had a "use client" issue

### What was wrong

The entire homepage was a **client component** (`"use client"` at the top of `page.tsx`). That meant:

1. **Data in the client bundle**  
   The page imported `projects` and `trailImages` directly from `@/data/...`. Those modules are part of the **client JavaScript bundle**. So every project (titles, categories, image paths, descriptions, etc.) and every trail image was shipped as static data inside the JS that the browser downloads. The data wasn’t fetched at runtime — it was baked into the bundle. That increases bundle size and parse time for no benefit on a mostly static page.

2. **No server rendering of the shell**  
   With the whole page as a client component, the initial HTML is a minimal shell; React hydrates and then renders the hero and project list. The server could have sent the full list and hero structure as HTML and only hydrated the interactive bits (trail animation, cursor follower, hover state). That would improve first paint and SEO for the list content.

3. **Wrong ownership of data**  
   In the App Router, the default should be: **server owns data, client receives only what it needs via props**. The server can read from files, DB, or APIs; the client gets serialized props. Putting `import { projects } from "@/data/projects"` in a client component inverts that: the client “owns” the data by importing it, and the bundler embeds it.

### What we changed

- **`page.tsx` is now a server component.**  
  It imports `projects` and `trailImages` from `@/data/...` and passes only the fields needed for the home view:
  - `projects` → `{ id, title, category }[]` (no descriptions, images, specs).
  - `trailImages` → passed as-is `{ src, alt }[]`.

- **`home-view.tsx` is a client component** that receives those as props.  
  It does **not** import from `@/data/projects` or `@/data/trail-images`. So:
  - The **client JS bundle** no longer contains the raw `projects` or `trailImages` modules.
  - The data is sent once in the **RSC payload** (React Server Components) and used for the initial render and hydration.
  - If you later move to `async` data (e.g. `const projects = await fetchProjects()` in the server page), the same `HomeView` component keeps working; only the server page changes.

### Summary

| Before | After |
|--------|--------|
| Whole page = client | Page = server, only `HomeView` = client |
| `projects` + `trailImages` in client bundle | Data in RSC payload only; minimal props to client |
| Client “owns” data via imports | Server owns data; client receives props |

So the homepage is now structured the “right” way: server shell, client islands, data passed as props.

---

## 2. What’s missing from this design studio site (senior dev view)

From a senior dev perspective, these are the main gaps for a **design studio** site that wants to feel production-grade and credible.

### Content & discovery

- **Case study depth**  
  Project pages are strong (carousel, specs, description). Missing: optional “process” or “detail” sub-pages, before/after, or a clear “View full case study” vs. “Overview” split. Not mandatory, but studios often use case studies as lead magnets.

- **Filtering / categories**  
  Works list is a single flat list. No filter by category (Industrial, Spatial, Brand, etc.), year, or tag. For 10+ projects, filters or tabs would help. Could stay static (e.g. category tabs that filter the same list client-side) or be driven by URL (e.g. `/works?category=industrial`).

- **Search**  
  No site search. For a small site it’s optional; for 20+ projects or if you add blog/news, search (or at least a simple static search over project titles/categories) would be expected.

### Trust & credibility

- **Testimonials / quotes**  
  No client quotes or short testimonials. Even one or two on the Studio or Contact page would strengthen trust.

- **Awards / press / recognition**  
  No section for awards, features, or “As seen in”. Common for studios; can be a simple list or logos.

- **Team / people (optional)**  
  Many studios have a small “People” or “Studio” section with names and roles. Not required, but it’s a differentiator.

### Performance & UX

- **Image loading strategy**  
  Hero trail uses many images; consider limiting how many are “active” or lazy-loading off-screen trail items if the list grows. Project grids could use blur placeholders or consistent `sizes` to avoid layout shift.

- **Reduced motion**  
  No `prefers-reduced-motion` handling for the trail, cursor follower, or dossier clock. Respecting that preference is a standard a11y/UX expectation.

- **Error / empty states**  
  If a project has no images, you handle it; consider explicit empty states for “no projects” or failed contact submit (you already show error in form state).

### Operations & analytics

- **Cookie consent → analytics**  
  Cookie banner sets a local flag; GA is loaded regardless. For GDPR-style compliance, consider loading GA (or other scripts) only after consent and documenting that in the legal page.

- **Contact success tracking**  
  No event when a form is successfully submitted (e.g. GA4 conversion). Useful for “contact” as a goal.

- **Env & config**  
  `.env.example` with `NEXT_PUBLIC_GA_ID`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL` and a short README on “how to run locally” would make onboarding and deployment clearer.

### Content management

- **Non-dev editing**  
  Projects live in `data/projects.ts`. To let non-devs add or edit projects, you’d need a CMS, Markdown pipeline, or simple admin. Not urgent at current size, but it’s the main scalability limit.

- **Draft / preview**  
  No concept of “draft” projects or preview URLs. If you add a CMS later, preview links for clients are valuable.

### Nice-to-haves

- **RSS or “News”**  
  If you ever add blog posts or project updates, an RSS feed or “News” section would fit.

- **Multilingual**  
  No i18n. Acceptable for a single-market studio; if you target multiple regions, consider at least EN + one other language and proper `hreflang`/metadata.

- **Structured data**  
  No JSON-LD (Organization, WebSite, or Project). Adding basic Organization + WebSite would help search and rich results.

---

**TL;DR**  
The homepage is now correct: server page passes data into a client view, so data stays out of the client bundle. For the studio site itself, the biggest gaps are: no filtering/categories on works, no testimonials/awards, no reduced-motion handling, cookie consent not gating analytics, and no way for non-devs to edit projects without touching code. The rest is polish and scale.
