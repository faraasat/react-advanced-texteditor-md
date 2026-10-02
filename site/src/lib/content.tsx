// The landing page's static content. Facts come from the README: change them there first.
import type { ReactNode } from "react";
import type { KeyGroup, RoadItem } from "@/components/blocks";
import type { IconName } from "@/components/icons";

export const TILES: { icon: IconName; title: string; text: ReactNode }[] = [
  { icon: "react", title: "Real React semantics", text: "The editor is created in an effect and destroyed in its cleanup (StrictMode-safe), updated in place where the core allows it, and recreated only when a structural option changes." },
  { icon: "pen", title: "Controlled or uncontrolled", text: <>Own the string with <code>value</code> and <code>onChange</code>, or give it a <code>defaultValue</code> and read it through a <code>ref</code> that is the core&apos;s full editor API.</> },
  { icon: "eye", title: "MarkdownView", text: "Renders Markdown as real React elements, with no dangerouslySetInnerHTML for your text. Each block is memoised, so editing one paragraph re-renders one paragraph." },
  { icon: "server", title: "Server Components", text: <><code>react-advanced-texteditor-md/view</code> has no hooks, so a Server Component can render it, and it ships no editor code to the browser.</> },
  { icon: "hook", title: "Three hooks", text: <><code>useMarkdownEditor</code> for headless layouts, <code>useEditorState</code> to read editor state, and <code>useEditorValue</code> for the current Markdown.</> },
  { icon: "zap", title: "No memoising needed", text: "Options are compared by value, so inline plugins and objects are fine, and callbacks may change identity on every render: the latest one is always called." },
  { icon: "layout", title: "Six layouts, five themes", text: "Classic, minimal, bubble, bottom-bar, split and document, in light, dark, sepia, slate and high contrast. A theme or token change applies in place." },
  { icon: "at", title: "Mentions, uploads, plugins", text: "Everything in the core editor: mentions with badges and colours, uploads with allow and deny lists, math, highlighting, embeds and syntax of your own." },
  { icon: "chat", title: "Comment boxes", text: "The bottom-bar layout has an actions slot. React children are portalled into it, so state, context and events just work." },
  { icon: "wind", title: "Tailwind v4", text: <>An optional bridge maps the editor&apos;s variables onto Tailwind theme tokens, and every slot takes utilities through <code>classNames</code>.</> },
  { icon: "shield", title: "Safe by default", text: "Raw HTML in Markdown is never interpreted, unsafe URLs are refused by the same link policy as the core, and a test runs a list of payloads through it." },
  { icon: "package", title: "Small wrapper", text: "About 5.4 kB gzip, the renderer another 4.3 kB. The editor itself is the core's separate, lazily loaded download. React 17 or newer." },
];

export const KEYS: KeyGroup[] = [
  {
    title: "Text",
    keys: [
      { label: "Bold", combo: ["Mod", "B"] },
      { label: "Italic", combo: ["Mod", "I"] },
      { label: "Strikethrough", combo: ["Mod", "Shift", "X"] },
      { label: "Inline code", combo: ["Mod", "E"] },
      { label: "Link", combo: ["Mod", "K"] },
      { label: "Clear formatting", combo: ["Mod", "\\"] },
    ],
  },
  {
    title: "Blocks",
    keys: [
      { label: "Heading 1 to 6", combo: ["Mod", "Alt", "1…6"] },
      { label: "Paragraph", combo: ["Mod", "Alt", "0"] },
      { label: "Bulleted list", combo: ["Mod", "Shift", "8"] },
      { label: "Numbered list", combo: ["Mod", "Shift", "7"] },
      { label: "Task list", combo: ["Mod", "Shift", "L"] },
      { label: "Quote", combo: ["Mod", "Shift", "9"] },
      { label: "Code block", combo: ["Mod", "Alt", "C"] },
      { label: "Math block", combo: ["Mod", "Shift", "M"] },
    ],
  },
  {
    title: "Everything else",
    keys: [
      { label: "Undo", combo: ["Mod", "Z"] },
      { label: "Redo", combo: ["Mod", "Shift", "Z"] },
      { label: "Mention", combo: ["@"] },
      { label: "Slash menu", combo: ["/"] },
      { label: "Find (plugin)", combo: ["Mod", "F"] },
      { label: "Block handle", combo: ["Alt", "Shift", "H"] },
      { label: "Move a block", combo: ["Alt", "↑ / ↓"] },
      { label: "Image toolbar", combo: ["Alt", "F10"] },
      { label: "Submit (bottom-bar)", combo: ["Mod", "Enter"] },
    ],
  },
];

export const COMPARE_HEAD = ["Piece", "Gzip", "Budget"];
export const COMPARE_ROWS: ReactNode[][] = [
  [<><code>react-advanced-texteditor-md</code> (editor, hooks, client MarkdownView)</>, <b key="a">5.5 kB</b>, "6 kB"],
  [<><code>react-advanced-texteditor-md/view</code> (server-safe renderer)</>, <b key="b">4.3 kB</b>, "5 kB"],
  ["The core's editor entry that the wrapper loads", "about 62 kB, with more chunks on first use", "The core's budget"],
];
export const COMPARE_NOTE = (
  <>
    Measured 2026-10-02 (gzip -9, <code>npm run size</code>, which excludes the core). For the whole editor against Tiptap, Lexical and Milkdown, with the method and versions, see the core&apos;s{" "}
    <a href="https://github.com/faraasat/advanced-texteditor-md#how-it-compares">comparison</a>: the initial JavaScript of a Markdown-holding editor was 62.4 kB gzip here against 139.4 kB (Tiptap), 137.3 kB
    (Lexical) and 137.0 kB (Milkdown), the others being headless toolkits. Those libraries also have React bindings of their own and capabilities this one lacks (real-time collaboration, a larger
    ecosystem, a longer track record); we did not measure rendering speed or editing quality and make no claim about them.
  </>
);

export const SUPPORT_HEAD = ["What", "Tested how"];
export const SUPPORT_ROWS: ReactNode[][] = [
  ["Chromium, desktop and a Pixel 7 emulation", "Playwright against the example app and this site, in CI"],
  ["React 19", "The unit, integration, SSR and hydration suites, and both apps"],
  ["React 17 and 18", <>Designed for (a stand-in replaces <code>useSyncExternalStore</code> on 17); <strong>not</strong> in the CI matrix</>],
  ["Firefox, WebKit", <>Covered by the core&apos;s own Playwright suite, <strong>not</strong> re-run here</>],
  ["Node 20, 22, 24", "CI matrix: typecheck, tests, build, size"],
  ["Real iOS and Android devices", "Not run"],
];

export const ROADMAP: RoadItem[] = [
  { tag: "Known gap", title: "Depends on a published core", text: <><code>advanced-texteditor-md</code> is a regular dependency, so this package cannot be installed from the registry until the core is.</> },
  { tag: "Known gap", title: "Controlled mode and a rejected change", text: <>React gives the component no signal when a parent refuses an update, so call <code>ref.current.setValue(previous)</code> yourself.</> },
  { tag: "Limit", title: "Structural options recreate the editor", text: "Changing layout, plugins or syntax recreates the editor, and the undo history does not survive that. The Markdown, mode and focus do." },
  { tag: "Limit", title: "React 17 and 18", text: "Supported by design but not exercised in CI; only React 19 is." },
  { tag: "Known gap", title: "Tailwind preflight", text: "It removes list markers unless you add the three CSS lines shown in the README (a core stylesheet matter)." },
  { tag: "Out of scope", title: "Everything the core lacks", text: "Collaborative editing, comments and suggestions and nested block drag-and-drop are not planned for 0.x. The core's roadmap applies here too." },
  { tag: "Pre-1.0", title: "The API can still change", text: "Between minor versions. The changelog says what moved." },
];

export const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "Can the emoji button open the OS emoji panel?",
    a: (
      <>
        <p>
          No: a web page cannot open it. The button focuses the editor and shows the shortcut (macOS <kbd>Ctrl</kbd> <kbd>Cmd</kbd> <kbd>Space</kbd>, Windows <kbd>Win</kbd> <kbd>.</kbd>, Linux <kbd>Ctrl</kbd> <kbd>.</kbd>);
          the characters then arrive as normal text.
        </p>
        <p>
          To use your own picker pass <code>emoji: {"{ open: (editor) => ... }"}</code>, or <code>emoji: false</code> to remove the button. No emoji data ships in the package.
        </p>
      </>
    ),
  },
  { q: "Do I need useMemo or useCallback for props?", a: <p>No. Options are compared by value, so inline objects and plugins are fine, and callbacks may change identity on every render.</p> },
  { q: "Why did the editor lose my undo history?", a: <p>A structural option (<code>layout</code>, <code>plugins</code>, ...) changed and the editor was recreated. The Markdown, mode and focus are kept, the history is not. Changing <code>value</code>, <code>theme</code>, <code>readOnly</code> or <code>mode</code> never does that.</p> },
  { q: "onChange does not fire when I call setValue", a: <p>By design, and it is the core&apos;s contract: <code>onChange</code> is for user edits, so setting a value from state can never loop.</p> },
  { q: "Can I use it in a Server Component?", a: <p><code>react-advanced-texteditor-md/view</code> has no hooks and no directive, so render <code>MarkdownView</code> anywhere. The editor itself is a client component: import it from the main entry and use it as a leaf.</p> },
  { q: "Which React versions?", a: <p>17 and newer. Hydration with the static copy and <code>useSyncExternalStore</code> are designed for 18 and 19; on 17 a built-in stand-in replaces <code>useSyncExternalStore</code>. StrictMode and the React Compiler are fine.</p> },
  { q: "Where is the CSS?", a: <p>In the core: <code>advanced-texteditor-md/style.css</code>. It is never bundled into this package, so it is never shipped twice.</p> },
  { q: "Does the library collect any data?", a: <p>No. It makes no network request on its own, loads no script and sends no telemetry. This demo site counts visits with a cookieless service and uses Google Analytics only if you accept; see the Privacy page.</p> },
];
