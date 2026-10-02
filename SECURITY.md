# Security policy

## Supported versions

Security fixes go into the latest minor release of the latest major. While the package is `0.x`, that means the most recent
published version only.

## Reporting a vulnerability

**Please do not open a public issue.** Report it privately with a
[GitHub security advisory](https://github.com/faraasat/react-advanced-texteditor-md/security/advisories/new)
(Security tab, "Report a vulnerability").

Please include the versions of this package, `advanced-texteditor-md` and React, the props you pass, the Markdown or file that
triggers it, the browser or runtime (a Server Component, a route handler), and what runs or leaks.

You can expect an acknowledgement within a few days, a fix or a clear answer as soon as it is understood, and credit in the
release notes if you want it.

## What counts

In scope: any way for untrusted Markdown to reach the DOM of `<MarkdownView />` or the static server copy of
`<MarkdownEditor />` as anything other than text and the library's own markup (script, event handlers, `javascript:` and `data:`
URLs, unsafe attributes from custom syntax); and any hydration or server-rendering path that turns text into markup.

Out of scope: output from a function you wrote (`ChipDefinition.render`, a `mathRenderer`, `components` overrides): those are trusted
extension points, and the README says so. Vulnerabilities in the editor itself belong to the core's
[security policy](https://github.com/faraasat/advanced-texteditor-md/blob/main/SECURITY.md); if you are unsure which side a problem is on,
report it here and it will be routed.

## How the package defends itself

- `MarkdownView` builds React elements, so text and attribute values are escaped by React. The only markup inserted as HTML is trusted
  library output: MathML, the highlighter's escaped spans, and what a `ChipDefinition.render` you wrote returns.
- Links and images pass the same scheme allow-list as the core; `javascript:`, `data:` and `vbscript:` (including `java<TAB>script:`
  and entity tricks) are refused, and `on*` attributes from custom syntax are dropped. A test runs a list of payloads through it.
- Embeds are sandboxed `https` iframes; link-preview `resolve` functions belong on your server.

## The package never phones home

Neither this package nor `advanced-texteditor-md` collects telemetry, loads a script, or makes a network request on its own
(uploads and link previews call only the functions you supply). Analytics exist **only on the demo site** (`site/`, deployed to
GitHub Pages), which is not part of the published package; the README's Privacy section describes them.
