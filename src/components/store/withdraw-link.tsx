import Link from "next/link";
import { WITHDRAW_PATH } from "@/lib/shop-info";

/**
 * The online withdrawal function (art. 11a CRD), shown after a purchase on the
 * success page only (owner's call, 2026-10-23); the terms and every customer
 * email link to it too. The label is the owner's softer wording, still saying
 * plainly what the page does.
 */
export function WithdrawLink({ className = "" }: { className?: string }) {
  return (
    <p className={`border-t-brutal pt-4 ${className}`}>
      <Link
        href={WITHDRAW_PATH}
        className="text-caps text-xs font-light tracking-wider transition-opacity hover:opacity-60"
      >
        CANCEL OR RETURN A PURCHASE →
      </Link>
    </p>
  );
}
