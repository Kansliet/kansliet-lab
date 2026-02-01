"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function FullscreenMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      previousActiveRef.current = document.activeElement as HTMLElement | null;
      // Focus first focusable element in panel after paint
      requestAnimationFrame(() => {
        const focusable = panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
        const first = focusable?.[0] as HTMLElement | undefined;
        first?.focus();
      });
    } else {
      document.body.style.overflow = "";
      previousActiveRef.current?.focus?.();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-caps text-sm font-light tracking-wide transition-opacity hover:opacity-60"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        MENU
      </button>

      {/* Backdrop with blur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-200 backdrop-blur-sm bg-foreground/20"
          onClick={close}
          aria-hidden
        />
      )}

      {/* Fullscreen Overlay - Right Side */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          className="fixed top-0 right-0 bottom-0 w-full md:w-150 z-201 bg-background flex flex-col border-l-brutal"
        >
          {/* Header */}
          <div className="border-b-brutal">
            <div className="container-kansliet">
              <div className="flex h-16 items-center justify-between">
                <Link
                  href="/"
                  className="text-caps text-lg font-light tracking-wider hover:opacity-60 transition-opacity"
                  onClick={close}
                >
                  KANSLIET
                </Link>
                <button
                  onClick={close}
                  className="text-caps text-sm font-light tracking-wide transition-opacity hover:opacity-60"
                  aria-label="Close menu"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>

          {/* Menu Content */}
          <div className="flex-1 flex items-center">
            <nav className="container-kansliet w-full">
              <ul className="space-y-6">
                <li>
                  <Link
                    href="/"
                    className="text-caps text-4xl font-light tracking-tight hover:opacity-60 transition-opacity block"
                    onClick={close}
                  >
                    HOME
                  </Link>
                </li>
                <li>
                  <Link
                    href="/projects"
                    className="text-caps text-4xl font-light tracking-tight hover:opacity-60 transition-opacity block"
                    onClick={close}
                  >
                    WORK
                  </Link>
                </li>
                <li>
                  <Link
                    href="/studio"
                    className="text-caps text-4xl font-light tracking-tight hover:opacity-60 transition-opacity block"
                    onClick={close}
                  >
                    STUDIO
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-caps text-4xl font-light tracking-tight hover:opacity-60 transition-opacity block"
                    onClick={close}
                  >
                    CONTACT
                  </Link>
                </li>
              </ul>

              {/* Secondary Links */}
              <div className="mt-16 space-y-3">
                <p className="text-normal-case text-sm font-light opacity-60">
                  <a
                    href="mailto:desk@kansliet.co"
                    className="hover:opacity-100 transition-opacity"
                  >
                    desk@kansliet.co
                  </a>
                </p>
                <p className="text-normal-case text-sm font-light opacity-60">
                  <a
                    href="https://instagram.com/kansliet.co"
                    className="hover:opacity-100 transition-opacity"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                  {" / "}
                  <a
                    href="https://linkedin.com/company/kansliet"
                    className="hover:opacity-100 transition-opacity"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                </p>
              </div>
            </nav>
          </div>

          {/* Footer */}
          <div className="border-t-brutal py-6">
            <div className="container-kansliet">
              <p className="text-caps text-sm font-light opacity-60">
                IDN-2526-K(DC)SYS
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
