"use client";

import { createContext, useContext, useState } from "react";
import Image from "next/image";
import type { ProductOption } from "@/lib/products";
import {
  imagesFor,
  option1SoldOut,
  option2SoldOut,
  selectionQuery,
  variantFor,
  type Selection,
} from "@/lib/variants";
import { maxLineQuantity } from "@/lib/cart-limits";
import { addToCart } from "@/app/(main)/store/(shop)/cart/actions";
import { Button } from "@/components/ui/button";
import { Carousel } from "@/components/ui/carousel";
import { ProductImage } from "@/components/store/ProductImage";
import { QuantityStepper } from "@/components/store/QuantityStepper";
import { cn } from "@/lib/utils";

/** What the product page's client parts need: no Stripe ids, just options and stock. */
export type PickerProduct = {
  id: number;
  name: string;
  hidden: boolean;
  images: string[];
  options: ProductOption[];
  variants: { id: number; option1: string | null; option2: string | null; stock: number }[];
};

type VariantState = {
  product: PickerProduct;
  selection: Selection;
  select: (next: Partial<Selection>) => void;
};

const VariantContext = createContext<VariantState | null>(null);

function useVariant(): VariantState {
  const state = useContext(VariantContext);
  if (!state) throw new Error("useVariant outside VariantProvider");
  return state;
}

/**
 * Holds the product page's pick (colour, size). The server resolves the
 * first pick from the URL, so the page renders right before any script runs;
 * switching after that is instant, and the URL follows (replaceState, no
 * request) so a shared link opens on the same colour and size.
 */
export function VariantProvider({
  product,
  initial,
  children,
}: {
  product: PickerProduct;
  initial: Selection;
  children: React.ReactNode;
}) {
  const [selection, setSelection] = useState(initial);

  function select(next: Partial<Selection>) {
    const merged = { ...selection, ...next };
    setSelection(merged);
    const query = selectionQuery(product, merged);
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }

  return (
    <VariantContext.Provider value={{ product, selection, select }}>{children}</VariantContext.Provider>
  );
}

/** The photos for the picked colour (its own, then the shared ones). */
export function VariantGallery() {
  const { product, selection } = useVariant();
  const images = imagesFor(product, selection.option1);
  const colour = selection.option1 ? `, ${selection.option1}` : "";

  if (images.length > 1) {
    return (
      // key: a new colour starts from its first photo.
      <Carousel
        key={selection.option1 ?? "shared"}
        images={images.map((src, index) => ({
          src,
          alt: `${product.name}${colour}, photo ${index + 1} of ${images.length}`,
        }))}
        variant="fullHeight"
        aria-label={`${product.name} photos`}
        className="grain h-full min-h-0 flex-1"
      />
    );
  }
  return (
    <ProductImage
      id={product.id}
      name={product.name}
      imageUrl={images[0] ?? null}
      tone="grain"
      className="h-full w-full"
      sizes="(max-width: 1024px) 100vw, 50vw"
      priority
    />
  );
}

/** The picked variant, or undefined while a size is still to be chosen. */
function useSelectedVariant() {
  const { product, selection } = useVariant();
  return variantFor(product, selection.option1, selection.option2);
}

function useSoldOut(): boolean {
  const { product, selection } = useVariant();
  const variant = useSelectedVariant();
  if (product.hidden) return true;
  if (variant) return variant.stock <= 0;
  // No size picked yet: sold out only if the colour has nothing at all.
  return selection.option1 !== null && option1SoldOut(product, selection.option1);
}

/** The SPEC sheet's status cell. */
export function VariantStatus() {
  return <>{useSoldOut() ? "Sold out" : "In stock"}</>;
}

const strike =
  "after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(to_top_right,transparent_calc(50%-0.5px),currentColor,transparent_calc(50%+0.5px))]";

/**
 * Colour as photo thumbnails (COS / Arket style) when the colours have
 * photos, else as text buttons; size as text buttons. Sold-out values stay
 * visible with a diagonal strike: a colour can still be picked (to see it),
 * a size can't.
 */
export function VariantOptions() {
  const { product, selection, select } = useVariant();
  const [first, second] = product.options;
  if (!first) return null;
  const thumbnails = first.values.some((value) => (value.images?.length ?? 0) > 0);

  return (
    <div className="max-w-xl space-y-6">
      <fieldset>
        <legend className="dossier-label mb-3">
          {first.name.toUpperCase()}
          {selection.option1 && ` — ${selection.option1.toUpperCase()}`}
        </legend>
        <div className="flex flex-wrap gap-2">
          {first.values.map((value) => {
            const picked = value.value === selection.option1;
            const soldOut = option1SoldOut(product, value.value);
            const label = `${value.value}${soldOut ? ", sold out" : ""}`;
            const cover = imagesFor(product, value.value)[0];
            return thumbnails ? (
              <button
                key={value.value}
                type="button"
                aria-label={label}
                aria-pressed={picked}
                title={label}
                onClick={() => select({ option1: value.value })}
                className={cn(
                  "relative h-16 w-14 cursor-pointer overflow-hidden border bg-foreground/5",
                  picked ? "border-foreground" : "border-foreground/20 hover:border-foreground/60",
                  soldOut && cn("opacity-50", strike),
                )}
              >
                {cover && <Image src={cover} alt="" fill sizes="56px" className="object-cover" />}
              </button>
            ) : (
              <TextOption
                key={value.value}
                label={value.value}
                picked={picked}
                soldOut={soldOut}
                onClick={() => select({ option1: value.value })}
              />
            );
          })}
        </div>
      </fieldset>

      {second && (
        <fieldset>
          <legend className="dossier-label mb-3">
            {second.name.toUpperCase()}
            {selection.option2 && ` — ${selection.option2.toUpperCase()}`}
          </legend>
          <div className="flex flex-wrap gap-2">
            {second.values.map((value) => {
              const soldOut = option2SoldOut(product, selection.option1, value.value);
              return (
                <TextOption
                  key={value.value}
                  label={value.value}
                  picked={value.value === selection.option2}
                  soldOut={soldOut}
                  disabled={soldOut}
                  onClick={() => select({ option2: value.value })}
                />
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}

function TextOption({
  label,
  picked,
  soldOut,
  disabled,
  onClick,
}: {
  label: string;
  picked: boolean;
  soldOut: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={picked}
      aria-label={`${label}${soldOut ? ", sold out" : ""}`}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "text-caps relative min-w-12 cursor-pointer border px-3 py-2 text-sm tracking-wider disabled:cursor-not-allowed",
        picked ? "border-foreground bg-foreground text-background" : "border-foreground/30 hover:border-foreground",
        soldOut && cn("opacity-40", strike),
      )}
    >
      {label}
    </button>
  );
}

/** Quantity and the add button, for the picked variant. */
export function VariantAddToCart({ displayPrice }: { displayPrice: string }) {
  const { product } = useVariant();
  const variant = useSelectedVariant();
  const soldOut = useSoldOut();
  const needsSize = !variant && product.options.length > 1;

  if (soldOut) {
    return (
      <Button type="button" disabled className="w-full max-w-xl">
        SOLD OUT — {displayPrice}
      </Button>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-2">
      <form action={addToCart} className="flex items-end gap-3">
        {variant && <input type="hidden" name="variantId" value={variant.id} />}
        <div className="w-32 shrink-0">
          <label htmlFor="quantity" className="dossier-label mb-2 block">
            QTY
          </label>
          {/* key: a new pick starts again at 1, capped at its own stock. */}
          <QuantityStepper
            key={variant?.id ?? "none"}
            id="quantity"
            name="quantity"
            max={Math.max(1, maxLineQuantity(variant?.stock ?? 1))}
          />
        </div>
        <Button type="submit" disabled={needsSize} className="flex-1 justify-between gap-4 py-3.5">
          <span>{needsSize ? `SELECT ${product.options[1].name.toUpperCase()}` : "ADD TO CART"}</span>
          <span className="tabular-nums">{displayPrice}</span>
        </Button>
      </form>
      {/* Prices include VAT (prisinformationslagen) without saying so, the
          Swedish norm for consumer shops. Extra delivery costs must be
          flagged before purchase, hence this line. */}
      <p className="text-normal-case text-sm font-light opacity-60 sm:text-right">
        Shipping is calculated in the cart.
      </p>
    </div>
  );
}
