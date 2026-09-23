import Image from "next/image";
import { cn } from "@/lib/utils";

/** Dossier-style catalog reference, e.g. id 7 → "STR-007". */
export function productRef(id: number): string {
  return `STR-${String(id).padStart(3, "0")}`;
}

type ProductImageProps = {
  id: number;
  name: string;
  imageUrl: string | null;
  sizes: string;
  priority?: boolean;
  /** Small thumbnails (cart) skip the REF / name overlay. */
  compact?: boolean;
  className?: string;
};

/**
 * Product image panel, same treatment as the /works cards: a faint signal
 * tint with the REF stamped top-left. Products without a photo yet render a
 * typographic placeholder instead of a broken or stock image.
 */
export function ProductImage({
  id,
  name,
  imageUrl,
  sizes,
  priority,
  compact,
  className,
}: ProductImageProps) {
  return (
    <div className={cn("relative overflow-hidden bg-foreground/5", className)}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes={sizes}
          priority={priority}
        />
      ) : (
        !compact && (
          <div className="flex h-full items-center justify-center p-6">
            <span className="text-caps text-lg font-light tracking-wider opacity-40 text-center">
              {name}
            </span>
          </div>
        )
      )}
      {!compact && (
        <span className="absolute top-2 left-2 text-dossier text-caps tracking-wider opacity-70">
          REF: {productRef(id)}
        </span>
      )}
    </div>
  );
}
