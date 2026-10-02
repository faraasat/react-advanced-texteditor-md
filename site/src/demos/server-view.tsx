// A Server Component: no "use client", no hooks. In this static export it ran once, at build time.
import { MarkdownView } from "react-advanced-texteditor-md/view";
import { createHighlighter } from "advanced-texteditor-md";
import { typescript } from "advanced-texteditor-md/highlight/typescript";

const highlighter = createHighlighter([typescript]);

const POST = `## Rendered on the server

\`MarkdownView\` from \`react-advanced-texteditor-md/view\` has no hooks and no effects, so a Server Component can render it.
It ships **no editor code** to the browser.

- Mentions render as chips: [@Ada Lovelace](mention:staff/u01) and [@Alan Turing](mention:guest/u02)
- Code is highlighted by the core's highlighter, on the server:

\`\`\`ts
export const add = (a: number, b: number): number => a + b; // 0 kB of JS for this block
\`\`\`
`;

export function ServerViewDemo() {
  const builtAt = new Date().toISOString();
  return (
    <>
      <div className="viewbox">
        <MarkdownView
          markdown={POST}
          highlight={highlighter}
          chips={[{ scheme: "mention", kinds: { staff: { color: 3, label: "Staff" }, guest: { color: 6, label: "Guest" } } }]}
        />
      </div>
      <p className="fcard__hint" data-testid="built-at">
        Rendered at build time: <time dateTime={builtAt}>{builtAt}</time>
      </p>
    </>
  );
}
