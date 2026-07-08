"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // localStorage is client-only; reading it post-mount avoids a hydration
      // mismatch. One-time sync, not a render-driving loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    window.dispatchEvent(new Event("cookie-consent-granted"));
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-100 border-t-brutal bg-background p-6">
      <div className="container-kansliet flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-normal-case text-sm font-light">
          WE USE ANALYTICS COOKIES TO UNDERSTAND HOW THE SITE IS USED.{" "}
          <a href="/legal" className="underline hover:opacity-60">
            LEARN MORE
          </a>
        </p>
        <div className="flex gap-3 shrink-0">
          <Button variant="secondary" onClick={declineCookies} size="sm">
            DECLINE
          </Button>
          <Button onClick={acceptCookies} size="sm">
            ACCEPT
          </Button>
        </div>
      </div>
    </div>
  );
}
