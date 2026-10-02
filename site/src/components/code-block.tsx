import { createHighlighter } from "advanced-texteditor-md";
import { typescript } from "advanced-texteditor-md/highlight/typescript";
import { css } from "advanced-texteditor-md/highlight/css";
import { bash } from "advanced-texteditor-md/highlight/bash";
import { markdown } from "advanced-texteditor-md/highlight/markdown";
import { CopyButton } from "./copy-button";

// The core's own highlighter, run on the server at build time: the page ships the highlighted markup, no highlighter code.
const highlighter = createHighlighter([typescript, css, bash, markdown]);
const KNOWN = new Set(["typescript", "css", "bash", "markdown"]);
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function CodeBlock({ code, lang = "typescript", label }: { code: string; lang?: string; label?: string }) {
  const html = KNOWN.has(lang) ? highlighter.highlight(code, lang) : escapeHtml(code);
  return (
    <div className="code-block relative min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted">{label}</span>
        <CopyButton text={code} />
      </div>
      <pre
        tabIndex={0}
        aria-label={label ? `Code: ${label}` : "Code"}
        className="max-h-[34rem] overflow-auto rounded-lg border border-line bg-code p-3 font-mono text-[0.78rem] leading-relaxed"
      >
        {/* Trusted: the library's highlighter escapes the source and adds only <span class="atm-tok-*">. */}
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
