import { StrictMode, createRef, useLayoutEffect, useRef, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EditorInstance, EditorMode } from "advanced-texteditor-md";
import { MarkdownEditor } from "../src";
import { editors, live, resetEditors, type FakeEditor } from "./helpers/fake-core";

vi.mock("advanced-texteditor-md", async (importOriginal) => {
  const actual = await importOriginal<typeof import("advanced-texteditor-md")>();
  const { fakeCreateEditor } = await import("./helpers/fake-core");
  return { ...actual, createEditor: vi.fn(fakeCreateEditor) };
});

beforeEach(() => resetEditors());
const current = () => live()[0] as FakeEditor;

describe("mounting", () => {
  it("creates one editor in the host and destroys it on unmount", () => {
    const { container, unmount } = render(<MarkdownEditor defaultValue="# Hi" />);
    expect(editors).toHaveLength(1);
    expect(container.querySelector(".atm-root")).not.toBeNull();
    unmount();
    expect(live()).toHaveLength(0);
    expect(document.querySelector(".atm-root")).toBeNull();
  });

  it("is StrictMode safe: the double invoke leaves exactly one live editor and no stray DOM", () => {
    const { container, unmount } = render(
      <StrictMode>
        <MarkdownEditor defaultValue="x" />
      </StrictMode>,
    );
    expect(editors.length).toBeGreaterThanOrEqual(2);
    expect(live()).toHaveLength(1);
    expect(container.querySelectorAll(".atm-root")).toHaveLength(1);
    unmount();
    expect(live()).toHaveLength(0);
    expect(document.querySelectorAll(".atm-root")).toHaveLength(0);
  });

  it("does not leak across many mount/unmount cycles", () => {
    for (let i = 0; i < 25; i++) render(<MarkdownEditor defaultValue={String(i)} />).unmount();
    expect(live()).toHaveLength(0);
    expect(document.querySelectorAll(".atm-root, [data-atm-react]")).toHaveLength(0);
  });

  it("passes the core options through and keeps callbacks out of the structural key", () => {
    render(<MarkdownEditor defaultValue="a" placeholder="Write" maxLength={10} layout="minimal" />);
    expect(current().options).toMatchObject({ value: "a", placeholder: "Write", maxLength: 10, layout: "minimal" });
  });

  it("wraps with className, style and id; aria-label becomes the editor label", () => {
    const { container } = render(<MarkdownEditor id="e1" className="mine" style={{ margin: 3 }} aria-label="Reply" />);
    const w = container.firstElementChild as HTMLElement;
    expect(w.id).toBe("e1");
    expect(w.classList.contains("mine")).toBe(true);
    expect(w.style.margin).toBe("3px");
    expect(current().options.labels?.editor).toBe("Reply");
  });

  it("applies aria-labelledby and aria-describedby to the editable surface", () => {
    render(<MarkdownEditor aria-labelledby="lbl" aria-describedby="hint" />);
    const surface = current().element.querySelector('[role="textbox"]')!;
    expect(surface.getAttribute("aria-labelledby")).toBe("lbl");
    expect(surface.getAttribute("aria-describedby")).toBe("hint");
  });
});

describe("controlled and uncontrolled", () => {
  it("uncontrolled: starts from defaultValue and ignores later defaultValue changes", () => {
    const { rerender } = render(<MarkdownEditor defaultValue="one" />);
    rerender(<MarkdownEditor defaultValue="two" />);
    expect(current().value).toBe("one");
    expect(current().setValueSpy).not.toHaveBeenCalled();
  });

  it("controlled: creates from value, and a changed prop calls setValue once with keepHistory", () => {
    const { rerender } = render(<MarkdownEditor value="one" onChange={() => {}} />);
    expect(current().options.value).toBe("one");
    rerender(<MarkdownEditor value="two" onChange={() => {}} />);
    expect(current().setValueSpy).toHaveBeenCalledTimes(1);
    expect(current().setValueSpy).toHaveBeenCalledWith("two", { keepHistory: true });
  });

  it("does not call setValue when the prop equals the editor's current value (no caret jump)", () => {
    function Controlled() {
      const [v, setV] = useState("start");
      return <MarkdownEditor value={v} onChange={setV} />;
    }
    render(<Controlled />);
    const ed = current();
    act(() => ed.type("start a"));
    act(() => ed.type("start ab"));
    act(() => ed.type("start abc"));
    expect(ed.setValueSpy).not.toHaveBeenCalled();
    expect(ed.value).toBe("start abc");
  });

  it("never feeds an onChange back in a loop", () => {
    const onChange = vi.fn();
    function Controlled() {
      const [v, setV] = useState("");
      return (
        <MarkdownEditor
          value={v}
          onChange={(m) => {
            onChange(m);
            setV(m);
          }}
        />
      );
    }
    render(<Controlled />);
    act(() => current().type("hello"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(current().setValueSpy).not.toHaveBeenCalled();
  });

  it("ignores a stale echo from a parent that updates late (does not clobber what was typed since)", () => {
    const { rerender } = render(<MarkdownEditor value="" onChange={() => {}} />);
    const ed = current();
    act(() => ed.type("a"));
    act(() => ed.type("ab"));
    rerender(<MarkdownEditor value="a" onChange={() => {}} />); // the parent only now applies the first change
    expect(ed.setValueSpy).not.toHaveBeenCalled();
    expect(ed.value).toBe("ab");
    rerender(<MarkdownEditor value="ab" onChange={() => {}} />);
    expect(ed.setValueSpy).not.toHaveBeenCalled();
    rerender(<MarkdownEditor value="reset" onChange={() => {}} />); // a real external change still applies
    expect(ed.setValueSpy).toHaveBeenCalledWith("reset", { keepHistory: true });
  });

  it("onChange gets the markdown and the stable handle", () => {
    const onChange = vi.fn();
    const ref = createRef<EditorInstance>();
    render(<MarkdownEditor ref={ref} defaultValue="" onChange={onChange} />);
    act(() => current().type("hi"));
    expect(onChange).toHaveBeenCalledWith("hi", ref.current);
  });
});

describe("callbacks and structural options", () => {
  it("changing callback identity on every render never recreates the editor", () => {
    const { rerender } = render(<MarkdownEditor defaultValue="x" onChange={() => 1} onFocus={() => 1} onModeChange={() => 1} />);
    for (let i = 0; i < 5; i++) rerender(<MarkdownEditor defaultValue="x" onChange={() => i} onFocus={() => i} onModeChange={() => i} />);
    expect(editors).toHaveLength(1);
  });

  it("calls the LATEST onChange", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<MarkdownEditor onChange={first} />);
    rerender(<MarkdownEditor onChange={second} />);
    act(() => current().type("x"));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("x", expect.anything());
  });

  it("recreates exactly once when a structural option changes, carrying value and mode over", () => {
    const { rerender } = render(<MarkdownEditor defaultValue="a" layout="classic" />);
    act(() => current().type("typed"));
    act(() => current().setMode("markdown"));
    rerender(<MarkdownEditor defaultValue="a" layout="minimal" />);
    expect(editors).toHaveLength(2);
    expect(live()).toHaveLength(1);
    expect(current().options.layout).toBe("minimal");
    expect(current().options.value).toBe("typed");
    expect(current().options.mode).toBe("markdown");
  });

  it("inline objects and arrays with the same content do not recreate (compared by value)", () => {
    const view = () => (
      <MarkdownEditor
        defaultValue="x"
        toolbar={{ items: ["bold", "|", "italic"] }}
        classNames={{ root: "a" }}
        plugins={[{ name: "p", setup: () => undefined }]}
        mentions={{ search: () => [] }}
        features={{ headings: [1, 2] }}
      />
    );
    const { rerender } = render(view());
    rerender(view());
    rerender(view());
    expect(editors).toHaveLength(1);
  });

  it("a changed plugin name or array content recreates", () => {
    const { rerender } = render(<MarkdownEditor plugins={[{ name: "a" }]} />);
    rerender(<MarkdownEditor plugins={[{ name: "b" }]} />);
    expect(editors).toHaveLength(2);
    rerender(<MarkdownEditor plugins={[{ name: "b" }]} features={{ headings: [1] }} />);
    expect(editors).toHaveLength(3);
  });

  it("functions nested in options always call the latest closure", async () => {
    let seen = "";
    const { rerender } = render(<MarkdownEditor mentions={{ search: () => ((seen = "old"), []) }} />);
    rerender(<MarkdownEditor mentions={{ search: () => ((seen = "new"), []) }} />);
    expect(editors).toHaveLength(1);
    const search = (current().options.mentions as { search: (q: string) => unknown }).search;
    search("a");
    expect(seen).toBe("new");
  });

  it("keeps the focus across a recreation", () => {
    const { rerender } = render(<MarkdownEditor layout="classic" />);
    current().element.ownerDocument.body.tabIndex = 0;
    const input = document.createElement("input");
    current().element.appendChild(input);
    input.focus();
    rerender(<MarkdownEditor layout="minimal" />);
    expect(current().options.autofocus).toBe(true);
  });
});

describe("live options (no recreation)", () => {
  it("readOnly, theme and mode update the same editor", () => {
    const { rerender } = render(<MarkdownEditor readOnly={false} theme="light" mode="wysiwyg" onModeChange={() => {}} />);
    const ed = current();
    rerender(<MarkdownEditor readOnly theme="dark" mode="markdown" onModeChange={() => {}} />);
    expect(editors).toHaveLength(1);
    expect(ed.setReadOnlySpy).toHaveBeenCalledWith(true);
    expect(ed.setThemeSpy).toHaveBeenCalledWith("dark");
    expect(ed.setModeSpy).toHaveBeenCalledWith("markdown");
  });

  it("a theme tokens object compares by value", () => {
    const { rerender } = render(<MarkdownEditor theme={{ accent: "#f00" }} />);
    const ed = current();
    rerender(<MarkdownEditor theme={{ accent: "#f00" }} />);
    expect(ed.setThemeSpy).not.toHaveBeenCalled();
    rerender(<MarkdownEditor theme={{ accent: "#0f0" }} />);
    expect(ed.setThemeSpy).toHaveBeenCalledTimes(1);
  });

  it("disabled toggles aria-disabled and the form input without recreating", () => {
    const { rerender } = render(<MarkdownEditor name="body" />);
    const ed = current();
    rerender(<MarkdownEditor name="body" disabled />);
    expect(editors).toHaveLength(1);
    expect(ed.element.getAttribute("aria-disabled")).toBe("true");
    expect((ed.element.querySelector("input[type=hidden]") as HTMLInputElement).disabled).toBe(true);
    expect(ed.readOnly).toBe(true);
    rerender(<MarkdownEditor name="body" />);
    expect(ed.element.hasAttribute("aria-disabled")).toBe(false);
  });

  it("minHeight and maxHeight are applied as the core's CSS variables", () => {
    const { rerender } = render(<MarkdownEditor minHeight={120} />);
    expect(current().element.style.getPropertyValue("--atm-min-height")).toBe("120px");
    rerender(<MarkdownEditor minHeight="10rem" maxHeight={300} />);
    expect(current().element.style.getPropertyValue("--atm-min-height")).toBe("10rem");
    expect(current().element.style.getPropertyValue("--atm-max-height")).toBe("300px");
    expect(editors).toHaveLength(1);
  });

  it("controlled mode: no onModeChange echo for a prop-driven change, but one for the user's", () => {
    const onModeChange = vi.fn();
    const { rerender } = render(<MarkdownEditor mode="wysiwyg" onModeChange={onModeChange} />);
    rerender(<MarkdownEditor mode="split" onModeChange={onModeChange} />);
    expect(onModeChange).not.toHaveBeenCalled();
    act(() => current().setMode("markdown" as EditorMode));
    expect(onModeChange).toHaveBeenCalledWith("markdown");
  });
});

describe("ref", () => {
  it("exposes the full EditorInstance API through one stable object", () => {
    const ref = createRef<EditorInstance>();
    const { rerender } = render(<MarkdownEditor ref={ref} defaultValue="# T" layout="classic" />);
    const first = ref.current!;
    for (const m of ["getValue", "setValue", "getHtml", "getText", "getAst", "getMentions", "isEmpty", "getStats", "getMode", "setMode", "setReadOnly", "setTheme", "focus", "blur", "insertMarkdown", "insertText", "insertChip", "getSelectionText", "exec", "registerCommand", "can", "undo", "redo", "uploadFiles", "on", "destroy"]) {
      expect(typeof (first as unknown as Record<string, unknown>)[m]).toBe("function");
    }
    expect(first.getValue()).toBe("# T");
    expect(first.element).toBe(current().element);
    rerender(<MarkdownEditor ref={ref} defaultValue="# T" layout="minimal" />);
    expect(ref.current).toBe(first); // same object across a recreation
    expect(first.element).toBe(current().element); // forwarding to the new editor
  });

  it("on() subscriptions survive a recreation", () => {
    const ref = createRef<EditorInstance>();
    const { rerender } = render(<MarkdownEditor ref={ref} layout="classic" />);
    const fn = vi.fn();
    const off = ref.current!.on("change", fn);
    act(() => current().type("one"));
    rerender(<MarkdownEditor ref={ref} layout="minimal" />);
    act(() => current().type("two"));
    expect(fn.mock.calls.map((c) => c[0])).toEqual(["one", "two"]);
    off();
    act(() => current().type("three"));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("is safe to call before mount completes and after unmount", () => {
    const ref = createRef<EditorInstance>();
    const { unmount } = render(<MarkdownEditor ref={ref} defaultValue="kept" />);
    const h = ref.current!;
    unmount();
    expect(h.getValue()).toBe("kept");
    expect(() => {
      h.focus();
      h.setMode("markdown");
      h.insertText("x");
    }).not.toThrow();
  });

  it("onReady fires with the handle", () => {
    const onReady = vi.fn();
    const ref = createRef<EditorInstance>();
    render(<MarkdownEditor ref={ref} onReady={onReady} />);
    expect(onReady).toHaveBeenCalledWith(ref.current);
  });
});

describe("children and actions slot", () => {
  it("portals children into the actions slot of the bottom-bar layout", () => {
    render(
      <MarkdownEditor layout="bottom-bar">
        <button type="button">Send</button>
      </MarkdownEditor>,
    );
    const slot = current().actions!;
    expect(slot.querySelector("button")?.textContent).toBe("Send");
  });

  it("children stay interactive and see fresh props", () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <MarkdownEditor layout="bottom-bar">
        <button onClick={() => onClick("a")}>Send</button>
      </MarkdownEditor>,
    );
    rerender(
      <MarkdownEditor layout="bottom-bar">
        <button onClick={() => onClick("b")}>Send</button>
      </MarkdownEditor>,
    );
    fireEvent.click(screen.getByText("Send"));
    expect(onClick).toHaveBeenCalledWith("b");
  });

  it("layouts without an actions slot still render the children, below the editor", () => {
    const { container } = render(
      <MarkdownEditor layout="classic">
        <button>Go</button>
      </MarkdownEditor>,
    );
    expect(container.querySelector(".atm-react-actions button")).not.toBeNull();
  });
});

describe("onSubmit", () => {
  it("is forwarded to the core's own onSubmit option and called with the value and the handle", () => {
    const onSubmit = vi.fn();
    render(<MarkdownEditor layout="bottom-bar" defaultValue="v" onSubmit={onSubmit} />);
    current().options.onSubmit?.("from core", current() as never);
    expect(onSubmit).toHaveBeenCalledWith("from core", expect.anything());
  });
});

describe("form", () => {
  it("name reaches the core (hidden input) and a form submit reads it", () => {
    const { container } = render(
      <form>
        <MarkdownEditor name="body" defaultValue="hello" />
      </form>,
    );
    const input = container.querySelector("input[type=hidden][name=body]") as HTMLInputElement;
    expect(input.value).toBe("hello");
  });
});

describe("the handle forwards the whole core API, across recreations", () => {
  it("transact, emit, getPane, isReadOnly and the selection helpers reach the current editor", () => {
    const ref = createRef<EditorInstance>();
    render(<MarkdownEditor ref={ref} readOnly />);
    const ed = current();
    const fn = vi.fn(() => 42);
    expect(ref.current!.transact(fn)).toBe(42);
    expect(ref.current!.isReadOnly()).toBe(true);
    expect(ref.current!.getPane()).toBeNull();
    expect(ref.current!.getSelectionMarkdown()).toBe("");
    ref.current!.replaceSelectionMarkdown("x");
    expect(ed.replaceSelectionMarkdown).toHaveBeenCalledWith("x");
  });

  it("transact still runs its callback when there is no editor (before mount / after unmount)", () => {
    const ref = createRef<EditorInstance>();
    const { unmount } = render(<MarkdownEditor ref={ref} />);
    const h = ref.current!;
    unmount();
    expect(h.transact(() => "ran")).toBe("ran");
  });

  it("plugin-defined events subscribed through the handle survive a recreation", () => {
    const ref = createRef<EditorInstance>();
    const { rerender } = render(<MarkdownEditor ref={ref} layout="classic" />);
    const fn = vi.fn();
    const off = ref.current!.on("plugin:demo:ping", fn);
    current().emit("plugin:demo:ping", 1);
    rerender(<MarkdownEditor ref={ref} layout="minimal" />);
    current().emit("plugin:demo:ping", 2);
    expect(fn.mock.calls.map((c) => c[0])).toEqual([1, 2]);
    off();
    current().emit("plugin:demo:ping", 3);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("a command registered through the handle is re-registered on the new editor", () => {
    const ref = createRef<EditorInstance>();
    const { rerender } = render(<MarkdownEditor ref={ref} layout="classic" />);
    const cmd = () => true;
    const off = ref.current!.registerCommand("mine", cmd);
    const first = current();
    expect(first.registerCommand).toHaveBeenCalledWith("mine", cmd);
    rerender(<MarkdownEditor ref={ref} layout="minimal" />);
    expect(current().registerCommand).toHaveBeenCalledWith("mine", cmd);
    off();
  });

  it("a setValue made before the editor exists is applied when it arrives", () => {
    function Early() {
      const ref = useRef<EditorInstance>(null);
      // useImperativeHandle has run by the time effects do: call it from a layout effect of the PARENT, before the child's editor exists.
      useLayoutEffect(() => ref.current?.setValue("queued"), []);
      return <MarkdownEditor ref={ref} defaultValue="initial" />;
    }
    render(<Early />);
    expect(current().value).toBe("queued");
  });

  it("ssr={false} on the client renders no static copy at all", () => {
    const { container } = render(<MarkdownEditor ssr={false} defaultValue="x" />);
    expect(container.querySelector(".atm-react-fallback")).toBeNull();
  });
});
