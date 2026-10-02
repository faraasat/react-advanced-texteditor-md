"use client";
import { useState } from "react";

/** Copies `text` to the clipboard. Falls back to a hint when the browser refuses (insecure context, blocked permission). */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      data-copy={label === "Copy" ? "snippet" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("copied");
        } catch {
          setState("failed");
        }
        setTimeout(() => setState("idle"), 1600);
      }}
      className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink hover:bg-panel-2"
    >
      {state === "copied" ? "Copied" : state === "failed" ? "Select and copy" : label}
    </button>
  );
}
