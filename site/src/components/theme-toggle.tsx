"use client";
import { track } from "@/lib/analytics";
import { useSiteTheme } from "@/lib/use-site-theme";

export function ThemeToggle() {
  const theme = useSiteTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      id="theme-toggle"
      aria-pressed={theme === "dark"}
      aria-label={`Switch to ${next} mode`}
      onClick={() => {
        const root = document.documentElement;
        root.setAttribute("data-theme", next);
        // The editor stylesheet follows an ancestor's data-atm-theme, so every editor on the page follows the toggle.
        root.setAttribute("data-atm-theme", next);
        track("theme_switch", { value: next });
        try {
          localStorage.setItem("ratm-site-theme", next);
        } catch {
          /* storage can be blocked: the choice then lasts for this page only */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1 text-sm hover:bg-panel-2"
    >
      <span aria-hidden="true">◐</span>
      <span suppressHydrationWarning>{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
