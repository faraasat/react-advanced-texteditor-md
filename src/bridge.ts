import type { Doc, EditorInstance, EditorMode, EditorOptions } from "advanced-texteditor-md";

type Listener = (payload: never) => void;
/** Always followed, so `getValue()` and `getMode()` stay right between editors. Any other event (the core's, or a plugin's) is followed once somebody listens. */
const TRACKED = ["change", "mode"];

/**
 * Holds the editor the component currently has and outlives it: the editor is recreated when a
 * structural option changes, the bridge (and the handle built on it) is not. That is what makes
 * the `ref` object stable and keeps `on()` subscriptions alive across a recreation.
 */
export class EditorBridge {
  editor: EditorInstance | null = null;
  /** The last markdown seen, so `getValue()` is meaningful before mount and after unmount. */
  value = "";
  mode: EditorMode = "wysiwyg";
  private listeners = new Map<string, Set<Listener>>();
  private forwarders = new Map<string, () => void>();
  private subs = new Set<() => void>();
  private pending: { markdown: string; opts?: { keepHistory?: boolean } } | null = null;

  /** `useSyncExternalStore` subscription: called when the editor is attached or detached. */
  subscribe = (fn: () => void): (() => void) => {
    this.subs.add(fn);
    return () => void this.subs.delete(fn);
  };
  getEditor = (): EditorInstance | null => this.editor;
  /** Tell subscribers the content changed without an event (a programmatic `setValue`). */
  touch(): void {
    this.subs.forEach((f) => f());
  }

  attach(ed: EditorInstance): void {
    this.detach(false);
    this.editor = ed;
    this.value = ed.getValue();
    this.mode = ed.getMode();
    for (const type of new Set([...TRACKED, ...this.listeners.keys()])) this.follow(type);
    if (this.pending) {
      const { markdown, opts } = this.pending;
      this.pending = null;
      ed.setValue(markdown, opts);
      this.value = markdown;
    }
    this.subs.forEach((f) => f());
  }

  /** Forget the editor. `notify` is false while attaching a replacement so subscribers see one change. */
  detach(notify = true): void {
    if (this.editor) {
      try {
        this.value = this.editor.getValue();
        this.mode = this.editor.getMode();
      } catch {
        /* already destroyed */
      }
    }
    this.forwarders.forEach((off) => off());
    this.forwarders.clear();
    this.editor = null;
    if (notify) this.subs.forEach((f) => f());
  }

  /** Subscribe to `type` on the current editor (once) and fan it out to this bridge's listeners. */
  private follow(type: string): void {
    const ed = this.editor;
    if (!ed || this.forwarders.has(type)) return;
    this.forwarders.set(
      type,
      ed.on(type, (payload: unknown) => {
        if (type === "change") this.value = payload as string;
        else if (type === "mode") this.mode = payload as EditorMode;
        this.listeners.get(type)?.forEach((fn) => (fn as (p: unknown) => void)(payload));
      }),
    );
  }

  on(type: string, fn: Listener): () => void {
    let set = this.listeners.get(type);
    if (!set) this.listeners.set(type, (set = new Set()));
    set.add(fn);
    this.follow(type);
    return () => void set!.delete(fn);
  }

  /** Remember a `setValue` made before the editor exists; it is applied on attach. */
  queueValue(markdown: string, opts?: { keepHistory?: boolean }): void {
    this.value = markdown;
    this.pending = { markdown, opts };
  }
}

const EMPTY_DOC: Doc = { type: "doc", children: [] };

/**
 * An `EditorInstance` that is the same object for the life of the component and forwards to
 * whichever editor is current. Safe to call before mount and after unmount (reads return the last
 * known value, writes are ignored).
 */
export function createHandle(bridge: EditorBridge, optionsRef: { current: EditorOptions }): EditorInstance {
  const ed = () => bridge.editor;
  const handle: EditorInstance = {
    get element() {
      return (ed()?.element ?? null) as unknown as HTMLElement;
    },
    get options() {
      return ed()?.options ?? optionsRef.current;
    },
    getValue: () => ed()?.getValue() ?? bridge.value,
    setValue(markdown, opts) {
      const e = ed();
      if (e) {
        e.setValue(markdown, opts);
        bridge.value = markdown;
        bridge.touch();
      } else bridge.queueValue(markdown, opts);
    },
    getHtml: () => ed()?.getHtml() ?? "",
    getText: () => ed()?.getText() ?? "",
    getAst: () => ed()?.getAst() ?? EMPTY_DOC,
    getMentions: () => ed()?.getMentions() ?? [],
    isEmpty: () => ed()?.isEmpty() ?? bridge.value.trim() === "",
    getStats: () => ed()?.getStats() ?? { words: 0, characters: 0 },
    getMode: () => ed()?.getMode() ?? bridge.mode,
    setMode: (m) => ed()?.setMode(m),
    setReadOnly: (v) => ed()?.setReadOnly(v),
    setTheme: (t) => ed()?.setTheme(t),
    focus: () => ed()?.focus(),
    blur: () => ed()?.blur(),
    insertMarkdown: (m) => ed()?.insertMarkdown(m),
    insertText: (t) => ed()?.insertText(t),
    insertChip: (c) => ed()?.insertChip(c),
    getSelectionText: () => ed()?.getSelectionText() ?? "",
    getSelectionMarkdown: () => ed()?.getSelectionMarkdown() ?? "",
    replaceSelectionMarkdown: (m) => ed()?.replaceSelectionMarkdown(m),
    transact: (fn) => {
      const e = ed();
      return e ? e.transact(fn) : fn();
    },
    getPane: () => ed()?.getPane() ?? null,
    isReadOnly: () => ed()?.isReadOnly() ?? !!optionsRef.current.readOnly,
    emit: (type, payload) => ed()?.emit(type, payload),
    exec: (c, a) => ed()?.exec(c, a) ?? false,
    registerCommand: (id, cmd) => {
      // A command registered on one editor would be lost when it is recreated: keep it registered on whichever is current.
      let off = ed()?.registerCommand(id, cmd);
      const unsub = bridge.subscribe(() => {
        off?.();
        off = ed()?.registerCommand(id, cmd);
      });
      return () => {
        unsub();
        off?.();
      };
    },
    can: (c) => ed()?.can(c) ?? false,
    undo: () => ed()?.undo() ?? false,
    redo: () => ed()?.redo() ?? false,
    uploadFiles: (files) => ed()?.uploadFiles(files) ?? Promise.resolve(),
    on: ((type: string, fn: Listener) => bridge.on(type, fn)) as EditorInstance["on"],
    destroy: () => ed()?.destroy(),
  };
  bridges.set(handle, bridge);
  return handle;
}

/** The bridge behind a handle, so hooks can also listen for the editor being replaced. */
export const bridges = new WeakMap<EditorInstance, EditorBridge>();
