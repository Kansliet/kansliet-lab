"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitWithdrawal, type WithdrawState } from "./actions";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <span className="animate-pulse">SENDING...</span> : "CONFIRM WITHDRAWAL"}
    </Button>
  );
}

const FIELD = "rounded-none border border-signal bg-transparent focus:ring-0 focus:border-signal";

export function WithdrawForm({ formToken }: { formToken: string }) {
  const [state, formAction] = useActionState<WithdrawState | null, FormData>(
    submitWithdrawal,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <p aria-hidden className="text-dossier uppercase tracking-wider opacity-60">
        FORM K(DC)-02 · WITHDRAWAL · 1 COPY
      </p>
      {/* Honeypot: hidden from real users, bots fill it in */}
      <input
        type="text"
        name="_trap"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
        autoComplete="off"
      />
      <input type="hidden" name="_token" value={formToken} />
      {state?.error && (
        <div role="alert" className="border border-foreground p-4">
          <p className="text-caps text-sm tracking-wide font-bold">ERROR: {state.error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="dossier-label block mb-2">
          01 — NAME
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          defaultValue={state?.values?.name}
          required
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="order" className="dossier-label block mb-2">
          02 — ORDER NUMBER
        </label>
        <Input
          id="order"
          name="order"
          type="text"
          placeholder="KDC-00042"
          autoComplete="off"
          defaultValue={state?.values?.order}
          required
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="email" className="dossier-label block mb-2">
          03 — EMAIL (FOR YOUR RECEIPT)
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="The one you ordered with"
          defaultValue={state?.values?.email}
          required
          className={FIELD}
        />
      </div>

      <ConfirmButton />
    </form>
  );
}
