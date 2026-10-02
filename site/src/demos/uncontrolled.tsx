"use client";
import { useRef, useState } from "react";
import { MarkdownEditor, type EditorInstance } from "react-advanced-texteditor-md";

export function UncontrolledDemo() {
  // The ref is the core's full EditorInstance: one stable object, safe to call before mount and after unmount.
  const ref = useRef<EditorInstance>(null);
  const [saved, setSaved] = useState("");
  const btn = "rounded-lg border border-line bg-panel px-3 py-1.5 text-sm font-semibold hover:bg-panel-2";
  return (
    <div className="space-y-3">
      <MarkdownEditor ref={ref} defaultValue={"Uncontrolled: the editor owns the document.\n\nRead it back through the **ref**."} layout="minimal" minHeight={110} maxHeight={220} aria-label="Uncontrolled editor" />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => setSaved(ref.current?.getValue() ?? "")}>
          Read value
        </button>
        <button type="button" className={btn} onClick={() => ref.current?.insertMarkdown("**bold** ")}>
          Insert bold
        </button>
        <button type="button" className={btn} onClick={() => ref.current?.setValue("")}>
          Clear
        </button>
      </div>
      <pre data-testid="uncontrolled-out" tabIndex={0} className="min-h-12 overflow-auto rounded-lg border border-line bg-code p-3 font-mono text-xs whitespace-pre-wrap">
        {saved || "getValue() will appear here"}
      </pre>
    </div>
  );
}
