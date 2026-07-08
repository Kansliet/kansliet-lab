"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";

/**
 * Fires a single GA4 conversion event when the contact form succeeds, then
 * strips ?success=1 from the URL. Rendered only inside the success banner.
 *
 * GA is consent-gated by AnalyticsConsent — if the visitor declined cookies,
 * sendGAEvent just pushes to an unconsumed dataLayer array (no request, no
 * cookie), so this stays GDPR-safe without a check of its own.
 */
export function ContactSuccessTracker() {
  useEffect(() => {
    // sessionStorage guard: refresh / bfcache restore must not re-fire.
    if (sessionStorage.getItem("contact-conversion-sent")) return;
    sessionStorage.setItem("contact-conversion-sent", "1");
    sendGAEvent("event", "contact_form_submit", {});
    // Strip ?success=1 WITHOUT a router navigation, so the banner stays mounted.
    window.history.replaceState(null, "", "/contact");
  }, []);

  return null;
}
