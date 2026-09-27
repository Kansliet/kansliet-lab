import Link from "next/link";
import type { Metadata } from "next";
import { COMPANY, WITHDRAWAL_DAYS } from "@/lib/shop-info";
import { mintFormToken } from "@/lib/form-token";
import { orderRef, parseOrderRef } from "@/lib/order-email";
import { WithdrawForm } from "./withdraw-form";

export const metadata: Metadata = {
  title: "KANSLIET (WITHDRAW FROM CONTRACT)",
  description: `Withdraw from a purchase in the Kansliet store within ${WITHDRAWAL_DAYS} days of delivery.`,
  alternates: { canonical: "/store/withdraw" },
};

type WithdrawPageProps = {
  searchParams: Promise<{ received?: string }>;
};

/**
 * The online withdrawal function (EU directive 2023/2673): a clearly labelled
 * way to withdraw, one form, one confirm button, and an emailed receipt.
 * Deliberately outside the (shop) layout, so it keeps working while the store
 * is closed.
 */
export default async function WithdrawPage({ searchParams }: WithdrawPageProps) {
  const { received } = await searchParams;

  if (received !== undefined) {
    // Only digits survive parseOrderRef, so the URL can't put text on the page.
    const id = parseOrderRef(received);
    return (
      <div className="min-h-screen bg-background">
        <section className="py-20">
          <div className="container-kansliet max-w-2xl">
            <h1 className="dossier-label mb-12">WITHDRAWAL RECEIVED</h1>
            <div className="mb-10 border border-signal bg-signal text-background p-6">
              <p className="text-caps text-sm tracking-widest font-bold mb-1">
                STATUS: RECEIVED{id !== null && ` · ${orderRef(id)}`}
              </p>
              <p className="text-normal-case text-sm font-light opacity-90">
                Your withdrawal is logged. A receipt is on its way to your email; keep it as proof.
              </p>
            </div>
            <p className="text-normal-case mb-10 text-base font-light leading-relaxed">
              Send the goods back within {WITHDRAWAL_DAYS} days to {COMPANY.legalName},{" "}
              {COMPANY.address.join(", ")}, marked with your order number. We refund you, including
              the standard shipping cost, as soon as they&apos;re back or you&apos;ve shown
              you&apos;ve sent them. No receipt within the hour? Email{" "}
              <a href={`mailto:${COMPANY.email}`} className="underline hover:opacity-60">
                {COMPANY.email}
              </a>
              .
            </p>
            <Link
              href="/"
              className="text-caps text-sm font-light tracking-wider transition-opacity hover:opacity-60"
            >
              ← BACK TO KANSLIET
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet max-w-2xl">
          <h1 className="text-lg uppercase tracking-wide font-normal mb-10">
            WITHDRAW FROM CONTRACT
          </h1>
          <div className="text-normal-case mb-12 space-y-4 text-base font-light leading-relaxed">
            <p>
              You can withdraw from a purchase within {WITHDRAWAL_DAYS} days of receiving it,
              without giving a reason. Fill in the form and confirm: your withdrawal is logged at
              once, and we email you a receipt.
            </p>
            <p className="text-sm opacity-70">
              You can also email{" "}
              <a href={`mailto:${COMPANY.email}`} className="underline hover:opacity-60">
                {COMPANY.email}
              </a>{" "}
              or write to us; any clear statement works. The full rules are in the{" "}
              <Link href="/terms#withdrawal" className="underline hover:opacity-60">
                terms of sale
              </Link>
              .
            </p>
          </div>
          <WithdrawForm formToken={mintFormToken()} />
        </div>
      </section>
    </div>
  );
}
