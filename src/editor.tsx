import { forwardRef, memo, useImperativeHandle, useState } from "react";
import type { ForwardedRef } from "react";
import { createPortal } from "react-dom";
import { renderHtml } from "advanced-texteditor-md/render";
import type { EditorInstance, RenderOptions } from "advanced-texteditor-md";
import { useEngine } from "./engine";
import type { MarkdownEditorProps } from "./types";

const cx = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(" ");

/** The static copy shown until the editor exists. Pure and DOM-free: it runs on the server. */
function staticHtml(p: MarkdownEditorProps, markdown: string): string {
  // The core accepts both forms (array or record) and derives the chip schemes.
  const chips = p.chips ?? [];
  const chipSchemeNames = Array.isArray(chips) ? chips.map((d) => d.scheme) : Object.keys(chips);
  const mentions = p.mentions ? (Array.isArray(p.mentions) ? p.mentions : [p.mentions]) : [];
  const o: RenderOptions = {
    math: p.features?.math !== false,
    footnotes: p.features?.footnotes !== false,
    syntax: p.syntax,
    links: p.links,
    classPrefix: p.classPrefix,
    highlight: p.highlight,
    chips,
    chipSchemes: [...chipSchemeNames, ...mentions.map((m) => m.scheme ?? "mention")],
    embeds: p.embeds,
  };
  return renderHtml(markdown, o);
}

function MarkdownEditorImpl(props: MarkdownEditorProps, ref: ForwardedRef<EditorInstance>) {
  const { className, style, id, children, ssr = true, "aria-label": ariaLabel, ...options } = props;
  const prefix = options.classPrefix ?? "atm";
  const engine = useEngine({
    ...options,
    // The editable surface takes its accessible name from labels.editor.
    labels: ariaLabel ? { ...options.labels, editor: ariaLabel } : options.labels,
  });
  useImperativeHandle(ref, () => engine.handle, [engine.handle]);

  // Computed once, during the first render, on the server and in the browser alike: hydration sees the same markup.
  const [fallback] = useState(() => {
    if (!ssr) return null;
    const markdown = options.value ?? options.defaultValue ?? "";
    try {
      return { html: staticHtml(props, markdown), empty: markdown.trim() === "", markdown };
    } catch {
      return null;
    }
  });

  const theme = typeof options.theme === "string" && options.theme !== "auto" ? options.theme : undefined;
  const slot = engine.actionsEl;

  return (
    <div id={id} className={cx(prefix + "-react", className)} style={style} data-atm-react="">
      <div ref={engine.hostRef} />
      {!engine.editor && fallback !== null && (
        <div
          className={cx(prefix + "-surface", prefix + "-react-fallback")}
          data-atm-theme={theme}
          data-empty={fallback.empty ? "" : undefined}
          data-placeholder={options.placeholder}
          aria-busy="true"
          style={options.minHeight !== undefined ? { minHeight: options.minHeight } : undefined}
        >
          {options.name ? <input type="hidden" name={options.name} defaultValue={fallback.markdown} /> : null}
          <div dangerouslySetInnerHTML={{ __html: fallback.html }} />
        </div>
      )}
      {children !== undefined && children !== null && (slot ? createPortal(children, slot) : <div className={prefix + "-react-actions"}>{children}</div>)}
    </div>
  );
}

/**
 * A WYSIWYG editor that stores Markdown. Controlled (`value` + `onChange`) or uncontrolled
 * (`defaultValue`), with a `ref` that exposes the core's `EditorInstance`.
 */
export const MarkdownEditor = memo(forwardRef<EditorInstance, MarkdownEditorProps>(MarkdownEditorImpl));
MarkdownEditor.displayName = "MarkdownEditor";
