# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
