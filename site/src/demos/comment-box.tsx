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
    <>
      <ul className="comments" data-testid="comments">
        {comments.map((c, i) => (
          <li key={i}>
            <MarkdownView markdown={c} />
          </li>
        ))}
      </ul>
      <MarkdownEditor ref={ref} layout="bottom-bar" placeholder="Reply... (Ctrl or Cmd + Enter sends)" minHeight={72} maxHeight={160} aria-label="Reply" onSubmit={send}>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => send(ref.current?.getValue() ?? "")}>
          Send
        </button>
      </MarkdownEditor>
    </>
  );
}
