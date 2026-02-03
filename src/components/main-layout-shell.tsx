"use client";

import { usePathname } from "next/navigation";

/**
 * On project pages (works/[id]) desktop only: constrains layout to one viewport so
 * main matches the window and footer is below the fold. Mobile: normal flow,
 * single column, footer at bottom.
 */
export function MainLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isProjectPage =
    pathname?.startsWith("/works/") && pathname !== "/works";

  return (
    <div
      className={
        isProjectPage
          ? "flex flex-col bg-background min-h-screen lg:h-[calc(100vh-var(--dossier-strip-height,2rem))] lg:min-h-0"
          : "flex min-h-screen flex-col bg-background"
      }
    >
      {children}
    </div>
  );
}
