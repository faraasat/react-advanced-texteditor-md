// The client entry. tsup puts "use client" on the first line of the built file; everything here may
// use hooks and effects. The server-safe renderer is `react-advanced-texteditor-md/view`.
export { MarkdownEditor } from "./editor";
export { MarkdownView } from "./view-client";
export { renderMarkdownToReact } from "./view-core";
export { useMarkdownEditor, useEditorState, useEditorValue } from "./hooks";
export type { UseEditorStateOptions, UseMarkdownEditorResult } from "./hooks";

// Light, pure helpers from the core, so a host rarely needs a second import for them. Heavier
// subpaths (`/uploaders`, `/mentions`, `/plugins`, `/highlight`, `/math`, `/embeds`, `/link-preview`,
// `/paste`) are deliberately NOT re-exported: import them where you use them, so a bundler only
// ships what you need.
export { definePlugin, defineInlineSyntax, defineBlockSyntax, defineLayout, defineToolbarItem, DEFAULT_LABELS, preloadChunks } from "advanced-texteditor-md";

export type {
  ChipNode,
  ChipViewProps,
  EditorCallbacks,
  EditorConfig,
  MarkdownEditorProps,
  MarkdownViewOptions,
  MarkdownViewProps,
  UseMarkdownEditorOptions,
  ViewComponents,
  ViewNodeProps,
} from "./types";
// The core's types (EditorOptions, EditorInstance, Plugin, MentionItem, ...), listed by name: a
// blanket `export *` would also declare the core's functions as exports of this package.
export type {
  BlockNode,
  BlockSyntax,
  ChipDefinition,
  Command,
  Doc,
  EditorEvents,
  EditorInstance,
  EditorLabels,
  EditorMode,
  EditorOptions,
  EmbedProvider,
  Highlighter,
  InlineNode,
  InlineSyntax,
  LanguageDef,
  LayoutDefinition,
  LayoutName,
  LayoutRegions,
  LinkPolicy,
  LinkPreview,
  LinkPreviewOptions,
  ListItem,
  MathRenderer,
  MentionItem,
  MentionOptions,
  Pane,
  ParseOptions,
  Plugin,
  Pos,
  RenderOptions,
  SlashItem,
  Slot,
  ThemeTokens,
  ToolbarConfig,
  ToolbarItem,
  TokenRule,
  UploadContext,
  UploadOptions,
  UploadRejectReason,
  UploadResult,
} from "advanced-texteditor-md";
