import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type Stripe from "stripe";
import { stripe, formatPrice } from "@/lib/stripe";
import { ClearCartOnMount } from "./clear-cart-on-mount";

export const metadata: Metadata = {
  title: "KANSLIET (ORDER CONFIRMED)",
  robots: { index: false },
};

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

// Checkout Session ids look like cs_test_… / cs_live_…; anything else is not
// worth a Stripe round-trip.
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

/**
 * The session id arrives in the URL, so it's untrusted: look it up with Stripe
 * and only confirm a session that is actually paid. Without this, anyone could
 * open /store/success?session_id=<anything> and get a "payment went through"
 * page (and have their cart emptied).
 */
async function getPaidSession(
  sessionId: string | undefined
): Promise<Stripe.Checkout.Session | null> {
  if (!sessionId || !SESSION_ID.test(sessionId)) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    // "paid" for cards; async methods (bank debits) complete later and are
    // confirmed by the webhook, so they get the pending copy below.
    return session.status === "complete" ? session : null;
  } catch {
    return null;
  }
}

export default async function StoreSuccessPage({ searchParams }: SuccessPageProps) {
  const session = await getPaidSession((await searchParams).session_id);
  if (!session) {
    redirect("/store");
  }

  const isPaid = session.payment_status === "paid";
  const currency = (session.currency ?? "eur").toUpperCase();
  const lines = session.line_items?.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <ClearCartOnMount />
      <section className="py-20">
        <div className="container-kansliet">
          <h1 className="dossier-label mb-12">
            {isPaid ? "ORDER CONFIRMED" : "ORDER RECEIVED"}
          </h1>
          <p className="mb-6 text-lg font-normal uppercase tracking-wide">
            THANK YOU.
          </p>
          <p className="text-normal-case mb-10 max-w-xl text-base font-light leading-relaxed">
            {isPaid
              ? "Your payment went through. We'll be in touch by email with shipping details."
              : "Your order is placed and the payment is processing. We'll confirm by email once it clears."}
          </p>

          <div className="mb-10 max-w-xl border-y border-foreground">
            <ul>
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="flex items-baseline justify-between gap-6 border-b border-foreground/20 py-3 last:border-b-0"
                >
                  <span className="text-caps text-sm font-normal tracking-wider">
                    {line.description} × {line.quantity}
                  </span>
                  <span className="text-sm tabular-nums">
                    {formatPrice(line.amount_total / 100, currency)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between gap-6 border-t border-foreground py-4">
              <span className="dossier-label">TOTAL</span>
              <span className="text-lg tabular-nums">
                {formatPrice((session.amount_total ?? 0) / 100, currency)}
              </span>
            </div>
            <div className="flex items-baseline gap-4 border-t border-foreground py-4">
              <span className="dossier-label shrink-0">REF</span>
              <span className="text-dossier font-light tracking-wider tabular-nums">
                {session.id.slice(-10).toUpperCase()}
              </span>
            </div>
          </div>

          <Link
            href="/store"
            className="text-caps text-sm font-light tracking-wider transition-opacity hover:opacity-60"
          >
            ← BACK TO STORE
          </Link>
        </div>
      </section>
    </div>
  );
}
