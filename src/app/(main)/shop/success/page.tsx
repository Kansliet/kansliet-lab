import Link from "next/link";
import { ClearCartOnMount } from "./clear-cart-on-mount";
import { PAGE_SHELL, HEADING, buttonClasses } from "@/lib/design-tokens";

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function ShopSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;

  return (
    <div className={`${PAGE_SHELL.form} text-center`}>
      <ClearCartOnMount />
      <h1 className={HEADING}>Thanks for your order</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        We&apos;ll be in touch with shipping details shortly.
      </p>
      {sessionId && (
        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
          Order reference: {sessionId}
        </p>
      )}
      <Link href="/shop" className={`mt-6 inline-block ${buttonClasses("tertiary")}`}>
        Back to shop
      </Link>
    </div>
  );
}
