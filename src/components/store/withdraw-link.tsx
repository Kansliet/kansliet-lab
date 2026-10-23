import Link from "next/link";
import { WITHDRAW_PATH } from "@/lib/shop-info";

/**
 * The online withdrawal function, always one click away on every store page
 * (art. 11a CRD asks for it to be easily accessible for the whole withdrawal
 * period). The terms and every order email link to it too.
 */
export function WithdrawLink({ className = "" }: { className?: string }) {
  return (
    <p className={`border-t-brutal pt-4 ${className}`}>
      <Link
        href={WITHDRAW_PATH}
        className="text-caps text-xs font-light tracking-wider transition-opacity hover:opacity-60"
      >
        WITHDRAW FROM CONTRACT HERE →
      </Link>
    </p>
  );
}
