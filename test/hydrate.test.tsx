import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownEditor, MarkdownView } from "../src";

afterEach(() => vi.restoreAllMocks());

async function hydrate(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  container.innerHTML = renderToString(element);
  const before = container.innerHTML;
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  // React 19 reports a hydration mismatch through onRecoverableError, not console.error.
  const recoverable = vi.fn();
  let root!: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, element, { onRecoverableError: recoverable });
  });
  return { container, before, errors: { toString: () => "", calls: () => errors.mock.calls.length + recoverable.mock.calls.length }, recoverable, root };
}

describe("hydration", () => {
  it("negative control: the harness does see a mismatch", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<p>server</p>);
    const recoverable = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      hydrateRoot(container, <p>client</p>, { onRecoverableError: recoverable });
    });
    expect(recoverable.mock.calls.length + (console.error as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBeGreaterThan(0);
  });

  it("MarkdownEditor: the first client render matches the server markup (no mismatch warning), then the editor takes over", async () => {
    const { container, before, errors, root } = await hydrate(<MarkdownEditor defaultValue={"# Hello\n\nworld"} placeholder="Write" />);
    expect(errors.calls()).toBe(0);
    expect(before).toContain("atm-react-fallback");
    // After hydration the real editor is mounted and the static copy is gone.
    expect(container.querySelector(".atm-react-fallback")).toBeNull();
    expect(container.querySelector('[role="textbox"]')).not.toBeNull();
    expect(container.textContent).toContain("Hello");
    await act(async () => root.unmount());
    expect(document.querySelectorAll(".atm-root")).toHaveLength(0);
  });

  it("MarkdownEditor with a name and children hydrates cleanly", async () => {
    const { errors, root } = await hydrate(
      <MarkdownEditor name="body" layout="bottom-bar" defaultValue="x">
        <button>Send</button>
      </MarkdownEditor>,
    );
    expect(errors.calls()).toBe(0);
    await act(async () => root.unmount());
  });

  it("MarkdownView hydrates with no mismatch and keeps its DOM", async () => {
    const { container, before, errors, root } = await hydrate(<MarkdownView markdown={"# T\n\n$x^2$ [@j](mention:person/1)\n\n- a"} />);
    expect(errors.calls()).toBe(0);
    expect(container.innerHTML).toBe(before);
    await act(async () => root.unmount());
  });
});
