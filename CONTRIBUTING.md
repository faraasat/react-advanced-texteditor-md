# Contributing to react-advanced-texteditor-md

Thanks for taking the time. Bug reports, reproductions, docs fixes and pull requests are all welcome. Please read the
[Code of Conduct](CODE_OF_CONDUCT.md) first.

## Which repository?

This package is the **React layer** over [advanced-texteditor-md](https://github.com/faraasat/advanced-texteditor-md). Anything
about the editor itself (how it edits, the Markdown it stores, plugins, the toolbar, themes, the XSS policy) belongs in the core
repository. Anything about React semantics (controlled and uncontrolled values, the ref, hooks, `MarkdownView`, server rendering,
hydration, the `"use client"` boundary) belongs here.

## Ground rules

- **No new runtime dependencies.** The only one is `advanced-texteditor-md`; `react` and `react-dom` are peers.
- **Size is a feature.** `npm run size` enforces the gzip budget of the wrapper alone (main <= 6 kB, view <= 5 kB).
- **Server-safe.** `react-advanced-texteditor-md/view` has no hooks and no directive; the main entry starts with `"use client"`.
  `npm run check:next` verifies both against the built files.
- **StrictMode and SSR are not optional.** Creation and destruction of the editor stay balanced in one effect, and the first client
  render equals the server render.

## Setup

You need Node 20 or newer. The package depends on the **published** core, so install from the registry:

```bash
git clone https://github.com/faraasat/react-advanced-texteditor-md.git
cd react-advanced-texteditor-md
npm install
```

Until the core is published, or to work on both at once, link a sibling checkout (it leaves `package.json` untouched):

```bash
npm run link:core        # npm install --no-save ../advanced-texteditor-md
```

There is no lockfile on purpose: a lockfile would pin the core's resolved URL and integrity hash and break the first time the
core publishes a new patch.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit and integration tests (Vitest, the real core in jsdom), watch mode. `npm run test:run` for one pass. |
| `npm run build` | Builds `dist/` (`index` with `"use client"`, `view` without) |
| `npm run size` | Gzip budget of the wrapper |
| `npm run check:next` | Imports the built entries in Node with no DOM |
| `npm run test:e2e` | Builds the esbuild example (`example/`) and runs Playwright (Chromium, desktop and mobile) |
| `npm run site:install` | Installs the demo site's dependencies (`site/`). While the core is not on npm yet it installs it from the sibling checkout (`../advanced-texteditor-md`, built) |
| `npm run site:build` | Builds the Next.js static export into `site/out/` |
| `npm run site:serve` | Serves it under its GitHub Pages base path |
| `npm run test:site` | Tests the built site under its base path: behaviour, no 404s, consent and Do Not Track, axe in light and dark |
| `npm run site:screenshots` | Regenerates `github-imgs/` from the built site (each PNG under 200 kB) |

Playwright needs Chromium once: `npx playwright install chromium`.

## Making a change

1. Open an issue first for anything bigger than a small fix.
2. Write the test first when you can: a unit or integration test in `test/`, and an `e2e/` spec when it needs a real browser.
3. Run `npm run typecheck`, `npm run test:run`, `npm run build`, `npm run size` and `npm run check:next`.
4. Update the [README](README.md) when props, hooks or behaviour change. If a prop is really a core option, document it in the core.
5. Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `chore:`). The changelog is
   generated from them by `standard-version`.
6. Open the pull request and fill in the template.

## The demo site

`site/` is a Next.js App Router app (static export; Tailwind v4 is there only for the Tailwind demo). Each demo is one file in `site/src/demos/`, and the code shown next
to it is that same file read at build time, so the snippet cannot drift from what runs. The site installs this package as a copy of
what `npm pack` would publish (`site/.npmrc`: `install-links=true`), so run `npm run build` first. The site's analytics are
described in the README's Privacy section; nothing in `src/` or `dist/` ever calls out.

## Releases

Maintainers only: `npm run release`, `git push --follow-tags`, and the release workflow publishes to npm with provenance.
The core must be published first (this package depends on it). See "Maintainers" in the README.

## Reporting a security problem

Do not open a public issue. Use a [private advisory](https://github.com/faraasat/react-advanced-texteditor-md/security/advisories/new);
details in [SECURITY.md](SECURITY.md).
