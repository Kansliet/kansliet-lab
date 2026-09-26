"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { ArchivePlate, ArchiveProject } from "./archive-data";

/** Thumbnail box: fixed size, so one copy's height is known without measuring images. */
const PLATE_W = 103;
const PLATE_H = 130;
const GAP = 8;
const STEP = PLATE_H + GAP;
const COPIES = 3;
const PREVIEW_SIZES = "(max-width: 1400px) 34vw, 480px";

/**
 * The works archive as a ticker: one narrow column of small plates that
 * scrolls without end over an empty field of paper, snapping each plate onto
 * the centre line. The plate on the centre line is the selected one: in
 * colour and shown as a figure beside the column. A click anywhere
 * opens the selected project, wherever the cursor happens to be.
 *
 * Endless = three copies of the list; when the scroll drifts out of the
 * middle copy it jumps by exactly one copy height, which looks identical.
 * The plates are decoration for pointer users: keyboard and screen-reader
 * users get one plain link per project instead (visually hidden list).
 */
export function ArchiveColumn({
  plates,
  projects,
  className = "",
}: {
  plates: ArchivePlate[];
  projects: ArchiveProject[];
  className?: string;
}) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const copyHeight = plates.length * STEP;

  // Start in the middle copy, first plate on the centre line.
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = copyHeight + PLATE_H / 2;
  }, [copyHeight]);

  const current = plates[active];
  // Warm the selected project's page so the click opens it instantly.
  useEffect(() => {
    if (current) router.prefetch(`/works/${current.projectId}`);
  }, [current, router]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    if (el.scrollTop < copyHeight * 0.5) el.scrollTop += copyHeight;
    else if (el.scrollTop > copyHeight * 1.5) el.scrollTop -= copyHeight;
    // The plate whose centre is nearest the centre line. With the column
    // padded by half the window, plate i is centred at scrollTop = i·STEP + PLATE_H/2.
    const i = Math.round((el.scrollTop - PLATE_H / 2) / STEP);
    setActive(((i % plates.length) + plates.length) % plates.length);
  };

  const open = () => {
    if (current) router.push(`/works/${current.projectId}`);
  };

  return (
    <section className={`relative h-screen overflow-hidden ${className}`} aria-label="Works archive">
      {/* The figure: the selected image at a moderate size beside the column,
          caption beneath — a plate in a document, not a takeover. It arrives
          pixelated and resolves. Phones have no room beside the column:
          caption only. */}
      {current && (
        <figure
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-[calc(50%+103px)] hidden -translate-y-1/2 md:block"
        >
          <div className="grain relative h-[44vh] w-[min(34vw,36vh)] overflow-hidden bg-foreground/5">
            <PixelReveal key={current.src} src={current.src} />
          </div>
          <figcaption className="mt-2 text-dossier uppercase tracking-wider">{current.caption}</figcaption>
        </figure>
      )}
      {current && (
        // Wrapper carries md:hidden: .dossier-label sets its own display,
        // which would override it on the same element.
        <div aria-hidden className="pointer-events-none absolute top-3 left-3 z-10 md:hidden">
          <p className="dossier-label">{current.caption}</p>
        </div>
      )}

      {/* The scroller spans the whole page, so the wheel or a swipe anywhere
          moves the column and a click anywhere opens the selection; the
          column itself stays narrow and centred. */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        onClick={open}
        aria-hidden
        className="absolute inset-0 cursor-pointer snap-y snap-mandatory overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Padding so the first and last plates can reach the centre line. */}
        <div
          className="mx-auto flex flex-col items-center"
          style={{ width: PLATE_W + 24, gap: GAP, paddingBlock: "50vh" }}
        >
          {Array.from({ length: COPIES }, (_, copy) =>
            plates.map((plate, index) => (
              <div
                key={`${copy}-${index}`}
                data-active={active === index}
                className="relative shrink-0 snap-center bg-foreground/5 grayscale contrast-105 transition-[filter] duration-150 data-[active=true]:grayscale-0 data-[active=true]:contrast-100"
                style={{ width: PLATE_W, height: PLATE_H }}
              >
                <Image src={plate.src} alt="" fill sizes={`${PLATE_W}px`} className="object-cover" />
              </div>
            ))
          )}
        </div>
      </div>

      <ul className="sr-only">
        {projects.map((project) => (
          <li key={project.id}>
            <Link href={`/works/${project.id}`}>{project.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The preview's pixelated stages: tiny versions of the image, px wide. */
const PIXEL_WIDTHS = [16, 32];
/**
 * An image that arrives within this long of being asked for was cached (or
 * as good as): it's shown straight away, with no pixelated stages.
 */
const CACHED_MS = 80;

/** A tiny version of a local image from Next's optimizer (widths must be in images.imageSizes). */
const tiny = (src: string, w: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;

/**
 * The preview image. Already cached: it's simply there. Actually loading:
 * it arrives pixelated and resolves as the data comes in, a 16 px wide
 * version stretched to fill the frame with no smoothing (big hard blocks),
 * then a 32 px one, then the image itself, each shown as soon as it has
 * loaded. Every stage uses the same object-fit: cover as the final image, so
 * the framing never shifts.
 */
function PixelReveal({ src }: { src: string }) {
  // Which stages have loaded: 16 px, 32 px, full.
  const [loaded, setLoaded] = useState([false, false, false]);
  const [waiting, setWaiting] = useState(false); // past CACHED_MS without the full image
  const markLoaded = (i: number) => setLoaded((l) => l.map((v, j) => v || j === i));

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
        alt=""
        fill
        sizes={PREVIEW_SIZES}
        // Always in view, and the page's largest image: never lazy.
        loading="eager"
        fetchPriority="high"
        className="object-cover"
        style={show(2)}
        onLoad={() => markLoaded(2)}
        onError={() => markLoaded(2)}
      />
    </>
  );
}
