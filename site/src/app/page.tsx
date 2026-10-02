import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import Link from "next/link";
import { DemoCard } from "@/components/demo-card";
import { CopyButton } from "@/components/copy-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ControlledDemo } from "@/demos/controlled";
import { UncontrolledDemo } from "@/demos/uncontrolled";
import { ViewDemo } from "@/demos/view";
import { ServerViewDemo } from "@/demos/server-view";
import { HeadlessDemo } from "@/demos/headless";
import { MentionsDemo } from "@/demos/mentions";
import { UploadsDemo } from "@/demos/uploads";
import { PluginsDemo } from "@/demos/plugins";
import { ThemingDemo } from "@/demos/theming";
import { TailwindDemo } from "@/demos/tailwind";
import { CommentBoxDemo } from "@/demos/comment-box";

const REPO = "faraasat/react-advanced-texteditor-md";
const CORE = "faraasat/advanced-texteditor-md";

/** gzip size of a built file of the wrapper, measured now. Null when the file cannot be read. */
function gzipKb(file: string): string | null {
  try {
    const buf = readFileSync(join(process.cwd(), "node_modules/react-advanced-texteditor-md/dist", file));
    return (gzipSync(buf, { level: 9 }).length / 1024).toFixed(1);
  } catch {
    return null;
  }
}

const NAV = [
  ["controlled", "Controlled"],
  ["uncontrolled", "Uncontrolled"],
  ["view", "MarkdownView"],
  ["server", "Server rendering"],
  ["headless", "Hook"],
  ["mentions", "Mentions"],
  ["uploads", "Uploads"],
  ["plugins", "Plugins"],
  ["theming", "Theming"],
  ["tailwind", "Tailwind v4"],
  ["comments", "Comment box"],
] as const;

export default function Page() {
  const main = gzipKb("index.mjs");
  const view = gzipKb("view.mjs");
  return (
    <>
      <a href="#main" className="absolute -top-14 left-2 z-50 rounded-md border-2 border-brand bg-panel px-3 py-2 focus:top-2">
        Skip to the content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-page/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
          <a href="#top" className="inline-flex items-center gap-2 font-bold tracking-tight text-ink no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon.svg`} alt="" width={24} height={24} />
            react-advanced-texteditor-md
          </a>
          <nav aria-label="Main" className="ml-auto flex items-center gap-1 text-sm">
            <a className="hidden rounded-md px-2 py-1 text-muted no-underline hover:bg-panel-2 hover:text-ink sm:inline" href="#demos">
              Demos
            </a>
            <a className="hidden rounded-md px-2 py-1 text-muted no-underline hover:bg-panel-2 hover:text-ink sm:inline" href={`https://github.com/${REPO}#readme`}>
              Docs
            </a>
            <a className="hidden rounded-md px-2 py-1 text-muted no-underline hover:bg-panel-2 hover:text-ink sm:inline" href={`https://github.com/${REPO}`}>
              GitHub
            </a>
            <a className="hidden rounded-md px-2 py-1 text-muted no-underline hover:bg-panel-2 hover:text-ink sm:inline" href="https://www.npmjs.com/package/react-advanced-texteditor-md">
              npm
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 pb-16">
        <section id="top" className="py-12 sm:py-16">
          <p className="mb-2 text-xs font-bold tracking-widest text-muted uppercase">React bindings · MIT</p>
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            A React editor that
            <br />
            <span className="text-brand">stores Markdown.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            <code className="font-mono text-[0.95em]">&lt;MarkdownEditor /&gt;</code> (controlled or uncontrolled),{" "}
            <code className="font-mono text-[0.95em]">&lt;MarkdownView /&gt;</code> that renders as real React elements and works in Server Components, and hooks. Built on{" "}
            <a href={`https://github.com/${CORE}`}>advanced-texteditor-md</a>.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href="#demos" className="rounded-lg bg-brand px-4 py-2 font-semibold text-brand-ink no-underline">
              See the demos
            </a>
            <a href={`https://github.com/${REPO}`} className="rounded-lg border border-line bg-panel px-4 py-2 font-semibold text-ink no-underline">
              GitHub
            </a>
          </div>
          <div className="mt-5 inline-flex max-w-full items-center gap-3 rounded-xl border border-line bg-code py-2 pr-2 pl-4">
            <code id="install-cmd" className="overflow-x-auto font-mono text-sm whitespace-nowrap">
              npm i react-advanced-texteditor-md
            </code>
            <CopyButton text="npm i react-advanced-texteditor-md" />
          </div>
          <ul className="mt-5 flex flex-wrap gap-2 text-sm text-muted" aria-label="Facts">
            {main ? <li className="rounded-full border border-line bg-panel px-3 py-1">Wrapper <b className="text-ink">{main} kB</b> gzip</li> : null}
            {view ? <li className="rounded-full border border-line bg-panel px-3 py-1">Server renderer <b className="text-ink">{view} kB</b> gzip</li> : null}
            <li className="rounded-full border border-line bg-panel px-3 py-1">React 17 to 19</li>
            <li className="rounded-full border border-line bg-panel px-3 py-1">StrictMode and SSR safe</li>
          </ul>
          <nav aria-label="Demos" className="mt-8 flex flex-wrap gap-1.5 text-sm">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-full border border-line bg-panel px-3 py-1 text-ink no-underline hover:bg-panel-2">
                {label}
              </a>
            ))}
          </nav>
        </section>

        <div id="demos" className="space-y-2">
          <DemoCard id="controlled" title="Controlled" file="controlled.tsx" note={<>You own the string. <code>onChange</code> fires for edits the user makes, never for <code>value</code> updates, so state echoing back cannot loop and undo keeps working.</>}>
            <ControlledDemo />
          </DemoCard>
          <DemoCard id="uncontrolled" title="Uncontrolled, with a ref" file="uncontrolled.tsx" note={<>Give it a <code>defaultValue</code> and let it own the document. The <code>ref</code> is the core&apos;s full editor API, as one object that never changes identity.</>}>
            <UncontrolledDemo />
          </DemoCard>
          <DemoCard id="view" title="MarkdownView" file="view.tsx" note={<>Renders Markdown as React elements, not an HTML string. Each block is memoised, so editing one paragraph re-renders one paragraph.</>}>
            <ViewDemo />
          </DemoCard>
          <DemoCard id="server" title="Server rendering" badge="Server Component" file="server-view.tsx" note={<><code>react-advanced-texteditor-md/view</code> has no hooks, so a Server Component can render it. This block was rendered once, at build time, and ships no editor code.</>}>
            <ServerViewDemo />
          </DemoCard>
          <DemoCard id="headless" title="useMarkdownEditor (headless)" file="headless.tsx" note={<>For layouts the component does not give you: attach the <code>ref</code> where the editor should mount and draw everything else yourself.</>}>
            <HeadlessDemo />
          </DemoCard>
          <DemoCard id="mentions" title="Mentions with badges and colours" file="mentions.tsx" note={<>Type <kbd>@</kbd>. Each kind gets a colour and a badge; the stored form is <code>[@Name](mention:kind/id?refs)</code>.</>}>
            <MentionsDemo />
          </DemoCard>
          <DemoCard id="uploads" title="Uploads with allow and deny lists" file="uploads.tsx" note={<>Files are validated (size, count, extension, MIME) before the handler runs. Nothing leaves the page here: the uploader stores files in memory.</>}>
            <UploadsDemo />
          </DemoCard>
          <DemoCard id="plugins" title="Plugins and custom syntax" file="plugins.tsx" note={<>Ready-made plugins from the core, one written in a few lines, and an inline syntax of your own (<code>||spoiler||</code>).</>}>
            <PluginsDemo />
          </DemoCard>
          <DemoCard id="theming" title="Theming" file="theming.tsx" note={<>Five themes through <code>data-atm-theme</code>, or tokens through the <code>theme</code> prop. Both change in place: the editor is not rebuilt.</>}>
            <ThemingDemo />
          </DemoCard>
          <DemoCard id="tailwind" title="Tailwind v4" file="tailwind.tsx" note={<>This whole page is Tailwind v4. The core&apos;s bridge maps the editor&apos;s variables onto theme tokens, and every slot takes utilities through <code>classNames</code>.</>}>
            <TailwindDemo />
          </DemoCard>
          <DemoCard id="comments" title="Comment box" file="comment-box.tsx" note={<>The <code>bottom-bar</code> layout has an actions slot. React children are portalled into it, so state, context and events just work.</>}>
            <CommentBoxDemo />
          </DemoCard>
        </div>
      </main>

      <footer className="border-t border-line py-8 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4">
          <span>
            MIT licensed. Made by <a href="https://github.com/faraasat">Farasat Ali</a>.
          </span>
          <span>
            <a href={`https://github.com/${REPO}`}>Source</a> · <a href="https://www.npmjs.com/package/react-advanced-texteditor-md">npm</a> ·{" "}
            <a href={`https://github.com/${REPO}/issues`}>Issues</a> · <a href={`https://github.com/${CORE}`}>Core editor</a> · <Link href="/privacy/">Privacy</Link>
          </span>
        </div>
      </footer>
    </>
  );
}
