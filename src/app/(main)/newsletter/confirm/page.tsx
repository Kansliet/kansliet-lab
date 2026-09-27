import Link from "next/link";
import type { Metadata } from "next";
import { verifyConfirmation } from "@/lib/newsletter";
import { Button } from "@/components/ui/button";
import { confirmSignup } from "../actions";

export const metadata: Metadata = {
  title: "KANSLIET (NEWSLETTER)",
  robots: { index: false },
};

type ConfirmPageProps = {
  searchParams: Promise<{ e?: string; t?: string; s?: string; status?: string }>;
};

const MESSAGES: Record<string, { label: string; text: string }> = {
  done: {
    label: "SUBSCRIBED",
    text: "You're on the list. Every newsletter has a link to unsubscribe.",
  },
  invalid: {
    label: "LINK NOT VALID",
    text: "This link has expired or was changed. Sign up again from the store and use the new link within 7 days.",
  },
  failed: {
    label: "SOMETHING WENT WRONG",
    text: "We couldn't add you just now. Please use the link in your email again in a little while.",
  },
};

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams;
  // Only fixed messages are shown: nothing from the URL is echoed except an
  // email that passed the signature check.
  const result = params.status ? MESSAGES[params.status] : undefined;
  const email = result ? null : verifyConfirmation(params);
  const shown = result ?? (email ? null : MESSAGES.invalid);

  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container-kansliet max-w-2xl">
          <h1 className="dossier-label mb-12">NEWSLETTER</h1>
          {shown ? (
            <>
              <p className="mb-2 text-lg font-normal uppercase tracking-wide">{shown.label}</p>
              <p className="text-normal-case mb-10 text-base font-light leading-relaxed">
                {shown.text}
              </p>
            </>
          ) : (
            <form action={confirmSignup} className="mb-10 space-y-6">
              <input type="hidden" name="e" value={params.e} />
              <input type="hidden" name="t" value={params.t} />
              <input type="hidden" name="s" value={params.s} />
              <p className="text-normal-case text-base font-light leading-relaxed">
                Subscribe <span className="font-normal">{email}</span> to the Kansliet newsletter?
              </p>
              <Button type="submit">CONFIRM SUBSCRIPTION</Button>
            </form>
          )}
          <Link
            href="/store"
            className="text-caps text-sm font-light tracking-wider transition-opacity hover:opacity-60"
          >
            ← STORE
          </Link>
        </div>
      </section>
    </div>
  );
}
