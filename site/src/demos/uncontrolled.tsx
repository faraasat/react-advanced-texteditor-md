"use client";
import { useRef, useState } from "react";
import { MarkdownEditor, type EditorInstance } from "react-advanced-texteditor-md";

export function UncontrolledDemo() {
  // The ref is the core's full EditorInstance: one stable object, safe to call before mount and after unmount.
  const ref = useRef<EditorInstance>(null);
  const [saved, setSaved] = useState("");
  return (
    <>
      <MarkdownEditor ref={ref} defaultValue={"Uncontrolled: the editor owns the document.\n\nRead it back through the **ref**."} layout="minimal" minHeight={110} maxHeight={220} aria-label="Uncontrolled editor" />
      <div className="controls">
        <button type="button" className="btn btn--sm" onClick={() => setSaved(ref.current?.getValue() ?? "")}>
          Read value
        </button>
        <button type="button" className="btn btn--sm" onClick={() => (ref.current?.focus(), ref.current?.insertMarkdown("**bold** "))}>
          Insert bold
        </button>
        <button type="button" className="btn btn--sm" onClick={() => ref.current?.setValue("")}>
          Clear
        </button>
      </div>
      <pre className="out" data-testid="uncontrolled-out" role="region" tabIndex={0} aria-label="What getValue returned">
        {saved || "getValue() will appear here"}
      </pre>
    </>
  );
}
