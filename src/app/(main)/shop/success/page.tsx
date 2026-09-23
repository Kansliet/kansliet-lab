import { Link } from "next-view-transitions";
import type { Metadata } from "next";
import { ClearCartOnMount } from "./clear-cart-on-mount";

export const metadata: Metadata = {
  title: "KANSLIET (ORDER CONFIRMED)",
  robots: { index: false },
};

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function ShopSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;

  return (
    <div className="min-h-screen bg-background">
      <ClearCartOnMount />
      <section className="py-20">
        <div className="container-kansliet">
          <h1 className="dossier-label mb-12">ORDER CONFIRMED</h1>
          <p className="mb-6 text-3xl font-normal uppercase tracking-tight lg:text-4xl">
            THANK YOU.
          </p>
          <p className="text-normal-case mb-10 max-w-xl text-base font-light leading-relaxed">
            Your payment went through. A receipt is on its way to your email,
            and we&apos;ll be in touch with shipping details shortly.
          </p>
          {sessionId && (
            <div className="mb-10 flex max-w-xl items-baseline gap-4 border-y border-foreground py-4">
              <span className="dossier-label shrink-0">REF</span>
              <span className="text-dossier break-all font-light tracking-wider">
                {sessionId}
              </span>
            </div>
          )}
          <Link
            href="/shop"
            className="text-caps text-sm font-light tracking-wider transition-opacity hover:opacity-60"
          >
            ← BACK TO SHOP
          </Link>
        </div>
      </section>
    </div>
  );
}
