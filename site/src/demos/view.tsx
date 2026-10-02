"use client";
import { useState } from "react";
import { MarkdownEditor, MarkdownView } from "react-advanced-texteditor-md";

// MarkdownView builds React elements from the same parser the editor uses: no dangerouslySetInnerHTML for your text.
export function ViewDemo() {
  const [md, setMd] = useState("## Live preview\n\nType here. The block below is a **MarkdownView**, re-rendering only the blocks that changed.\n\n> Quotes, `code`, tables and math work too: $a^2 + b^2 = c^2$.");
  return (
    <>
      <MarkdownEditor defaultValue={md} onChange={setMd} layout="minimal" minHeight={110} maxHeight={200} aria-label="Source" />
      <div className="viewbox" data-testid="view-out">
        <MarkdownView markdown={md} />
      </div>
    </>
  );
}
