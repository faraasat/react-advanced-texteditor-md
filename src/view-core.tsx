/**
 * Markdown → React elements, built natively from the core's AST. No hooks, no effects, no browser
 * globals: this module is imported by the server-safe `./view` entry as well as by the client one.
 *
 * It mirrors the core's `renderHtml` (same elements, same `atm-*` classes, same link policy, same
 * escaping rules) so the stylesheet that styles the editor styles this too. The only
 * `dangerouslySetInnerHTML` carries output of the core's own math renderer and highlighter, or
 * markup a host supplied through `ChipDefinition.render`: never the document's text. Text and
 * attribute values are React children and props, escaped by React.
 */
import { Fragment, createElement as h } from "react";
import type { CSSProperties, ComponentType, MouseEvent as ReactMouseEvent, ReactElement, ReactNode } from "react";
import { parse } from "advanced-texteditor-md/parser";
import { safeUrl } from "advanced-texteditor-md/render";
import { embedSpec, findStandaloneUrl, matchEmbed } from "advanced-texteditor-md/embeds";
import { createMathRenderer } from "advanced-texteditor-md/math";
import type {
  BlockNode,
  ChipDefinition,
  Doc,
  InlineNode,
  LinkPolicy,
  MathRenderer,
  ParseOptions,
} from "advanced-texteditor-md";
import type { ChipNode, MarkdownViewOptions, ViewComponents } from "./types";

/* ───────────────────────────── options ───────────────────────────── */

export type ResolvedView = {
  parse: ParseOptions;
  prefix: string;
  softBreak?: "br";
  links?: LinkPolicy;
  classNames: Partial<Record<string, string>>;
  highlight: NonNullable<MarkdownViewOptions["highlight"]> | null;
  chips: Record<string, ChipDefinition>;
  embeds: NonNullable<MarkdownViewOptions["embeds"]>;
  linkPreview: boolean;
  linkPreviewOpts?: MarkdownViewOptions["linkPreview"];
  labels: NonNullable<MarkdownViewOptions["labels"]>;
  components: ViewComponents;
  mathRenderer: MathRenderer | null;
  syntax: NonNullable<ParseOptions["syntax"]>;
  onChipClick?: MarkdownViewOptions["onChipClick"];
  onLinkClick?: MarkdownViewOptions["onLinkClick"];
};

let defaultMath: MathRenderer | undefined;

export function resolveView(o: MarkdownViewOptions = {}): ResolvedView {
  const chips: Record<string, ChipDefinition> = {};
  if (Array.isArray(o.chips)) for (const d of o.chips) chips[d.scheme] = d;
  else if (o.chips) Object.assign(chips, o.chips);
  const chipSchemes = Array.from(new Set([...(o.chipSchemes ?? []), ...Object.values(chips).map((d) => d.scheme), ...Object.keys(chips).map((k) => k.split(":")[0])]));
  const parseMath = o.math !== false;
  const fromObj = typeof o.math === "object" ? o.math.renderer : undefined;
  const given = o.mathRenderer !== undefined ? o.mathRenderer : fromObj;
  const mathRenderer = given !== undefined ? given : parseMath ? (defaultMath ??= createMathRenderer()) : null;
  return {
    parse: { gfm: o.gfm, math: parseMath, footnotes: o.footnotes, syntax: o.syntax, chipSchemes },
    prefix: o.classPrefix ?? "atm",
    softBreak: o.softBreak,
    links: o.links,
    classNames: o.classNames ?? {},
    highlight: o.highlight ?? null,
    chips,
    embeds: o.embeds ?? [],
    linkPreview: !!o.linkPreview,
    linkPreviewOpts: o.linkPreview,
    labels: o.labels ?? {},
    components: o.components ?? {},
    mathRenderer,
    syntax: o.syntax ?? {},
    onChipClick: o.onChipClick,
    onLinkClick: o.onLinkClick,
  };
}

/* ───────────────────────────── helpers ───────────────────────────── */

type Ctx = { r: ResolvedView; fnNum: Map<string, number> };
type Chip = ChipNode;
type Props = Record<string, unknown>;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
const safeColor = (c: string) => /^[#\w\s%.,()/-]+$/.test(c) && !/url\(|expression|javascript/i.test(c);
const fnId = (l: string) => l.replace(/[^\w-]/g, (c) => "_" + c.charCodeAt(0).toString(16));
const isExternal = (u: string) => /^(?:https?:)?\/\//i.test(u);

const TAGS = new Set(["span", "mark", "u", "kbd", "sub", "sup", "small", "abbr", "div", "aside", "section", "details", "summary"]);
const BLOCK_TAGS = new Set(["div", "aside", "section", "details"]);
const URL_ATTRS = new Set(["href", "src", "action", "formaction", "poster", "cite", "data", "background", "ping", "codebase", "manifest"]);

/** HTML attribute names that React spells differently. Anything else lower-case passes through. */
const PROP: Record<string, string> = {
  tabindex: "tabIndex",
  colspan: "colSpan",
  rowspan: "rowSpan",
  readonly: "readOnly",
  maxlength: "maxLength",
  datetime: "dateTime",
  spellcheck: "spellCheck",
  contenteditable: "contentEditable",
  hreflang: "hrefLang",
  crossorigin: "crossOrigin",
  allowfullscreen: "allowFullScreen",
  referrerpolicy: "referrerPolicy",
  for: "htmlFor",
};

/** `"color:red;--x:1"` → `{ color: "red", "--x": "1" }`. The core has already refused `url(` and friends. */
function parseStyle(css: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of css.split(";")) {
    const i = decl.indexOf(":");
    if (i < 1) continue;
    const name = decl.slice(0, i).trim();
    const key = name.startsWith("--") ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = decl.slice(i + 1).trim();
  }
  return out;
}

function safeAttrs(src: Record<string, string> | undefined, pol: LinkPolicy | undefined, into: Props) {
  for (const [n, v] of Object.entries(src ?? {})) {
    if (!/^[a-z][a-z0-9-]*$/.test(n) || n.startsWith("on") || n === "srcset" || n === "class") continue;
    if (URL_ATTRS.has(n)) {
      const u = safeUrl(v, pol, "link");
      if (u === null) continue;
      into[n] = u;
    } else if (n === "style") {
      if (!/url\(|expression|javascript|@import|[<>]/i.test(v)) into.style = parseStyle(v);
    } else into[PROP[n] ?? n] = String(v);
  }
}

/** Trusted markup (core math/highlight output, or a host's `ChipDefinition.render`) or a DOM node a host built. */
const rawProps = (r: string | HTMLElement): Props =>
  typeof r === "string"
    ? { dangerouslySetInnerHTML: { __html: r } }
    : { ref: (n: HTMLElement | null) => void (n && n.replaceChildren(r)) };

/* ───────────────────────────── rendering ───────────────────────────── */

const cls = (c: Ctx, name: string, type?: string) => {
  const extra = c.r.classNames[type ?? name];
  return `${c.r.prefix}-${name}` + (extra ? " " + extra : "");
};

function node<N>(c: Ctx, kind: keyof ViewComponents, n: N, key: string | number, tag: string, className: string, props: Props, children?: ReactNode, extra?: Props): ReactElement {
  const Comp = c.r.components[kind] as ComponentType<Props> | undefined;
  // An override replaces the element: it gets the node, the class and the default content, not our attributes.
  if (Comp) return h(Comp, { key, node: n, className, children, ...extra });
  return h(tag, { key, className, ...props }, children);
}

function inlines(nodes: InlineNode[], c: Ctx): ReactNode[] {
  return nodes.map((n, i) => inline(n, c, i));
}

function mathEl(tex: string, display: boolean, className: string, c: Ctx, key: string | number, kind: "mathInline" | "mathBlock", n: unknown): ReactElement {
  let content: Props | null = null;
  if (c.r.mathRenderer) {
    try {
      content = rawProps(c.r.mathRenderer(tex, display));
    } catch {
      /* show the source */
    }
  }
  const src = h("code", { className: cls(c, "math-src") }, tex);
  if (c.r.components[kind]) return node(c, kind, n, key, "span", className, {}, content ? h("span", content) : src);
  return h(display ? "div" : "span", { key, className, ...content }, content ? undefined : src);
}

function chipEl(n: Chip, c: Ctx, key: number): ReactElement {
  const p = c.r.prefix;
  const def = c.r.chips[`${n.scheme}:${n.kind}`] ?? c.r.chips[n.scheme];
  const kd = def?.kinds?.[n.kind];
  const className = [cls(c, "chip", "chip"), cls(c, "chip-" + slug(n.scheme)), n.kind && cls(c, "chip-kind-" + slug(n.kind)), def?.className, kd?.className]
    .filter(Boolean)
    .join(" ");
  let style: CSSProperties | undefined;
  const col = kd?.color;
  if (typeof col === "number" && col >= 1 && col <= 8) style = { [`--${p}-chip-color`]: `var(--${p}-chip-${Math.trunc(col)})` } as CSSProperties;
  else if (typeof col === "string" && safeColor(col)) style = { [`--${p}-chip-color`]: col } as CSSProperties;
  const text = (n.trigger ?? "") + n.label;
  const clickable = !!(def?.onClick || c.r.onChipClick);
  const onClick = clickable
    ? (ev: ReactMouseEvent<HTMLElement>) => {
        def?.onClick?.(n, ev.nativeEvent);
        c.r.onChipClick?.(n, ev);
      }
    : undefined;
  const props: Props = {
    style,
    "data-scheme": n.scheme,
    "data-kind": n.kind || undefined,
    "data-id": n.id,
    "data-trigger": n.trigger,
    "data-refs": n.attrs && Object.keys(n.attrs).length ? JSON.stringify(n.attrs) : undefined,
  };
  if (onClick) {
    props.onClick = onClick;
    props.role = "button";
    props.tabIndex = 0;
    props.onKeyDown = (ev: { key: string; preventDefault(): void; currentTarget: HTMLElement }) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        ev.currentTarget.click();
      }
    };
  }
  let custom: string | HTMLElement | undefined;
  try {
    custom = def?.render?.(n);
  } catch {
    /* the default label */
  }
  const Comp = (c.r.components.chips?.[`${n.scheme}:${n.kind}`] ?? c.r.components.chips?.[n.scheme] ?? c.r.components.chip) as ComponentType<Props> | undefined;
  const badge = kd?.label;
  if (Comp) return h(Comp, { key, node: n, className, text, badge, style, onClick, children: custom === undefined ? undefined : h("span", rawProps(custom)) });
  if (custom !== undefined) return h("span", { key, className, ...props, ...rawProps(custom) });
  return h("span", { key, className, ...props }, text, badge ? h("span", { className: cls(c, "chip-badge") }, badge) : null);
}

function inline(n: InlineNode, c: Ctx, key: number): ReactNode {
  switch (n.type) {
    case "text":
      // `softBreak: "br"` shows a single newline as a line break (display only; the Markdown is unchanged).
      return c.r.softBreak === "br" && n.value.includes("\n")
        ? h(Fragment, { key }, ...n.value.split("\n").flatMap((t, i) => (i ? [h("br", { key: "b" + i, "data-atm-soft": "" }), t] : [t])))
        : n.value;
    case "emphasis":
      return node(c, "emphasis", n, key, "em", cls(c, "em", "emphasis"), {}, inlines(n.children, c));
    case "strong":
      return node(c, "strong", n, key, "strong", cls(c, "strong"), {}, inlines(n.children, c));
    case "strike":
      return node(c, "strike", n, key, "del", cls(c, "del", "strike"), {}, inlines(n.children, c));
    case "code":
      return node(c, "code", n, key, "code", cls(c, "code") + " " + cls(c, "code-inline"), {}, n.value);
    case "break":
      return h("br", { key });
    case "math":
      return mathEl(n.tex, false, cls(c, "math", "math") + " " + cls(c, "math-inline"), c, key, "mathInline", n);
    case "footnoteRef": {
      const num = c.fnNum.get(n.label);
      if (!num) return `[^${n.label}]`;
      const id = fnId(n.label);
      return h("sup", { key, className: cls(c, "footnote-ref", "footnoteRef") }, h("a", { href: "#fn-" + id, id: "fnref-" + id }, String(num)));
    }
    case "chip":
      return chipEl(n, c, key);
    case "custom":
      return customEl("inline", n.name, n.data, inlines(n.children, c), c, key, n);
    case "link": {
      const u = safeUrl(n.href, c.r.links, "link");
      if (u === null) return h(Fragment, { key }, inlines(n.children, c));
      const ext = isExternal(u);
      const rel = ext ? (c.r.links?.rel ?? "noopener noreferrer nofollow") : undefined;
      const target = ext ? (c.r.links?.target ?? "_blank") : undefined;
      const onClick = c.r.onLinkClick ? (ev: ReactMouseEvent<HTMLAnchorElement>) => c.r.onLinkClick!(u, ev) : undefined;
      const props = { href: u, title: n.title, rel, target, onClick };
      return node(c, "link", n, key, "a", cls(c, "link", "link"), props, inlines(n.children, c), { ...props, external: ext });
    }
    case "image": {
      const u = safeUrl(n.src, c.r.links, "image");
      if (u === null) return n.alt;
      return node(c, "image", n, key, "img", cls(c, "img", "image"), { src: u, alt: n.alt, title: n.title, loading: "lazy" }, undefined, { src: u });
    }
  }
}

function customEl(kind: "inline" | "block", name: string, data: Record<string, string> | undefined, kids: ReactNode, c: Ctx, key: number, n: unknown): ReactElement {
  const sy = (c.r.syntax[kind] as { name: string; tag?: string; className?: string; attrs?: Record<string, string> }[] | undefined)?.find((s) => s.name === name);
  let tag = sy?.tag && TAGS.has(sy.tag) ? sy.tag : kind === "inline" ? "span" : "div";
  if (kind === "inline" && BLOCK_TAGS.has(tag)) tag = "span";
  const className = [cls(c, "custom", "custom"), cls(c, "custom-" + slug(name)), sy?.className].filter(Boolean).join(" ");
  const props: Props = {};
  safeAttrs(sy?.attrs, c.r.links, props);
  for (const [dk, dv] of Object.entries(data ?? {})) if (dk[0] !== "_" && /^[a-z][a-z0-9-]*$/i.test(dk)) props["data-" + dk.toLowerCase()] = dv;
  const Comp = c.r.components.custom?.[name] as ComponentType<Props> | undefined;
  if (Comp) return h(Comp, { key, node: n, className, tag, children: kids });
  return h(tag, { key, ...props, className }, kids);
}

function standalone(b: Extract<BlockNode, { type: "paragraph" }>, c: Ctx, top: boolean, key: number): ReactElement | null {
  const url = c.r.embeds.length || c.r.linkPreview ? findStandaloneUrl(b) : null;
  if (!url || safeUrl(url, c.r.links, "link") === null) return null;
  const m = top && c.r.embeds.length ? matchEmbed(url, c.r.embeds) : null;
  if (m) {
    const sp = embedSpec(m, { openOriginal: c.r.labels.openOriginal }, c.r.prefix);
    const f = sp.frame;
    return h(
      "div",
      { key, className: sp.wrap.class, "data-embed": sp.wrap["data-embed"], "data-atm-embed-url": sp.wrap["data-atm-embed-url"], style: parseStyle(sp.wrap.style) },
      h("iframe", { className: f.class, src: f.src, sandbox: f.sandbox, loading: "lazy", referrerPolicy: f.referrerpolicy as "strict-origin-when-cross-origin", allow: f.allow, title: f.title, allowFullScreen: true }),
      h("a", { className: sp.open.class, href: sp.open.href, target: sp.open.target, rel: sp.open.rel }, sp.openText),
    );
  }
  return c.r.linkPreview ? h("p", { key, className: cls(c, "p", "paragraph"), "data-atm-standalone-link": url }, inlines(b.children, c)) : null;
}

export function block(b: BlockNode, c: Ctx, key: number, tight = false, top = true, tail?: ReactNode): ReactNode {
  switch (b.type) {
    case "paragraph":
      if (tight) return h(Fragment, { key }, inlines(b.children, c));
      return standalone(b, c, top, key) ?? node(c, "paragraph", b, key, "p", cls(c, "p", "paragraph"), {}, tail ? [...inlines(b.children, c), tail] : inlines(b.children, c));
    case "heading":
      return node(c, "heading", b, key, "h" + b.level, cls(c, "h" + b.level, "heading"), {}, inlines(b.children, c));
    case "blockquote":
      return node(c, "blockquote", b, key, "blockquote", cls(c, "blockquote"), {}, blocks(b.children, c, false, false));
    case "list": {
      const className = cls(c, b.ordered ? "ol" : "ul", "list") + (b.tight ? " " + cls(c, "tight") : "");
      const items = b.items.map((it, i) => {
        const task = it.checked !== undefined;
        const kids = [
          task ? h("input", { key: "box", type: "checkbox", className: cls(c, "task-box"), disabled: true, readOnly: true, checked: !!it.checked, "aria-label": c.r.labels.task || "Task" }) : null,
          ...blocks(it.children, c, b.tight, false),
        ];
        const liClass = cls(c, "li", "listItem") + (task ? " " + cls(c, "task") + (it.checked ? " " + cls(c, "task-done") : "") : "");
        return node(c, "listItem", it, i, "li", liClass, {}, kids, { ordered: b.ordered });
      });
      return node(c, "list", b, key, b.ordered ? "ol" : "ul", className, { start: b.ordered && b.start !== 1 ? b.start : undefined }, items);
    }
    case "codeBlock": {
      const lang = b.lang.replace(/[^\w+#.-]/g, "");
      let html: string | undefined;
      if (c.r.highlight) {
        try {
          html = c.r.highlight.highlight(b.code, b.lang);
        } catch {
          /* escaped text */
        }
      }
      const code = h("code", { className: cls(c, "code") + (lang ? " language-" + lang : ""), "data-lang": lang || undefined, ...(html !== undefined ? rawProps(html) : { children: b.code }) });
      return node(
        c,
        "codeBlock",
        b,
        key,
        "pre",
        cls(c, "pre", "codeBlock"),
        // A scrollable region must be focusable and named.
        { tabIndex: 0, role: "region", "aria-label": (c.r.labels.code || "Code") + (lang ? ` (${lang})` : "") },
        code,
        { html },
      );
    }
    case "math":
      return mathEl(b.tex, true, cls(c, "math", "math") + " " + cls(c, "math-block"), c, key, "mathBlock", b);
    case "table": {
      const cell = (tag: "th" | "td", ci: InlineNode[], i: number, k: number) =>
        h(tag, { key: k, scope: tag === "th" ? "col" : undefined, style: b.align[i] ? { textAlign: b.align[i] as "left" } : undefined }, inlines(ci, c));
      const body = [
        h("thead", { key: "h" }, h("tr", null, b.head.map((ci, i) => cell("th", ci, i, i)))),
        h("tbody", { key: "b" }, b.rows.map((r, ri) => h("tr", { key: ri }, r.map((ci, i) => cell("td", ci, i, i))))),
      ];
      return node(c, "table", b, key, "table", cls(c, "table", "table"), {}, body);
    }
    case "thematicBreak":
      return node(c, "thematicBreak", b, key, "hr", cls(c, "hr", "thematicBreak"), {});
    case "footnoteDef":
      return null;
    case "custom":
      return customEl("block", b.name, b.data, blocks(b.children, c, false, false), c, key, b);
  }
}

export function blocks(bs: BlockNode[], c: Ctx, tight = false, top = true): ReactNode[] {
  return bs.map((b, i) => block(b, c, i, tight, top));
}

/* ───────────────────────────── document ───────────────────────────── */

type FootnoteDef = Extract<BlockNode, { type: "footnoteDef" }>;

/** Footnote definitions in document order (nested ones included), exactly as the core collects them. */
export function collectFootnotes(doc: Doc): FootnoteDef[] {
  const out: FootnoteDef[] = [];
  const visit = (bs: BlockNode[]) => {
    for (const b of bs) {
      if (b.type === "footnoteDef") out.push(b);
      else if (b.type === "blockquote" || b.type === "custom") visit(b.children);
      else if (b.type === "list") for (const it of b.items) visit(it.children);
    }
  };
  visit(doc.children);
  return out;
}

export const makeCtx = (r: ResolvedView, fns: FootnoteDef[]): Ctx => ({ r, fnNum: new Map(fns.map((f, i) => [f.label, i + 1])) });

export function footnotes(fns: FootnoteDef[], c: Ctx): ReactElement | null {
  if (!fns.length) return null;
  return h(
    "section",
    { key: "footnotes", className: cls(c, "footnotes", "footnoteDef") },
    h(
      "ol",
      { className: cls(c, "footnote-list") },
      fns.map((f) => {
        const id = fnId(f.label);
        const back = h("a", { key: "back", href: "#fnref-" + id, className: cls(c, "footnote-back"), "aria-label": "Back to content" }, "↩");
        // Like the core: the back-link joins the last paragraph, else follows the last block.
        const lastIdx = f.children.length - 1;
        const joins = lastIdx >= 0 && f.children[lastIdx].type === "paragraph";
        const kids = f.children.map((b, i) => block(b, c, i, false, false, joins && i === lastIdx ? [" ", back] : undefined));
        if (!joins) kids.push(back);
        return h("li", { key: f.label, id: "fn-" + id, className: cls(c, "footnote") }, kids);
      }),
    ),
  );
}

/** The document as React nodes (no wrapper element). */
export function renderMarkdownToReact(markdown: string, options?: MarkdownViewOptions): ReactNode {
  const r = resolveView(options);
  const doc = parse(markdown, r.parse);
  const fns = collectFootnotes(doc);
  const c = makeCtx(r, fns);
  return h(Fragment, null, blocks(doc.children, c), footnotes(fns, c));
}

export type { Ctx };
