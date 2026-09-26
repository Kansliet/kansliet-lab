"use client";

import { usePathname } from "next/navigation";

// Fixed store routes that live beside /store/[slug] but aren't product pages.
const STORE_NON_PRODUCT_SEGMENTS = new Set(["cart", "success"]);

function isStoreProductPage(pathname: string): boolean {
  const match = pathname.match(/^\/store\/([^/]+)$/);
  return !!match && !STORE_NON_PRODUCT_SEGMENTS.has(match[1]);
}

/**
 * On project pages (works/[id]) and product pages (store/[slug]) desktop only:
 * constrains layout to one viewport so main matches the window and footer is
 * below the fold. Mobile: normal flow, single column, footer at bottom.
 */
export function MainLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isProjectPage =
    (pathname?.startsWith("/works/") && pathname !== "/works") ||
    isStoreProductPage(pathname ?? "");

  return (
    <div
      className={
        // relative z-10 keeps the content (and the cursor preview inside it)
        // in its own stacking layer, below the axis tabs (z-201). Still below body-level cookie (z-100) / dossier (z-202).
        isProjectPage
          ? "relative z-10 flex flex-col bg-background min-h-screen lg:h-screen lg:min-h-0"
          : "relative z-10 flex min-h-screen flex-col bg-background"
      }
    >
      {children}
    </div>
  );
}
