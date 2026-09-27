"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestSignup, type SignupState } from "@/app/(main)/newsletter/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="shrink-0">
      {pending ? <span className="animate-pulse">SENDING...</span> : "SIGN UP"}
    </Button>
  );
}

/** Email-only newsletter signup; the address gets a confirmation link (double opt-in). */
export function SignupForm({ formToken }: { formToken: string }) {
  const [state, formAction] = useActionState<SignupState | null, FormData>(requestSignup, null);

  if (state?.sent) {
    return (
      <p role="status" className="text-normal-case text-sm font-light">
        Check your inbox: click the link in our email to confirm. Nothing is sent until you do.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input
        type="text"
        name="_trap"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
        autoComplete="off"
      />
      <input type="hidden" name="_token" value={formToken} />
      <label htmlFor="newsletter-email" className="sr-only">
        Email
      </label>
      <div className="flex gap-2">
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          defaultValue={state?.email}
          required
          className="rounded-none border border-signal bg-transparent focus:ring-0 focus:border-signal normal-case!"
        />
        <SubmitButton />
      </div>
      {state?.error && (
        <p role="alert" className="text-normal-case text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}
