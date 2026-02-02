# Priorities & State-of-the-Art Flair

## 1. Prioritized roadmap

Framed around **“state-of-the-art design first”** and **“effort where it matters.”**

---

### High — do first (first impression & vibe)

| Item | Why |
|------|-----|
| **Landing “wow” factor** | First 5 seconds decide if it feels premium. Hero entrance, staggered list reveal, or one killer micro-interaction. |
| **Flair / micro-interactions** | Project rows that reveal on scroll, subtle hover states, or a deliberate load moment. Makes the site feel *designed*, not templated. |
| **Respect reduced motion** | One line of effort (e.g. `useReducedMotion`), big a11y/UX win. Shows you care about polish. |
| **Cookie consent → analytics** | Load GA only after consent. Aligns with “we’re serious” and avoids legal gray area. |

---

### Medium — when you have time (credibility & polish)

| Item | Why |
|------|-----|
| **One or two testimonials** | Not long case studies — a single quote on Studio or Contact. “State of the art” + “they’re legit” in one sentence. |
| **Project list filtering** | Category tabs or filter chips when you have 12+ projects. Low effort, high clarity. |
| **`.env.example` + short README** | “How to run this” and required env vars. Professional baseline. |
| **Contact success event** | Fire a GA (or similar) event on successful form submit. Effort where it actually converts. |

---

### Low — only when scale demands it

| Item | Why |
|------|-----|
| **Deeper case studies** | See “Case studies” below — keep project pages strong visually; don’t over-invest in long copy unless you see real engagement. |
| **Full CMS for projects** | Only when non-devs need to edit. Until then, `data/projects.ts` is fine. |
| **Search** | Add when you have 20+ projects or blog/news. |
| **i18n / JSON-LD** | When you target multiple regions or want rich results; not required for “design first” vibe. |

---

## 2. Case studies: where to put effort

You’re right that many clients don’t read long case studies. They skim, look at images, and feel the vibe.

- **Do:** Keep project pages **visually strong** — big images, clear hierarchy, one clear takeaway (tagline + one short paragraph is enough).
- **Do:** Optional “flair” per project: one killer quote, one process shot, or one “before/after” if it’s quick to add. Atmosphere over word count.
- **Don’t:** Pour time into long process narratives unless you see evidence people read them (analytics, feedback).
- **Don’t:** Add “View full case study” that leads to a wall of text. If you add depth, keep it scannable (short sections, bold leads).

So: **effort into landing + project visuals + one or two testimonials**; **lighter touch on case study copy** unless data says otherwise.

---

## 3. Landing “wow” ideas (concrete)

Ideas that add flair without rebuilding the site:

| Idea | What it is | Effort | Impact |
|------|------------|--------|--------|
| **Hero title entrance** | “KANSLIET / DESIGN COMPANY” fades or reveals in after a short delay so the trail “lands” first, then the title appears. | Low | High — first 2 seconds feel designed. |
| **Staggered list reveal** | Project rows animate in (opacity + slight y) as they enter the viewport. One-by-one or in small groups. | Low | High — scroll feels choreographed. |
| **Project hover preview** | On hover on a row, show a small thumbnail or the project tagline next to the cursor or in a corner. | Medium | High — “preview without leaving” feels premium. |
| **Page load mask** | Whole page or hero fades in behind a simple mask (e.g. vertical wipe or fade). | Low | Medium — load feels intentional. |
| **Magnetic links** | Project links (or key CTAs) subtly “pull” toward the cursor on hover. | Medium | High — tactile, memorable. |
| **Cursor trail / glow** | Cursor leaves a brief trail or a soft glow that follows. Complements your existing custom cursor. | Medium | High — distinctive. |
| **Typography moment** | One word (e.g. “DESIGN”) with a clip-path or weight reveal on scroll/load. | Medium | High — typography-led studios do this. |
| **Dossier “boot”** | Dossier strip does a quick “boot” (e.g. date fades in, or a short typewriter) on first load. | Low | Medium — reinforces the system vibe. |
| **Reduced motion** | All of the above respect `prefers-reduced-motion`: shorten or disable animations. | Low | High for a11y and “we care” signal. |

**Suggested first steps:** Hero title entrance + staggered list reveal (both implemented in this pass). Then add project hover preview or magnetic links when you want the next bump.

---

## 4. State-of-the-art flair (beyond the landing)

Small touches that make the whole site feel more “state of the art”:

- **Consistent micro-motion** — Buttons/links that have a tiny scale or opacity change on hover/focus (you have some; ensure it’s consistent). Focus rings that match your design system.
- **Scroll rhythm** — Section transitions (e.g. Studio, Contact) that have a subtle reveal or sticky moment so scrolling feels intentional.
- **One “signature” interaction** — Pick one thing that’s uniquely Kansliet (e.g. the dossier strip, the custom cursor, or the trail) and make it slightly more expressive (e.g. cursor shows project title on hover, or dossier strip reacts to scroll).
- **Sound (optional)** | One very subtle click on key actions (e.g. “SEND MESSAGE”) or silence by default with an opt-in. Risky but memorable if done sparingly.
- **404 / error personality** | Your 404 is already on-brand; keep that level of care on any error or empty state.

---

**TL;DR**

- **Priorities:** High = landing wow + flair + reduced motion + cookie/GA. Medium = testimonials, filter, .env, contact event. Low = deep case studies, CMS, search, i18n until scale demands it.
- **Case studies:** Invest in visuals and vibe; keep copy short unless data shows people read long form.
- **Wow/flair:** Start with hero title entrance + staggered list (done). Then consider hover preview, magnetic links, or cursor trail.
- **State of the art:** One signature interaction, consistent micro-motion, scroll rhythm, and respect for reduced motion.
