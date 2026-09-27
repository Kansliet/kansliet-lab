import type { Metadata } from "next";
import { STORE_ENABLED } from "@/lib/store-flag";

// Until launch, keep the store out of search results even for the admin preview.
// The closed-store gate and the cart tab live in (shop)/layout.tsx, so neither
// covers /store/withdraw.
export const metadata: Metadata = STORE_ENABLED ? {} : { robots: { index: false, follow: false } };

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
