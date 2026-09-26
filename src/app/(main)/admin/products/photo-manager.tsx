"use client";

import { useState } from "react";
import Image from "next/image";
import { MAX_IMAGES, MAX_PHOTO_BYTES } from "@/lib/product-form";
import { uploadProductPhoto } from "./actions";
import { buttonVariants } from "@/components/ui/button";

/**
 * Shrinks a photo to a JPEG under Stripe's upload cap, in the browser, so any
 * camera or phone photo can be dropped in as-is. Steps size and quality down
 * until it fits; 1600px at 0.85 usually lands at 200–400 KB on the first try.
 */
async function shrinkPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  let edge = 1600;
  let quality = 0.85;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; // transparent PNGs flatten onto white, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (blob && blob.size <= MAX_PHOTO_BYTES) {
      const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      return new File([blob], name, { type: "image/jpeg" });
    }
    edge = Math.round(edge * 0.8);
    quality = Math.max(0.6, quality - 0.05);
  }
  throw new Error(`Could not shrink ${file.name} enough. Try a different photo.`);
}

const controlButton =
  "flex h-6 w-6 items-center justify-center bg-background text-sm transition-opacity hover:opacity-60 disabled:pointer-events-none disabled:opacity-25";

/**
 * Photos upload one at a time as they're picked; the form then submits only
 * the ordered URL list (hidden "images" input). Lives outside the part of the
 * form that remounts after a failed save, so uploaded photos are never lost.
 */
export function PhotoManager({
  initial,
  onBusyChange,
}: {
  initial: string[];
  onBusyChange: (busy: boolean) => void;
}) {
  const [images, setImages] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);
  const room = MAX_IMAGES - images.length;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    const files = picked.slice(0, room);
    onBusyChange(true);
    const errors: string[] = [];
    for (const [i, file] of files.entries()) {
      setStatus(`Uploading ${i + 1} of ${files.length}…`);
      try {
        const body = new FormData();
        body.set("photo", await shrinkPhoto(file));
        const result = await uploadProductPhoto(body);
        if ("url" in result) setImages((current) => [...current, result.url]);
        else errors.push(`${file.name}: ${result.error}`);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `${file.name}: could not read it.`);
      }
    }
    if (picked.length > files.length) errors.push(`Only ${MAX_IMAGES} photos per product.`);
    setStatus(errors.length ? errors.join(" ") : null);
    onBusyChange(false);
  }

  function move(index: number, by: -1 | 1) {
    setImages((current) => {
      const next = [...current];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });
  }

  return (
    <div>
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <div className="flex flex-wrap gap-3">
        {images.map((url, index) => (
          <div key={url} className="relative h-28 w-28 border-brutal">
            <Image src={url} alt="" fill sizes="112px" className="object-cover" />
            {index === 0 && (
              <span className="dossier-label absolute top-0 left-0">COVER</span>
            )}
            <div className="absolute right-0 bottom-0 left-0 flex justify-between border-t-brutal bg-background">
              <button
                type="button"
                aria-label="Move left"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className={controlButton}
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => setImages((current) => current.filter((u) => u !== url))}
                className={controlButton}
              >
                ×
              </button>
              <button
                type="button"
                aria-label="Move right"
                disabled={index === images.length - 1}
                onClick={() => move(index, 1)}
                className={controlButton}
              >
                →
              </button>
            </div>
          </div>
        ))}
        {room > 0 && (
          <label
            htmlFor="photo-picker"
            className={buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "h-28 w-28 cursor-pointer px-2 text-center",
            })}
          >
            + ADD PHOTOS
          </label>
        )}
        <input
          id="photo-picker"
          type="file"
          accept="image/*"
          multiple
          onChange={onPick}
          className="sr-only"
        />
      </div>
      <p className="text-normal-case mt-2 text-sm font-light opacity-60">
        {status ??
          `Up to ${MAX_IMAGES}, any size (shrunk before upload). The first is the cover in the store grid, cart and checkout.`}
      </p>
    </div>
  );
}
