"use client";
import { useSyncExternalStore } from "react";

export type SiteTheme = "light" | "dark";

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

/** The page's light / dark choice (set on <html> by the toggle). "light" on the server and for the first client render. */
export function useSiteTheme(): SiteTheme {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"),
    () => "light",
  );
}
