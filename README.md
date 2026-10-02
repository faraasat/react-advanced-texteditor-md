<!-- site:skip -->
<p align="center">
  <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/.github/assets/banner.svg" alt="react-advanced-texteditor-md" width="100%" />
</p>

<p align="center">
  React bindings for a WYSIWYG editor that <b>stores Markdown</b>: <code>&lt;MarkdownEditor /&gt;</code>, a server-component friendly <code>&lt;MarkdownView /&gt;</code>, and hooks.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-advanced-texteditor-md"><img alt="npm version" src="https://img.shields.io/npm/v/react-advanced-texteditor-md?color=cb3837&label=npm&logo=npm"></a>
  <a href="https://www.npmjs.com/package/react-advanced-texteditor-md"><img alt="downloads" src="https://img.shields.io/npm/dm/react-advanced-texteditor-md?color=cb3837&label=downloads"></a>
  <a href="https://bundlephobia.com/package/react-advanced-texteditor-md"><img alt="bundle size" src="https://img.shields.io/bundlephobia/minzip/react-advanced-texteditor-md?label=minzipped"></a>
  <a href="https://github.com/faraasat/react-advanced-texteditor-md/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/faraasat/react-advanced-texteditor-md/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="types" src="https://img.shields.io/badge/types-included-3178c6?logo=typescript&logoColor=white">
  <img alt="one dependency: the core" src="https://img.shields.io/badge/dependencies-1%20(the%20core)-brightgreen">
  <a href="https://github.com/faraasat/react-advanced-texteditor-md/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/npm/l/react-advanced-texteditor-md?color=blue"></a>
</p>

<p align="center">
  <a href="https://faraasat.github.io/react-advanced-texteditor-md/"><b>Live demo</b></a> ·
  <a href="https://www.npmjs.com/package/react-advanced-texteditor-md">npm</a> ·
  <a href="https://github.com/faraasat/advanced-texteditor-md">Core editor</a> ·
  <a href="https://github.com/faraasat/react-advanced-texteditor-md/blob/main/CHANGELOG.md">Changelog</a> ·
  <a href="https://github.com/faraasat/react-advanced-texteditor-md/issues">Issues</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/hero.png" alt="The live demo site" width="860" />
</p>

---
<!-- /site:skip -->

# react-advanced-texteditor-md

React bindings for [advanced-texteditor-md](https://github.com/faraasat/advanced-texteditor-md): a dependency-free WYSIWYG
editor that **stores Markdown**. You get a `<MarkdownEditor />` (controlled or uncontrolled, with a `ref` to the full editor
API), a `<MarkdownView />` that renders Markdown as real React elements (no `dangerouslySetInnerHTML` for your content, and a
server-component build), and three hooks.

- Correct React semantics: the editor is created in an effect and destroyed in its cleanup (StrictMode-safe), updated in place
  where the core allows it, and recreated only when a structural option changes.
- No memoising needed: options are compared by value, callbacks may change on every render.
- SSR-safe: the server (and the first client render) shows a static copy of the initial Markdown, so there is no empty flash and
  no hydration mismatch.
- `MarkdownView` re-renders only the blocks that changed. `react-advanced-texteditor-md/view` has no hooks, so Next.js App
  Router Server Components can render it.
- Small: the wrapper is about 5.4 kB gzip (the renderer another 4.3 kB); the editor itself is the core's separate, lazily loaded
  download.

```bash
npm i react-advanced-texteditor-md      # or: pnpm add / yarn add / bun add
```

See it first in the **[live demo](https://faraasat.github.io/react-advanced-texteditor-md/)**: a playground with every layout, theme and mode, and eleven demos, each with the exact code beside it.

`advanced-texteditor-md` is a regular dependency and installs with it. `react` and `react-dom` (17 or newer) are peer dependencies.

<!-- site:skip -->
## Screenshots

| | |
|---|---|
| <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/playground.png" alt="The playground with its JSX tab" /><br><sub>The playground: the real component, with the JSX it would take</sub> | <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/playground-split.png" alt="The split layout in the playground" /><br><sub>Every layout, theme and mode, live</sub> |
| <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/demo-controlled.png" alt="The controlled demo with its code" /><br><sub>Controlled editor, with the code that runs it</sub> | <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/mentions-menu.png" alt="The mention menu" /><br><sub>Mentions with badges and colours</sub> |
| <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/demo-server.png" alt="A MarkdownView rendered by a Server Component" /><br><sub><code>MarkdownView</code> in a Server Component (dark mode)</sub> | <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/demo-tailwind.png" alt="The editor styled with Tailwind utility classes" /><br><sub>Tailwind v4 through <code>classNames</code></sub> |
| <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/demo-theming.png" alt="Theming demo with the sepia theme" /><br><sub>Themes and custom tokens</sub> | <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/uploads.png" alt="Uploads accepted and rejected by the allow and deny lists" /><br><sub>Uploads: allow and deny lists</sub> |
| <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/demo-comments.png" alt="A comment box in the bottom-bar layout" /><br><sub>A comment box with React children in the actions slot</sub> | <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/landing-light.png" alt="The demo site in light mode" /><br><sub>The demo site, light mode (it follows your system and has a toggle)</sub> |
| <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/dark-mode.png" alt="The demo site in dark mode" /><br><sub>The demo site, dark mode</sub> | <img src="https://raw.githubusercontent.com/faraasat/react-advanced-texteditor-md/main/github-imgs/mobile-editor.png" alt="The demo on a phone" width="260" /><br><sub>On a phone (390 px, dark)</sub> |

<!-- /site:skip -->

## Quick start

### Vite (or any bundler)

```tsx
import { useState } from "react";
import { MarkdownEditor } from "react-advanced-texteditor-md";
import "advanced-texteditor-md/style.css"; // the editor's stylesheet: import it once, anywhere

export function Comment() {
  const [markdown, setMarkdown] = useState("# Hello\n\nWrite **Markdown** visually.");
  return <MarkdownEditor value={markdown} onChange={setMarkdown} placeholder="Write something..." minHeight={160} />;
}
```

The stylesheet is **not** bundled into this package (so it is never shipped twice): import `advanced-texteditor-md/style.css`
(or `style.min.css`, or the Tailwind bridge, see [Theming](#theming)) yourself.

### Next.js App Router

```tsx
// app/page.tsx  (a Server Component: no "use client" needed here)
import { MarkdownView } from "react-advanced-texteditor-md/view"; // server-safe renderer
import { Composer } from "./composer";

export default async function Page() {
  const post = await loadPost();
  return (
    <>
      <MarkdownView markdown={post.body} />
      <Composer initial={post.draft} />
    </>
  );
}
```

```tsx
// app/composer.tsx
"use client"; // handlers are functions, so the component that passes them is a Client Component
import { useState } from "react";
import { MarkdownEditor } from "react-advanced-texteditor-md";

export function Composer({ initial }: { initial: string }) {
  const [md, setMd] = useState(initial);
  return <MarkdownEditor value={md} onChange={setMd} />;
}
```

```css
/* app/globals.css, or import the file from app/layout.tsx */
@import "advanced-texteditor-md/style.css";
```

The main entry (`react-advanced-texteditor-md`) already starts with `"use client"`, so you can import it from a Server Component
and use it as a leaf, but you cannot pass it functions from there. `react-advanced-texteditor-md/view` is a plain module with
no directive: render it anywhere. `npm run check:next` in this repository verifies both against the built files.

## Which import path

| Import | Use it for |
|---|---|
| `react-advanced-texteditor-md` | `MarkdownEditor`, `MarkdownView` (memoised), `renderMarkdownToReact`, `useMarkdownEditor`, `useEditorState`, `useEditorValue`, `definePlugin`, `defineInlineSyntax`, `defineBlockSyntax`, `defineLayout`, `defineToolbarItem`, `DEFAULT_LABELS`, `preloadChunks`, and the core's **types** |
| `react-advanced-texteditor-md/view` | `MarkdownView` (no memoisation, no hooks), `renderMarkdownToReact`. Server Components, route handlers, emails |
| `advanced-texteditor-md/style.css` (`style.min.css`, `tailwind.css`) | The stylesheet |
| `advanced-texteditor-md/plugins` | Ready-made plugins (`highlightMark`, `callout`, `kbd`, `subSup`, find and replace, toc, ...) |
| `advanced-texteditor-md/uploaders` | `createPutUploader`, `createFormUploader`, `createPresignedUploader`, `createDataUrlUploader`, `validateFile`, `urlAllowed` |
| `advanced-texteditor-md/mentions` | `mentionHref`, `parseMentionHref` |
| `advanced-texteditor-md/highlight`, `advanced-texteditor-md/highlight/<lang>` | `createHighlighter` languages |
| `advanced-texteditor-md/math` | `createMathRenderer({ macros })`, `texToMathML` |
| `advanced-texteditor-md/embeds`, `/link-preview`, `/paste`, `/parser`, `/render` | Embeds, link previews, paste conversion, parse and render |

The heavy subpaths are deliberately not re-exported from the main entry: import them where you use them and your bundler ships
only that. Every type from the core (`EditorOptions`, `EditorInstance`, `Plugin`, `MentionItem`, ...) is re-exported as a type.

## `<MarkdownEditor />`

It takes **every option of the core's `EditorOptions`** with the same names and meaning: `mode`, `allowModeSwitch`, `layout`,
`toolbar`, `theme`, `classNames`, `classPrefix`, `placeholder`, `readOnly`, `disabled`, `autofocus`, `maxLength`, `minHeight`,
`maxHeight`, `name`, `features`, `mentions`, `chips`, `upload`, `links`, `linkPreview`, `embeds`, `highlight`, `math`, `syntax`,
`plugins`, `keymap`, `history`, `emoji`, `labels`. Their documentation lives in the core and is not repeated here:
**[advanced-texteditor-md: Options](https://github.com/faraasat/advanced-texteditor-md#options)**.

Added or changed by the React layer:

| Prop | |
|---|---|
| `value` / `defaultValue` | Controlled / uncontrolled Markdown. See below. |
| `onChange(markdown, editor)` | Fires for edits the **user** makes (never for `value` updates or `setValue`). `editor` is the stable handle. |
| `mode` / `defaultMode` / `onModeChange(mode)` | Controlled / uncontrolled mode (`"wysiwyg"`, `"markdown"`, `"split"`). |
| `onFocus`, `onBlur`, `onMentionsChange(chips)`, `onUpload(event)` | As in the core. |
| `onReady(editor)` | Once per created editor (again after a recreation). Receives the stable handle. |
| `onSubmit(markdown, editor)` | The `bottom-bar` layout's `Mod-Enter`. |
| `className`, `style`, `id` | On the wrapping `<div>`. |
| `aria-label`, `aria-labelledby`, `aria-describedby` | On the editable surface (and the Markdown textarea). A `<label htmlFor>` cannot target a `contenteditable`; use `aria-labelledby`. |
| `children` | Rendered into the layout's `actions` slot by a portal. See [Comment boxes](#comment-boxes-children-and-the-actions-slot). |
| `cards` | Profile cards for chips and mentions: `{ getCard(chip, { signal }), delayMs?, graceMs?, schemes?, cacheSize?, labels? }`. `getCard` returns card data (`{ title, subtitle?, avatarUrl?, fields?, list?, links? }`), an `HTMLElement`, a Promise of either, or `null`. Hover, the caret beside a chip and a touch long-press open it; Escape closes it. Omit it and nothing changes. A new `getCard` identity each render does not recreate the editor. See [Cards](#cards-for-mentions-and-chips). |
| `ssr` | `false` skips the static server copy (client-only apps with huge documents). Default `true`. |
| `ref` | The full `EditorInstance`, one stable object. See [The ref](#the-ref). |

### Controlled and uncontrolled

```tsx
// Uncontrolled: the editor owns the document. `defaultValue` is read once.
<MarkdownEditor defaultValue="# Draft" onChange={(md) => autosave(md)} />

// Controlled: you own the document.
const [md, setMd] = useState("");
<MarkdownEditor value={md} onChange={setMd} />
```

How the controlled mode stays well behaved:

- **No loop.** `onChange` fires only for user edits. When the `value` prop changes the editor calls `setValue` **only if it
  differs from what the editor already holds**, and it does so with `{ keepHistory: true }`, so undo still works and the
  caret is not moved by your own state echoing back.
- **A late parent is not an instruction.** If the parent updates asynchronously (`startTransition`, a debounce) and re-renders
  with a value the user already typed past, that stale echo is ignored instead of overwriting the newer text.
- **Rejecting a change** (a controlled `maxLength` of your own, say) is up to you: in `onChange` call
  `editor.setValue(previous)`. A prop that simply stays the same is not re-applied, because React gives the component no
  signal for it.
- Switching between controlled and uncontrolled after mount is not supported.

`value` and `defaultValue` are the **Markdown** string. The editor normalises it after the user edits it (`**a**` stays
`**a**`, `* a` becomes `- a`), as described in the core's architecture notes.

### How option identity is compared

You never need `useMemo` for options. On every render the component compares what you passed to what it passed to the core:

| Kind of option | Rule |
|---|---|
| Plain objects and arrays (`toolbar`, `features`, `classNames`, `plugins`, `mentions`, `chips`, `upload`, `syntax`, `labels`, ...) | compared **by value**, deeply |
| Functions (`mentions.search`, `upload.handler`, `links.resolve`, plugin `setup`, `chips[].onClick`, ...) | **never compared**. The editor holds a stable wrapper that always calls the **latest** function you passed, so a new closure each render is free and never stale |
| Callbacks (`onChange`, `onFocus`, ...) | the same: latest wins, never a reason to recreate |
| `RegExp` | by source and flags |
| Class instances, DOM nodes, Maps, React elements and exotic components (`memo`, `forwardRef`, class components) | by **reference** |

Which options act live and which recreate the editor:

| Change | Effect |
|---|---|
| `value`, `mode`, `readOnly`, `disabled`, `theme` (string or tokens, by value), `minHeight`, `maxHeight`, `aria-labelledby`, `aria-describedby`, any callback | applied **in place**, no recreation |
| `layout`, `plugins`, `syntax`, `toolbar`, `features`, `mentions` (shape), `chips`, `upload` (shape), `highlight`, `classNames`, `labels`, `placeholder`, `maxLength`, `name`, `keymap`, ... | **recreates the editor once**, carrying the current Markdown, the mode and the focus over. Undo history does not survive a recreation |

So `plugins={[callout()]}` written inline is fine (it is the same value every render), while swapping `layout` rebuilds. Two
caveats follow from "functions are never compared": if you swap one plugin function for a different one and nothing else
changes, the editor does not know, so give the component a `key` to force a rebuild; and a stateful object such as
`createHighlighter([...])` should be created once (module scope or `useMemo`), because the editor keeps the first instance (its
methods are forwarded to the latest, but the two instances do not share registered languages).

### Mentions with badges and colours

```tsx
import { MarkdownEditor } from "react-advanced-texteditor-md";
import type { MentionItem } from "react-advanced-texteditor-md";

const search = async (q: string, { signal }: { signal: AbortSignal }): Promise<MentionItem[]> =>
  (await fetch(`/api/people?q=${encodeURIComponent(q)}`, { signal })).json();
// [{ id: "u1", label: "Jane Doe", kind: "person", badge: "Staff", color: 3, refs: { legacy: "123" } }, ...]

<MarkdownEditor
  mentions={{ trigger: "@", search, groupBy: (p) => p.badge }}
  chips={[{ scheme: "mention", kinds: { person: { color: 3 }, team: { color: "#0d9488", label: "Team" } } }]}
  onMentionsChange={(chips) => console.log(chips.map((c) => c.id))}
/>
```

The stored form is `[@Jane Doe](mention:person/u1?legacy=123)`. Colours are palette slots 1 to 8 or any CSS colour, set per
`(scheme, kind)`; the `label` is the badge text on the chip. Full details: the core's
[Mentions, badges, colours](https://github.com/faraasat/advanced-texteditor-md#mentions-badges-colours-merged-identities).
`<MarkdownView>` renders the same chips (and takes the same `chips` option).

### Uploads

```tsx
import { createPutUploader } from "advanced-texteditor-md/uploaders";

<MarkdownEditor
  upload={{
    handler: createPutUploader({ endpoint: (f) => `/upload/${encodeURIComponent(f.name)}`, resolveUrl: (r) => r.headers.get("Location") ?? "" }),
    allowExtensions: ["png", "jpg", "pdf"],
    maxFileSizeBytes: 5 * 1024 * 1024,
  }}
  onUpload={(e) => e.type === "rejected" && toast(`${e.file.name} was rejected: ${e.reason}`)}
/>
```

Paste, drop and the file picker all go through `upload`. The core validates size, count, extension and MIME type before your
handler runs, checks the returned URL against the link policy, and aborts in-flight uploads when the editor is destroyed.

### Plugins and custom syntax

```tsx
import { MarkdownEditor, definePlugin, defineInlineSyntax } from "react-advanced-texteditor-md";
import { highlightMark, callout } from "advanced-texteditor-md/plugins";

const spoiler = defineInlineSyntax({ name: "spoiler", open: "||", tag: "span", className: "spoiler" });

<MarkdownEditor plugins={[highlightMark(), callout()]} syntax={{ inline: [spoiler] }} />;
```

Plugins are compared by value (see above), so inline arrays are fine. A plugin's `setup(editor)` receives the core's editor.
Authoring guides: the core's [Plugins](https://github.com/faraasat/advanced-texteditor-md/blob/main/docs/PLUGINS.md) and
[Custom syntax](https://github.com/faraasat/advanced-texteditor-md/blob/main/docs/CUSTOM_SYNTAX.md).

### Comment boxes: children and the actions slot

The `bottom-bar` layout has an `actions` slot next to the toolbar. Children are portalled into it, so they are ordinary React
(state, context, events all work):

```tsx
const ref = useRef<EditorInstance>(null);

<MarkdownEditor ref={ref} layout="bottom-bar" placeholder="Reply..." onSubmit={send}>
  <button type="button" onClick={() => { send(ref.current!.getValue()); ref.current!.setValue(""); }}>Send</button>
</MarkdownEditor>
```

Layouts without an `actions` slot render the children in a `<div class="atm-react-actions">` below the editor, so they are never
lost. Before the editor exists (server render, first client render) the children sit in that same bar. Inside a `<form>`, the
core's bubbling `submit` event also reaches the form's own `onSubmit`, so `Mod-Enter` can submit it; see the FAQ.

### In a form

```tsx
<form onSubmit={(e) => { e.preventDefault(); save(new FormData(e.currentTarget)); }}>
  <input name="title" />
  <MarkdownEditor name="body" defaultValue={draft} aria-label="Body" />
  <button>Save</button>
</form>
```

`name` makes the core add a hidden `<input>` that always holds the current Markdown, so it works with `FormData`, native
submission and Server Actions (`action={save}`). `reset` restores the initial value, and `disabled` disables the field. The
server render includes the same hidden input (with the initial value), so a form posted before hydration still carries it.

### The ref

```tsx
const ref = useRef<EditorInstance>(null);
<MarkdownEditor ref={ref} />;

ref.current.getValue();                // Markdown
ref.current.setValue("# New");         // does not fire onChange
ref.current.insertMarkdown("**x**");
ref.current.insertChip({ scheme: "mention", kind: "person", id: "u1", label: "Jane", trigger: "@" });
ref.current.focus();
ref.current.on("change", (md) => {});  // survives a recreation
```

It is the core's full `EditorInstance`
([Events and API](https://github.com/faraasat/advanced-texteditor-md#events-and-api)), exposed as **one object that never
changes identity** (it forwards to whichever editor is current). Safe to call before mount and after unmount: reads return the
last known value, writes are ignored (a `setValue` before mount is applied when the editor arrives). `on()` listeners and
`registerCommand()` registrations are carried over when the editor is recreated. `ref.current.element` is the editor's root
element (null when there is no editor). Calling `destroy()` yourself leaves the component with a dead editor: unmount it instead.

## Hooks

### `useEditorState(editor, selector, options?)`

Built on `useSyncExternalStore`. Subscribes to the core's events and re-renders **only when the selected value changes**, so a
word count does not re-render for every caret move.

```tsx
import { useEditorState } from "react-advanced-texteditor-md";

function Footer({ editor }: { editor: EditorInstance | null }) {
  const words = useEditorState(editor, (e) => e.getStats().words, { events: ["change"], fallback: 0 });
  const people = useEditorState(editor, (e) => e.getMentions(), { events: ["mentions"], isEqual: sameIds });
  return <p>{words} words</p>;
}
```

- A selector that returns a **new object each call** needs `isEqual`, otherwise every event re-renders (the result is cached and
  compared with `Object.is` by default).
- `events` limits what triggers a re-read (`change`, `mode`, `selection`, `mentions`, `focus`, `blur`, `pane`, or a plugin's
  `"plugin:name:event"`). Default: all of them.
- Without an editor it returns `fallback` (or `undefined`), also on the server.
- Pass `ref.current` or the `editor` that `useMarkdownEditor` returns: both survive a recreation.

On React 17, which has no `useSyncExternalStore`, a small built-in equivalent is used.

### `useEditorValue(editor, fallback = "")`

The current Markdown as state. Re-renders on every change; prefer `useEditorState` with a selector for anything finer.

### `useMarkdownEditor(options)` (headless)

For layouts the component does not give you. The editor mounts into the element you attach `ref` to; you draw everything else.

```tsx
const { ref, editor, value, setValue, mode, setMode, stats, isEmpty, ready, actionsElement } = useMarkdownEditor({
  defaultValue: "# Notes",
  layout: "bottom-bar",
  onChange: (md) => save(md),
});

return (
  <>
    <div ref={ref} />
    <footer>{stats.words} words · {mode}</footer>
    {actionsElement && createPortal(<SendButton />, actionsElement)}
  </>
);
```

It takes every `<MarkdownEditor />` option. `value`, `mode` and `stats` re-render the calling component when they change; for
less, read them with `useEditorState` in a child. It renders no static server copy (an empty host on the server).

## `<MarkdownView />`

A read-only renderer that builds **React elements from the core's parser**: no `dangerouslySetInnerHTML` for your text, the
same link policy, the same `atm-*` classes (so the editor's stylesheet styles it, and its output matches the core's `renderHtml`;
a test compares them over a corpus).

```tsx
import { MarkdownView } from "react-advanced-texteditor-md";

<MarkdownView
  markdown={post.body}
  chips={[{ scheme: "mention", kinds: { person: { color: 3 } } }]}
  links={{ allowedHosts: ["example.com"] }}
  highlight={highlighter}
  onChipClick={(chip) => router.push(`/people/${chip.id}`)}
  onLinkClick={(href, ev) => track(href)}
  components={{ heading: ({ node, className, children }) => <h2 data-level={node.level} className={className}>{children}</h2> }}
/>;
```

Props: `markdown`, `className`, `style`, `id`, `theme` (`"light" | "dark"`), `aria-label`, plus the render options of the core:
`gfm`, `math` (`false` to leave `$` alone), `mathRenderer`, `footnotes`, `syntax`, `chips` (an array, as the editor takes it, or a
record), `chipSchemes`, `links`, `classPrefix`, `classNames` (per **node type**: `paragraph`, `heading`, `table`, ...),
`highlight`, `embeds`, `linkPreview`, `labels`, and `cards` (client `MarkdownView` only, see [Cards](#cards-for-mentions-and-chips)).

- **Math** is rendered by the core's TeX renderer into MathML. A string result is trusted core output and is inserted as markup;
  an `HTMLElement` result from a custom renderer is attached on the client.
- **Code**: pass `highlight` (a `createHighlighter([...])`); the highlighter's escaped markup is the only other trusted markup.
- **Chips** carry `data-scheme`, `data-kind`, `data-id`, `data-trigger`, `data-refs`, a kind class, the colour variable and the
  kind's badge. With `onChipClick` or `ChipDefinition.onClick` they become `role="button"` and answer Enter and Space, and carry `data-atm-interactive` (pointer cursor, hover and focus styles).
- **Embeds and link previews**: `embeds` turns a top-level line holding only a URL into the core's sandboxed iframe block.
  `linkPreview` marks standalone-URL paragraphs; the client `MarkdownView` loads the core's link-preview controller and turns the
  marks into cards (and hover cards). `resolve` must run on your server, see the core's docs.
- **The wrapper** is `<div class="atm-surface atm-view">` with the min-height and padding variables set to 0 (override with
  `style` or the `--atm-surface-*` variables).

### Cards for mentions and chips

Pass `cards` to show a profile card when a mention or chip is hovered, focused with the keyboard or long-pressed on a touch screen. It works the same on `<MarkdownEditor />` and on the client `<MarkdownView />`:

```tsx
const getCard = async (chip, { signal }) => {
  const p = await fetch(`/api/people/${chip.id}`, { signal }).then((r) => r.json());
  return { title: p.name, subtitle: p.role, avatarUrl: p.avatar, links: [{ label: "Profile", href: `/people/${chip.id}` }] };
};

<MarkdownView markdown={post.body} cards={{ getCard }} onChipClick={(chip) => router.push(`/people/${chip.id}`)} />;
<MarkdownEditor value={md} onChange={setMd} mentions={mentions} cards={{ getCard }} />;
```

- **Opt-in:** without `cards` the chips are exactly as before. The card code (the core's `/chips` subpath) is fetched only when `cards` is set.
- **View:** the chips are bound in an effect after the render, so server and client markup are identical and there is no hydration mismatch. One binding lives as long as the `cards` value does; new Markdown only binds the chips that are new, and blocks React keeps (the memoisation) keep their binding. It is removed on unmount. The server-safe `react-advanced-texteditor-md/view` ignores `cards`.
- **Editor:** the cards plugin is added to the editor; `getCard` is read through a ref, so an inline function does not recreate it. Turning `cards` on or off does.
- **Pointer and states:** chips with a card, or with `onChipClick`, get `data-atm-interactive`: a pointer cursor, a hover tint, a focus ring. Cards are `role="tooltip"` (or a non-modal `role="dialog"` when they hold links), close with Escape, copy the theme, density and `dir` of the content, and respect `prefers-reduced-motion` and forced colors.

### Customising with `components`

```tsx
<MarkdownView
  markdown={md}
  components={{
    // by node type. Each override gets { node, className, children }: the AST node, the class the library would use,
    // and the default rendering of the content. Omit children to replace the content as well.
    link: ({ href, external, children }) => <a href={href} data-external={external}>{children}</a>,
    image: ({ src, node }) => <Zoomable src={src} alt={node.alt} />,
    codeBlock: ({ node, html }) => <CodeBlock lang={node.lang} code={node.code} highlighted={html} />,
    // per chip: "scheme:kind" beats "scheme" beats `chip`
    chips: { "mention:person": ({ node, text }) => <PersonChip id={node.id} name={text} /> },
    chip: ({ text }) => <b>{text}</b>,
    // user-defined syntax, by name
    custom: { spoiler: ({ children }) => <Spoiler>{children}</Spoiler> },
  }}
/>
```

Node types: `paragraph`, `heading`, `blockquote`, `list`, `listItem`, `codeBlock`, `mathBlock`, `table`, `thematicBreak`, `emphasis`,
`strong`, `strike`, `code`, `link`, `image`, `mathInline`. An override replaces the element, so it is also the place to add a
`key`-stable wrapper, a tooltip or a router `<Link>`.

### Why it is fast on long documents

The client `MarkdownView` parses once per `markdown` change and gives every top-level block a key made from its own content.
Each block is a memoised component that re-renders only when its own content (or the options) changed. Editing one paragraph
of a 500-block document re-renders that paragraph; inserting a block at the top re-renders only the new one. Options are
compared by value (see above), so inline `components`, `chips` and `links` do not defeat it. Blocks that cite a footnote also
re-render when the footnote numbering changes.

`react-advanced-texteditor-md/view` exports the same `MarkdownView` without memoisation or effects (and without link-preview
hydration): that is the one to use in Server Components.

### `renderMarkdownToReact(markdown, options?)`

The same renderer as a function, for non-component use (a table cell, a tooltip, an email template, a list of messages):

```tsx
import { renderMarkdownToReact } from "react-advanced-texteditor-md/view";

const nodes = renderMarkdownToReact(message.body, { links: { allowedHosts: ["example.com"] } });
return <li className="atm-surface">{nodes}</li>; // wrap in `atm-surface` yourself to get the typography
```

## Theming

Everything visual comes from the core's stylesheet and CSS variables: see its
[Theming guide](https://github.com/faraasat/advanced-texteditor-md/blob/main/docs/THEMING.md). From React:

```tsx
<MarkdownEditor theme="dark" />                       // "light" | "dark" | "auto" (follows the OS) | tokens
<MarkdownEditor theme={{ accent: "#7c3aed", radius: "12px", palette: ["#e11d48", "#0d9488"] }} />
<MarkdownEditor classNames={{ root: "rounded-xl border", surface: "prose", toolbarButton: "hover:bg-slate-100" }} />
<MarkdownView markdown={md} theme="dark" className="prose" />
```

`theme` and `readOnly` change **in place**; the editor is not rebuilt, so the caret and undo history survive a dark-mode toggle.
With no `theme` the editor follows an ancestor's `data-atm-theme` or the OS.

### Tailwind v4

```css
/* app.css */
@import "tailwindcss";
@import "advanced-texteditor-md/style.css";
@import "advanced-texteditor-md/tailwind.css";
```

The bridge maps the editor's variables onto Tailwind theme tokens (`bg-atm-surface`, `text-atm-fg`, `border-atm-border`,
`ring-atm-ring`, `rounded-atm`, `atm-chip-1` to `atm-chip-8`), and every slot takes utilities through `classNames`:

```tsx
<MarkdownEditor
  className="max-w-2xl"
  classNames={{
    root: "rounded-xl border border-atm-border shadow-sm",
    toolbar: "bg-atm-surface",
    surface: "min-h-40 text-atm-fg",
    chip: "font-medium",
  }}
/>
```

Tailwind must be able to see those class strings (they are in your source, so it does). The wrapper element also accepts `className`.

The editor's stylesheet is plain, unlayered CSS, and Tailwind's utilities live in a cascade layer, so where a utility and the editor's own rule set the same
property on the same element (`rounded-2xl` or `border-2` on `root`, say) the editor's rule wins. Import it into a lower layer and the utilities win:
`@import "advanced-texteditor-md/style.css" layer(components);` (the demo site does this; checked with Tailwind v4 and core 0.1.0).

Tailwind's preflight sets `list-style: none` on every list, and the core's stylesheet leaves list markers to the browser default, so inside a
Tailwind app bullets and numbers disappear from the editor and from `MarkdownView` (checked with Tailwind v4 and core 0.1.0). Put them back
once:

```css
.atm-surface ul { list-style: disc; }
.atm-surface ol { list-style: decimal; }
.atm-surface li.atm-task { list-style: none; }
```

## Server rendering and hydration

`<MarkdownEditor />` renders, on the server and for the first client render, a static copy of the initial Markdown (the core's
`renderHtml` from `advanced-texteditor-md/render`, in a `div.atm-surface.atm-react-fallback`) next to an empty host. As soon as
the client mounts, the real editor is created in the host in a layout effect and the copy is removed, before the browser paints.
Because both renders are the same, hydration has nothing to reconcile. The copy honours `chips`, `syntax`, `links`, `highlight`
and `embeds`; formulas appear as source until the editor loads its math chunk.

- Controlled: the copy shows `value`; uncontrolled: `defaultValue`.
- Pass `ssr={false}` in a client-only app to skip that work for very large documents.
- `useMarkdownEditor` renders an empty host on the server (it has no layout of its own to fall back to).
- With JavaScript disabled the page still shows the content and, with `name`, still posts it.

## Security notes

- Raw HTML in Markdown is never interpreted. `MarkdownView` builds elements, so text and attribute values are escaped by React;
  `javascript:`, `data:` and `vbscript:` URLs (including `java<TAB>script:` and entity tricks) are refused by the same link
  policy as the core, `on*` attributes from custom syntax are dropped, and a test runs a list of payloads through it.
- The only markup inserted as HTML is **trusted output**: the core's MathML, your `highlight`er's escaped spans, and what a
  `ChipDefinition.render` you wrote returns. Do not return unescaped user text from `render`.
- `links.allowedHosts`, `allowedSchemes` and `resolve` apply in `MarkdownView` exactly as in the editor; a `resolve` rewrite is
  re-checked.
- Embeds are sandboxed `https` iframes whose host must be allowed by the provider; link-preview `resolve` functions belong on
  your server (the core explains the SSRF reasons).
- Validate and sanitise on the server too: the client is not a trust boundary, and what you store is just a Markdown string.

## FAQ

**Do I need `useMemo` / `useCallback` for props?** No. See [How option identity is compared](#how-option-identity-is-compared).

**Why did the editor lose my undo history?** A structural option (`layout`, `plugins`, ...) changed and the editor was
recreated. The Markdown, mode and focus are kept, the history is not. Changing `value`, `theme`, `readOnly` or `mode` never
does that.

**The editor does not follow my state.** In controlled mode the `value` prop is applied when it differs from the editor's current
Markdown. If a change is rejected by your handler the prop does not change, and React gives the component no signal, so the
editor keeps what the user typed: call `ref.current.setValue(previous)` in that case.

**`onChange` does not fire when I call `setValue`.** By design (it is the core's contract): `onChange` is for user edits, so
setting a value from state can never loop.

**Can I put `<MarkdownEditor>` inside a `<form onSubmit>` and use the bottom-bar layout?** Yes, but note that the core
dispatches a bubbling `submit` CustomEvent from the editor on `Mod-Enter`. React maps it to ancestors' `onSubmit`, so the form's
handler runs (with that CustomEvent, not a `SubmitEvent`, and the native form is not submitted). Use `onSubmit` on the editor
for chat-style sending and keep such editors out of forms that should not react to it.

**Which React versions?** 17 and newer. Hydration with the static copy and `useSyncExternalStore` are designed for 18 and 19;
on 17 a built-in stand-in replaces `useSyncExternalStore`.

**Does it work with the React Compiler / StrictMode?** Yes: creation and destruction are balanced in one effect, and tests run
the editor under StrictMode.

**Where is the CSS?** In the core: `advanced-texteditor-md/style.css`. It is never bundled into this package.

## Browser support

The wrapper adds no browser requirement of its own: it needs what the [core editor](https://github.com/faraasat/advanced-texteditor-md#browser-support)
needs, and React 17 or newer.

| What | Tested how |
|---|---|
| Chromium, desktop and a Pixel 7 emulation | Playwright against the example app (`example/`) and the demo site, in CI |
| React 19 | the unit, integration, SSR and hydration suites and both apps |
| React 17 and 18 | designed for (a stand-in replaces `useSyncExternalStore` on 17); **not** in the CI matrix |
| Firefox, WebKit | covered by the core's own Playwright suite, **not** re-run here |
| Node 20, 22, 24 | CI matrix (typecheck, tests, build, size) |
| Real iOS and Android devices | not run |

## How it compares

The wrapper is small because the editor is the core's separate, lazily loaded download. Measured 2026-10-02 (gzip -9, `npm run size` in this
repository, which excludes the core):

| Piece | Gzip |
|---|---|
| `react-advanced-texteditor-md` (editor, hooks, client `MarkdownView`) | 5.5 kB (budget 6 kB) |
| `react-advanced-texteditor-md/view` (server-safe renderer) | 4.3 kB (budget 5 kB) |
| The core's editor entry that the wrapper loads | about 62 kB, with more chunks on first use (see the core's [size table](https://github.com/faraasat/advanced-texteditor-md#size-and-lazy-loading)) |

For the whole editor against Tiptap, Lexical and Milkdown (measured the same way, with the method and versions) see the core's
[comparison](https://github.com/faraasat/advanced-texteditor-md#how-it-compares): the initial JavaScript of a Markdown-holding editor was
62.4 kB gzip here against 139.4 kB (Tiptap), 137.3 kB (Lexical) and 137.0 kB (Milkdown), the others being headless toolkits. Those
libraries also have React bindings of their own and capabilities this one lacks (real-time collaboration, a larger ecosystem, longer track
record); we did not measure rendering speed or editing quality and make no claim about them.


## Roadmap and known gaps

- **Depends on a published core.** `advanced-texteditor-md` is a regular dependency; this package cannot be installed from the registry until the
  core is.
- **Controlled mode and a rejected change:** React gives the component no signal when a parent refuses an update, so call `ref.current.setValue(previous)`
  yourself (see the FAQ).
- **Structural options recreate the editor** (`layout`, `plugins`, `syntax`, ...) and the undo history does not survive that.
- **React 17 and 18** are supported by design but not exercised in CI; only 19 is.
- **Tailwind preflight** removes list markers unless you add the three CSS lines shown under Tailwind v4 (a core stylesheet matter).
- Everything in the core's [roadmap and known gaps](https://github.com/faraasat/advanced-texteditor-md#roadmap-and-known-gaps) applies here too.

Gaps you hit are welcome as [issues](https://github.com/faraasat/react-advanced-texteditor-md/issues).

## Privacy

The demo site uses privacy-respecting analytics: Aptabase (cookieless) and, only with your consent, Google Analytics. The npm package itself
collects nothing: it makes no network request on its own, loads no script, and sends no telemetry. Details, and how to change your choice:
[the site's Privacy page](https://faraasat.github.io/react-advanced-texteditor-md/privacy/) and [SECURITY.md](SECURITY.md).

## Developing this package

`advanced-texteditor-md` is a normal dependency (`^0.1.0`) and CI installs it from the registry, so the core must be published first.
Locally, link the sibling checkout:

```bash
npm install --no-save ../advanced-texteditor-md   # or: npm run link:core
```

That creates a symlink in `node_modules`, leaves `package.json` untouched and publishable, and uses the core's built `dist/` (run `npm run build`
in the core first if it is missing). A later plain `npm install` prunes the link; run the command again.

```bash
npx vitest run                         # unit, integration (real core in jsdom), SSR, hydration, bundle shape
npx tsc --noEmit
npm run build                          # tsup: dist/index (use client) + dist/view (no directive)
npm run size                           # gzip budget: main <= 6 kB, view <= 5 kB (the core is excluded)
npm run check:next                     # imports the built entries in Node with no DOM
npm run example:build && npx playwright test --project=desktop   # example app (example/) in Chromium
npm run site:install && npm run site:build && npm run site:serve # the Pages site (site/): http://127.0.0.1:4328/react-advanced-texteditor-md/
npm run test:site                      # the built site under its base path: behaviour, no 404s, axe in light and dark
```

## Contributing

Bug reports, reproductions and pull requests are welcome: read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).
Editor behaviour belongs in the [core repository](https://github.com/faraasat/advanced-texteditor-md); React semantics belong here. Security problems
go through a [private advisory](https://github.com/faraasat/react-advanced-texteditor-md/security/advisories/new), not a public issue
([SECURITY.md](SECURITY.md)).

## Maintainers

Releases are deliberate; nothing publishes on a push to `main`. **Publish `advanced-texteditor-md` first**: this package depends on it.

1. `npm run release` bumps the version, writes `CHANGELOG.md` and creates the tag (standard-version, from Conventional Commits).
2. `git push --follow-tags`. The **Release** workflow runs on the `v*` tag: typecheck, tests, build, size budget, Next.js check, then
   `npm publish --provenance --access public`, and creates the GitHub Release.
3. It needs one repository secret, **`NPM_TOKEN`**: an npm *Automation* token with publish rights (Settings, Secrets and variables, Actions).
   Provenance needs no further setup: the workflow has `id-token: write`.

**Actions, Release, "Run workflow"** with `dry-run` ticked builds and packs without publishing. The **Deploy site to GitHub Pages** workflow needs no
secrets; Pages must use the "GitHub Actions" source.

## License

MIT

Made by [Farasat Ali](https://github.com/faraasat).
