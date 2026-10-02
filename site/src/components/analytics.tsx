"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { initAnalytics, reflect, track, trackingBlocked } from "@/lib/analytics";

/** Starts the privacy-respecting analytics once (see lib/analytics.ts). Renders nothing; the banner is built by the module. */
export function Analytics() {
  const pathname = usePathname();
  const started = useRef(false);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      initAnalytics();
      return;
    }
    // A client-side navigation: count the new page and refresh the consent status shown on the Privacy page.
    if (!trackingBlocked()) track("page_view", { path: pathname });
    reflect();
  }, [pathname]);
  return null;
}
