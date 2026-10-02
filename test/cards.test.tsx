import { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownEditor, MarkdownView } from "../src";
import { renderToString } from "react-dom/server";
import { MarkdownView as PureView } from "../src/view";
import { live, resetEditors, type FakeEditor } from "./helpers/fake-core";

vi.mock("advanced-texteditor-md", async (importOriginal) => {
  const actual = await importOriginal<typeof import("advanced-texteditor-md")>();
  const { fakeCreateEditor } = await import("./helpers/fake-core");
  return { ...actual, createEditor: vi.fn(fakeCreateEditor) };
});

beforeEach(() => resetEditors());
const wait = (ms = 80) => act(() => new Promise<void>((r) => setTimeout(r, ms)));
const until = async (f: () => unknown) => {
  for (let i = 0; i < 60 && !f(); i++) await wait(25);
};
const card = () => document.querySelector<HTMLElement>(".atm-chip-card");
const MD = "Hi [@Jane](mention:person/u1) and [@Bob](mention:person/u2).";

describe("MarkdownView cards", () => {
  it("without cards nothing is added to the chips", async () => {
    const { container } = render(<MarkdownView markdown={MD} />);
    await wait();
    const chip = container.querySelector(".atm-chip")!;
    expect(chip.hasAttribute("tabindex")).toBe(false);
    expect(chip.hasAttribute("data-atm-interactive")).toBe(false);
  });

  it("the server markup is the same with and without cards (no hydration mismatch)", () => {
    const getCard = () => ({ title: "x" });
    expect(renderToString(<PureView markdown={MD} cards={{ getCard }} />)).toBe(renderToString(<PureView markdown={MD} />));
  });

  it("with cards: chips become interactive and focus opens the card; Escape closes it", async () => {
    const getCard = vi.fn(() => ({ title: "Jane Doe" }));
    const { container } = render(<MarkdownView markdown={MD} cards={{ getCard, delayMs: 0 }} />);
    await wait();
    const chip = container.querySelector<HTMLElement>(".atm-chip")!;
    expect(chip.getAttribute("tabindex")).toBe("0");
    expect(chip.hasAttribute("data-atm-interactive")).toBe(true);
    await until(() => chip.getAttribute("tabindex"));
    act(() => chip.focus());
    await until(card);
    expect(card()?.textContent).toContain("Jane Doe");
    expect(getCard).toHaveBeenCalledWith(expect.objectContaining({ id: "u1", scheme: "mention" }), expect.objectContaining({ signal: expect.any(AbortSignal) }));
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    });
    expect(card()).toBeNull();
  });

  it("a re-render with an inline getCard does not rebind; new markdown binds the new chip only", async () => {
    const a = vi.fn(() => ({ title: "A" }));
    const b = vi.fn(() => ({ title: "B" }));
    const { container, rerender } = render(<MarkdownView markdown={MD} cards={{ getCard: a, delayMs: 0 }} />);
    await wait();
    const first = container.querySelector<HTMLElement>(".atm-chip")!;
    rerender(<MarkdownView markdown={MD} cards={{ getCard: b, delayMs: 0 }} />);
    await wait();
    expect(container.querySelector(".atm-chip")).toBe(first);
    act(() => first.focus());
    await wait();
    expect(b).toHaveBeenCalledTimes(1); // the latest function, called once
    expect(a).not.toHaveBeenCalled();
    rerender(<MarkdownView markdown={MD + "\n\nAnd [@Cy](mention:person/u3)."} cards={{ getCard: b, delayMs: 0 }} />);
    await wait();
    const chips = container.querySelectorAll<HTMLElement>(".atm-chip");
    expect(chips).toHaveLength(3);
    expect(chips[2].getAttribute("tabindex")).toBe("0");
  });

  it("unmount closes the card and removes nothing it should not; StrictMode leaves one binding", async () => {
    const getCard = vi.fn(() => ({ title: "Jane" }));
    const { container, unmount } = render(
      <StrictMode>
        <MarkdownView markdown={MD} cards={{ getCard, delayMs: 0 }} />
      </StrictMode>,
    );
    await wait();
    const chip = container.querySelector<HTMLElement>(".atm-chip")!;
    act(() => chip.focus());
    await wait();
    expect(getCard).toHaveBeenCalledTimes(1);
    unmount();
    expect(card()).toBeNull();
  });

  it("a chip with onChipClick is interactive without cards", () => {
    const { container } = render(<MarkdownView markdown={MD} onChipClick={() => {}} />);
    expect(container.querySelector(".atm-chip")!.hasAttribute("data-atm-interactive")).toBe(true);
  });
});

describe("MarkdownEditor cards", () => {
  it("adds the cards plugin only when cards is set, and recreates when it appears", async () => {
    const { rerender } = render(<MarkdownEditor defaultValue="x" />);
    expect(((live()[0] as FakeEditor).options.plugins ?? []).map((p) => p.name)).not.toContain("react-chip-cards");
    rerender(<MarkdownEditor defaultValue="x" cards={{ getCard: () => null }} />);
    expect(((live()[0] as FakeEditor).options.plugins ?? []).map((p) => p.name)).toContain("react-chip-cards");
  });

  it("a new getCard identity does not recreate the editor, and the latest is called", async () => {
    const a = vi.fn(() => ({ title: "A" }));
    const b = vi.fn(() => ({ title: "B" }));
    const { rerender } = render(<MarkdownEditor defaultValue="x" cards={{ getCard: a }} />);
    const ed = live()[0] as FakeEditor;
    const plugin = ed.options.plugins!.find((p) => p.name === "react-chip-cards")!;
    rerender(<MarkdownEditor defaultValue="x" cards={{ getCard: b }} />);
    expect(live()[0]).toBe(ed);
    // Drive the plugin as the core would: setup, then a view render.
    const off = plugin.setup!(ed as never);
    await wait();
    const host = document.createElement("div");
    host.innerHTML = '<span class="atm-chip" data-scheme="mention" data-kind="person" data-id="u1" data-trigger="@">@Jane</span>';
    document.body.append(host);
    plugin.postRender!(host, { mode: "view", doc: { type: "doc", children: [] } as never });
    await wait();
    const chip = host.querySelector<HTMLElement>(".atm-chip")!;
    expect(chip.getAttribute("tabindex")).toBe("0");
    act(() => chip.focus());
    await wait(450);
    expect(b).toHaveBeenCalled();
    expect(a).not.toHaveBeenCalled();
    if (typeof off === "function") off();
    host.remove();
  });
});
