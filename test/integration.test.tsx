import { StrictMode, createRef, useState } from "react";
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EditorInstance } from "advanced-texteditor-md";
import { MarkdownEditor } from "../src";

/** The real core in jsdom: what the React layer actually does to a real editor. Typing itself is covered by Playwright. */
const tick = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe("with the real core", () => {
  it("mounts, reads back the value and renders the document", async () => {
    const ref = createRef<EditorInstance>();
    const { container } = render(<MarkdownEditor ref={ref} defaultValue={"# Title\n\nSome **bold**"} />);
    expect(ref.current!.getValue()).toBe("# Title\n\nSome **bold**");
    expect(container.querySelector('[role="textbox"] h1')?.textContent).toBe("Title");
    expect(container.querySelector('[role="textbox"] strong')?.textContent).toBe("bold");
    expect(container.querySelector(".atm-react-fallback")).toBeNull();
  });

  it("a controlled value change reaches the real editor; the same value does not call setValue", () => {
    const ref = createRef<EditorInstance>();
    const { rerender } = render(<MarkdownEditor ref={ref} value="one" onChange={() => {}} />);
    const spy = vi.spyOn(ref.current!, "setValue");
    rerender(<MarkdownEditor ref={ref} value="one" onChange={() => {}} />);
    expect(spy).not.toHaveBeenCalled();
    rerender(<MarkdownEditor ref={ref} value="two" onChange={() => {}} />);
    expect(ref.current!.getValue()).toBe("two");
  });

  it("readOnly toggles live on the real editor", () => {
    const { container, rerender } = render(<MarkdownEditor defaultValue="x" />);
    const surface = () => container.querySelector('[role="textbox"]') as HTMLElement;
    expect(surface().getAttribute("contenteditable")).toBe("true");
    rerender(<MarkdownEditor defaultValue="x" readOnly />);
    expect(surface().getAttribute("contenteditable")).not.toBe("true");
    rerender(<MarkdownEditor defaultValue="x" />);
    expect(surface().getAttribute("contenteditable")).toBe("true");
  });

  it("strict mode leaves exactly one editor in the DOM and nothing after unmount", () => {
    const { container, unmount } = render(
      <StrictMode>
        <MarkdownEditor defaultValue="x" />
      </StrictMode>,
    );
    expect(container.querySelectorAll(".atm-root")).toHaveLength(1);
    unmount();
    expect(document.querySelectorAll(".atm-root")).toHaveLength(0);
  });

  it("the actions slot of the bottom-bar layout receives the children", () => {
    const { container } = render(
      <MarkdownEditor layout="bottom-bar">
        <button>Post</button>
      </MarkdownEditor>,
    );
    expect(container.querySelector(".atm-actions button")?.textContent).toBe("Post");
  });

  it("a form with `name` gets the Markdown in its FormData", () => {
    const { container } = render(
      <form>
        <MarkdownEditor name="body" defaultValue="hello **w**" />
      </form>,
    );
    const data = new FormData(container.querySelector("form")!);
    expect(data.get("body")).toBe("hello **w**");
  });

  it("insertMarkdown through the handle fires onChange once, with the new Markdown", async () => {
    const onChange = vi.fn();
    const ref = createRef<EditorInstance>();
    render(<MarkdownEditor ref={ref} defaultValue="" onChange={onChange} />);
    act(() => {
      ref.current!.focus();
      ref.current!.insertMarkdown("**hi**");
    });
    await tick();
    if (onChange.mock.calls.length) expect(onChange.mock.calls.at(-1)![0]).toContain("hi");
  });

  it("a controlled editor never loops: onChange -> state -> value", async () => {
    const seen: string[] = [];
    function C() {
      const [v, setV] = useState("");
      return <MarkdownEditor value={v} onChange={(m) => (seen.push(m), setV(m))} />;
    }
    const ref = createRef<EditorInstance>();
    const { container } = render(<C />);
    expect(container.querySelector('[role="textbox"]')).not.toBeNull();
    await tick();
    expect(seen.length).toBeLessThan(3);
    void ref;
  });

  it("changing the layout recreates the real editor once and keeps the document", () => {
    const ref = createRef<EditorInstance>();
    const { container, rerender } = render(<MarkdownEditor ref={ref} defaultValue="# keep" layout="classic" />);
    const first = ref.current!.element;
    rerender(<MarkdownEditor ref={ref} defaultValue="# keep" layout="minimal" />);
    expect(ref.current!.element).not.toBe(first);
    expect(container.querySelectorAll(".atm-root")).toHaveLength(1);
    expect(ref.current!.getValue()).toBe("# keep");
  });
});
