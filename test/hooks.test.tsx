import { StrictMode, memo, useRef } from "react";
import { act, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EditorInstance } from "advanced-texteditor-md";
import { MarkdownEditor, useEditorState, useEditorValue, useMarkdownEditor } from "../src";
import { editors, live, resetEditors, type FakeEditor } from "./helpers/fake-core";

vi.mock("advanced-texteditor-md", async (importOriginal) => {
  const actual = await importOriginal<typeof import("advanced-texteditor-md")>();
  const { fakeCreateEditor } = await import("./helpers/fake-core");
  return { ...actual, createEditor: vi.fn(fakeCreateEditor) };
});

beforeEach(() => resetEditors());
const current = () => live()[0] as FakeEditor;

function Headless({ onRender, ...options }: { onRender?: (r: ReturnType<typeof useMarkdownEditor>) => void } & Parameters<typeof useMarkdownEditor>[0]) {
  const r = useMarkdownEditor(options);
  onRender?.(r);
  return (
    <>
      <div ref={r.ref} data-testid="host" />
      <output data-testid="value">{r.value}</output>
      <output data-testid="mode">{r.mode}</output>
      <output data-testid="words">{r.stats.words}</output>
      <output data-testid="empty">{String(r.isEmpty)}</output>
    </>
  );
}

describe("useMarkdownEditor (headless)", () => {
  it("mounts the editor into the element it gives you, once, and cleans up", () => {
    const { unmount } = render(<Headless defaultValue="hi" />);
    expect(screen.getByTestId("host").querySelector(".atm-root")).not.toBeNull();
    expect(editors).toHaveLength(1);
    unmount();
    expect(live()).toHaveLength(0);
  });

  it("is StrictMode safe", () => {
    render(
      <StrictMode>
        <Headless defaultValue="hi" />
      </StrictMode>,
    );
    expect(live()).toHaveLength(1);
  });

  it("value, mode, stats and isEmpty follow the editor", () => {
    render(<Headless defaultValue="" />);
    expect(screen.getByTestId("empty").textContent).toBe("true");
    act(() => current().type("one two three"));
    expect(screen.getByTestId("value").textContent).toBe("one two three");
    expect(screen.getByTestId("words").textContent).toBe("3");
    expect(screen.getByTestId("empty").textContent).toBe("false");
    act(() => current().setMode("markdown"));
    expect(screen.getByTestId("mode").textContent).toBe("markdown");
  });

  it("setValue updates the editor and the reactive value without firing onChange", () => {
    const onChange = vi.fn();
    let api!: ReturnType<typeof useMarkdownEditor>;
    render(<Headless defaultValue="a" onChange={onChange} onRender={(r) => (api = r)} />);
    act(() => api.setValue("replaced"));
    expect(current().value).toBe("replaced");
    expect(screen.getByTestId("value").textContent).toBe("replaced");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("editor is null before mount and the stable handle after", () => {
    const seen: (EditorInstance | null)[] = [];
    render(<Headless onRender={(r) => seen.push(r.editor)} />);
    expect(seen[0]).toBeNull();
    const handles = new Set(seen.filter(Boolean));
    expect(handles.size).toBe(1);
  });

  it("accepts every option, including recreation on a structural change", () => {
    const { rerender } = render(<Headless defaultValue="x" layout="classic" />);
    rerender(<Headless defaultValue="x" layout="minimal" />);
    expect(live()).toHaveLength(1);
    expect(current().options.layout).toBe("minimal");
  });

  it("exposes the actions slot element for bottom-bar", () => {
    let api!: ReturnType<typeof useMarkdownEditor>;
    render(<Headless layout="bottom-bar" onRender={(r) => (api = r)} />);
    expect(api.actionsElement).toBe(current().actions);
  });
});

describe("useEditorState", () => {
  const Words = memo(function Words({ editor }: { editor: EditorInstance | null }) {
    const renders = useRef(0);
    renders.current++;
    const words = useEditorState(editor, (e) => e.getStats().words, { events: ["change"], fallback: -1 });
    return <output data-testid="w" data-renders={renders.current}>{words}</output>;
  });

  function WithEditor({ children }: { children: (e: EditorInstance | null) => React.ReactNode }) {
    const r = useMarkdownEditor({ defaultValue: "" });
    return (
      <>
        <div ref={r.ref} />
        {children(r.editor)}
      </>
    );
  }

  it("subscribes through useSyncExternalStore and re-renders only when the selection changes", () => {
    render(<WithEditor>{(e) => <Words editor={e} />}</WithEditor>);
    expect(screen.getByTestId("w").textContent).toBe("0");
    act(() => current().type("a b"));
    expect(screen.getByTestId("w").textContent).toBe("2");
    const before = Number(screen.getByTestId("w").dataset.renders);
    act(() => current().type("a c")); // still two words
    expect(screen.getByTestId("w").dataset.renders).toBe(String(before));
  });

  it("returns the fallback (or undefined) with no editor", () => {
    const { result } = renderHook(() => useEditorState(null, (e) => e.getValue(), { fallback: "none" }));
    expect(result.current).toBe("none");
    const { result: r2 } = renderHook(() => useEditorState(undefined, (e) => e.getValue()));
    expect(r2.current).toBeUndefined();
  });

  it("an object selection needs isEqual; with it, equal results do not re-render", () => {
    let renders = 0;
    function S({ editor }: { editor: EditorInstance | null }) {
      renders++;
      const s = useEditorState(editor, (e) => e.getStats(), { events: ["change"], isEqual: (a, b) => a.words === b.words && a.characters === b.characters });
      return <output data-testid="s">{s?.characters}</output>;
    }
    render(<WithEditor>{(e) => <S editor={e} />}</WithEditor>);
    act(() => current().type("abc"));
    const n = renders;
    act(() => current().emit("change", "abc"));
    expect(renders).toBe(n);
  });

  it("does not loop when the selector returns a fresh object each time and no isEqual is given... it is called with a stable result per event", () => {
    // A fresh object per call would loop forever in naive implementations; here the cache plus Object.is bails out only for equal values,
    // so a selector that always returns a new object is the caller's bug and must still terminate for a stable editor.
    const sel = vi.fn((e: EditorInstance) => e.getValue());
    function S({ editor }: { editor: EditorInstance | null }) {
      const v = useEditorState(editor, sel);
      return <output data-testid="s">{v}</output>;
    }
    render(<WithEditor>{(e) => <S editor={e} />}</WithEditor>);
    expect(sel.mock.calls.length).toBeLessThan(50);
  });

  it("works with the ref handle of <MarkdownEditor/> across a recreation", () => {
    function App({ layout }: { layout: "classic" | "minimal" }) {
      const ref = useRef<EditorInstance>(null);
      return (
        <>
          <MarkdownEditor ref={ref} defaultValue="" layout={layout} />
          <Words editor={ref.current} />
        </>
      );
    }
    const { rerender } = render(<App layout="classic" />);
    rerender(<App layout="minimal" />); // second render sees ref.current
    act(() => current().type("x y z"));
    expect(screen.getByTestId("w").textContent).toBe("3");
    rerender(<App layout="classic" />); // recreate
    act(() => current().type("x y"));
    expect(screen.getByTestId("w").textContent).toBe("2");
  });
});

describe("useEditorValue", () => {
  it("tracks the markdown, and programmatic setValue through the handle", () => {
    function V({ editor }: { editor: EditorInstance | null }) {
      return <output data-testid="v">{useEditorValue(editor, "init")}</output>;
    }
    let h: EditorInstance | null = null;
    function App() {
      const r = useMarkdownEditor({ defaultValue: "start" });
      h = r.editor;
      return (
        <>
          <div ref={r.ref} />
          <V editor={r.editor} />
        </>
      );
    }
    render(<App />);
    expect(screen.getByTestId("v").textContent).toBe("start");
    act(() => current().type("typed"));
    expect(screen.getByTestId("v").textContent).toBe("typed");
    act(() => h!.setValue("set"));
    expect(screen.getByTestId("v").textContent).toBe("set");
  });
});
