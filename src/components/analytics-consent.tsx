"use client";

import { useState, useEffect } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

export function AnalyticsConsent({ gaId }: { gaId: string }) {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("cookie-consent") === "accepted") {
      setHasConsent(true);
    }

    const handleConsent = () => setHasConsent(true);
    window.addEventListener("cookie-consent-granted", handleConsent);
    return () => window.removeEventListener("cookie-consent-granted", handleConsent);
  }, []);

  if (!hasConsent) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
