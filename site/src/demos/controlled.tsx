"use client";
import { useState } from "react";
import { MarkdownEditor } from "react-advanced-texteditor-md";

// The stylesheet is imported once for the whole app (see app/globals.css):
//   @import "advanced-texteditor-md/style.css";

export function ControlledDemo() {
  const [markdown, setMarkdown] = useState(
    "## Controlled\n\nReact state owns this string. Edit here and watch it below.\n\n- [x] no memoising needed\n- [ ] your idea",
  );
  return (
    <div className="space-y-3">
      <MarkdownEditor value={markdown} onChange={setMarkdown} layout="minimal" minHeight={140} maxHeight={260} aria-label="Controlled editor" />
      <pre data-testid="controlled-out" tabIndex={0} className="max-h-40 overflow-auto rounded-lg border border-line bg-code p-3 font-mono text-xs whitespace-pre-wrap">
        {markdown}
      </pre>
      <button
        type="button"
        onClick={() => setMarkdown("# Set from state\n\nThe editor took the new value without losing its undo history.")}
        className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm font-semibold hover:bg-panel-2"
      >
        Set from state
      </button>
    </div>
  );
}
