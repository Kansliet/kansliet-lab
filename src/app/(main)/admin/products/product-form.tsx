"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "next-view-transitions";
import { MAX_PHOTO_BYTES, slugify, type ProductFields } from "@/lib/product-form";
import { saveProduct, type ProductFormState } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  throw new Error("Could not shrink this photo enough. Try a different one.");
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="dossier-label mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-normal-case mt-1 text-sm font-light opacity-60">{hint}</p>}
    </div>
  );
}

type ProductFormProps = {
  productId?: number;
  initial: ProductFields;
  imageUrl?: string | null;
  categories: string[];
};

export function ProductForm({ productId, initial, imageUrl, categories }: ProductFormProps) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    saveProduct,
    { error: null }
  );
  const fields = state.fields ?? initial;

  // Slug follows the name until it's edited by hand (always, once created).
  const [slug, setSlug] = useState(fields.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(productId));

  const [preview, setPreview] = useState<string | null>(imageUrl ?? null);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  async function onPhotoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked || !photoInput.current) return;
    setPhotoStatus("Shrinking photo…");
    try {
      const small = await shrinkPhoto(picked);
      // Swap the shrunk file into the named input the server action reads.
      const transfer = new DataTransfer();
      transfer.items.add(small);
      photoInput.current.files = transfer.files;
      // data: URL, not blob: — the CSP's img-src allows data: only.
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(small);
      setPhotoStatus(`Ready: ${Math.round(small.size / 1024)} KB`);
    } catch (err) {
      photoInput.current.value = "";
      setPhotoStatus(err instanceof Error ? err.message : "Could not read that photo.");
    }
  }

  const prose = "text-normal-case tracking-normal";

  return (
    <form
      // Remount after a failed save so defaultValues pick up what was submitted.
      key={JSON.stringify(state.fields ?? null)}
      action={formAction}
      className="grid max-w-3xl gap-6"
    >
      {productId && <input type="hidden" name="productId" value={productId} />}

      {state.error && (
        <div role="alert" className="border border-red-500 bg-red-500/5 p-4 text-red-600">
          <p className="text-normal-case text-sm">{state.error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="NAME" htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            defaultValue={fields.name}
            className={prose}
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <Field label="SLUG" htmlFor="slug" hint={`kansliet.co/store/${slug || "…"}`}>
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            className={prose}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </Field>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Field label="CATEGORY" htmlFor="category" hint="Pick one or type a new one.">
          <Input
            id="category"
            name="category"
            list="categories"
            required
            defaultValue={fields.category}
          />
          <datalist id="categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Field>
        <Field label="PRICE (EUR)" htmlFor="price">
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            required
            placeholder="45.00"
            defaultValue={fields.price}
          />
        </Field>
        <Field label="STOCK" htmlFor="stock">
          <Input
            id="stock"
            name="stock"
            inputMode="numeric"
            required
            defaultValue={fields.stock}
          />
        </Field>
      </div>

      <Field label="TAGLINE" htmlFor="tagline" hint="One line, shown large on the product page and in Stripe Checkout.">
        <Input id="tagline" name="tagline" defaultValue={fields.tagline} className={prose} />
      </Field>

      <Field label="DESCRIPTION" htmlFor="description" hint="Leave a blank line between paragraphs.">
        <Textarea
          id="description"
          name="description"
          rows={7}
          defaultValue={fields.description}
          className={prose}
        />
      </Field>

      <Field label="SPECS" htmlFor="specs" hint="One per line, as Label: value. E.g. Material: 16 oz cotton canvas">
        <Textarea
          id="specs"
          name="specs"
          rows={6}
          defaultValue={fields.specs}
          className={prose}
          placeholder={"Material: …\nDimensions: …\nMade in: …"}
        />
      </Field>

      <Field
        label="PHOTO"
        htmlFor="photo-picker"
        hint={
          photoStatus ??
          (productId ? "Leave empty to keep the current photo." : "Any size; it's shrunk before upload.")
        }
      >
        <div className="flex items-center gap-4">
          {preview && (
            // Through next/image, not a bare <img>: the CSP only allows
            // files.stripe.com via the optimizer. data: previews skip it.
            <Image
              src={preview}
              alt=""
              width={80}
              height={80}
              unoptimized={preview.startsWith("data:")}
              className="h-20 w-20 border-brutal object-cover"
            />
          )}
          <label
            htmlFor="photo-picker"
            className={buttonVariants({ variant: "secondary", size: "sm", className: "cursor-pointer" })}
          >
            {preview ? "REPLACE PHOTO" : "CHOOSE PHOTO"}
          </label>
          <input
            id="photo-picker"
            type="file"
            accept="image/*"
            onChange={onPhotoPicked}
            className="sr-only"
          />
          <input ref={photoInput} type="file" name="photo" hidden />
        </div>
      </Field>

      <div className="flex items-center gap-6 border-t-brutal pt-6">
        <Button type="submit" disabled={pending || photoStatus === "Shrinking photo…"}>
          {pending ? "SAVING…" : productId ? "SAVE CHANGES" : "CREATE PRODUCT"}
        </Button>
        <Link
          href="/admin/products"
          className="text-caps text-sm font-light tracking-wider opacity-60 transition-opacity hover:opacity-100"
        >
          CANCEL
        </Link>
      </div>
    </form>
  );
}
