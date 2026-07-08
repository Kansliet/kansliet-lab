"use client";

import { useState, useEffect } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

export function AnalyticsConsent({ gaId }: { gaId: string }) {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("cookie-consent") === "accepted") {
      // localStorage is client-only; reading it post-mount avoids a hydration
      // mismatch. One-time sync, not a render-driving loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasConsent(true);
    }

    const handleConsent = () => setHasConsent(true);
    window.addEventListener("cookie-consent-granted", handleConsent);
    return () => window.removeEventListener("cookie-consent-granted", handleConsent);
  }, []);

  if (!hasConsent) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
