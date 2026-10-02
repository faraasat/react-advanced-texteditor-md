import { useCallback, useRef } from "react";
import type { RefObject } from "react";
import type { EditorEvents, EditorInstance, EditorMode } from "advanced-texteditor-md";
import { bridges } from "./bridge";
import { useEngine } from "./engine";
import { useStore } from "./isomorphic";
import type { UseMarkdownEditorOptions } from "./types";

const ALL_EVENTS: (keyof EditorEvents | (string & {}))[] = ["change", "mode", "selection", "mentions", "focus", "blur", "pane"];
const noop = () => undefined;

export type UseEditorStateOptions<T> = {
  /** Return true when two selections are the same, so an equal result does not re-render. Default `Object.is`. */
  isEqual?: (a: T, b: T) => boolean;
  /** Which core events trigger a re-read. Default: all of them. */
  events?: (keyof EditorEvents | (string & {}))[];
};

/**
 * Subscribe a component to a derived piece of editor state: word count, current mode, the
 * mentioned people. Built on `useSyncExternalStore`: the component re-renders only when the
 * selected value changes (by `isEqual`), never for the keystrokes it does not care about.
 *
 *   const words = useEditorState(editor, (e) => e.getStats().words);
 *
 * Returns `undefined` until there is an editor (and on the server). Pass the `editor` the hook
 * returns or a `ref` value: both keep working when the editor is recreated.
 */
export function useEditorState<T>(editor: EditorInstance | null | undefined, selector: (editor: EditorInstance) => T, options?: UseEditorStateOptions<T>): T | undefined;
export function useEditorState<T>(editor: EditorInstance | null | undefined, selector: (editor: EditorInstance) => T, options: UseEditorStateOptions<T> & { fallback: T }): T;
export function useEditorState<T>(
  editor: EditorInstance | null | undefined,
  selector: (editor: EditorInstance) => T,
  options: UseEditorStateOptions<T> & { fallback?: T } = {},
): T | undefined {
  const selRef = useRef(selector);
  selRef.current = selector;
  const eq = useRef(options.isEqual);
  eq.current = options.isEqual;
  const cache = useRef<{ has: boolean; value?: T }>({ has: false });
  const events = options.events ?? ALL_EVENTS;
  const eventsKey = events.join();

  const subscribe = useCallback(
    (notify: () => void) => {
      if (!editor) return noop;
      const offs = eventsKey.split(",").map((t) => editor.on(t, notify as () => void));
      const bridge = bridges.get(editor);
      if (bridge) offs.push(bridge.subscribe(notify)); // the editor was recreated, or setValue ran
      return () => offs.forEach((off) => off());
    },
    [editor, eventsKey],
  );
  // The fallback is held in a ref: an inline `{ ... }` would be a new snapshot on every call.
  const fb = useRef(options.fallback);
  const getSnapshot = (): T | undefined => {
    if (!editor) return fb.current;
    const next = selRef.current(editor);
    const c = cache.current;
    if (c.has && (eq.current ? eq.current(c.value as T, next) : Object.is(c.value, next))) return c.value;
    c.has = true;
    c.value = next;
    return next;
  };
  return useStore(subscribe, getSnapshot, () => fb.current);
}

/** The current Markdown, kept in step with the editor. Re-renders on every change: prefer `useEditorState` with a selector for anything finer. */
export function useEditorValue(editor: EditorInstance | null | undefined, fallback = ""): string {
  return useEditorState(editor, (e) => e.getValue(), { events: ["change"], fallback });
}

export type UseMarkdownEditorResult = {
  /** Attach to the element the editor should be mounted into: `<div ref={ref} />`. */
  ref: RefObject<HTMLDivElement | null>;
  /** The stable `EditorInstance` (forwards to the current editor), or null until mount. */
  editor: EditorInstance | null;
  /** The current Markdown. */
  value: string;
  setValue: (markdown: string, opts?: { keepHistory?: boolean }) => void;
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  /** True once the editor exists. */
  ready: boolean;
  stats: { words: number; characters: number };
  isEmpty: boolean;
  /** The `actions` slot element of the `bottom-bar` layout, to portal your own buttons into. */
  actionsElement: HTMLElement | null;
};

const ZERO = { words: 0, characters: 0 };
const sameStats = (a: { words: number; characters: number }, b: { words: number; characters: number }) =>
  a.words === b.words && a.characters === b.characters;

/**
 * Headless: the editor mounts into the element you give `ref`, and you draw everything around it.
 *
 *   const { ref, value, editor } = useMarkdownEditor({ defaultValue: "# Hi", layout: "bottom-bar" });
 *   return <><div ref={ref} /><p>{value.length} characters</p></>;
 *
 * Accepts every `<MarkdownEditor />` option (callbacks included). Unlike the component this hook
 * renders no static fallback, so a server render shows an empty host. `value`, `mode` and `stats`
 * re-render the calling component when they change; read what you need with `useEditorState` in a
 * child component to keep the re-renders small.
 */
export function useMarkdownEditor(options: UseMarkdownEditorOptions = {}): UseMarkdownEditorResult {
  const engine = useEngine(options);
  const { handle } = engine;
  const ready = engine.editor !== null;
  const target = ready ? handle : null;
  const value = useEditorValue(target, options.value ?? options.defaultValue ?? "");
  const mode = useEditorState(target, (e) => e.getMode(), { events: ["mode"], fallback: options.mode ?? options.defaultMode ?? "wysiwyg" });
  const stats = useEditorState(target, (e) => e.getStats(), { events: ["change"], fallback: ZERO, isEqual: sameStats });
  const isEmpty = useEditorState(target, (e) => e.isEmpty(), { events: ["change"], fallback: true });
  const setValue = useCallback((markdown: string, opts?: { keepHistory?: boolean }) => handle.setValue(markdown, opts), [handle]);
  const setMode = useCallback((m: EditorMode) => handle.setMode(m), [handle]);
  return { ref: engine.hostRef, editor: target, value, setValue, mode, setMode, ready, stats, isEmpty, actionsElement: engine.actionsEl };
}
