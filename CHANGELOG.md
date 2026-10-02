# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 0.3.1 (2026-10-03)

- `cards` prop on `<MarkdownEditor />`, `useMarkdownEditor` and the client `<MarkdownView />`: profile cards for chips and mentions on hover, keyboard focus and touch long-press (`getCard(chip, { signal })`, opt-in, lazy, no hydration mismatch, bound once per `cards` value, removed on unmount). The server-safe `/view` ignores it.
- Chips with `onChipClick` or `ChipDefinition.onClick` carry `data-atm-interactive`, which the core's stylesheet turns into a pointer cursor, a hover tint and a focus ring.
- Needs the core release that adds `enhanceChipCards` and the interactive chip styles (`advanced-texteditor-md` above 0.3.0).

## 0.3.0 (2026-10-03)

- Requires `advanced-texteditor-md` `^0.3.0`: new lazy subpaths `/snippets`, `/links`, `/comments`, `/frontmatter` and `/source` (import them from the core and pass the plugins through `plugins`).

## 0.2.1 (2026-10-03)

- `MarkdownView` accepts `softBreak="br"`: a single newline inside a paragraph shows as a line break (display only; the Markdown is unchanged). `MarkdownEditor` forwards the same option to the core.
- Requires `advanced-texteditor-md` `^0.2.1` (per-person chip colour and badge, theming for menus appended to `<body>`, narrow-toolbar overflow, `insertMarkdown` without focus, `getValue()` always current).

## 0.2.0 (2026-10-02)

- Requires `advanced-texteditor-md` `^0.2.0` (large-document speed fix, definition lists, tasks, dictation and present/reader subpaths).
- Fix: `onSubmit` now uses the core's own `onSubmit` option. 0.1.0 listened for a `submit` event that the core had renamed to `atm:submit`, so `onSubmit` never fired in the comment-box layout.

## 0.1.0 (2026-10-02)

First release. Requires `advanced-texteditor-md` `^0.1.0`.

### Features

* `<MarkdownEditor />`: every core option, controlled (`value`) or uncontrolled (`defaultValue`), created in an effect and
  destroyed in its cleanup (StrictMode safe), updated in place for `value`, `mode`, `readOnly`, `disabled`, `theme`,
  `minHeight` and `maxHeight`, recreated once when a structural option changes (value, mode and focus carried over).
* Options are compared by value; functions are never compared (the latest is always called), so nothing has to be memoised.
* A forwarded `ref` exposing the full `EditorInstance` as one stable object that survives recreation (`on()` listeners and
  registered commands included).
* `children` are portalled into the `bottom-bar` layout's `actions` slot; `onSubmit` for `Mod-Enter`; `aria-label`,
  `aria-labelledby`, `aria-describedby`, `className`, `style`, `id`.
* Server rendering: a static copy of the initial Markdown (no empty flash, no hydration mismatch), including the form field.
* `<MarkdownView />`: Markdown to React elements from the core's AST, same output and classes as the core's `renderHtml`,
  `components` map (per node type, per chip scheme or kind, per custom syntax), chips with badges and colours, math, highlighting,
  embeds, link previews, `onChipClick`, `onLinkClick`, and per-block memoisation for long documents.
* `renderMarkdownToReact(markdown, options)` for non-component use.
* `react-advanced-texteditor-md/view`: the same renderer with no hooks and no `"use client"` directive, for Server Components.
* Hooks: `useMarkdownEditor` (headless), `useEditorState` (`useSyncExternalStore`), `useEditorValue`.
* Core types and the light `define*` helpers re-exported; heavy subpaths stay in the core.
