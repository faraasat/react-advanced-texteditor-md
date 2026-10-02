"use client";
import { useMarkdownEditor } from "react-advanced-texteditor-md";

// The headless hook: you draw everything around the editor, it mounts into the element you attach `ref` to.
export function HeadlessDemo() {
  const { ref, mode, setMode, stats, isEmpty } = useMarkdownEditor({
    defaultValue: "The editor mounts into the `div` below. The footer is plain React.",
    layout: "minimal",
    minHeight: 100,
    maxHeight: 200,
  });
  return (
    <div className="space-y-3">
      <div ref={ref} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted" data-testid="headless-footer">
        <span>
          {stats.words} words{isEmpty ? " (empty)" : ""}
        </span>
        <span className="flex gap-1" role="group" aria-label="Mode">
          {(["wysiwyg", "markdown", "split"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold aria-pressed:bg-brand aria-pressed:text-brand-ink"
            >
              {m}
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}
