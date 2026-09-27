import Link from "next/link";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/shop-info";

/** Page shell for /legal, /terms and /privacy: same type and spacing as /legal. */
export function LegalDoc({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 bg-background flex flex-col py-10 lg:py-20">
      <div className="container-kansliet max-w-2xl">
        <h1 className="text-lg uppercase tracking-wide font-normal mb-4">{title}</h1>
        {updated && (
          <p className="text-dossier text-caps tracking-wider opacity-60 mb-10 lg:mb-16">
            LAST UPDATED {updated}
          </p>
        )}
        {intro && (
          <div className="text-normal-case text-base font-light leading-relaxed mb-10">{intro}</div>
        )}
        <nav className="mb-12 flex flex-wrap gap-x-6 gap-y-2 border-t-brutal border-b-brutal py-3">
          {[
            { href: "/terms", label: "TERMS OF SALE" },
            { href: "/privacy", label: "PRIVACY" },
            { href: "/legal", label: "COMPANY & COOKIES" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-caps text-sm font-light tracking-wider transition-opacity hover:opacity-60"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-12 text-normal-case text-base font-light leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="dossier-label">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ items, className }: { items: React.ReactNode[]; className?: string }) {
  return (
    <ul className={cn("list-disc space-y-2 pl-5", className)}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function MailLink() {
  return (
    <a href="mailto:desk@kansliet.co" className="underline hover:opacity-60">
      desk@kansliet.co
    </a>
  );
}

export function PhoneLink() {
  return (
    <a href={COMPANY.phone.href} className="underline hover:opacity-60">
      {COMPANY.phone.display}
    </a>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className="underline hover:opacity-60"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
