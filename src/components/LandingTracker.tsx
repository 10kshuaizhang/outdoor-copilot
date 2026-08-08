"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/events";

/** Fires once per mount on the marketing home. */
export function LandingTracker() {
  useEffect(() => {
    trackEvent("landing_view");
  }, []);
  return null;
}
