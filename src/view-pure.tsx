import { createElement as h } from "react";
import type { CSSProperties, ReactElement } from "react";
import { renderMarkdownToReact } from "./view-core";
import type { MarkdownViewOptions, MarkdownViewProps } from "./types";

/** The wrapper's props, shared by the server and the client `MarkdownView`. */
export function splitViewProps(p: MarkdownViewProps): { options: MarkdownViewOptions; root: Record<string, unknown>; markdown: string } {
  const { markdown, className, style, id, theme, "aria-label": ariaLabel, ...options } = p;
  const prefix = options.classPrefix ?? "atm";
  // `.atm-surface` is the core's typography class; its box (min-height, padding, pre-wrap) is for an editable area.
  const base: CSSProperties = { "--atm-surface-min-height": "0", "--atm-surface-padding": "0", whiteSpace: "normal" } as CSSProperties;
  return {
    markdown,
    options,
    root: {
      id,
      className: [prefix + "-surface", prefix + "-view", className].filter(Boolean).join(" "),
      style: { ...base, ...style },
      "data-atm-theme": theme,
      "aria-label": ariaLabel,
      role: ariaLabel ? "region" : undefined,
    },
  };
}

/**
 * Renders Markdown as React elements. No hooks and no effects, so a React Server Component can
 * render it (`import { MarkdownView } from "react-advanced-texteditor-md/view"`). It re-renders
 * whole when its props change; use the client `MarkdownView` from the main entry for long
 * documents that change often.
 */
export function MarkdownView(props: MarkdownViewProps): ReactElement {
  const { markdown, options, root } = splitViewProps(props);
  return h("div", root, renderMarkdownToReact(markdown, options));
}
