"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Choice = "accepted" | "declined" | null;

/** Change or withdraw analytics consent: must be as easy as giving it (GDPR art. 7.3). */
export function CookieSettings() {
  const [choice, setChoice] = useState<Choice>(null);

  useEffect(() => {
    // localStorage is client-only; read post-mount to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(localStorage.getItem("cookie-consent") as Choice);
  }, []);

  function allow() {
    localStorage.setItem("cookie-consent", "accepted");
    window.dispatchEvent(new Event("cookie-consent-granted"));
    setChoice("accepted");
  }

  function withdraw() {
    localStorage.setItem("cookie-consent", "declined");
    // Remove the Google Analytics cookies already set, on this host and the
    // parent domain (GA writes to the registrable domain).
    const domain = window.location.hostname.split(".").slice(-2).join(".");
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0].trim();
      if (name.startsWith("_ga")) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
        document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`;
      }
    }
    // A reload is the only way to unload the already-running GA script.
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center gap-4 border-brutal p-4">
      <p className="text-sm">
        Analytics:{" "}
        <strong className="font-normal">
          {choice === "accepted" ? "ON" : choice === "declined" ? "OFF" : "NOT CHOSEN (OFF)"}
        </strong>
      </p>
      {choice === "accepted" ? (
        <Button type="button" variant="secondary" size="sm" onClick={withdraw}>
          TURN OFF ANALYTICS
        </Button>
      ) : (
        <Button type="button" variant="secondary" size="sm" onClick={allow}>
          ALLOW ANALYTICS
        </Button>
      )}
    </div>
  );
}
