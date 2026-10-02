"use client";
import { useRef, useState } from "react";
import { MarkdownEditor, MarkdownView, type EditorInstance } from "react-advanced-texteditor-md";

// The bottom-bar layout has an `actions` slot. Children are portalled into it, so they are ordinary React.
export function CommentBoxDemo() {
  const ref = useRef<EditorInstance>(null);
  const [comments, setComments] = useState<string[]>(["First! Markdown works **here** too."]);
  const send = (md: string) => {
    if (!md.trim()) return;
    setComments((c) => [...c, md]);
    ref.current?.setValue("");
  };
  return (
    <div className="space-y-3">
      <ul className="space-y-2" data-testid="comments">
        {comments.map((c, i) => (
          <li key={i} className="rounded-lg border border-line bg-panel-2 p-2">
            <MarkdownView markdown={c} />
          </li>
        ))}
      </ul>
      <MarkdownEditor ref={ref} layout="bottom-bar" placeholder="Reply... (Ctrl or Cmd + Enter sends)" minHeight={72} maxHeight={160} aria-label="Reply" onSubmit={send}>
        <button type="button" onClick={() => send(ref.current?.getValue() ?? "")} className="rounded-md bg-brand px-3 py-1 text-sm font-semibold text-brand-ink">
          Send
        </button>
      </MarkdownEditor>
    </div>
  );
}
