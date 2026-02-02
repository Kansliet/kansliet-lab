# Projects & metadata run-through

**Checked:** Projects data, image paths vs files on disk, metadata, sitemap, and one copy fix.

---

## Projects list (9 total)

| # | id | title | Images in data | Images on disk | Status |
|---|----|--------|-----------------|----------------|--------|
| 1 | laminar-01 | LAMINAR-01 | 3 | 3 | OK |
| 2 | kallstorp | KÄLLSTORP | 5 | 5 | OK |
| 3 | smeg-nespresso | SMEG X NESPRESSO | 4 | 4 | OK |
| 4 | roppongi | ROPPONGI | 3 | 3 | OK (copy fixed, see below) |
| 5 | frank-and-stein | FRANK & STEIN | 4 | 4 | OK |
| 6 | nothing | NOTHING | 4 | 4 | OK |
| 7 | aime-leon-dore | AIMÉ LEON DORE | 3 | 3 | OK |
| 8 | ebay-x-elton-john | EBAY X ELTON JOHN | 3 | 3 | OK |
| 9 | cannaluxe | CANNALUXE | 4 | 4 | OK |

Every project’s image paths in `data/projects.ts` match files under `public/images/projects/`. No 404s.

---

## What was fixed

**Roppongi**  
- **Issue:** Description, tags, image alts, and specs were copied from Waffries (wrong project).  
- **Change:** Description and specs updated to Roppongi; tags set to INDUSTRIAL, LIGHTING, PRODUCT, SPATIAL; image alts updated to lamp views. You can replace the placeholder copy with final text when ready.

---

## Metadata

- **works/[id]**  
  - `generateMetadata` uses project `title`, `tagline`, and first image for OG.  
  - Absolute image URL built from `NEXT_PUBLIC_SITE_URL` or `https://kansliet.co`.  
- **Home**  
  - Server page passes `id`, `title`, `category` to `HomeView`; list and trail data are correct.  
- **Sitemap**  
  - All 9 project routes included as `/works/{id}`.  
- **Root layout**  
  - `metadataBase`, default title/description, OG, robots are set.

---

## Unused folder

- **`public/images/projects/waffries/`**  
  - Contains `waffries.webp` and `waffries-2.webp`.  
  - There is no `waffries` project in `data/projects.ts` (only roppongi, laminar-01, etc.).  
  - So either add a Waffries project entry and point its images to these files, or leave the folder as unused / remove it if you don’t need it.

---

## Summary

- All 9 projects have valid image paths and matching files.  
- Roppongi copy and metadata were corrected.  
- Project pages, home list, sitemap, and metadata are consistent.  
- Only follow-up: decide what to do with the waffries folder (use it in a project or remove).
