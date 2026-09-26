import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartIcon } from "@/components/store/CartIcon";
import { getSession } from "@/lib/auth";
import { STORE_ENABLED } from "@/lib/store-flag";

// Until launch, keep the store out of search results even for the admin preview.
export const metadata: Metadata = STORE_ENABLED ? {} : { robots: { index: false, follow: false } };

export default async function StoreLayout({
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
