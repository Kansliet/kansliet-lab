# Deploy to Vercel (kansliet.co)

Step-by-step setup for deploying this Next.js app to Vercel and connecting your domain.

---

## 1. Push your code to GitHub

If the project isn’t in a Git repo yet:

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a new repository on [GitHub](https://github.com/new) (e.g. `kansliet-lab` or `kansliet-website`), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

If it’s already on GitHub, make sure your latest changes are pushed.

---

## 2. Import the project in Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. Click **Add New…** → **Project**.
3. **Import** the GitHub repo (e.g. `kansliet-lab`).
4. Vercel will detect Next.js. Leave the defaults:
   - **Framework Preset:** Next.js  
   - **Root Directory:** `./`  
   - **Build Command:** `npm run build` (or `next build`)  
   - **Output Directory:** (auto)  
   - **Install Command:** `npm install`
5. **Do not** click Deploy yet—set env vars first (step 3).
6. Open **Environment Variables** for the project.

---

## 3. Set environment variables

In the project’s **Settings → Environment Variables**, add:

| Name | Value | Notes |
|------|--------|--------|
| `RESEND_API_KEY` | Your Resend API key | **Required** for the contact form. Get it from [resend.com](https://resend.com) → API Keys. |
| `NEXT_PUBLIC_GA_ID` | e.g. `G-XXXXXXXXXX` | Optional. Only set if you use Google Analytics. |
| `NEXT_PUBLIC_SITE_URL` | `https://kansliet.co` | Optional. Used for canonical/OG URLs. Default in code is `https://kansliet.co`. |

- Add each for **Production** (and optionally Preview if you want them in PR previews).
- Then go back to the **Deployments** tab and trigger a deploy, or run the first deploy from the import screen after saving env vars.

---

## 4. Deploy

1. Click **Deploy** (from the import screen, or **Deployments → Redeploy** after changing env vars).
2. Wait for the build. The first deploy will get a URL like `kansliet-lab-xxx.vercel.app`.
3. Open that URL and check the site (home, works, contact, one project page).

---

## 5. Add your domain (kansliet.co)

1. In Vercel: **Project → Settings → Domains**.
2. Add **kansliet.co** and **www.kansliet.co** (if you want www).
3. Vercel will show DNS records. In your domain registrar (where you bought kansliet.co):

   **For apex (kansliet.co):**  
   - Type: **A**  
   - Name: `@` (or leave blank)  
   - Value: **76.76.21.21** (Vercel’s IP; confirm in Vercel’s Domains UI)

   **For www (www.kansliet.co):**  
   - Type: **CNAME**  
   - Name: `www`  
   - Value: **cname.vercel-dns.com** (confirm in Vercel)

4. Save DNS. Propagation can take a few minutes up to 48 hours.
5. In Vercel, wait until the domain shows **Valid**. HTTPS is automatic.

---

## 6. Optional: redirect www to apex (or vice versa)

In **Settings → Domains**, you can set one domain as primary and redirect the other. Common choice: **kansliet.co** as primary, **www.kansliet.co** redirects to it.

---

## Checklist

- [ ] Code pushed to GitHub  
- [ ] Project imported in Vercel  
- [ ] `RESEND_API_KEY` set (and others if needed)  
- [ ] First deploy succeeded  
- [ ] Domains **kansliet.co** (and www) added and DNS set at registrar  
- [ ] Domain shows Valid in Vercel; site loads on https://kansliet.co  

---

## Troubleshooting

- **Build fails:** Check the build log in Vercel. Common: missing env (e.g. `RESEND_API_KEY` not set for Production).  
- **Contact form doesn’t send:** Confirm `RESEND_API_KEY` is set and that the “from” domain is allowed in Resend (e.g. onboarding@resend.dev until you verify your domain).  
- **Domain not valid:** Double-check A and CNAME at the registrar; wait for DNS propagation; in Vercel, ensure no typos in the domain.
