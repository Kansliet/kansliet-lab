import Link from "next/link";
import { getCart } from "@/lib/cart";

// Persistent, fixed to the lower-right corner (matching
// teenage.engineering's own store), visible on scroll across every shop
// page — the shop's one cart affordance, so it lives once in the shop
// layout rather than being repeated per-page.
export async function CartIcon() {
  const count = (await getCart()).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/shop/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      className="fixed right-6 bottom-6 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-900 shadow-sm transition-colors hover:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:text-zinc-400"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8V6a6 6 0 1 1 12 0v2" />
        <path d="M4.5 8h15l-1 13h-13z" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-medium text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
          {count}
        </span>
      )}
    </Link>
  );
}
