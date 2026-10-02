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
    <>
      <MarkdownEditor value={markdown} onChange={setMarkdown} layout="minimal" minHeight={140} maxHeight={260} aria-label="Controlled editor" />
      <pre className="out" data-testid="controlled-out" role="region" tabIndex={0} aria-label="The state, as Markdown">
        {markdown}
      </pre>
      <div className="controls">
        <button type="button" className="btn btn--sm" onClick={() => setMarkdown("# Set from state\n\nThe editor took the new value without losing its undo history.")}>
          Set from state
        </button>
      </div>
    </>
  );
}
