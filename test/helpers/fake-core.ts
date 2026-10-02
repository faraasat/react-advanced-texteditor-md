import { vi } from "vitest";
import type { Doc, EditorInstance, EditorMode, EditorOptions } from "advanced-texteditor-md";

/**
 * A stand-in for the core's createEditor: records what the React layer does to it, with none of the
 * contenteditable machinery. The real core is exercised in integration.test.tsx and in Playwright.
 */
export class FakeEditor implements EditorInstance {
  element: HTMLElement;
  options: EditorOptions;
  value: string;
  mode: EditorMode;
  readOnly: boolean;
  destroyed = false;
  listeners = new Map<string, Set<(p: never) => void>>();
  setValueSpy = vi.fn();
  setModeSpy = vi.fn();
  setReadOnlySpy = vi.fn();
  setThemeSpy = vi.fn();
  focused = false;
  actions: HTMLElement | null = null;

  constructor(public target: HTMLElement, options: EditorOptions) {
    this.options = options;
    this.value = options.value ?? "";
    this.mode = options.mode ?? "wysiwyg";
    this.readOnly = !!options.readOnly;
    this.element = target.ownerDocument.createElement("div");
    this.element.className = "atm-root";
    const surface = target.ownerDocument.createElement("div");
    surface.setAttribute("role", "textbox");
    this.element.appendChild(surface);
    if (options.layout === "bottom-bar") {
      this.actions = target.ownerDocument.createElement("div");
      this.actions.className = `${options.classPrefix ?? "atm"}-actions`;
      this.element.appendChild(this.actions);
    }
    if (options.name) {
      const h = target.ownerDocument.createElement("input");
      h.type = "hidden";
      h.name = options.name;
      h.value = this.value;
      this.element.appendChild(h);
    }
    target.appendChild(this.element);
  }
  /** What the user typing does: fires onChange and the change event, like the core. */
  type(markdown: string) {
    this.value = markdown;
    this.options.onChange?.(markdown, this);
    this.emit("change", markdown);
  }
  emit(type: string, payload?: unknown) {
    this.listeners.get(type)?.forEach((f) => (f as (p: unknown) => void)(payload));
  }
  transact = <T>(fn: () => T): T => fn();
  getPane = () => null;
  isReadOnly = () => this.readOnly;
  getSelectionMarkdown = () => "";
  replaceSelectionMarkdown = vi.fn();
  getValue = () => this.value;
  setValue(markdown: string, opts?: { keepHistory?: boolean }) {
    this.setValueSpy(markdown, opts);
    this.value = markdown;
  }
  getHtml = () => "";
  getText = () => this.value;
  getAst = (): Doc => ({ type: "doc", children: [] });
  getMentions = () => [];
  isEmpty = () => this.value.trim() === "";
  getStats = () => ({ words: this.value.trim() ? this.value.trim().split(/\s+/).length : 0, characters: this.value.length });
  getMode = () => this.mode;
  setMode(m: EditorMode) {
    this.setModeSpy(m);
    this.mode = m;
    this.emit("mode", m);
    this.options.onModeChange?.(m);
  }
  setReadOnly(v: boolean) {
    this.setReadOnlySpy(v);
    this.readOnly = !!v || !!this.options.disabled;
  }
  setTheme(t: NonNullable<EditorOptions["theme"]>) {
    this.setThemeSpy(t);
  }
  focus() {
    this.focused = true;
  }
  blur() {
    this.focused = false;
  }
  insertMarkdown = vi.fn();
  insertText = vi.fn();
  insertChip = vi.fn();
  getSelectionText = () => "";
  exec = vi.fn(() => true);
  registerCommand = vi.fn(() => () => undefined);
  can = () => true;
  undo = () => true;
  redo = () => true;
  uploadFiles = vi.fn(async () => undefined);
  on(type: string, fn: (p: never) => void): () => void {
    let s = this.listeners.get(type);
    if (!s) this.listeners.set(type, (s = new Set()));
    s.add(fn as (p: never) => void);
    return () => void s!.delete(fn as (p: never) => void);
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.element.remove();
    this.listeners.clear();
  }
}

export const editors: FakeEditor[] = [];
export const live = () => editors.filter((e) => !e.destroyed);

export function fakeCreateEditor(target: HTMLElement, options: EditorOptions = {}): EditorInstance {
  const ed = new FakeEditor(target, options);
  editors.push(ed);
  return ed;
}

export const resetEditors = () => void (editors.length = 0);
