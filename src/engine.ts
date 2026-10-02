import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { createEditor } from "advanced-texteditor-md";
import type { EditorInstance, EditorMode, EditorOptions } from "advanced-texteditor-md";
import { EditorBridge, createHandle } from "./bridge";
import { useIsoLayoutEffect } from "./isomorphic";
import { materialize, shallowEqual, signature, type FnTable, type Signature } from "./stable";
import type { UseMarkdownEditorOptions } from "./types";

/**
 * Props the engine handles itself. Everything else is a core option: it is compared by value
 * (see stable.ts) and a change recreates the editor.
 *   - callbacks: always the latest one is called, never a reason to recreate;
 *   - value / mode / readOnly / disabled / theme / minHeight / maxHeight: the core can change them live.
 */
const LIVE = ["aria-labelledby", "aria-describedby", "value", "defaultValue", "mode", "defaultMode", "readOnly", "disabled", "theme", "minHeight", "maxHeight", "ssr"];
const CALLBACKS = ["onChange", "onModeChange", "onFocus", "onBlur", "onReady", "onMentionsChange", "onUpload", "onSubmit"];
export const SKIP: ReadonlySet<string> = new Set([...LIVE, ...CALLBACKS]);

export type EngineOptions = UseMarkdownEditorOptions & { "aria-labelledby"?: string; "aria-describedby"?: string };

export type Engine = {
  hostRef: RefObject<HTMLDivElement | null>;
  /** The stable `EditorInstance` that forwards to the current editor. */
  handle: EditorInstance;
  bridge: EditorBridge;
  /** The real editor once created (null on the server and until the first layout effect). */
  editor: EditorInstance | null;
  /** The element of the `actions` slot, when the layout has one. */
  actionsEl: HTMLElement | null;
};

const px = (v: number | string | undefined) => (v === undefined ? undefined : typeof v === "number" ? `${v}px` : v);

function applyHeights(el: HTMLElement, min: number | string | undefined, max: number | string | undefined) {
  // Same variables the core sets at creation (`--atm-min-height`, `--atm-max-height`).
  for (const [name, v] of [["--atm-min-height", px(min)], ["--atm-max-height", px(max)]] as const) {
    if (v === undefined) el.style.removeProperty(name);
    else el.style.setProperty(name, v);
  }
}

function applyAria(root: HTMLElement, labelledBy?: string, describedBy?: string) {
  if (labelledBy === undefined && describedBy === undefined) return;
  root.querySelectorAll('[role="textbox"], textarea').forEach((el) => {
    for (const [name, v] of [["aria-labelledby", labelledBy], ["aria-describedby", describedBy]] as const) {
      if (v === undefined) continue;
      if (el.getAttribute(name) !== v) el.setAttribute(name, v);
    }
  });
}

function applyDisabled(ed: EditorInstance, opts: EditorOptions, disabled: boolean) {
  opts.disabled = disabled; // the core reads it again in setReadOnly()
  if (disabled) ed.element.setAttribute("aria-disabled", "true");
  else ed.element.removeAttribute("aria-disabled");
  const hidden = ed.element.querySelector<HTMLInputElement>('input[type="hidden"]');
  if (hidden) hidden.disabled = disabled;
}

type Carry = { value: string; mode: EditorMode; focused: boolean };

/**
 * Everything the component and the headless hook share: creates the editor in an effect (and
 * destroys it in the cleanup, so StrictMode's double invocation leaves nothing behind), keeps it
 * in step with the props without recreating it, and recreates it only when a structural option
 * changes.
 */
export function useEngine(options: EngineOptions): Engine {
  const hostRef = useRef<HTMLDivElement>(null);
  const [{ bridge, handle, optsRef }] = useState(() => {
    const optsRef = { current: {} as EditorOptions };
    const bridge = new EditorBridge();
    bridge.value = options.value ?? options.defaultValue ?? "";
    bridge.mode = options.mode ?? options.defaultMode ?? "wysiwyg";
    return { bridge, handle: createHandle(bridge, optsRef), optsRef };
  });
  const [editor, setEditor] = useState<EditorInstance | null>(null);

  /* ── structural key: recomputed only when some prop changed by reference ── */
  const memo = useRef<{ input: Record<string, unknown>; sig: Signature } | null>(null);
  let sig: Signature;
  if (memo.current && shallowEqual(memo.current.input, options as Record<string, unknown>)) sig = memo.current.sig;
  else memo.current = { input: options as Record<string, unknown>, sig: (sig = signature(options as Record<string, unknown>, SKIP)) };

  /* ── latest props, committed before any other effect of this component runs ── */
  const latest = useRef(options);
  const table = useRef<FnTable>(new Map());
  useIsoLayoutEffect(() => {
    latest.current = options;
    table.current.clear();
    sig.fns.forEach((v, k) => table.current.set(k, v));
  });

  const carry = useRef<Carry | null>(null);
  /** Values this component emitted that the parent has not echoed back yet (see the value effect). */
  const emitted = useRef<string[]>([]);
  const syncing = useRef(false);
  const applied = useRef<{ ed: EditorInstance | null; readOnly: boolean; disabled: boolean; theme: string }>({
    ed: null,
    readOnly: false,
    disabled: false,
    theme: "",
  });
  const themeKey = (t: unknown) => (t === undefined ? "" : typeof t === "string" ? t : JSON.stringify(t));

  /* ── create / recreate ── */
  useIsoLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const o = latest.current;
    const c = carry.current;
    const cfg = materialize(o as Record<string, unknown>, table.current, SKIP) as EditorOptions;
    const opts: EditorOptions = {
      ...cfg,
      value: o.value !== undefined ? o.value : (c?.value ?? o.defaultValue ?? ""),
      mode: o.mode ?? c?.mode ?? o.defaultMode,
      readOnly: o.readOnly,
      disabled: o.disabled,
      theme: o.theme,
      minHeight: o.minHeight,
      maxHeight: o.maxHeight,
      autofocus: cfg.autofocus || !!c?.focused,
      onChange: (markdown) => {
        const q = emitted.current;
        q.push(markdown);
        if (q.length > 64) q.shift();
        latest.current.onChange?.(markdown, handle);
      },
      onModeChange: (m) => {
        if (!syncing.current) latest.current.onModeChange?.(m);
      },
      onFocus: () => latest.current.onFocus?.(),
      onBlur: () => latest.current.onBlur?.(),
      onMentionsChange: (l) => latest.current.onMentionsChange?.(l),
      onUpload: (e) => latest.current.onUpload?.(e),
      // Core calls this after dispatching the cancelable `atm:submit` event (Mod-Enter in bottom-bar, exec("submit")).
      onSubmit: (md) => latest.current.onSubmit?.(md, handle),
    };
    const ed = createEditor(host, opts);
    optsRef.current = opts;
    emitted.current = [];
    bridge.attach(ed);
    applied.current = { ed, readOnly: !!o.readOnly, disabled: !!o.disabled, theme: themeKey(o.theme) };

    const aria = () => applyAria(ed.element, latest.current["aria-labelledby"], latest.current["aria-describedby"]);
    aria();
    // The Markdown pane is created lazily: label each pane when it is mounted (and again on focus, for cores without the event).
    const offs = [ed.on("pane", aria), ed.on("mode", aria), ed.on("focus", aria)];

    setEditor(ed);
    latest.current.onReady?.(handle);

    return () => {
      offs.forEach((off) => off());
      let focused = false;
      try {
        focused = ed.element.contains(ed.element.ownerDocument.activeElement);
      } catch {
        /* detached */
      }
      bridge.detach(); // reads the value and mode before the editor is destroyed
      carry.current = { value: bridge.value, mode: bridge.mode, focused };
      ed.destroy();
    };
    // Only a structural change recreates the editor: that is the whole point of the signature.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig.key]);

  /* ── value: the prop wins over the editor only when it really differs ── */
  useEffect(() => {
    const ed = bridge.editor;
    const v = options.value;
    if (!ed || v === undefined) return;
    if (v === ed.getValue()) {
      emitted.current.length = 0;
      return;
    }
    // The parent echoing a value we emitted a moment ago (it updates asynchronously) is not an
    // instruction: applying it would throw away what the user has typed since.
    const i = emitted.current.lastIndexOf(v);
    if (i >= 0) {
      emitted.current.splice(0, i + 1);
      return;
    }
    emitted.current.length = 0;
    ed.setValue(v, { keepHistory: true });
    bridge.value = v;
    bridge.touch();
  }, [options.value, editor, bridge]);

  /* ── mode ── */
  useEffect(() => {
    const ed = bridge.editor;
    const m = options.mode;
    if (!ed || m === undefined || ed.getMode() === m) return;
    syncing.current = true;
    try {
      ed.setMode(m);
    } finally {
      syncing.current = false;
    }
  }, [options.mode, editor, bridge]);

  /* ── readOnly, disabled, theme, heights ── */
  const tKey = themeKey(options.theme);
  useEffect(() => {
    const ed = bridge.editor;
    if (!ed) return;
    const a = applied.current;
    const ro = !!options.readOnly;
    const dis = !!options.disabled;
    if (a.disabled !== dis) applyDisabled(ed, optsRef.current, dis);
    if (a.readOnly !== ro || a.disabled !== dis) ed.setReadOnly(ro);
    if (a.theme !== tKey && options.theme !== undefined) ed.setTheme(options.theme);
    applied.current = { ed, readOnly: ro, disabled: dis, theme: tKey };
  }, [options.readOnly, options.disabled, tKey, editor, bridge, optsRef, options.theme]);

  useEffect(() => {
    if (editor) applyHeights(editor.element, options.minHeight, options.maxHeight);
  }, [editor, options.minHeight, options.maxHeight]);

  useEffect(() => {
    if (editor) applyAria(editor.element, options["aria-labelledby"], options["aria-describedby"]);
  }, [editor, options["aria-labelledby"], options["aria-describedby"]]);

  const prefix = options.classPrefix ?? "atm";
  const actionsEl = useMemo(
    () => (editor ? editor.element.querySelector<HTMLElement>("." + prefix + "-actions") : null),
    [editor, prefix],
  );

  return { hostRef, handle, bridge, editor, actionsEl };
}
