"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { slugify, type ProductFields } from "@/lib/product-form";
import { saveProduct, type ProductFormState } from "./actions";
import { PhotoManager } from "./photo-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  images?: string[];
  categories: string[];
};

export function ProductForm({ productId, initial, images = [], categories }: ProductFormProps) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    saveProduct,
    { error: null }
  );
  const fields = state.fields ?? initial;

  // Slug follows the name until it's edited by hand (always, once created).
  const [slug, setSlug] = useState(fields.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(productId));

  const [uploading, setUploading] = useState(false);

  const prose = "text-normal-case tracking-normal";
  const resetKey = JSON.stringify(state.fields ?? null);

  return (
    <form action={formAction} className="grid max-w-3xl gap-6">
      {productId && (
        <>
          <input type="hidden" name="productId" value={productId} />
          {/* The stock the page loaded with (not the retyped value after an
              error), so the save applies only the change made here. */}
          <input type="hidden" name="previousStock" value={initial.stock} />
        </>
      )}

      {state.error && (
        <div role="alert" className="border border-red-500 bg-red-500/5 p-4 text-red-600">
          <p className="text-normal-case text-sm">{state.error}</p>
        </div>
      )}

      {/* Remounts after a failed save so defaultValues pick up what was
          submitted. Photos sit outside it, so uploads survive. */}
      <div key={`fields-${resetKey}`} className="grid gap-6">
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
          <Field label="PRICE (SEK)" htmlFor="price">
            <Input
              id="price"
              name="price"
              inputMode="decimal"
              required
              placeholder="450"
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
      </div>

      <Field label="PHOTOS" htmlFor="photo-picker">
        <PhotoManager initial={images} onBusyChange={setUploading} />
      </Field>

      <label key={`hidden-${resetKey}`} className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="hidden"
          defaultChecked={fields.hidden === "on"}
          className="h-4 w-4 accent-foreground"
        />
        <span className="text-caps tracking-wide">HIDE FROM STORE</span>
        <span className="text-normal-case font-light opacity-60">
          Drops it from the store; orders and Stripe stay intact.
        </span>
      </label>

      <div className="flex items-center gap-6 border-t-brutal pt-6">
        <Button type="submit" disabled={pending || uploading}>
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
