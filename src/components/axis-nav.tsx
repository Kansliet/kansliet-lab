"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { COMPANY } from "@/lib/shop-info";
import { STORE_ENABLED } from "@/lib/store-flag";

// The site's whole frame: two small tabs on one horizontal axis across the
// middle of the screen (bottom edge on phones, where mid-height tabs would sit
// on body text), and an index panel that holds everything a header and footer
// used to: sections, legal pages, company details, contact, the live clock.

const REF_ID = "IDN-2526-K(DC)SYS";

const SECTIONS = [
  { href: "/works", label: "WORKS" },
  { href: "/studio", label: "STUDIO" },
  // Listed only once the store is open (see lib/store-flag).
  ...(STORE_ENABLED ? [{ href: "/store", label: "STORE" }] : []),
  { href: "/contact", label: "CONTACT" },
];

const LEGAL = [
  { href: "/terms", label: "TERMS OF SALE" },
  { href: "/privacy", label: "PRIVACY" },
  { href: "/legal", label: "LEGAL & COOKIES" },
] as const;

export function getActiveSection(pathname: string): string {
  if (pathname === "/") return "INDEX";
  if (pathname.startsWith("/works")) return "WORKS";
  if (pathname === "/studio") return "STUDIO";
  if (pathname === "/contact") return "CONTACT";
  if (LEGAL.some((item) => item.href === pathname) || pathname === "/store/withdraw") return "LEGAL";
  if (pathname === "/store/cart") return "CART";
  if (pathname.startsWith("/admin") || pathname === "/login") return "ADMIN";
  if (pathname.startsWith("/store")) return "STORE";
  return "INDEX";
}

function formatDossierDate(date: Date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split(" ")[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${date.getFullYear()} — ${hours}:${minutes}`;
}

/** Ticks once a minute; renders "—" on the server to avoid a hydration mismatch. */
function useMinuteClock(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const start = new Date();
    const msToNextMinute = 60000 - (start.getSeconds() * 1000 + start.getMilliseconds());
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60000);
    }, msToNextMinute);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);
  return now;
}

// flex! and the font size's ! because .dossier-label's own display and 8px size
// would otherwise win (same layer, defined later). 10px in a 28px tab: the 8px
// label size was too small to read, the 11px body size a notch too big.
const TAB =
  "dossier-label flex! h-7 items-center gap-2 px-2.5 text-[0.625rem]! transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export function AxisNav() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const now = useMinuteClock();

  // Close on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Focus trap + Escape; the toggle stays visible while open, so it's part of
  // the cycle and the panel can always be closed by keyboard.
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus());
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = [
        toggleRef.current!,
        ...Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href], button") ?? []),
      ];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!focusable.includes(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    // data-ball-safe: the home page steel ball ignores the cursor over the
    // tabs and the open index, so using the menu never knocks it.
    <nav aria-label="Main" className="print:hidden" data-ball-safe>
      {/* Left end of the axis: home + where you are. */}
      <Link
        href="/"
        aria-label="Kansliet, home"
        className={`${TAB} fixed left-0 z-201 max-lg:bottom-3 lg:top-1/2 lg:-translate-y-1/2`}
      >
        <span>K(DC)</span>
        <span aria-hidden className="opacity-60">
          / {getActiveSection(pathname)}
        </span>
      </Link>

      {/* Right end of the axis: the index. */}
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls="axis-index"
        onClick={() => setOpen((o) => !o)}
        className={`${TAB} fixed right-0 z-202 cursor-pointer max-lg:bottom-3 lg:top-1/2 lg:-translate-y-1/2`}
      >
        {open ? "CLOSE ×" : "INDEX ≡"}
      </button>

      <div
        ref={panelRef}
        id="axis-index"
        role="dialog"
        aria-modal="true"
        aria-label="Index"
        hidden={!open}
        className="fixed right-0 z-201 w-full bg-foreground p-5 pt-10 text-background max-lg:bottom-3 max-lg:pb-12 sm:w-96 lg:top-[calc(50%+0.875rem)] lg:max-h-[calc(50vh-1.75rem)] lg:overflow-y-auto"
      >
        <ul className="space-y-1.5 text-[0.625rem] tracking-wider">
          {SECTIONS.map((section) => (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={pathname.startsWith(section.href) ? "page" : undefined}
                className="uppercase transition-opacity hover:opacity-60 aria-[current=page]:underline"
              >
                {section.label}
              </Link>
            </li>
          ))}
        </ul>

        <ul className="mt-6 space-y-1 text-[0.5625rem] tracking-wider opacity-80">
          {LEGAL.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="uppercase transition-opacity hover:opacity-60">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-1 text-[0.5625rem] uppercase tracking-wider opacity-80">
          <p>
            <a href={`mailto:${COMPANY.email}`} className="normal-case hover:opacity-60">
              {COMPANY.email}
            </a>
          </p>
          <p className="flex gap-4">
            <a href="https://instagram.com/kansliet.co" target="_blank" rel="noopener noreferrer" className="hover:opacity-60">
              INSTAGRAM
            </a>
            <a href="https://www.linkedin.com/company/kansliet" target="_blank" rel="noopener noreferrer" className="hover:opacity-60">
              LINKEDIN
            </a>
          </p>
        </div>

        <div className="mt-6 space-y-0.5 text-[0.5625rem] uppercase tracking-wider opacity-60">
          <p>
            {COMPANY.legalName} · ORG.NR {COMPANY.orgNr} · VAT {COMPANY.vatNr}
          </p>
          <p>
            REF: {REF_ID} · <span className="tabular-nums">{now ? formatDossierDate(now) : "—"}</span>
          </p>
        </div>
      </div>
    </nav>
  );
}
