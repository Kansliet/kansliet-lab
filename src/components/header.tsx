"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/works", label: "WORKS" },
  { href: "/studio", label: "STUDIO" },
  { href: "/contact", label: "CONTACT" },
] as const;

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header
      className="sticky z-50 border-b-brutal bg-background"
      style={{ top: "var(--dossier-strip-height, 2rem)" }}
    >
      <div className="container-kansliet">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="hover:opacity-60 transition-opacity shrink-0 relative z-50"
            onClick={() => setIsOpen(false)}
          >
            <Image
              src="/kansliet-logo-navbar-web.svg"
              alt="Kansliet"
              width={250}
              height={0}
              style={{ height: "auto" }}
              priority
              // UPDATED: w-[210px] makes it very prominent on mobile
              className="w-52.5 lg:w-62.5"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden lg:flex items-center gap-8"
            aria-label="Main navigation"
          >
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-caps text-sm font-light tracking-wide transition-opacity hover:opacity-60 whitespace-nowrap ${
                  pathname === href ? "opacity-100" : "opacity-60"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden relative z-50 p-2 -mr-2 text-foreground hover:opacity-60 focus:outline-none"
            aria-label="Toggle menu"
          >
            <div className="w-6 flex flex-col items-end gap-1.5">
              {/* Line 1 
                  - Fixed height: h-[2px] 
                  - Transition: transforms for the X
              */}
              <span
                className={`h-0.5 w-6 bg-current transition-all duration-300 ${
                  isOpen ? "rotate-45 translate-y-2.5" : ""
                }`}
              />

              {/* Line 2 
                  - Fixed height: h-[2px] 
                  - This one fades out for the X
              */}
              <span
                className={`h-0.5 w-6 bg-current transition-all duration-300 ${
                  isOpen ? "opacity-0" : ""
                }`}
              />

              {/* Line 3 
                  - Fixed height: h-[2px] 
                  - Transition: transforms for the X
              */}
              <span
                className={`h-0.5 w-6 bg-current transition-all duration-300 ${
                  isOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              />
            </div>
          </button>

          {/* Mobile Overlay Menu */}
          <div
            className={`fixed inset-0 bg-background z-40 flex flex-col justify-center px-6 transition-all duration-300 lg:hidden ${
              isOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
            style={{ top: "var(--dossier-strip-height, 2rem)" }}
          >
            <nav className="flex flex-col gap-8 text-center">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className="text-caps text-xl font-light tracking-widest hover:opacity-60 transition-opacity"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
