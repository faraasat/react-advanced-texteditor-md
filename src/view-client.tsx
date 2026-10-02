import { createElement as h, memo, useEffect, useMemo, useRef } from "react";
import type { ReactElement } from "react";
import { parse } from "advanced-texteditor-md/parser";
import type { BlockNode } from "advanced-texteditor-md";
import { useIsoLayoutEffect } from "./isomorphic";
import { materialize, shallowEqual, signature, type FnTable, type Signature } from "./stable";
import { splitViewProps } from "./view-pure";
import { block, collectFootnotes, footnotes, resolveView, type ResolvedView } from "./view-core";
import type { MarkdownViewProps } from "./types";

/** A 53-bit string hash (cyrb53): the key of a block, so inserting one at the top moves the others instead of re-rendering them. */
function hash(s: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

type BlockProps = {
  b: BlockNode;
  r: ResolvedView;
  fnNum: Map<string, number>;
  /** The block as JSON: what "unchanged" means. */
  sig: string;
  /** Footnote numbering, for blocks that cite a footnote only. */
  dep: string;
};

/** Re-renders only when this block's own content (or the options, or its footnote numbers) changed. */
const BlockView = memo(
  function BlockView({ b, r, fnNum }: BlockProps) {
    return block(b, { r, fnNum }, 0) as ReactElement;
  },
  (a, b) => a.sig === b.sig && a.r === b.r && a.dep === b.dep,
);

type FootProps = { defs: Extract<BlockNode, { type: "footnoteDef" }>[]; r: ResolvedView; fnNum: Map<string, number>; sig: string };
const Footnotes = memo(
  function Footnotes({ defs, r, fnNum }: FootProps) {
    return footnotes(defs, { r, fnNum });
  },
  (a, b) => a.sig === b.sig && a.r === b.r,
);

/**
 * Renders Markdown as React elements and re-renders only the blocks that changed: a long document
 * that is edited elsewhere keeps its untouched paragraphs, tables and code blocks as they are.
 * Options are compared by value (see "How identity is compared" in the README), so inline
 * `components`, `links` and `chips` objects do not defeat that.
 */
function MarkdownViewImpl(props: MarkdownViewProps) {
  const { markdown, options, root } = splitViewProps(props);
  const rootRef = useRef<HTMLDivElement>(null);

  // Options by value. The function table is refreshed during render: `components` are rendered,
  // not just called later, so their trampolines must see this render's functions.
  const memoSig = useRef<{ input: Record<string, unknown>; sig: Signature } | null>(null);
  const table = useRef<FnTable>(new Map());
  let sig: Signature;
  if (memoSig.current && shallowEqual(memoSig.current.input, options as Record<string, unknown>)) sig = memoSig.current.sig;
  else memoSig.current = { input: options as Record<string, unknown>, sig: (sig = signature(options as Record<string, unknown>)) };
  table.current.clear();
  sig.fns.forEach((v, k) => table.current.set(k, v));
  const r = useMemo(() => resolveView(materialize(options as Record<string, unknown>, table.current)), [sig.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const { items, foot, doc } = useMemo(() => {
    const doc = parse(markdown, r.parse);
    const defs = collectFootnotes(doc);
    const fnNum = new Map(defs.map((f, i) => [f.label, i + 1]));
    const fnKey = defs.map((f) => f.label).join("\u0000");
    const seen = new Map<string, number>();
    const items = doc.children.map((b) => {
      const s = JSON.stringify(b);
      const n = seen.get(s) ?? 0;
      seen.set(s, n + 1);
      return h(BlockView, { key: hash(s) + ":" + n, b, r, fnNum, sig: s, dep: s.includes('"footnoteRef"') ? fnKey : "" });
    });
    const foot = defs.length ? h(Footnotes, { key: "footnotes", defs, r, fnNum, sig: JSON.stringify(defs) + fnKey }) : null;
    return { items, foot, doc };
  }, [markdown, r]);

  // Link previews: the renderer only marks the paragraphs; the core's controller turns the marks into cards.
  const ctl = useRef<{ hydrate(root: HTMLElement): void; destroy(): void } | null>(null);
  const wantsPreview = r.linkPreview;
  useEffect(() => {
    const el = rootRef.current;
    if (!wantsPreview || !el || !r.linkPreviewOpts) return;
    let dead = false;
    let detach: (() => void) | undefined;
    import("advanced-texteditor-md/link-preview").then((m) => {
      if (dead) return;
      const c = m.createLinkPreviewController({ options: r.linkPreviewOpts!, links: r.links });
      ctl.current = c;
      c.hydrate(el);
      detach = c.attachHover(el);
    });
    return () => {
      dead = true;
      detach?.();
      ctl.current?.destroy();
      ctl.current = null;
    };
  }, [wantsPreview, r]);
  useIsoLayoutEffect(() => {
    if (rootRef.current) ctl.current?.hydrate(rootRef.current);
  }, [doc]);

  // Chip cards: the core binds the rendered chips in an effect (never during render, so hydration
  // matches). One binding per `cards` value; a new document only asks it to look for new chips.
  const cards = r.cards;
  const cardsHandle = useRef<{ refresh(): void; destroy(): void } | null>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!cards || !el) return;
    let dead = false;
    import("advanced-texteditor-md/chips").then((m) => {
      if (dead) return;
      cardsHandle.current = m.enhanceChipCards(el, { ...cards, classPrefix: r.prefix });
    });
    return () => {
      dead = true;
      cardsHandle.current?.destroy();
      cardsHandle.current = null;
    };
  }, [cards, r.prefix]);
  useIsoLayoutEffect(() => {
    cardsHandle.current?.refresh();
  }, [doc]);

  return h("div", { ...root, ref: rootRef }, items, foot);
}

export const MarkdownView = memo(MarkdownViewImpl);
MarkdownView.displayName = "MarkdownView";
