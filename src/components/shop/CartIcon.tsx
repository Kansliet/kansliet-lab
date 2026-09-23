import { Link } from "next-view-transitions";
import { getCart } from "@/lib/cart";

// Persistent, fixed to the lower-right corner, visible on scroll across every
// shop page — the shop's one cart affordance, so it lives once in the shop
// layout rather than being repeated per-page. Sits below the cookie banner
// (z-100) so the banner stays on top until it's dismissed.
export async function CartIcon() {
  const count = (await getCart()).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/shop/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      className="text-caps fixed right-3 bottom-3 z-50 border-brutal bg-background px-4 py-3 text-sm font-light tracking-wider tabular-nums transition-colors hover:bg-foreground hover:text-background md:right-6 md:bottom-6"
    >
      CART [{String(count).padStart(2, "0")}]
    </Link>
  );
}
