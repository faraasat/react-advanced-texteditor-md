import { act, render, screen } from "@testing-library/react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { editors, live, resetEditors, type FakeEditor } from "./helpers/fake-core";

/**
 * React 17 has no useSyncExternalStore. The peer range allows it, so the package carries a small
 * stand-in. Run the hook tests again with the native one removed.
 */
vi.mock("advanced-texteditor-md", async (importOriginal) => {
  const actual = await importOriginal<typeof import("advanced-texteditor-md")>();
  const { fakeCreateEditor } = await import("./helpers/fake-core");
  return { ...actual, createEditor: vi.fn(fakeCreateEditor) };
});
vi.mock("react", async (importOriginal) => ({ ...(await importOriginal<typeof import("react")>()), useSyncExternalStore: undefined }));

beforeEach(() => resetEditors());
afterAll(() => vi.doUnmock("react"));

describe("without React's useSyncExternalStore", () => {
  it("useMarkdownEditor and useEditorState still follow the editor", async () => {
    const React = await import("react");
    expect((React as Record<string, unknown>).useSyncExternalStore).toBeUndefined();
    const { useMarkdownEditor, useEditorState } = await import("../src");
    function App() {
      const { ref, value, editor } = useMarkdownEditor({ defaultValue: "a" });
      const words = useEditorState(editor, (e) => e.getStats().words, { events: ["change"], fallback: 0 });
      return (
        <>
          <div ref={ref} />
          <output data-testid="v">{value}</output>
          <output data-testid="w">{words}</output>
        </>
      );
    }
    render(<App />);
    expect(screen.getByTestId("v").textContent).toBe("a");
    act(() => (live()[0] as FakeEditor).type("one two"));
    expect(screen.getByTestId("v").textContent).toBe("one two");
    expect(screen.getByTestId("w").textContent).toBe("2");
    expect(editors).toHaveLength(1);
  });
});
