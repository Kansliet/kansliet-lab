"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitContact, type ContactState } from "@/app/(main)/contact/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full transition-all duration-200 border border-signal hover:bg-signal hover:text-white"
    >
      {pending ? (
        <span className="animate-pulse">SENDING...</span>
      ) : (
        "SEND MESSAGE"
      )}
    </Button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState<ContactState | null, FormData>(
    submitContact,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="border border-red-500 bg-red-500/5 p-4 text-red-600">
          <p className="text-caps text-sm tracking-wide font-bold">
            ERROR: {state.error}
          </p>
        </div>
      )}

      <div className="group">
        <label
          htmlFor="name"
          className="text-caps block mb-2 text-sm font-normal tracking-wider opacity-70 group-focus-within:opacity-100 transition-opacity"
        >
          NAME
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Your name"
          required
          className="rounded-none border border-signal bg-transparent focus:ring-0 focus:border-signal"
        />
      </div>

      <div className="group">
        <label
          htmlFor="email"
          className="text-caps block mb-2 text-sm font-normal tracking-wider opacity-70 group-focus-within:opacity-100 transition-opacity"
        >
          EMAIL
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          required
          className="rounded-none border border-signal bg-transparent focus:ring-0 focus:border-signal"
        />
      </div>

      <div className="group">
        <label
          htmlFor="company"
          className="text-caps block mb-2 text-sm font-normal tracking-wider opacity-70 group-focus-within:opacity-100 transition-opacity"
        >
          COMPANY (OPTIONAL)
        </label>
        <Input
          id="company"
          name="company"
          type="text"
          placeholder="Company name"
          className="rounded-none border border-signal bg-transparent focus:ring-0 focus:border-signal"
        />
      </div>

      <div className="group">
        <label
          htmlFor="message"
          className="text-caps block mb-2 text-sm font-normal tracking-wider opacity-70 group-focus-within:opacity-100 transition-opacity"
        >
          MESSAGE
        </label>
        <Textarea
          id="message"
          name="message"
          placeholder="Tell us about your project..."
          rows={6}
          required
          className="rounded-none border border-signal bg-transparent focus:ring-0 focus:border-signal resize-none"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
