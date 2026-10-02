/**
 * `react-advanced-texteditor-md/view`: the server-safe entry. Everything exported here is a pure
 * function of its props (no hooks, no effects, no browser globals) and the built file carries no
 * "use client" directive, so a React Server Component can import it.
 */
export { MarkdownView } from "./view-pure";
export { renderMarkdownToReact } from "./view-core";

// @internal: the building blocks the client `MarkdownView` (main entry) reuses so the two share
// one copy of the renderer. Not part of the public API and not covered by semver.
export { splitViewProps } from "./view-pure";
export { block, blocks, collectFootnotes, footnotes, resolveView } from "./view-core";
export type { ResolvedView } from "./view-core";
export type {
  BlockNode,
  ChipDefinition,
  Doc,
  Highlighter,
  InlineNode,
  LinkPolicy,
  LinkPreviewOptions,
  MathRenderer,
  ParseOptions,
  RenderOptions,
} from "advanced-texteditor-md";
export type {
  ChipNode,
  ChipViewProps,
  MarkdownViewOptions,
  MarkdownViewProps,
  ViewComponents,
  ViewNodeProps,
} from "./types";
