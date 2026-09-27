"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/** The pixelated stages: tiny versions of the image, px wide. */
const PIXEL_WIDTHS = [16, 32];
/**
 * An image that arrives within this long of being asked for was cached (or
 * as good as): it's shown straight away, with no pixelated stages.
 */
const CACHED_MS = 80;

/** A tiny version of a local image from Next's optimizer (widths must be in images.imageSizes). */
const tiny = (src: string, w: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;

/**
 * An image that, when it actually has to load, arrives pixelated and
 * resolves as the data comes in: a 16 px wide version stretched to fill the
 * frame with no smoothing (big hard blocks), then a 32 px one, then the image
 * itself, each shown as soon as it has loaded. Already cached: it's simply
 * there. Every stage uses the same object-fit: cover, so the framing never
 * shifts. Fills its positioned parent. Used by the works archive preview and
 * the project page photos.
 */
export function PixelReveal({
  src,
  alt = "",
  sizes,
  eager = false,
}: {
  src: string;
  alt?: string;
  sizes: string;
  /** The page's main image: fetch it straight away, first. */
  eager?: boolean;
}) {
  // Which stages have loaded: 16 px, 32 px, full.
  const [loaded, setLoaded] = useState([false, false, false]);
  const [waiting, setWaiting] = useState(false); // past CACHED_MS without the full image
  const markLoaded = (i: number) => setLoaded((l) => l.map((v, j) => v || j === i));

  // On a server-rendered page the tiny stages can finish before hydration,
  // when React isn't listening yet, so their onLoad never fires: check them
  // once on mount. (next/image does the same for the full image itself.)
  const stageRefs = useRef<(HTMLImageElement | null)[]>([]);
  useEffect(() => {
    stageRefs.current.forEach((img, i) => {
      if (img?.complete) setLoaded((l) => l.map((v, j) => v || j === i));
    });
  }, []);

  // A cached image fires onLoad well within CACHED_MS, before any stage shows.
  useEffect(() => {
    const t = window.setTimeout(() => setWaiting(true), CACHED_MS);
    return () => window.clearTimeout(t);
  }, []);

  // The best stage we have; pixel stages only once it's clearly a real load.
  const shown = loaded[2] ? 2 : !waiting ? -1 : loaded[1] ? 1 : loaded[0] ? 0 : -1;
  const show = (i: number) => ({ visibility: shown === i ? ("visible" as const) : ("hidden" as const) });
  return (
    <>
      {PIXEL_WIDTHS.map((w, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- deliberately tiny and unoptimised further
        <img
          key={w}
          ref={(el) => {
            stageRefs.current[i] = el;
          }}
          src={tiny(src, w)}
          alt=""
          onLoad={() => markLoaded(i)}
          onError={() => markLoaded(i)} // a failed stage is skipped, never waited on
          className="absolute inset-0 h-full w-full object-cover"
          style={{ imageRendering: "pixelated", ...show(i) }}
        />
      ))}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : undefined}
        fetchPriority={eager ? "high" : undefined}
        className="object-cover"
        style={show(2)}
        onLoad={() => markLoaded(2)}
        onError={() => markLoaded(2)}
      />
    </>
  );
}
