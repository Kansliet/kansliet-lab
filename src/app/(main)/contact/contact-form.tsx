"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitContact, type ContactState } from "./actions";

export function ContactForm() {
  const [state, formAction] = useFormState<ContactState | null, FormData>(
    submitContact,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <p className="text-normal-case text-sm font-light text-foreground bg-foreground/10 border-brutal p-4">
          {state.error}
        </p>
      )}
      <div>
        <label
          htmlFor="name"
          className="text-caps block mb-2 text-sm font-normal tracking-wider"
        >
          NAME
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="YOUR NAME"
          required
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="text-caps block mb-2 text-sm font-normal tracking-wider"
        >
          EMAIL
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="YOUR@EMAIL.COM"
          required
        />
      </div>

      <div>
        <label
          htmlFor="company"
          className="text-caps block mb-2 text-sm font-normal tracking-wider"
        >
          COMPANY
        </label>
        <Input
          id="company"
          name="company"
          type="text"
          placeholder="YOUR COMPANY"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="text-caps block mb-2 text-sm font-normal tracking-wider"
        >
          MESSAGE
        </label>
        <Textarea
          id="message"
          name="message"
          placeholder="TELL US ABOUT YOUR PROJECT"
          rows={6}
          required
        />
      </div>

      <Button type="submit" className="w-full">
        SEND MESSAGE
      </Button>
    </form>
  );
}
