import { renderToStaticMarkup } from "react-dom/server";
import { render, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderHtml } from "advanced-texteditor-md/render";
import { createMathRenderer } from "advanced-texteditor-md/math";
import { createHighlighter } from "advanced-texteditor-md";
import { javascript } from "advanced-texteditor-md/highlight/javascript";
import { BUILTIN_EMBEDS } from "advanced-texteditor-md/embeds";
import { MarkdownView as ClientView, renderMarkdownToReact } from "../src";
import { MarkdownView as PureView } from "../src/view";
import type { ChipNode } from "../src";
import { normalize } from "./helpers/html";

const inner = (md: string, opts = {}) => {
  const html = renderToStaticMarkup(<PureView markdown={md} {...opts} />);
  const t = document.createElement("template");
  t.innerHTML = html;
  return (t.content.firstElementChild as HTMLElement).innerHTML;
};

/** What the core would render for the same Markdown and options: the parity target. */
const core = (md: string, o: Record<string, unknown> = {}) => normalize(renderHtml(md, { mathRenderer: createMathRenderer(), ...o }));
const mine = (md: string, o: Record<string, unknown> = {}) => normalize(inner(md, o));

const CORPUS: Record<string, string> = {
  paragraphs: "First paragraph.\n\nSecond with a  \nhard break.",
  headings: "# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6",
  inline: "*em* **strong** ~~strike~~ `code` and a [link](https://example.com \"Title\") plus ![alt](https://example.com/i.png \"T\")",
  relativeLinks: "[a](/path) [b](./rel) [c](#hash) [d](mailto:a@b.co) [e](tel:+123)",
  quote: "> quoted\n>\n> > nested\n\nafter",
  lists: "- one\n- two\n  - nested\n\n3. three\n4. four",
  looseList: "- a\n\n- b\n\n- c",
  tasks: "- [ ] todo\n- [x] done\n- plain",
  code: "```js\nconst a = 1 < 2;\n```\n\n    indented\n\n```\nno lang\n```",
  table: "| a | b | c |\n|:--|:-:|--:|\n| 1 | 2 | 3 |\n| *x* | y | z |",
  rule: "above\n\n---\n\nbelow",
  math: "inline $x^2$ and block:\n\n$$\n\\frac{a}{b}\n$$",
  footnotes: "Text[^1] and more[^note].\n\n[^1]: First note.\n[^note]: Second\n    paragraph.",
  footnoteBlock: "A[^a]\n\n[^a]: > quoted note",
  chips: "[@Jane Doe](mention:person/42?legacy=7) and [#bug](task:issue/12) and [@Team](mention:team/9)",
  rawHtml: "<b>not bold</b> and <script>alert(1)</script>",
  entities: "a & b < c > d \"q\" 'r'",
  autolink: "see https://example.com/a?b=c&d=e and www.example.org",
  emptyDoc: "",
  unicode: "héllo 🌍 ‮ RTL",
  escapes: "\\*not em\\* \\[not link\\]",
  refLinks: "[ref][1] and [ref2]\n\n[1]: https://example.com/one\n[ref2]: https://example.com/two",
};

describe("parity with the core's renderHtml (same elements, classes, attributes)", () => {
  for (const [name, md] of Object.entries(CORPUS)) {
    it(name, () => expect(mine(md)).toBe(core(md)));
  }

  it("with the same options: chip kinds, classNames, custom syntax, link policy, class prefix", () => {
    const o = {
      chips: { mention: { scheme: "mention", className: "m", kinds: { person: { color: 3, label: "Staff", className: "p" }, team: { color: "#0d9488" } } } },
      classNames: { paragraph: "my-p", table: "my-table", link: "my-link", heading: "my-h" },
      syntax: { inline: [{ name: "mark", open: "==", tag: "mark", className: "hl" }], block: [{ name: "note", fence: ":::", className: "note", attrs: { role: "note", "data-x": "1" } }] },
      links: { allowedHosts: ["example.com"], rel: "noopener", target: "_self" },
      classPrefix: "zz",
    };
    const md = "==marked== [@Jane](mention:person/1) [@T](mention:team/2) [ok](https://example.com/x) [bad](https://evil.test/x)\n\n::: note\ninside *it*\n:::\n\n| a |\n|---|\n| 1 |";
    expect(mine(md, o)).toBe(core(md, o));
  });

  it("with a highlighter", () => {
    const highlight = createHighlighter([javascript]);
    const md = "```js\nconst s = 'a < b'; // c\n```";
    expect(mine(md, { highlight })).toBe(core(md, { highlight }));
    expect(mine(md, { highlight })).toContain("atm-tok-");
  });

  it("with embeds and the link-preview marker", () => {
    const md = "https://www.youtube.com/watch?v=dQw4w9WgXcQ\n\nhttps://example.com/article\n\n> https://example.com/quoted";
    const o = { embeds: BUILTIN_EMBEDS, linkPreview: { resolve: async () => null } };
    expect(mine(md, o)).toBe(core(md, o));
  });

  it("with the footnote section in place and numbering by first definition", () => {
    const md = "x[^b] y[^a]\n\n[^a]: A\n[^b]: B";
    expect(mine(md)).toBe(core(md));
  });
});

describe("node matrix (DOM assertions)", () => {
  const dom = (md: string, opts = {}) => {
    const c = document.createElement("div");
    c.innerHTML = inner(md, opts);
    return c;
  };

  it("renders every block and inline type with the library's classes", () => {
    const md = [
      "# T",
      "para *em* **st** ~~del~~ `c` [l](https://a.co) ![i](https://a.co/i.png)",
      "> q",
      "- a\n- b",
      "1. x",
      "- [x] done",
      "```js\ncode\n```",
      "| h |\n|---|\n| c |",
      "---",
      "$$\nx\n$$",
      "math $y$ ok[^1]",
      "[^1]: note",
    ].join("\n\n");
    const d = dom(md);
    for (const sel of [".atm-h1", ".atm-p", ".atm-em", ".atm-strong", ".atm-del", ".atm-code-inline", "a.atm-link", "img.atm-img", ".atm-blockquote", "ul.atm-ul", "ol.atm-ol", "li.atm-li", ".atm-task-box", "pre.atm-pre", ".atm-table", ".atm-hr", ".atm-math-block", ".atm-math-inline", ".atm-footnote-ref", ".atm-footnotes"]) {
      expect(d.querySelector(sel), sel).not.toBeNull();
    }
  });

  it("math renders MathML from the core renderer, as markup and not as text", () => {
    const d = dom("$x^2$");
    expect(d.querySelector("math")).not.toBeNull();
  });

  it("math: false leaves the dollars alone, mathRenderer null leaves the source", () => {
    expect(dom("$x$", { math: false }).textContent).toContain("$x$");
    expect(dom("$x$", { mathRenderer: null }).querySelector(".atm-math-src")?.textContent).toBe("x");
  });

  it("a throwing math renderer shows the source", () => {
    const d = dom("$boom$", { mathRenderer: () => { throw new Error("no"); } });
    expect(d.querySelector(".atm-math-src")?.textContent).toBe("boom");
  });

  it("an HTMLElement-returning math renderer is attached on the client", () => {
    const mathRenderer = (tex: string) => { const s = document.createElement("span"); s.className = "custom-math"; s.textContent = tex; return s; };
    const { container } = render(<ClientView markdown="$z$" mathRenderer={mathRenderer} />);
    expect(container.querySelector(".custom-math")?.textContent).toBe("z");
  });

  it("chips: scheme, kind, id, trigger and refs data attributes, kind class, colour variable and badge", () => {
    const d = dom("[@Jane](mention:person/42?legacy=7) [@T](mention:team/9)", {
      chips: [{ scheme: "mention", kinds: { person: { color: 3, label: "Staff" }, team: { color: "#0d9488" } } }],
    });
    const [jane, team] = Array.from(d.querySelectorAll<HTMLElement>(".atm-chip"));
    expect(jane.dataset).toMatchObject({ scheme: "mention", kind: "person", id: "42", trigger: "@" });
    expect(JSON.parse(jane.dataset.refs!)).toEqual({ legacy: "7" });
    expect(jane.classList.contains("atm-chip-mention")).toBe(true);
    expect(jane.classList.contains("atm-chip-kind-person")).toBe(true);
    expect(jane.getAttribute("style")).toContain("--atm-chip-color:var(--atm-chip-3)");
    expect(jane.querySelector(".atm-chip-badge")?.textContent).toBe("Staff");
    expect(jane.textContent).toBe("@JaneStaff");
    expect(team.getAttribute("style")).toContain("--atm-chip-color:#0d9488");
  });

  it("chip colours that are not safe CSS colours are dropped", () => {
    const d = dom("[@x](mention:person/1)", { chips: [{ scheme: "mention", kinds: { person: { color: "red;background:url(x)" } } }] });
    expect(d.querySelector(".atm-chip")?.getAttribute("style")).toBeNull();
  });

  it("chipSchemes come from `chips`; an unknown scheme stays a plain link", () => {
    expect(dom("[T](task:issue/1)").querySelector(".atm-chip")).toBeNull();
    expect(dom("[T](task:issue/1)", { chips: [{ scheme: "task" }] }).querySelector(".atm-chip-task")).not.toBeNull();
  });

  it("external links get rel and target; internal ones do not", () => {
    const d = dom("[a](https://a.co) [b](/x)");
    const [a, b] = Array.from(d.querySelectorAll("a"));
    expect(a.getAttribute("rel")).toBe("noopener noreferrer nofollow");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(b.getAttribute("rel")).toBeNull();
  });

  it("task items render a disabled, checked checkbox", () => {
    const boxes = Array.from(dom("- [x] a\n- [ ] b").querySelectorAll<HTMLInputElement>("input.atm-task-box"));
    expect(boxes.map((b) => b.checked)).toEqual([true, false]);
    expect(boxes.every((b) => b.disabled)).toBe(true);
  });

  it("ordered lists keep their start number", () => {
    expect(dom("5. a\n6. b").querySelector("ol")?.getAttribute("start")).toBe("5");
  });

  it("code blocks are focusable named regions", () => {
    const pre = dom("```ts\nx\n```").querySelector("pre")!;
    expect(pre.getAttribute("tabindex")).toBe("0");
    expect(pre.getAttribute("role")).toBe("region");
    expect(pre.getAttribute("aria-label")).toBe("Code (ts)");
    expect(dom("```ts\nx\n```", { labels: { code: "Code sample" } }).querySelector("pre")!.getAttribute("aria-label")).toBe("Code sample (ts)");
  });

  it("table alignment becomes text-align", () => {
    const d = dom("| a | b | c |\n|:-|:-:|-:|\n| 1 | 2 | 3 |");
    expect(Array.from(d.querySelectorAll<HTMLElement>("th")).map((x) => x.style.textAlign)).toEqual(["left", "center", "right"]);
  });

  it("the wrapper carries the core's typography class and neutral box variables", () => {
    const html = renderToStaticMarkup(<PureView markdown="x" className="mine" id="v" theme="dark" />);
    expect(html).toContain('class="atm-surface atm-view mine"');
    expect(html).toContain('data-atm-theme="dark"');
    expect(html).toContain("--atm-surface-min-height:0");
  });

  it("classPrefix and classNames apply", () => {
    const d = dom("# x\n\ny", { classPrefix: "zz", classNames: { paragraph: "mb-4", heading: "text-xl" } });
    expect(d.querySelector("p")?.className).toBe("zz-p mb-4");
    expect(d.querySelector("h1")?.className).toBe("zz-h1 text-xl");
  });

  it("custom syntax: tag allow-list, class, safe attrs and data attributes", () => {
    const d = dom("==hi==\n\n::: note\nbody\n:::", {
      syntax: { inline: [{ name: "hl", open: "==", tag: "mark", className: "hl", attrs: { title: "t", onclick: "alert(1)", tabindex: "0", style: "color:red" } }], block: [{ name: "note", fence: ":::", className: "note" }] },
    });
    const mark = d.querySelector("mark")!;
    expect(mark.className).toContain("hl");
    expect(mark.getAttribute("title")).toBe("t");
    expect(mark.getAttribute("tabindex")).toBe("0");
    expect(mark.style.color).toBe("red");
    expect(mark.hasAttribute("onclick")).toBe(false);
    expect(d.querySelector(".atm-custom-note")).not.toBeNull();
  });

  it("renders an embed block for a provider match and a marker for link previews", () => {
    const d = dom("https://www.youtube.com/watch?v=dQw4w9WgXcQ\n\nhttps://example.com/a", { embeds: BUILTIN_EMBEDS, linkPreview: { resolve: async () => null } });
    const f = d.querySelector("iframe")!;
    expect(f.getAttribute("src")).toMatch(/^https:\/\/www\.youtube(-nocookie)?\.com\/embed\//);
    expect(f.getAttribute("sandbox")).toContain("allow-scripts");
    expect(d.querySelector("[data-atm-standalone-link]")?.getAttribute("data-atm-standalone-link")).toBe("https://example.com/a");
  });
});

describe("security: no markup from user text", () => {
  const dom = (md: string, opts = {}) => {
    const c = document.createElement("div");
    c.innerHTML = renderToStaticMarkup(<PureView markdown={md} {...opts} />);
    return c;
  };
  const danger = (d: HTMLElement) => ({
    scripts: d.querySelectorAll("script, style, iframe, object, embed").length,
    handlers: Array.from(d.querySelectorAll("*")).filter((e) => Array.from(e.attributes).some((a) => /^on/i.test(a.name))).length,
    jsHref: Array.from(d.querySelectorAll("[href], [src]")).filter((e) => /^\s*(javascript|data|vbscript):/i.test((e.getAttribute("href") ?? e.getAttribute("src"))!.replace(/[\u0000- ]/g, ""))).length,
  });

  const attacks = [
    "[x](javascript:alert(1))",
    "[x](JaVaScRiPt:alert(1))",
    "[x](java\tscript:alert(1))",
    "[x](&#106;avascript:alert(1))",
    "[x](data:text/html,<script>alert(1)</script>)",
    "[x](vbscript:msgbox(1))",
    "![x](javascript:alert(1))",
    "![x](data:image/svg+xml,<svg onload=alert(1)>)",
    "<img src=x onerror=alert(1)>",
    "<script>alert(1)</script>",
    "<a href=\"javascript:alert(1)\">x</a>",
    "[<img src=x onerror=alert(1)>](https://a.co)",
    "[\"><script>alert(1)</script>](mention:person/\"><script>alert(1)</script>)",
    "`<script>alert(1)</script>`",
    "```\n<script>alert(1)</script>\n```",
    "```\"><img src=x onerror=alert(1)>\ncode\n```",
    "<https://a.co\"onmouseover=\"alert(1)>",
    "https://a.co/\"onmouseover=\"alert(1)",
    "[x](https://a.co \"t\" onclick=\"alert(1)\")",
    "| <img src=x onerror=alert(1)> |\n|---|\n| x |",
    "[^<img src=x onerror=alert(1)>]: x\n\ny[^<img src=x onerror=alert(1)>]",
    "$$\n<img src=x onerror=alert(1)>\n$$",
    "$<script>alert(1)</script>$",
  ];
  for (const a of attacks) {
    it(`neutralises ${JSON.stringify(a).slice(0, 60)}`, () => {
      const d = dom(a, { chips: [{ scheme: "mention" }] });
      expect(danger(d)).toEqual({ scripts: 0, handlers: 0, jsHref: 0 });
    });
  }

  it("a link refused by the policy renders its text, not an anchor", () => {
    const d = dom("[bad](javascript:alert(1))");
    expect(d.querySelector("a")).toBeNull();
    expect(d.textContent).toContain("bad");
  });

  it("raw HTML stays literal text", () => {
    const d = dom("<b>x</b>");
    expect(d.querySelector("b")).toBeNull();
    expect(d.textContent).toContain("<b>x</b>");
  });

  it("an attribute-injection attempt through a chip id cannot add attributes", () => {
    const d = dom('[x](mention:person/a" onmouseover="alert(1))', { chips: [{ scheme: "mention" }] });
    expect(d.querySelectorAll("[onmouseover]").length).toBe(0);
  });

  it("allowedHosts blocks other hosts and a `resolve` rewrite is policy-checked", () => {
    const d = dom("[a](https://evil.test/x) [b](https://ok.test/y)", { links: { allowedHosts: ["ok.test"], resolve: (u: string) => (u.includes("ok") ? "javascript:alert(1)" : u) } });
    expect(d.querySelectorAll("a").length).toBe(0);
  });

  it("the only dangerouslySetInnerHTML is trusted core output: user text never passes through it", () => {
    const d = dom("`</code><script>x</script>`\n\n```\n</code></pre><script>x</script>\n```");
    expect(d.querySelectorAll("script").length).toBe(0);
  });
});

describe("customisation", () => {
  it("components override a node type and receive node, class and default children", () => {
    const Heading = vi.fn(({ node, className, children }: { node: { level: number }; className: string; children?: React.ReactNode }) => (
      <h2 data-level={node.level} className={className + " x"}>{children}</h2>
    ));
    const { container } = render(<ClientView markdown="### Hi" components={{ heading: Heading as never }} />);
    const h = container.querySelector("h2")!;
    expect(h.dataset.level).toBe("3");
    expect(h.className).toBe("atm-h3 x");
    expect(h.textContent).toBe("Hi");
  });

  it("overrides links (with href/external/rel) and images", () => {
    const { container } = render(
      <ClientView
        markdown="[a](https://a.co) ![p](https://a.co/p.png)"
        components={{
          link: ({ href, external, children }) => <a data-ext={String(external)} href={href}>{children}</a>,
          image: ({ src, node }) => <figure data-src={src}>{node.alt}</figure>,
        }}
      />,
    );
    expect(container.querySelector("a")?.getAttribute("data-ext")).toBe("true");
    expect(container.querySelector("figure")?.getAttribute("data-src")).toBe("https://a.co/p.png");
  });

  it("overrides a chip by scheme:kind, then scheme, then any chip", () => {
    const Person = ({ text }: { text: string }) => <b data-which="person">{text}</b>;
    const Mention = ({ text }: { text: string }) => <i data-which="mention">{text}</i>;
    const Any = ({ text }: { text: string }) => <u data-which="any">{text}</u>;
    const { container } = render(
      <ClientView
        markdown="[@a](mention:person/1) [@b](mention:team/2) [T](task:issue/3)"
        chips={[{ scheme: "task" }]}
        components={{ chips: { "mention:person": Person, mention: Mention }, chip: Any }}
      />,
    );
    expect(Array.from(container.querySelectorAll("[data-which]")).map((e) => e.getAttribute("data-which"))).toEqual(["person", "mention", "any"]);
  });

  it("overrides user-defined syntax by name", () => {
    const { container } = render(
      <ClientView
        markdown="==x=="
        syntax={{ inline: [{ name: "hl", open: "==" }] }}
        components={{ custom: { hl: ({ children }) => <mark data-custom="1">{children}</mark> } }}
      />,
    );
    expect(container.querySelector("mark[data-custom]")?.textContent).toBe("x");
  });

  it("onChipClick and ChipDefinition.onClick both fire; keyboard activates a clickable chip", () => {
    const onChipClick = vi.fn();
    const defClick = vi.fn();
    const { container } = render(<ClientView markdown="[@a](mention:person/1)" onChipClick={onChipClick} chips={[{ scheme: "mention", onClick: defClick }]} />);
    const chip = container.querySelector(".atm-chip") as HTMLElement;
    expect(chip.getAttribute("role")).toBe("button");
    fireEvent.click(chip);
    expect(onChipClick).toHaveBeenCalledTimes(1);
    expect((onChipClick.mock.calls[0][0] as ChipNode).id).toBe("1");
    expect(defClick).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(chip, { key: "Enter" });
    expect(onChipClick).toHaveBeenCalledTimes(2);
  });

  it("a chip with no handler is not a button", () => {
    const { container } = render(<ClientView markdown="[@a](mention:person/1)" />);
    expect(container.querySelector(".atm-chip")?.getAttribute("role")).toBeNull();
  });

  it("onLinkClick receives the safe href and can prevent navigation", () => {
    const onLinkClick = vi.fn((_h: string, ev: { preventDefault(): void }) => ev.preventDefault());
    const { container } = render(<ClientView markdown="[a](https://a.co/x)" onLinkClick={onLinkClick} />);
    const notPrevented = fireEvent.click(container.querySelector("a")!);
    expect(onLinkClick).toHaveBeenCalledWith("https://a.co/x", expect.anything());
    expect(notPrevented).toBe(false);
  });

  it("ChipDefinition.render output is used (string as trusted markup)", () => {
    const { container } = render(<ClientView markdown="[@a](mention:person/1)" chips={[{ scheme: "mention", render: (c) => `<em class="r">${c.id}</em>` }]} />);
    expect(container.querySelector(".atm-chip .r")?.textContent).toBe("1");
  });
});

describe("renderMarkdownToReact (non-component use)", () => {
  it("returns nodes you can place anywhere", () => {
    const html = renderToStaticMarkup(<section>{renderMarkdownToReact("# T\n\n**b**")}</section>);
    expect(html).toBe('<section><h1 class="atm-h1">T</h1><p class="atm-p"><strong class="atm-strong">b</strong></p></section>');
  });
  it("accepts the same options", () => {
    const html = renderToStaticMarkup(<>{renderMarkdownToReact("# T", { classPrefix: "q", classNames: { heading: "big" } })}</>);
    expect(html).toBe('<h1 class="q-h1 big">T</h1>');
  });
});

describe("memoisation: only changed blocks re-render", () => {
  const makeCounter = () => {
    const counts = new Map<string, number>();
    const Para = ({ node, children }: { node: { children: { value?: string }[] }; children?: React.ReactNode }) => {
      const key = node.children.map((c) => c.value ?? "").join("");
      counts.set(key, (counts.get(key) ?? 0) + 1);
      return <p>{children}</p>;
    };
    return { counts, Para };
  };
  const doc = (...ps: string[]) => ps.join("\n\n");

  it("editing one paragraph re-renders only that paragraph", () => {
    const { counts, Para } = makeCounter();
    const comps = { paragraph: Para as never };
    const { rerender } = render(<ClientView markdown={doc("one", "two", "three", "four")} components={comps} />);
    expect([...counts.values()]).toEqual([1, 1, 1, 1]);
    rerender(<ClientView markdown={doc("one", "two!", "three", "four")} components={comps} />);
    expect(counts.get("one")).toBe(1);
    expect(counts.get("three")).toBe(1);
    expect(counts.get("four")).toBe(1);
    expect(counts.get("two!")).toBe(1);
  });

  it("inserting at the top does not re-render the rest", () => {
    const { counts, Para } = makeCounter();
    const { rerender } = render(<ClientView markdown={doc("a", "b", "c")} components={{ paragraph: Para as never }} />);
    rerender(<ClientView markdown={doc("new", "a", "b", "c")} components={{ paragraph: Para as never }} />);
    expect(counts.get("a")).toBe(1);
    expect(counts.get("b")).toBe(1);
    expect(counts.get("c")).toBe(1);
    expect(counts.get("new")).toBe(1);
  });

  it("identical blocks (duplicates) are keyed distinctly and all render", () => {
    const { container } = render(<ClientView markdown={doc("same", "same", "same")} />);
    expect(container.querySelectorAll("p").length).toBe(3);
  });

  it("inline components/links/chips objects with the same content do not re-render anything", () => {
    const { counts, Para } = makeCounter();
    const view = () => <ClientView markdown={doc("a", "b")} components={{ paragraph: (p) => <Para {...(p as unknown as React.ComponentProps<typeof Para>)} /> }} links={{ allowedHosts: ["a.co"] }} chips={[{ scheme: "mention" }]} classNames={{ x: "y" }} />;
    const { rerender } = render(view());
    rerender(view());
    rerender(view());
    expect(counts.get("a")).toBe(1);
    expect(counts.get("b")).toBe(1);
  });

  it("a real option change re-renders the blocks", () => {
    const { counts, Para } = makeCounter();
    const { rerender } = render(<ClientView markdown={doc("a")} components={{ paragraph: Para as never }} classPrefix="x" />);
    rerender(<ClientView markdown={doc("a")} components={{ paragraph: Para as never }} classPrefix="y" />);
    expect(counts.get("a")).toBe(2);
  });

  it("a new footnote re-renders the blocks that cite footnotes, and only those", () => {
    const { counts, Para } = makeCounter();
    const comps = { paragraph: Para as never };
    const { rerender } = render(<ClientView markdown={"plain\n\ncites[^1]\n\n[^1]: n"} components={comps} />);
    rerender(<ClientView markdown={"plain\n\ncites[^1]\n\n[^1]: n\n[^2]: m"} components={comps} />);
    expect(counts.get("plain")).toBe(1);
  });

  it("a changed reference-link definition updates the blocks that use it", () => {
    const { container, rerender } = render(<ClientView markdown={"[x][r]\n\n[r]: https://a.co/1"} />);
    expect(container.querySelector("a")?.getAttribute("href")).toBe("https://a.co/1");
    rerender(<ClientView markdown={"[x][r]\n\n[r]: https://a.co/2"} />);
    expect(container.querySelector("a")?.getAttribute("href")).toBe("https://a.co/2");
  });

  it("the client view matches the server view's markup", () => {
    const md = "# T\n\n- a\n- b\n\n| a |\n|---|\n| 1 |\n\n$x$ [@j](mention:person/1)[^1]\n\n[^1]: n";
    const o = { chips: [{ scheme: "mention" }] };
    expect(normalize(renderToStaticMarkup(<ClientView markdown={md} {...o} />))).toBe(normalize(renderToStaticMarkup(<PureView markdown={md} {...o} />)));
  });
});

describe("link previews on the client view", () => {
  it("hydrates the marked paragraphs through the core controller", async () => {
    const resolve = vi.fn(async (url: string) => ({ url, title: "Example page" }));
    const { container, findByText } = render(<ClientView markdown="https://example.com/article" linkPreview={{ resolve, modes: ["card"] }} />);
    expect(container.querySelector("[data-atm-standalone-link]")).not.toBeNull();
    await findByText("Example page");
    expect(resolve).toHaveBeenCalledTimes(1);
  });
});

describe("softBreak", () => {
  it('shows a single newline as <br> with softBreak: "br", and matches the core renderer', () => {
    const md = "line one\nline two";
    const html = renderToStaticMarkup(<PureView markdown={md} softBreak="br" />);
    expect(html).toContain("line one<br");
    expect(html).toContain("line two");
    expect(renderHtml(md, { softBreak: "br" })).toContain("<br");
  });

  it("leaves the newline alone by default", () => {
    const html = renderToStaticMarkup(<PureView markdown={"line one\nline two"} />);
    expect(html).not.toContain("<br");
  });
});
