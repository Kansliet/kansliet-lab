# Downloading images from your Framer site (kansliet.co)

Framer doesn’t give you a file export for uploaded assets. Here are two ways to get your images back.

---

## Method 1: Browser (recommended — gets everything)

Framer loads many images via JavaScript, so the ones visible after the site has fully loaded are the most complete set.

1. Open **https://kansliet.co** in Chrome (or Edge).
2. Open **DevTools** (F12) → **Network** tab → filter by **Img**.
3. **Refresh** the page and **scroll through the whole site** (home + open a few projects) so all images load.
4. Open the **Console** tab and run one of the snippets below.

### A) Copy all image URLs (then download with the script)

```javascript
const imgs = [...document.querySelectorAll("img")]
  .map((el) => el.currentSrc || el.src)
  .filter(Boolean);
const unique = [...new Set(imgs)];
const text = unique.join("\n");
if (typeof copy === "function") {
  copy(text);
  console.log("Copied " + unique.length + " URLs (Chrome DevTools). Paste into urls.txt");
} else if (navigator.clipboard && navigator.clipboard.writeText) {
  navigator.clipboard.writeText(text).then(() => {
    console.log("Copied " + unique.length + " URLs. Paste into urls.txt");
  }).catch(() => {
    console.log(unique.length + " URLs (copy failed, see below):\n" + text);
  });
} else {
  console.log(unique.length + " URLs — select and copy from below:\n\n" + text);
}
```

Then create `urls.txt` in your project root (one URL per line), paste, and run:

```bash
node scripts/download-framer-images.mjs --urls urls.txt
```

### B) Trigger a download for each image (browser will ask “Allow multiple downloads?”)

```javascript
const imgs = [...document.querySelectorAll("img")]
  .map((el) => el.currentSrc || el.src)
  .filter(Boolean);
const unique = [...new Set(imgs)];
unique.forEach((url, i) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = `framer-image-${i}.jpg`;
  a.target = "_blank";
  a.click();
});
console.log("Triggered " + unique.length + " downloads. Allow multiple downloads if the browser asks.");
```

Allow multiple downloads when the browser prompts. Files will go to your default Downloads folder; you can then move them into `public/images/` as needed.

---

## Method 2: Node script (HTML-only)

The script only sees image URLs that are already in the **HTML** of the page (not ones injected by JS). It’s still useful for a first pass.

From the project root:

```bash
# Homepage only
node scripts/download-framer-images.mjs

# Homepage + specific project pages (add any URLs you want)
node scripts/download-framer-images.mjs https://kansliet.co/project/laminar-01 https://kansliet.co/project/waffries
```

Images are saved to **`public/images/kansliet-downloaded/`**.

If it finds very few images, use Method 1 (browser) instead.

---

## Framer plugins (inside Framer)

In the Framer editor you can install:

- **Image Downloader** or **Save Image** from the Framer marketplace — they let you download (or copy) images from frames/components at full resolution. You may need to do it per frame or per page rather than “export entire site,” but you don’t need filesystem access; it’s all inside Framer.

---

**TL;DR:** Use the **browser Console** on kansliet.co after loading and scrolling the site, run the “copy URLs” snippet, paste into `urls.txt`, then run `node scripts/download-framer-images.mjs --urls urls.txt` to download everything into `public/images/kansliet-downloaded/`.
