"use client";

import { useEffect } from "react";
import { clearCart } from "@/app/(main)/store/(shop)/cart/actions";

// Next.js won't let a Server Component write cookies during render, so
// clearing the cart cookie on landing here needs a client-side trigger —
// this is the only client component the cart feature needs.
export function ClearCartOnMount() {
  useEffect(() => {
    clearCart();
  }, []);

  return null;
}
