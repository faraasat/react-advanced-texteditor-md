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
    <>
      <div ref={ref} />
      <div className="statusrow" data-testid="headless-footer">
        <span>
          {stats.words} words{isEmpty ? " (empty)" : ""}
        </span>
        <span className="seg" role="group" aria-label="Mode">
          {(["wysiwyg", "markdown", "split"] as const).map((m) => (
            <label key={m}>
              <input type="radio" name="headless-mode" checked={mode === m} onChange={() => setMode(m)} />
              <span>{m}</span>
            </label>
          ))}
        </span>
      </div>
    </>
  );
}
