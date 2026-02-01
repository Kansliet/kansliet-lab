import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/works", label: "WORKS" },
  { href: "/studio", label: "STUDIO" },
  { href: "/contact", label: "CONTACT" },
] as const;

export function Header() {
  return (
    <header
      className="sticky z-50 border-b-brutal bg-background"
      style={{ top: "var(--dossier-strip-height, 2rem)" }}
    >
      <div className="container-kansliet">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link
            href="/"
            className="hover:opacity-60 transition-opacity shrink-0"
          >
            <Image
              src="/kansliet-logo-navbar-web.svg"
              alt="Kansliet"
              width={250}
              height={0}
              style={{ height: "auto" }}
              priority
            />
          </Link>
          <nav
            className="flex items-center gap-6 md:gap-8"
            aria-label="Main navigation"
          >
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-caps text-sm font-light tracking-wide transition-opacity hover:opacity-60 whitespace-nowrap"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
