"use client";

import { usePathname } from "next/navigation";

/**
 * Sets view-transition-name by route for different animations:
 * - Main pages (home, works list, studio, contact): vertical (bottom-up)
 * - Project pages (works/[id]): horizontal (left-to-right)
 */
export function TransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProjectPage =
    pathname?.startsWith("/works/") && pathname !== "/works";
  const name = isProjectPage ? "project-content" : "main-content";

  return (
    <div
      className="flex-1 flex flex-col w-full min-h-0"
      style={{ viewTransitionName: name } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
