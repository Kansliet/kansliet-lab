"use client";

import { Link } from "next-view-transitions";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Focus trap + Escape. The hamburger (which morphs into the X) lives OUTSIDE
  // the overlay in the DOM but stays visible while open, so it's part of the
  // trap cycle — otherwise the close button is unreachable by keyboard.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        hamburgerRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const links = menuRef.current?.querySelectorAll<HTMLElement>("a[href]");
      if (!links || links.length === 0) return;
      const list = [hamburgerRef.current!, ...Array.from(links)];
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!list.includes(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // Move focus into the menu when it opens (after the overlay un-hides).
  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    });
  }, [isOpen]);

  // Lock body scroll while open; close if the viewport grows past the lg
  // breakpoint (1024px), where the overlay is CSS-hidden but isOpen would
  // otherwise keep scroll locked with no visible menu.
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => {
      document.body.style.overflow = prevOverflow;
      mq.removeEventListener("change", onChange);
    };
  }, [isOpen]);

  return (
    <header
      className="sticky z-50 border-b-brutal bg-background [view-transition-name:header]"
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
              width={256.86}
              height={22.2}
              priority
              className="w-52.5 lg:w-62.5"
              style={{ height: "auto" }}
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
            ref={hamburgerRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden relative z-50 p-2 -mr-2 text-foreground hover:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
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
            ref={menuRef}
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className={`fixed inset-0 bg-background z-40 flex flex-col justify-center px-6 transition-all duration-300 lg:hidden ${
              isOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
            style={{ top: "var(--dossier-strip-height, 2rem)" }}
            hidden={!isOpen}
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
