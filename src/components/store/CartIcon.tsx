import Link from "next/link";
import { cartItemCount, getCart } from "@/lib/cart";

// A small tab pinned to the top-right corner of every store page, in the same
// style as the axis tabs — the store's one cart affordance, so it lives once in
// the shop layout rather than being repeated per-page.
export async function CartIcon() {
  const count = cartItemCount(await getCart());

  return (
    <Link
      href="/store/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      // flex! because .dossier-label's own display: inline-block would otherwise
      // win and leave the text in the tab's top-left corner (as in axis-nav).
      className="dossier-label fixed top-0 right-0 z-201 flex! h-8 items-center justify-center px-3 text-[length:var(--font-size-base)]! tabular-nums transition-opacity hover:opacity-80 print:hidden"
    >
      CART ({count})
    </Link>
  );
}
