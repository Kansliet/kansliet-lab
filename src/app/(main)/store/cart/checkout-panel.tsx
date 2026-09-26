"use client";

import { useState } from "react";
import Link from "next/link";
import {
  COUNTRY_NAMES,
  DISPATCH_DAYS,
  SHIPPING_REGIONS,
  VAT_RATE_PERCENT,
  WITHDRAWAL_DAYS,
  formatMoney,
  regionForCountry,
} from "@/lib/shop-info";
import { checkoutCart } from "./actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

/**
 * Everything the law wants a customer to see before they commit to pay: the
 * total including VAT and shipping to their country, delivery time, the
 * withdrawal right, and the terms, which they must accept to continue.
 */
export function CheckoutPanel({ subtotalCents }: { subtotalCents: number }) {
  const [country, setCountry] = useState("SE");
  const region = regionForCountry(country)!;
  const [min, max] = region.deliveryDays;

  return (
    <form action={checkoutCart} className="mt-8 grid gap-6">
      <div className="grid gap-4 border-b-brutal pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-xs">
          <label htmlFor="country" className="dossier-label mb-2">
            SHIP TO
          </label>
          <Select
            id="country"
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {SHIPPING_REGIONS.flatMap((r) => r.countries).map((code) => (
              <option key={code} value={code}>
                {COUNTRY_NAMES[code] ?? code}
              </option>
            ))}
          </Select>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-8 gap-y-1 text-sm tabular-nums md:text-right">
          <dt className="opacity-60">SUBTOTAL</dt>
          <dd>{formatMoney(subtotalCents)}</dd>
          <dt className="opacity-60">SHIPPING</dt>
          <dd>{formatMoney(region.amount)}</dd>
          <dt className="dossier-label mt-2 justify-self-start md:justify-self-end">TOTAL</dt>
          <dd className="mt-2 text-lg">{formatMoney(subtotalCents + region.amount)}</dd>
        </dl>
      </div>

      <div className="text-normal-case space-y-1 text-sm font-light opacity-70">
        <p>
          {region.customs
            ? `Exported without Swedish VAT, at the same price. Import VAT, duty and carrier fees in ${COUNTRY_NAMES[country]} are paid by you on delivery.`
            : `Prices include ${VAT_RATE_PERCENT}% Swedish VAT.`}{" "}
          Dispatched within {DISPATCH_DAYS} business days, then {min}–{max} business days to{" "}
          {COUNTRY_NAMES[country]}.
        </p>
        <p>
          {WITHDRAWAL_DAYS}-day right of withdrawal; you pay return shipping. Payment and shipping
          address on the next step (Stripe).
        </p>
      </div>

      {/* The declaration, as on a paper form: a titled, ruled box with a
          square to cross. A real checkbox underneath (required, keyboard,
          screen readers), drawn square with an X when ticked. */}
      <div className="space-y-2">
        <span className="dossier-label">DECLARATION</span>
        <label className="flex cursor-pointer items-start gap-4 border border-foreground p-4 text-sm transition-colors has-[:checked]:bg-foreground/[0.04]">
          <span className="relative mt-px grid size-[18px] shrink-0 place-items-center border border-foreground">
            <input
              type="checkbox"
              name="acceptTerms"
              required
              className="peer absolute inset-0 cursor-pointer appearance-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            />
            <span aria-hidden className="hidden text-[15px] leading-none peer-checked:block">
              ✕
            </span>
          </span>
          <span className="text-normal-case font-light">
            I have read and accept the{" "}
            <Link href="/terms" target="_blank" className="underline hover:opacity-60">
              terms of sale
            </Link>
            , including the right of withdrawal, and the{" "}
            <Link href="/privacy" target="_blank" className="underline hover:opacity-60">
              privacy policy
            </Link>
            .
          </span>
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="w-full md:w-auto">
          CONTINUE TO PAYMENT →
        </Button>
      </div>
    </form>
  );
}
