import { notFound } from "next/navigation";
import { CartIcon } from "@/components/store/CartIcon";
import { getSession } from "@/lib/auth";
import { STORE_ENABLED } from "@/lib/store-flag";

// The shop itself (grid, products, cart, success). /store/withdraw sits
// outside this group on purpose: customers keep the right to withdraw for 14
// days after delivery, so the withdrawal form must work while the store is closed.
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Store closed: a 404 for the public; a logged-in admin gets a preview.
  const preview = !STORE_ENABLED;
  if (preview && !(await getSession())) notFound();

  return (
    <>
      {children}
      <CartIcon />
      {preview && (
        <p className="dossier-label pointer-events-none fixed top-0 left-1/2 z-201 -translate-x-1/2 print:hidden">
          ADMIN PREVIEW · STORE HIDDEN FROM PUBLIC
        </p>
      )}
    </>
  );
}
