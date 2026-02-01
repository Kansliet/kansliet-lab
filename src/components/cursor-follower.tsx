"use client";

import { useEffect, useRef } from "react";

export function CursorFollower({ isVisible }: { isVisible: boolean }) {
  // The container that moves with the mouse
  const cursorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // direct DOM update = 0 latency snappy movement
    const moveCursor = (e: MouseEvent) => {
      if (cursorContainerRef.current) {
        // Use translate3d for GPU acceleration, positioning top-left at mouse coordinates
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
      {/* The visible box.
          - We use '-translate-x-1/2 -translate-y-1/2' to shift the box 
            back so its center aligns with the container's top-left coordinate (the mouse pointer).
      */}
      <div className="bg-white text-signal px-3 py-1.5 border border-signal shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] -translate-x-1/2 -translate-y-1/2">
        {/* Changed font-bold to font-light */}
        <span className="text-caps text-[10px] font-light tracking-widest whitespace-nowrap">
          OPEN CASE ↗
        </span>
      </div>
    </div>
  );
}
