"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-100 border-t-brutal bg-background p-6">
      <div className="container-kansliet flex items-center justify-between gap-6">
        <p className="text-normal-case text-sm font-light">
          WE USE COOKIES TO IMPROVE YOUR EXPERIENCE.{" "}
          <a href="/legal" className="underline hover:opacity-60">
            LEARN MORE
          </a>
        </p>
        <Button onClick={acceptCookies} size="sm">
          ACCEPT
        </Button>
      </div>
    </div>
  );
}
