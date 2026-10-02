// The docs pages: this repository's README and CHANGELOG, rendered at build time by the package's OWN server-safe
// <MarkdownView /> (react-advanced-texteditor-md/view). Server only: it reads files. The pages ship as static HTML.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { createHighlighter } from "advanced-texteditor-md";
import { parse } from "advanced-texteditor-md/parser";
import { inlineToText } from "advanced-texteditor-md/render";
import { bash } from "advanced-texteditor-md/highlight/bash";
import { css } from "advanced-texteditor-md/highlight/css";
import { html as htmlLang } from "advanced-texteditor-md/highlight/html";
import { javascript } from "advanced-texteditor-md/highlight/javascript";
import { json } from "advanced-texteditor-md/highlight/json";
import { markdown } from "advanced-texteditor-md/highlight/markdown";
import { typescript } from "advanced-texteditor-md/highlight/typescript";
import { MarkdownView } from "react-advanced-texteditor-md/view";
import { SITE } from "./config";
import { ROOT } from "./facts";

export type DocPage = { slug: string; source: string; nav: string; description: string };

export const DOC_PAGES: DocPage[] = (
  [
    { slug: "guide", source: "README.md", nav: "Guide and API", description: "Quick start for Vite and Next.js, the components, the hooks, theming, server rendering, security and the FAQ." },
    { slug: "changelog", source: "CHANGELOG.md", nav: "Changelog", description: "What changed in each release." },
  ] satisfies DocPage[]
).filter((p) => existsSync(join(ROOT, p.source)));

export type Toc = { level: 2 | 3; id: string; text: string }[];

const highlighter = createHighlighter([javascript, typescript, json, css, htmlLang, bash, markdown]);
const ALIASES: Record<string, string> = { js: "javascript", ts: "typescript", tsx: "typescript", jsx: "javascript", sh: "bash", shell: "bash", md: "markdown", jsonc: "json" };
const highlight = { highlight: (code: string, lang?: string) => highlighter.highlight(code, ALIASES[lang ?? ""] ?? lang ?? "") };

const bySource = new Map(DOC_PAGES.map((p) => [p.source.toLowerCase(), p.slug]));

/** README links to its own files: send CHANGELOG to the rendered page and the rest to GitHub. */
function fixLink(url: string): string {
  if (!url || url.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("/")) return url;
  const [path, hash] = url.split("#");
  const file = path.replace(/^(\.\/|\.\.\/)+/, "");
  const slug = bySource.get(file.toLowerCase());
  if (slug) return `${SITE.basePath}/docs/${slug}/${hash ? "#" + hash : ""}`;
  return `https://github.com/${SITE.repo}/blob/main/${file}${hash ? "#" + hash : ""}`;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s/g, "-");

/**
 * The sources are hard-wrapped at about 130 columns for reading on GitHub, and the renderer (rightly) turns every newline
 * inside a paragraph into a line break. Join the wrapped lines of plain paragraphs and list items so the page reflows.
 * Fenced code, tables, headings, quotes, blank lines and lines ending in a hard break are left exactly as they are.
 */
export function unwrap(md: string): string {
  const out: string[] = [];
  let fence = false;
  const block = (l: string) => /^\s*(#{1,6}\s|>|\||[-*+]\s|\d+[.)]\s|```|~~~|:::|<|---|===|\[[^\]]+\]:)/.test(l);
  for (const line of md.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence;
      out.push(line);
      continue;
    }
    const prev = out[out.length - 1];
    const joinable = !fence && prev !== undefined && prev.trim() !== "" && line.trim() !== "" && !block(line) && !/(\s{2}|\\)$/.test(prev) && !/^\s*(#{1,6}\s|\||```|~~~|:::|<)/.test(prev);
    if (joinable) out[out.length - 1] = prev.replace(/\s+$/, "") + " " + line.trim();
    else out.push(line);
  }
  return out.join("\n");
}

/** A table header cell must not be empty (a screen reader would read a column with no name): give blank ones a name. */
export function nameEmptyHeaders(md: string): string {
  const lines = md.split("\n");
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\s*\|/.test(lines[i]) || !/^\s*\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) continue;
    lines[i] = lines[i].replace(/\|\s{0,2}(?=\|)/g, "| Item ");
  }
  return lines.join("\n");
}

function readSource(p: DocPage): string {
  // README holds GitHub-only chrome (badges, screenshots: raw HTML, which the renderer correctly refuses to interpret).
  return nameEmptyHeaders(unwrap(readFileSync(join(ROOT, p.source), "utf8")))
    .replace(/<!-- site:skip -->[\s\S]*?<!-- \/site:skip -->/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

/** The ids headings get, in document order: the same slug rule as GitHub, with -1, -2 for repeats. */
function headingIds(md: string): { toc: Toc; ids: string[] } {
  const seen = new Map<string, number>();
  const ids: string[] = [];
  const toc: Toc = [];
  for (const b of parse(md).children) {
    if (b.type !== "heading") continue;
    const text = inlineToText(b.children);
    let id = slugify(text) || "section";
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    if (n) id += "-" + n;
    ids.push(id);
    if (b.level === 2 || b.level === 3) toc.push({ level: b.level, id, text });
  }
  return { toc, ids };
}

export function renderDoc(p: DocPage): { title: string; toc: Toc; body: ReactNode } {
  const md = readSource(p);
  const { toc, ids } = headingIds(md);
  const title = /^#\s+(.+)$/m.exec(md)?.[1].replace(/`/g, "") ?? p.nav;
  let next = 0;
  let tables = 0;
  let codes = 0;
  const body = (
    <MarkdownView
      markdown={md}
      highlight={highlight as never}
      math={false}
      links={{ resolve: fixLink, allowedSchemes: ["http", "https", "mailto"] } as never}
      components={{
        // Headings get the id GitHub would give them (the README's own anchors rely on it) and a link to themselves.
        heading: ({ node, className, children }) => {
          const id = ids[next++];
          const Tag = `h${node.level}` as "h1";
          return (
            <Tag id={id} className={className}>
              {children}
              <a className="anchor" href={`#${id}`} aria-label="Link to this section">
                #
              </a>
            </Tag>
          );
        },
        // The default code block is a named region; the names must be unique on a page, so number them.
        codeBlock: ({ node, className, children }) => (
          <pre className={className} tabIndex={0} role="region" aria-label={`Code ${++codes}${node.lang ? ` (${node.lang})` : ""}`}>
            {children}
          </pre>
        ),
        // A wide table scrolls sideways; its wrapper is focusable so the scroll is reachable by keyboard, and named uniquely.
        table: ({ className, children }) => (
          <div className="prose-table" tabIndex={0} role="region" aria-label={`Table ${++tables} (scrolls sideways)`}>
            <table className={className}>{children}</table>
          </div>
        ),
      }}
    />
  );
  return { title: title === SITE.name ? "Guide and API" : title, toc, body };
}
