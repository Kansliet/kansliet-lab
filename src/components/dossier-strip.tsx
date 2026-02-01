"use client";

import { useState, useEffect } from "react";

const REF_ID = "IDN-2526-K(DC)SYS";
const CLASSIFICATION = "PUBLIC";

function formatDossierDate(date: Date) {
  const day = date.getDate().toString().padStart(2, "0");
  const months = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC";
  const month = months.split(" ")[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${year} — ${hours}:${minutes}`;
}

export function DossierStrip() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-b-brutal bg-background h-full min-h-[var(--dossier-strip-height)] flex items-center">
      <div className="container-kansliet w-full">
        <div className="flex items-center justify-between text-dossier">
          <span className="text-caps tracking-wider opacity-80">
            REF: {REF_ID}
          </span>
          <span className="text-caps tracking-widest opacity-60">
            {CLASSIFICATION}
          </span>
          <span className="text-caps tracking-wider tabular-nums">
            {now ? formatDossierDate(now) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
