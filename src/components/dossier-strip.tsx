"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const REF_ID = "IDN-2526-K(DC)SYS";

function formatDossierDate(date: Date) {
  const day = date.getDate().toString().padStart(2, "0");
  const months = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC";
  const month = months.split(" ")[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${year} — ${hours}:${minutes}`;
}

function getActiveSection(pathname: string): string {
  if (pathname === "/") return "HOME";
  if (pathname === "/works") return "WORKS";
  if (pathname.startsWith("/works/")) return "WORKS";
  if (pathname === "/studio") return "STUDIO";
  if (pathname === "/contact") return "CONTACT";
  if (pathname === "/legal") return "LEGAL";
  return "INDEX";
}

export function DossierStrip() {
  const pathname = usePathname();
  const [now, setNow] = useState<Date | null>(null);
  const active = getActiveSection(pathname ?? "");

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-b-brutal bg-background h-full min-h-[var(--dossier-strip-height)] flex items-center">
      <div className="container-kansliet w-full">
        <div className="flex items-center justify-between text-dossier">
          <span className="text-caps tracking-wider opacity-80 shrink-0">
            REF: {REF_ID}
          </span>
          <span className="text-caps tracking-widest opacity-80 text-center flex-1">
            ACTIVE: {active}
          </span>
          <span className="text-caps tracking-wider tabular-nums shrink-0">
            {now ? formatDossierDate(now) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
