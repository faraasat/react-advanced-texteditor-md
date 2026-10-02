/** Everything that differs between this site and its sibling lives here; the shell components read it. */
export const SITE = {
  name: "react-advanced-texteditor-md",
  repo: "faraasat/react-advanced-texteditor-md",
  url: "https://faraasat.github.io/react-advanced-texteditor-md/",
  tagline: "React bindings for advanced-texteditor-md: a WYSIWYG editor that stores Markdown.",
  description:
    "React bindings for advanced-texteditor-md: a controlled or uncontrolled MarkdownEditor, a server-component friendly MarkdownView, and hooks. A WYSIWYG editor that stores Markdown.",
  themeKey: "ratm-site-theme",
  /** The in-page links in the top bar, before Docs. */
  nav: [
    { href: "/#playground", label: "Playground" },
    { href: "/#demos", label: "Demos" },
  ],
  /** The GitHub Pages base path ("" in local development). Set by next.config.ts. */
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
} as const;

/** The one place the analytics identifiers live. They are public client-side identifiers, not secrets. */
export const ANALYTICS = {
  aptabaseKey: "A-EU-4289711788",
  aptabaseUrl: "https://eu.aptabase.com/api/v0/event", // the EU region of the App Key
  gaId: "G-CSHX6YP98W",
  consentKey: "ratm-site-consent",
} as const;
