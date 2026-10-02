// @vitest-environment node
import { renderToString, renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownEditor, MarkdownView, useMarkdownEditor } from "../src";
import { MarkdownView as ServerView } from "../src/view";

describe("server rendering (no DOM at all)", () => {
  it("really is a DOM-free environment", () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
  });

  it("MarkdownEditor renders a static copy of the initial Markdown: no empty flash", () => {
    const html = renderToString(<MarkdownEditor defaultValue={"# Title\n\nSome **bold** text"} placeholder="Write" />);
    expect(html).toContain('<h1 class="atm-h1">Title</h1>');
    expect(html).toContain("<strong");
    expect(html).toContain("atm-react-fallback");
    expect(html).toContain('aria-busy="true"');
  });

  it("controlled value is what the fallback shows", () => {
    expect(renderToString(<MarkdownEditor value="*x*" onChange={() => {}} />)).toContain('<em class="atm-em">x</em>');
  });

  it("an empty editor renders the placeholder hooks", () => {
    const html = renderToString(<MarkdownEditor placeholder="Say something" />);
    expect(html).toContain('data-placeholder="Say something"');
    expect(html).toContain("data-empty");
  });

  it("the fallback is escaped: user markup never becomes elements", () => {
    const html = renderToString(<MarkdownEditor defaultValue={'<img src=x onerror=alert(1)> [a](javascript:alert(1))'} />);
    expect(html).not.toMatch(/<img/);
    expect(html).not.toMatch(/href="javascript/);
  });

  it("includes the form field so a no-JS form still posts the value", () => {
    const html = renderToString(<MarkdownEditor name="body" defaultValue="hi" />);
    expect(html).toMatch(/<input[^>]*type="hidden"[^>]*name="body"/);
    expect(html).toContain('value="hi"');
  });

  it("ssr={false} renders no fallback", () => {
    expect(renderToString(<MarkdownEditor ssr={false} defaultValue="x" />)).not.toContain("atm-react-fallback");
  });

  it("chips, syntax, highlight and links options shape the fallback", () => {
    const html = renderToString(
      <MarkdownEditor
        defaultValue="[@Jane](mention:person/1) ==m=="
        chips={[{ scheme: "mention", kinds: { person: { label: "Staff" } } }]}
        syntax={{ inline: [{ name: "mark", open: "==", tag: "mark" }] }}
      />,
    );
    expect(html).toContain("atm-chip-badge");
    expect(html).toContain("<mark");
  });

  it("children render below the static copy on the server", () => {
    const html = renderToString(
      <MarkdownEditor layout="bottom-bar">
        <button>Send</button>
      </MarkdownEditor>,
    );
    expect(html).toContain("atm-react-actions");
    expect(html).toContain("Send");
  });

  it("the headless hook renders an empty host on the server without touching the DOM", () => {
    function H() {
      const r = useMarkdownEditor({ defaultValue: "hi" });
      return <div ref={r.ref}>{r.value}</div>;
    }
    expect(renderToString(<H />)).toContain("hi");
  });

  it("both MarkdownView entries render on the server and agree", () => {
    const md = "# T\n\n- a\n- b\n\n$x$ and [@j](mention:person/1)";
    const a = renderToStaticMarkup(<MarkdownView markdown={md} />);
    const b = renderToStaticMarkup(<ServerView markdown={md} />);
    expect(a).toBe(b);
    expect(a).toContain("<math");
  });

  it("the client MarkdownView with link previews renders markers server-side without a controller", () => {
    const html = renderToString(<MarkdownView markdown="https://example.com/a" linkPreview={{ resolve: async () => null }} />);
    expect(html).toContain("data-atm-standalone-link");
  });
});
