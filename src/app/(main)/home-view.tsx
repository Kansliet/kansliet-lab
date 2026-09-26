"use client";

import Link from "next/link";
import { useRef } from "react";
import { SteelBall } from "@/components/steel-ball/SteelBall";

/**
 * The landing page is one object: the steel ball logomark, loose on the paper,
 * which the visitor can knock around or pick up and throw. Everything else is
 * one click away on the axis index.
 */
export function HomeView() {
  const readoutRef = useRef<HTMLSpanElement>(null);

  return (
    // Phones: main already pads 3rem below for the axis tabs, so one screen
    // minus that; otherwise the page scrolls by 3rem for nothing.
    <div className="flex min-h-[calc(100svh-3rem)] flex-col bg-background lg:min-h-screen">
      <h1 className="sr-only">Kansliet — objects, spaces, systems</h1>

      {/* The ball lives in its own fixed layer over the whole window; this
          just keeps the caption at the foot of the page. */}
      <div className="flex-1" />
      <SteelBall readoutRef={readoutRef} />

      {/* Figure caption, like the title block under a drawing. */}
      <div className="container-kansliet grid w-full grid-cols-[1fr_auto_1fr] items-baseline gap-6 pb-16 max-md:grid-cols-1 max-md:justify-items-center max-md:gap-2">
        <p aria-hidden className="text-dossier text-caps tracking-wider opacity-70">
          FIG. 01 — K(DC) STEEL BALL
        </p>
        <Link
          href="/works"
          className="text-caps text-lg font-light tracking-tight whitespace-nowrap transition-opacity hover:opacity-60"
        >
          OBJECTS. SPACES. SYSTEMS →
        </Link>
        <p className="text-dossier text-right tabular-nums tracking-wider opacity-70 max-md:text-center">
          <span ref={readoutRef}>V 0.00 M/S · DIST 0.00 M</span>
        </p>
      </div>
    </div>
  );
}
