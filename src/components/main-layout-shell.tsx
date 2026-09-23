"use client";

import { usePathname } from "next/navigation";

// Fixed shop routes that live beside /shop/[slug] but aren't product pages.
const SHOP_NON_PRODUCT_SEGMENTS = new Set(["cart", "orders", "success"]);

function isShopProductPage(pathname: string): boolean {
  const match = pathname.match(/^\/shop\/([^/]+)$/);
  return !!match && !SHOP_NON_PRODUCT_SEGMENTS.has(match[1]);
}

/**
 * On project pages (works/[id]) and product pages (shop/[slug]) desktop only:
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
    isShopProductPage(pathname ?? "");

  return (
    <div
      className={
        // relative z-10 lifts the content (and the cursor preview trapped in
        // its view-transition stacking context) above the footer, which is a
        // later sibling. Still below body-level cookie (z-100) / dossier (z-202).
        isProjectPage
          ? "relative z-10 flex flex-col bg-background min-h-screen lg:h-[calc(100vh-var(--dossier-strip-height,2rem))] lg:min-h-0"
          : "relative z-10 flex min-h-screen flex-col bg-background"
      }
    >
      {children}
    </div>
  );
}
