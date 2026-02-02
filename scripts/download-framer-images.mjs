#!/usr/bin/env node
/**
 * Download images from a Framer site (e.g. kansliet.co).
 *
 * Framer often loads images via JS, so the HTML fetch may not find everything.
 * For best results, use the browser method in docs/DOWNLOAD-FRAMER-IMAGES.md
 * to get all image URLs, then run this script with a file of URLs.
 *
 * Usage:
 *   node scripts/download-framer-images.mjs                    # fetch homepage, extract & download
 *   node scripts/download-framer-images.mjs https://kansliet.co/project/xyz   # add more URLs
 *   node scripts/download-framer-images.mjs --urls urls.txt    # download from URL list file
 */

const BASE = "https://kansliet.co";
const OUT_DIR = "public/images/kansliet-downloaded";

const urlsToFetch = process.argv.filter((a) => a.startsWith("http"));
const urlsFile = process.argv.includes("--urls")
  ? process.argv[process.argv.indexOf("--urls") + 1]
  : null;

function extractImageUrls(html, baseUrl) {
  const urls = new Set();
  const base = new URL(baseUrl);

  // img src="..."
  const srcRe = /<img[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = srcRe.exec(html))) urls.add(m[1]);

  // srcset (e.g. url 1x, url2 2x)
  const srcsetRe = /srcset=["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html))) {
    m[1].split(",").forEach((part) => {
      const url = part.trim().split(/\s+/)[0];
      if (url) urls.add(url);
    });
  }

  // data-src (lazy)
  const dataSrcRe = /data-src=["']([^"']+)["']/gi;
  while ((m = dataSrcRe.exec(html))) urls.add(m[1]);

  // Resolve relative URLs
  return [...urls].map((u) => {
    try {
      return new URL(u, base).href;
    } catch {
      return u;
    }
  });
}

function isImageUrl(url) {
  try {
    const u = new URL(url);
    return (
      /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i.test(u.pathname) ||
      u.hostname.includes("framerusercontent") ||
      u.hostname.includes("framer.com") ||
      u.hostname.includes("cdn.framer")
    );
  } catch {
    return false;
  }
}

function safeFilename(url, index) {
  try {
    const u = new URL(url);
    const pathname = u.pathname.replace(/^\//, "");
    const base = pathname.split("/").pop() || `image-${index}`;
    const beforeQ = base.split("?")[0];
    const ext = beforeQ.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)
      ? ""
      : ".jpg";
    return (beforeQ.replace(/\.[a-z]+$/i, "") || `image-${index}`) + ext;
  } catch {
    return `image-${index}.jpg`;
  }
}

async function download(url, filepath) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Kansliet download)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const fs = await import("fs");
  const path = await import("path");
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filepath, buf);
}

async function main() {
  const fs = await import("fs");
  const path = await import("path");
  const outDir = path.join(process.cwd(), OUT_DIR);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  let allUrls = new Set();

  if (urlsFile) {
    const content = fs.readFileSync(urlsFile, "utf8");
    content
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((u) => allUrls.add(u));
    console.log(`Loaded ${allUrls.size} URLs from ${urlsFile}`);
  }

  const pagesToFetch = urlsToFetch.length ? urlsToFetch : [BASE];
  for (const pageUrl of pagesToFetch) {
    console.log(`Fetching ${pageUrl}...`);
    try {
      const res = await fetch(pageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/119.0",
        },
      });
      const html = await res.text();
      const urls = extractImageUrls(html, pageUrl).filter(isImageUrl);
      urls.forEach((u) => allUrls.add(u));
      console.log(`  Found ${urls.length} image URLs`);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }

  const list = [...allUrls];
  if (list.length === 0) {
    console.log(
      "\nNo image URLs found. Framer often loads images via JavaScript."
    );
    console.log("Use the browser method in docs/DOWNLOAD-FRAMER-IMAGES.md");
    process.exit(1);
  }

  console.log(`\nDownloading ${list.length} images to ${OUT_DIR}/`);
  let ok = 0;
  for (let i = 0; i < list.length; i++) {
    const url = list[i];
    const name = safeFilename(url, i);
    const filepath = path.join(outDir, name);
    try {
      await download(url, filepath);
      ok++;
      console.log(`  [${ok}/${list.length}] ${name}`);
    } catch (err) {
      console.log(`  skip ${name}: ${err.message}`);
    }
  }
  console.log(`\nDone. ${ok} images saved to ${OUT_DIR}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
