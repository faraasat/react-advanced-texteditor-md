"use client";

import { createHighlighter } from "advanced-texteditor-md";
import { bash } from "advanced-texteditor-md/highlight/bash";
import { css } from "advanced-texteditor-md/highlight/css";
import { javascript } from "advanced-texteditor-md/highlight/javascript";
import { json } from "advanced-texteditor-md/highlight/json";
import { python } from "advanced-texteditor-md/highlight/python";
import { sql } from "advanced-texteditor-md/highlight/sql";
import { typescript } from "advanced-texteditor-md/highlight/typescript";
import { callout, highlightMark, kbd, subSup } from "advanced-texteditor-md/plugins";
import { useEffect, useMemo, useRef, useState } from "react";
import { MarkdownEditor, MarkdownView, type EditorInstance, type EditorMode } from "react-advanced-texteditor-md";
import { track } from "@/lib/analytics";
import { SITE } from "@/lib/config";
import { CHIPS, searchPeople } from "@/lib/people";
import { CopyButton } from "./copy-button";
import { Segmented } from "./segmented";
import { Tabs, useTabPrefix } from "./tabs";

const LAYOUTS = ["classic", "minimal", "bubble", "bottom-bar", "split", "document"] as const;
const THEMES = ["light", "dark", "sepia", "slate", "contrast"] as const;
const MODES = [
  { id: "wysiwyg", label: "Write" },
  { id: "markdown", label: "Markdown" },
  { id: "split", label: "Split" },
] as const;
type Layout = (typeof LAYOUTS)[number];
type Theme = (typeof THEMES)[number];

// Module scope: options are compared by value, but a stable reference is free.
const highlighter = createHighlighter([javascript, typescript, python, sql, css, json, bash]);
const PLUGINS = [highlightMark, callout, kbd, subSup];
const MENTIONS = { trigger: "@", search: searchPeople, maxResults: 8, groupBy: (p: { badge?: string }) => p.badge ?? "" };
const LINKS = { allowedSchemes: ["http", "https", "mailto", "tel", "blob"] };

const sample = (base: string) => `# A React editor

Write **rich text**, *store* Markdown. Mention [@Ada Lovelace](mention:staff/u01?legacy=100) from staff, or [@Alan Turing](mention:guest/u02?legacy=101) who is a guest.

==Highlighted text== comes from a plugin, H~2~O and x^2^ from another, press [[Ctrl]] [[K]] for a link.

::: tip
Callouts are a block syntax: \`::: tip\` ... \`:::\`.
:::

![Quarterly results|center|360](${base}/sample.svg "Q1 to Q3")

Inline math $E = mc^2$ and a block:

$$
\\int_0^1 x^2\\,dx = \\frac{1}{3}
$$

\`\`\`tsx
export const Comment = () => <MarkdownEditor value={md} onChange={setMd} />;
\`\`\`

| Feature | Status |
| :------ | -----: |
| Controlled | yes |
| Server rendering | yes |

- [x] Mentions
- [ ] Your idea
`;

const siteTheme = (): "light" | "dark" => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

/** The centrepiece: the real React component with every layout, theme and mode, and what it stores, live. */
export function Playground() {
  const [md, setMd] = useState(() => sample(SITE.basePath));
  const [layout, setLayout] = useState<Layout>("classic");
  const [theme, setTheme] = useState<Theme>("dark");
  const [mode, setMode] = useState<EditorMode>("wysiwyg");
  const [readOnly, setReadOnly] = useState(false);
  const [ready, setReady] = useState(false);
  const [html, setHtml] = useState("");
  const [stats, setStats] = useState({ words: 0, characters: 0 });
  const [tab, setTab] = useState("markdown");
  const prefix = useTabPrefix("pgout");
  const ref = useRef<EditorInstance>(null);

  // The site's own light / dark toggle drives the editor's theme until the visitor picks a different one here.
  useEffect(() => {
    setTheme(siteTheme());
    const on = (e: Event) => setTheme((e as CustomEvent<Theme>).detail);
    window.addEventListener("site-theme", on);
    return () => window.removeEventListener("site-theme", on);
  }, []);

  useEffect(() => {
    const ed = ref.current;
    setHtml(ed?.getHtml() ?? "");
    const st = (ed as { getStats?: () => { words?: number; characters?: number } } | null)?.getStats?.();
    setStats({ words: st?.words ?? 0, characters: st?.characters ?? md.length });
  }, [md, ready, layout]);

  const jsx = useMemo(
    () =>
      [
        "<MarkdownEditor",
        "  value={markdown}",
        "  onChange={setMarkdown}",
        `  layout="${layout}"`,
        `  theme="${theme}"`,
        mode !== "wysiwyg" ? `  mode="${mode}"\n  onModeChange={setMode}` : null,
        readOnly ? "  readOnly" : null,
        "/>",
      ]
        .filter(Boolean)
        .join("\n"),
    [layout, theme, mode, readOnly],
  );

  const shown = tab === "html" ? html : tab === "jsx" ? jsx : md;

  return (
    <div className="pg">
      <div className="pg__controls" role="group" aria-label="Playground options">
        <Segmented legend="Layout" name="pg-layout" value={layout} options={LAYOUTS.map((l) => ({ id: l, label: l }))} onChange={(v) => {
            setLayout(v);
            // The split layout is the one with a live preview, so it starts in split mode; leaving it leaves split mode.
            setMode((m) => (v === "split" ? "split" : m === "split" ? "wysiwyg" : m));
            track("playground_change", { kind: "layout", value: v });
          }} />
        <Segmented legend="Editor theme" name="pg-theme" value={theme} options={THEMES.map((t) => ({ id: t, label: t }))} onChange={(v) => (setTheme(v), track("playground_change", { kind: "theme", value: v }))} />
        <Segmented legend="Mode" name="pg-mode" value={mode} options={MODES} onChange={(v) => (setMode(v), track("playground_change", { kind: "mode", value: v }))} />
        <div className="pg__group">
          <div className="pg__tools" style={{ paddingBottom: 4 }}>
            <label className="check">
              <input type="checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} /> Read-only
            </label>
            <button type="button" className="btn btn--sm" onClick={() => setMd(sample(SITE.basePath))}>
              Reset sample
            </button>
          </div>
        </div>
      </div>

      <div className="pg__stage" id="editor-host" data-testid="editor-host" aria-busy={!ready}>
        <MarkdownEditor
          ref={ref}
          value={md}
          onChange={setMd}
          layout={layout}
          theme={theme as never}
          mode={mode}
          onModeChange={setMode}
          readOnly={readOnly}
          placeholder="Write something, or type @ to mention and / for blocks…"
          minHeight={260}
          maxHeight={layout === "document" ? undefined : 560}
          aria-label="Playground editor"
          highlight={highlighter}
          plugins={PLUGINS}
          chips={CHIPS}
          mentions={MENTIONS}
          links={LINKS}
          onReady={() => setReady(true)}
        />
      </div>

      <div className="out-card">
        <div className="out-card__head">
          <Tabs
            tabs={[
              { id: "markdown", label: "Markdown" },
              { id: "html", label: "HTML" },
              { id: "preview", label: "MarkdownView" },
              { id: "jsx", label: "JSX" },
            ]}
            value={tab}
            onChange={setTab}
            label="Output format"
            prefix={prefix}
          />
          <div className="out-card__meta">
            <span data-testid="stats">
              {stats.words} words, {stats.characters} characters
            </span>
            {tab !== "preview" ? <CopyButton getText={() => shown} target={`playground-${tab}`} /> : null}
          </div>
        </div>
        <div role="tabpanel" id={`${prefix}-panel-${tab}`} aria-labelledby={`${prefix}-tab-${tab}`}>
          {tab === "preview" ? (
            // The client MarkdownView: React elements built from the same parser, no dangerouslySetInnerHTML for your text.
            <div className="out-card__render" data-testid="output-render" role="region" tabIndex={0} aria-label="Rendered by MarkdownView">
              <MarkdownView markdown={md} highlight={highlighter} chips={CHIPS} links={LINKS} />
            </div>
          ) : (
            <pre className="out" id="output" data-testid="output" role="region" tabIndex={0} aria-label={tab === "html" ? "HTML (getHtml)" : tab === "jsx" ? "The component, as configured" : "Markdown (what is stored)"}>
              {shown}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
