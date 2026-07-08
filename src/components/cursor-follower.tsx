"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type PreviewImage = { src: string; alt: string };

export function CursorFollower({ image }: { image: PreviewImage | null }) {
  // The container that moves with the mouse
  const cursorContainerRef = useRef<HTMLDivElement>(null);

  // Retain the last image so the card fades out with its content still showing
  // (adjusting state during render — no effect, so no cascading-render lint).
  const [lastImage, setLastImage] = useState<PreviewImage | null>(image);
  if (image && image !== lastImage) setLastImage(image);

  const isVisible = image !== null;

  useEffect(() => {
    // direct DOM update = 0 latency snappy movement
    const moveCursor = (e: MouseEvent) => {
      if (cursorContainerRef.current) {
        cursorContainerRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  return (
    // This container gets moved around the screen
    <div
      ref={cursorContainerRef}
      className={`fixed top-0 left-0 pointer-events-none z-50 will-change-transform transition-opacity duration-150 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* The preview card. '-translate-x/y-1/2' centers it on the cursor.
          w-32 keeps it ≈ the old button width; image is a tasteful 4:5. */}
      <div className="w-fit -translate-x-1/2 -translate-y-1/2 border border-signal bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] overflow-hidden">
        {/* Same dimensions as the hero trail images (w-32 h-40 = 128×160). */}
        <div className="relative w-32 h-40 bg-foreground/5">
          {lastImage && (
            <Image
              src={lastImage.src}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
            />
          )}
        </div>
        {/* Kept from the old cursor: the OPEN CASE label, now under the image */}
        <div className="border-t border-signal px-2 py-1 text-center">
          <span className="text-caps text-[10px] font-light tracking-widest whitespace-nowrap text-signal">
            OPEN CASE ↗
          </span>
        </div>
      </div>
    </div>
  );
}
