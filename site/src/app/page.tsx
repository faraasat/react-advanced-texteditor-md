import { Code } from "@/components/code";
import { DataTable, Faq, FeatureGrid, Roadmap, Shortcuts } from "@/components/blocks";
import { DemoCard } from "@/components/demo-card";
import { Hero } from "@/components/hero";
import { InstallTabs } from "@/components/install-tabs";
import { Playground } from "@/components/playground";
import { Section } from "@/components/section";
import { ControlledDemo } from "@/demos/controlled";
import { CommentBoxDemo } from "@/demos/comment-box";
import { HeadlessDemo } from "@/demos/headless";
import { MentionsDemo } from "@/demos/mentions";
import { PluginsDemo } from "@/demos/plugins";
import { ServerViewDemo } from "@/demos/server-view";
import { TailwindDemo } from "@/demos/tailwind";
import { ThemingDemo } from "@/demos/theming";
import { UncontrolledDemo } from "@/demos/uncontrolled";
import { UploadsDemo } from "@/demos/uploads";
import { ViewDemo } from "@/demos/view";
import { COMPARE_HEAD, COMPARE_NOTE, COMPARE_ROWS, FAQS, KEYS, ROADMAP, SUPPORT_HEAD, SUPPORT_ROWS, TILES } from "@/lib/content";
import { gzipKb, readVersion } from "@/lib/facts";

const VITE = `import { useState } from "react";
import { MarkdownEditor } from "react-advanced-texteditor-md";
import "advanced-texteditor-md/style.css"; // the editor's stylesheet: import it once, anywhere

export function Comment() {
  const [markdown, setMarkdown] = useState("# Hello\\n\\nWrite **Markdown** visually.");
  return <MarkdownEditor value={markdown} onChange={setMarkdown} placeholder="Write something..." minHeight={160} />;
}`;

const NEXT = `// app/page.tsx  (a Server Component: no "use client" needed here)
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

// app/composer.tsx
"use client"; // handlers are functions, so the component that passes them is a Client Component
import { useState } from "react";
import { MarkdownEditor } from "react-advanced-texteditor-md";

export function Composer({ initial }: { initial: string }) {
  const [md, setMd] = useState(initial);
  return <MarkdownEditor value={md} onChange={setMd} />;
}`;

export default function Page() {
  const version = readVersion();
  const main = gzipKb("index.mjs");
  const view = gzipKb("view.mjs");
  return (
    <>
      <Hero
        eyebrow={`React bindings · v${version} · MIT`}
        title={
          <>
            A React editor that <em>stores Markdown.</em>
          </>
        }
        sub={
          <>
            <code>&lt;MarkdownEditor /&gt;</code> (controlled or uncontrolled), <code>&lt;MarkdownView /&gt;</code> that renders as real React elements and works in Server Components, and hooks. Built on{" "}
            <a href="https://faraasat.github.io/advanced-texteditor-md/">advanced-texteditor-md</a>.
          </>
        }
        install="react-advanced-texteditor-md"
        badges={[
          { k: "npm", v: `v${version}`, accent: true },
          { k: "wrapper", v: main ? `${main} kB gzip` : "small" },
          ...(view ? [{ k: "server view", v: `${view} kB gzip` }] : []),
          { k: "react", v: "17 to 19" },
          { k: "license", v: "MIT" },
        ]}
        extraLink={{ label: "Core editor", href: "https://faraasat.github.io/advanced-texteditor-md/" }}
      />

      <Section id="playground" title="Playground" sub={<>The real <code>&lt;MarkdownEditor /&gt;</code>, controlled, with every layout, theme and mode. Type <kbd>@</kbd> to mention someone, <kbd>/</kbd> for blocks. The output tabs show what is stored, the HTML, the same Markdown through <code>MarkdownView</code>, and the JSX you would write.</>}>
        <Playground />
      </Section>

      <Section id="why" title="What you get" sub="Correct React semantics on top of a small, dependency-free editor.">
        <FeatureGrid items={TILES} />
      </Section>

      <Section id="demos" title="Demos, live" sub="Each card is a real component with the exact source beside it: the code panel is the demo's own file, read at build time, so it cannot drift from what runs.">
        <div className="feat">
          <DemoCard id="controlled" icon="pen" title="Controlled" file="controlled.tsx" note={<>You own the string. <code>onChange</code> fires for edits the user makes, never for <code>value</code> updates, so state echoing back cannot loop and undo keeps working.</>}>
            <ControlledDemo />
          </DemoCard>
          <DemoCard id="uncontrolled" icon="hook" title="Uncontrolled, with a ref" file="uncontrolled.tsx" note={<>Give it a <code>defaultValue</code> and let it own the document. The <code>ref</code> is the core&apos;s full editor API, as one object that never changes identity.</>}>
            <UncontrolledDemo />
          </DemoCard>
          <DemoCard id="view" icon="eye" title="MarkdownView" file="view.tsx" note={<>Renders Markdown as React elements, not an HTML string. Each block is memoised, so editing one paragraph re-renders one paragraph.</>}>
            <ViewDemo />
          </DemoCard>
          <DemoCard id="server" icon="server" title="Server rendering" file="server-view.tsx" note={<><code>react-advanced-texteditor-md/view</code> has no hooks, so a Server Component can render it. This block was rendered once, at build time, and ships no editor code.</>}>
            <ServerViewDemo />
          </DemoCard>
          <DemoCard id="headless" icon="code" title="useMarkdownEditor (headless)" file="headless.tsx" note={<>For layouts the component does not give you: attach the <code>ref</code> where the editor should mount and draw everything else yourself.</>}>
            <HeadlessDemo />
          </DemoCard>
          <DemoCard id="mentions" icon="at" title="Mentions with badges and colours" file="mentions.tsx" note={<>Type <kbd>@</kbd>. Each kind gets a colour and a badge; the stored form is <code>[@Name](mention:kind/id?refs)</code>.</>}>
            <MentionsDemo />
          </DemoCard>
          <DemoCard id="uploads" icon="upload" title="Uploads with allow and deny lists" file="uploads.tsx" note={<>Files are validated (size, count, extension, MIME) before the handler runs. Nothing leaves the page here: the uploader stores files in memory.</>}>
            <UploadsDemo />
          </DemoCard>
          <DemoCard id="plugins" icon="plug" title="Plugins and custom syntax" file="plugins.tsx" note={<>Ready-made plugins from the core, one written in a few lines, and an inline syntax of your own (<code>||spoiler||</code>).</>}>
            <PluginsDemo />
          </DemoCard>
          <DemoCard id="theming" icon="palette" title="Theming" file="theming.tsx" note={<>Five themes through <code>data-atm-theme</code>, or tokens through the <code>theme</code> prop. Both change in place: the editor is not rebuilt.</>}>
            <ThemingDemo />
          </DemoCard>
          <DemoCard id="tailwind" icon="wind" title="Tailwind v4" file="tailwind.tsx" note={<>The core&apos;s bridge maps the editor&apos;s variables onto theme tokens, and every slot takes utilities through <code>classNames</code>. This card is styled that way.</>}>
            <TailwindDemo />
          </DemoCard>
          <DemoCard id="comments" icon="chat" title="Comment box" file="comment-box.tsx" note={<>The <code>bottom-bar</code> layout has an actions slot. React children are portalled into it, so state, context and events just work.</>}>
            <CommentBoxDemo />
          </DemoCard>
        </div>
      </Section>

      <Section id="install" title="Install" sub={<><code>advanced-texteditor-md</code> is a regular dependency and installs with it. <code>react</code> and <code>react-dom</code> (17 or newer) are peer dependencies.</>}>
        <div className="grid grid--2">
          <div className="card">
            <h3>Add it</h3>
            <p className="sub">The stylesheet is not bundled into this package, so it is never shipped twice: import the core&apos;s once.</p>
            <InstallTabs packages="react-advanced-texteditor-md" label="Install the React bindings" />
          </div>
          <div className="card">
            <h3>Vite, or any bundler</h3>
            <p className="sub">Import the stylesheet once, anywhere.</p>
            <Code language="tsx" label="comment.tsx" copyTarget="quick-start-vite">
              {VITE}
            </Code>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Code language="tsx" label="next-app-router.tsx" copyTarget="quick-start-next">
            {NEXT}
          </Code>
        </div>
      </Section>

      <Section id="shortcuts" title="Keyboard shortcuts" sub={<><kbd>Mod</kbd> is <kbd>Cmd</kbd> on macOS and <kbd>Ctrl</kbd> elsewhere. They are the core editor&apos;s, so every binding can be overridden with <code>keymap</code>.</>}>
        <Shortcuts groups={KEYS} />
      </Section>

      <Section id="compare" title="Size and how it compares" sub="The wrapper is small because the editor is the core's separate, lazily loaded download.">
        <DataTable caption="Size of each piece" head={COMPARE_HEAD} rows={COMPARE_ROWS} />
        <p className="note">{COMPARE_NOTE}</p>
      </Section>

      <Section id="browsers" title="Browser and React support" sub="The wrapper adds no browser requirement of its own: it needs what the core editor needs, and React 17 or newer.">
        <DataTable caption="Support matrix" head={SUPPORT_HEAD} rows={SUPPORT_ROWS} />
      </Section>

      <Section id="roadmap" title="Roadmap and known gaps" sub="An honest list, taken from the README.">
        <Roadmap items={ROADMAP} />
      </Section>

      <Section id="faq" title="FAQ">
        <Faq items={FAQS} />
      </Section>
    </>
  );
}
