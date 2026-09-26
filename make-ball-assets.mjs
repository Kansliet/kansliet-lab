// Builds the textures the home page steel ball renders from, out of the
// logomark photo and a fingerprint overlay. Run once (and again if either
// changes):
//
//   node make-ball-assets.mjs [path/to/photo.png] [path/to/fingerprints.jpg]
//
// public/ball/matcap.png          The photo with its specks removed. The shader
//                                 looks it up by view normal, so reflections
//                                 stay fixed to the viewer as the ball rolls.
// public/ball/imperfections.png   Equirectangular map wrapped on the ball and
//                                 rotated with it: R bright specks and hairline
//                                 scratches, G dark pits, B smudges (128 =
//                                 clean, above = oily haze).
// public/ball/fingerprints.webp   Equirectangular, from the fingerprint overlay
//                                 (prints light on black, tileable), at twice
//                                 the resolution so the ridges hold up.
//
// The photo must be a front view of the ball, filling the square, background
// transparent (the current one is 810×810, sphere radius ~403px, centred).
// The overlay is a source file only: keep it out of the published site. It's
// optional; without it the existing fingerprints.webp is kept.

import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";

const SRC = process.argv[2] ?? "public/kansliet-button-final-lores.png";
const PRINTS_SRC = process.argv[3] ?? "public/Fingerprints002_OVERLAY_VAR1_HIRES.jpg";
const OUT = "public/ball";
const MATCAP = 512;
const EQ_W = 1024;
const EQ_H = 512;

// Deterministic randomness, so re-running gives the same ball.
let seed = 20260926;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};

mkdirSync(OUT, { recursive: true });

const photo = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = photo.info;
const src = photo.data;
// A median wide enough to erase specks (a few px) but not the soft reflections.
const clean = await sharp(SRC).ensureAlpha().median(9).raw().toBuffer();

// Sphere geometry from the alpha mask.
let minX = W, maxX = 0, minY = H, maxY = 0;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++)
    if (src[(y * W + x) * 4 + 3] > 128) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
const cx = (minX + maxX) / 2;
const cy = (minY + maxY) / 2;
const R = (maxX - minX) / 2;

// --- Matcap: the cleaned photo, resized, alpha kept for the edge. ---
await sharp(clean, { raw: { width: W, height: H, channels: 4 } })
  .extract({
    left: Math.round(cx - R),
    top: Math.round(cy - R),
    width: Math.round(2 * R),
    height: Math.round(2 * R),
  })
  .resize(MATCAP, MATCAP)
  .png()
  .toFile(`${OUT}/matcap.png`);

// --- Speck field from the photo: photo minus its cleaned self. ---
const lum = (buf, i) => 0.299 * buf[i] + 0.587 * buf[i + 1] + 0.114 * buf[i + 2];
const bright = new Float32Array(W * H);
const dark = new Float32Array(W * H);
const T = 10; // ignore small differences: soft reflection edges, JPEG noise
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const r = Math.hypot(x - cx, y - cy) / R;
    if (r > 0.96) continue; // the rim is too foreshortened to trust
    const i = (y * W + x) * 4;
    const d = lum(src, i) - lum(clean, i);
    bright[y * W + x] = Math.max(0, d - T) / 60;
    dark[y * W + x] = Math.max(0, -d - T) / 60;
  }
// Max over a 3×3 neighbourhood: each photo speck grows by a pixel, so they
// hold up at the size the ball is shown.
const samplePhoto = (field, px, py) => {
  const x = Math.round(px), y = Math.round(py);
  let m = 0;
  for (let j = y - 1; j <= y + 1; j++)
    for (let i = x - 1; i <= x + 1; i++)
      if (i >= 0 && j >= 0 && i < W && j < H) m = Math.max(m, field[j * W + i]);
  return m;
};

// --- Unwrap onto the sphere. ---
const R_ = new Float32Array(EQ_W * EQ_H);
const G_ = new Float32Array(EQ_W * EQ_H);
const B_ = new Float32Array(EQ_W * EQ_H).fill(0.5);
const dir = (u, v) => {
  const lon = (u - 0.5) * 2 * Math.PI;
  const lat = (0.5 - v) * Math.PI;
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
};
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

for (let j = 0; j < EQ_H; j++)
  for (let i = 0; i < EQ_W; i++) {
    const [x, y, z] = dir((i + 0.5) / EQ_W, (j + 0.5) / EQ_H);
    // Front hemisphere reads the photo as seen; the back reads it turned a
    // quarter and mirrored, so the two halves don't echo each other.
    const [sx, sy] = z >= 0 ? [x, y] : [y, -x];
    const w = smooth(0.2, 0.45, Math.abs(z)); // fade where the photo is foreshortened
    const px = cx + sx * R;
    const py = cy - sy * R;
    const k = j * EQ_W + i;
    R_[k] = samplePhoto(bright, px, py) * w;
    G_[k] = samplePhoto(dark, px, py) * w;
  }

// Stamp something at a point on the sphere, widened by 1/cos(lat) so it stays
// round once wrapped.
const stamp = (field, p, radiusPx, amount, mode = "max") => {
  const lat = Math.asin(Math.max(-1, Math.min(1, p[1])));
  const lon = Math.atan2(p[0], p[2]);
  const u = (lon / (2 * Math.PI) + 0.5) * EQ_W;
  const v = (0.5 - lat / Math.PI) * EQ_H;
  const sx = radiusPx / Math.max(0.05, Math.cos(lat));
  for (let dj = -Math.ceil(radiusPx); dj <= Math.ceil(radiusPx); dj++)
    for (let di = -Math.ceil(sx); di <= Math.ceil(sx); di++) {
      const j = Math.round(v + dj);
      if (j < 0 || j >= EQ_H) continue;
      const i = (((Math.round(u + di)) % EQ_W) + EQ_W) % EQ_W;
      const d = Math.hypot(di / sx, dj / radiusPx);
      if (d > 1) continue;
      const a = amount * (1 - d * d);
      const k = j * EQ_W + i;
      field[k] = mode === "add" ? field[k] + a : Math.max(field[k], a);
    }
};
const randomDir = () => {
  const z = rand() * 2 - 1;
  const t = rand() * 2 * Math.PI;
  const s = Math.sqrt(1 - z * z);
  return [s * Math.cos(t), z, s * Math.sin(t)];
};
const normalize = (p) => {
  const l = Math.hypot(...p);
  return p.map((c) => c / l);
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// Extra specks and pits, so the rim band and the back aren't bare.
for (let n = 0; n < 90; n++) stamp(R_, randomDir(), 1.3 + rand() * 1.9, 0.35 + rand() * 0.6);
for (let n = 0; n < 50; n++) stamp(G_, randomDir(), 1.3 + rand() * 1.6, 0.3 + rand() * 0.5);

// Hairline scratches: short arcs of great circles, faint and bright.
for (let n = 0; n < 34; n++) {
  const a = randomDir();
  const t = normalize(cross(a, randomDir())); // a tangent direction at a
  const length = 0.08 + rand() * 0.35; // radians
  const strength = 0.12 + rand() * 0.25;
  const steps = Math.ceil(length * 700);
  for (let s = 0; s <= steps; s++) {
    const ang = (s / steps - 0.5) * length;
    const p = [0, 1, 2].map((c) => a[c] * Math.cos(ang) + t[c] * Math.sin(ang));
    // Taper the ends like a real scratch.
    const taper = Math.sin((s / steps) * Math.PI);
    stamp(R_, p, 1.0, strength * taper);
  }
}

// Everything below goes in B, 0.5 = clean: above is an oily haze (the shader
// lifts the dark reflections there), below a faint darkening. All very faint:
// they're there to be seen moving, not to be seen.

// Smudges: soft patches, mostly haze, some dragged into short wipes.
for (let n = 0; n < 46; n++) {
  const a = randomDir();
  const haze = rand() < 0.8;
  const size = 18 + rand() * 52;
  const amount = 0.035 + rand() * 0.06;
  const field = new Float32Array(EQ_W * EQ_H);
  if (rand() < 0.4) {
    // A wipe: the blob dragged along a short arc.
    const t = normalize(cross(a, randomDir()));
    const length = 0.1 + rand() * 0.25;
    for (let s = 0; s <= 12; s++) {
      const ang = (s / 12 - 0.5) * length;
      const q = [0, 1, 2].map((c) => a[c] * Math.cos(ang) + t[c] * Math.sin(ang));
      stamp(field, q, size * 0.6, amount * Math.sin((s / 12) * Math.PI));
    }
  } else {
    stamp(field, a, size, amount);
  }
  for (let k = 0; k < B_.length; k++) B_[k] += haze ? field[k] : -field[k] * 0.6;
}

// Smooth 3D value noise, 0..1 (hash on the integer lattice, smoothstep blend),
// sampled with directions on the sphere so it wraps seamlessly.
const hash3 = (x, y, z) => {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32;
};
const noise3 = (x, y, z) => {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const sm = (t) => t * t * (3 - 2 * t);
  const fx = sm(x - xi), fy = sm(y - yi), fz = sm(z - zi);
  const lerp = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), fx), lerp(c(0, 1, 0), c(1, 1, 0), fx), fy),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), fx), lerp(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz,
  );
};

const out = Buffer.alloc(EQ_W * EQ_H * 3);
const byte = (f) => Math.max(0, Math.min(255, Math.round(f * 255)));
for (let k = 0; k < EQ_W * EQ_H; k++) {
  out[k * 3] = byte(R_[k]);
  out[k * 3 + 1] = byte(G_[k]);
  out[k * 3 + 2] = byte(B_[k]);
}
await sharp(out, { raw: { width: EQ_W, height: EQ_H, channels: 3 } })
  .png()
  .toFile(`${OUT}/imperfections.png`);

// --- Fingerprints, from the overlay photo. ---
// Projected from three sides and blended by how squarely each faces the
// surface (triplanar), so the flat overlay wraps the ball without pinching.
// Scaled so a print is ~a third of the ball across, like a real fingertip on
// a ~40 mm ball; the overlay's prints are ~1/8 of its width. A soft random
// mask keeps prints to part of the ball: it's handled, not grimy.
const FP_W = 2048;
const FP_H = 1024;
// The overlay is optional: without it, the fingerprints.webp already made
// from it is kept.
const hasPrints = existsSync(PRINTS_SRC);
if (hasPrints) {
  const src2 = await sharp(PRINTS_SRC, { limitInputPixels: false }).metadata();
  const PRINT_PX = src2.width / 8; // one print, in overlay pixels
  const UNIT = PRINT_PX / 0.6; // overlay pixels per ball radius (print ≈ 0.6 R)
  // Work at the resolution the output needs (~1 overlay px per output texel).
  const texel = (2 * Math.PI) / FP_W; // radians per output texel
  const scale = 1 / (UNIT * texel);
  const prints = await sharp(PRINTS_SRC, { limitInputPixels: false })
    .greyscale()
    .resize(Math.round(src2.width * scale))
    .raw()
    .toBuffer({ resolveWithObject: true });
  const PW = prints.info.width, PH = prints.info.height, P = prints.data;
  const unit = UNIT * scale;
  // Levels: the overlay's 10th percentile (bare black) to 0, 99th to 1.
  const sorted = Uint8Array.from(P).sort();
  const lo = sorted[Math.floor(sorted.length * 0.1)], hi = sorted[Math.floor(sorted.length * 0.99)];
  const fetch = (x, y) => {
    // Bilinear, wrapping (the overlay tiles).
    x = ((x % PW) + PW) % PW;
    y = ((y % PH) + PH) % PH;
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const at = (i, j) => P[(j % PH) * PW + (i % PW)];
    const v = (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy;
    return Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
  };
  // A different region of the overlay for each projection, so no print repeats.
  const planes = [
    [PW * 0.0, PH * 0.0],
    [PW * 0.33, PH * 0.41],
    [PW * 0.67, PH * 0.77],
  ];
  const fp = Buffer.alloc(FP_W * FP_H);
  for (let j = 0; j < FP_H; j++)
    for (let i = 0; i < FP_W; i++) {
      const [x, y, z] = dir((i + 0.5) / FP_W, (j + 0.5) / FP_H);
      let wx = x ** 4, wy = y ** 4, wz = z ** 4;
      const ws = wx + wy + wz;
      wx /= ws; wy /= ws; wz /= ws;
      const v =
        wx * fetch(planes[0][0] + y * unit, planes[0][1] + z * unit) +
        wy * fetch(planes[1][0] + z * unit, planes[1][1] + x * unit) +
        wz * fetch(planes[2][0] + x * unit, planes[2][1] + y * unit);
      const mask = smooth(0.42, 0.68, noise3(x * 1.8 + 11, y * 1.8 + 3, z * 1.8 + 7));
      fp[j * FP_W + i] = Math.round(255 * v * mask);
    }
  await sharp(fp, { raw: { width: FP_W, height: FP_H, channels: 1 } })
    .webp({ quality: 82 })
    .toFile(`${OUT}/fingerprints.webp`);
}

console.log(
  `sphere centre (${cx}, ${cy}) radius ${R}; wrote ${OUT}/matcap.png, ${OUT}/imperfections.png` +
    (hasPrints ? `, ${OUT}/fingerprints.webp` : ` (no ${PRINTS_SRC}: kept ${OUT}/fingerprints.webp)`),
);
