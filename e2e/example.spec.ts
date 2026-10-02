import { expect, test, type Page } from "@playwright/test";

/**
 * The example app (example/) built from dist/ against a real browser: contenteditable, selection and
 * layout are exactly what jsdom cannot show. Desktop only for typing-heavy specs.
 */
const surface = (page: Page, section = "controlled") => page.locator(`[data-testid=${section}] [role=textbox]`).first();
const out = (page: Page) => page.getByTestId("md-out");

async function open(page: Page, path = "/") {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(path);
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await expect(surface(page)).toBeVisible();
  return errors;
}

async function clear(page: Page) {
  await surface(page).click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Backspace");
}

test.describe("controlled editor", () => {
  test("loads with no console errors, one editor per instance (StrictMode), and the fallback is gone", async ({ page }) => {
    const errors = await open(page);
    await expect(page.locator("[data-testid=controlled] .atm-root")).toHaveCount(1);
    await expect(page.locator("[data-testid=form-section] .atm-root")).toHaveCount(1);
    await expect(page.locator(".atm-react-fallback")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("typing updates the controlled state and the word count", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "keyboard");
    await open(page);
    await clear(page);
    await page.keyboard.type("Hello brave world");
    await expect(out(page)).toHaveText("Hello brave world");
    await expect(page.getByTestId("words")).toHaveText("3");
  });

  test("the caret does not jump while the parent re-renders on every keystroke", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "keyboard");
    await open(page);
    await clear(page);
    await page.keyboard.type("ab");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.type("X");
    await page.keyboard.type("Y");
    await expect(out(page)).toHaveText("aXYb");
  });

  test("a parent re-render does not recreate the editor (inline option objects)", async ({ page }) => {
    await open(page);
    await page.evaluate(() => ((window as unknown as { __root: Element }).__root = document.querySelector("[data-testid=controlled] .atm-root")!));
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /^Re-render/ }).click();
    await expect(page.getByRole("button", { name: "Re-render (3)" })).toBeVisible();
    const same = await page.evaluate(() => (window as unknown as { __root: Element }).__root === document.querySelector("[data-testid=controlled] .atm-root"));
    expect(same).toBe(true);
  });

  test("a value set from state reaches the editor, and the view renders it", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Load sample" }).click();
    await expect(surface(page).locator("h1")).toHaveText("Loaded from state");
    await expect(surface(page).locator("li")).toHaveCount(2);
    await expect(out(page)).toContainText("# Loaded from state");
    const view = page.getByTestId("view-section");
    await expect(view.locator("h1.atm-h1")).toHaveText("Loaded from state");
    await expect(view.locator("table.atm-table")).toBeVisible();
    await expect(view.locator(".atm-chip")).toContainText("@Jane Doe");
  });

  test("undo still works after a value was set from state (keepHistory)", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "keyboard");
    await open(page);
    await page.getByRole("button", { name: "Load sample" }).click();
    await surface(page).locator("h1").click();
    await page.keyboard.press("End");
    await page.keyboard.type(" more");
    await expect(out(page)).toContainText("# Loaded from state more");
    await page.keyboard.press("ControlOrMeta+z");
    await expect(out(page)).toContainText("# Loaded from state");
    await expect(out(page)).not.toContainText("more");
    await expect(surface(page).locator("h1")).toHaveText("Loaded from state"); // undo went back to the loaded document, not to empty
  });
});

test.describe("mentions", () => {
  test("typing @ opens the menu from the fake directory; Enter inserts one chip with refs, badge and colour", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "keyboard");
    await open(page);
    await clear(page);
    await page.keyboard.type("cc @Jane");
    const option = page.locator("[role=option]", { hasText: "Jane Doe" });
    await expect(option).toBeVisible();
    await expect(option.locator(".atm-mention-badge")).toHaveText("Staff");
    await page.keyboard.press("Enter");
    await expect(out(page)).toContainText("[@Jane Doe](mention:person/u1?legacy=123)");
    const chip = surface(page).locator("[data-scheme=mention][data-id=u1]");
    await expect(chip).toBeVisible();
    await expect(chip).toHaveAttribute("style", /--atm-chip-color:var\(--atm-chip-3\)/);
  });

  test("a team uses the declared colour and badge, in the editor and in the view", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "keyboard");
    await open(page);
    await clear(page);
    await page.keyboard.type("@Platf");
    await expect(page.locator("[role=option]", { hasText: "Platform" })).toBeVisible();
    await page.keyboard.press("Enter");
    const inView = page.getByTestId("view-section").locator("[data-scheme=mention][data-kind=team]");
    await expect(inView).toBeVisible();
    await expect(inView).toHaveAttribute("style", /--atm-chip-color:\s*#0d9488/);
    await expect(inView.locator(".atm-chip-badge")).toHaveText("Team");
  });

  test("a chip in the view is clickable and the handler gets the chip", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Load sample" }).click();
    await page.getByTestId("view-section").locator(".atm-chip").click();
    await expect(page.getByTestId("chip-out")).toHaveText("clicked Jane Doe");
  });
});

test.describe("uploads", () => {
  test("the attach button uploads an image through the PUT uploader and inserts it", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "file chooser");
    await open(page);
    await clear(page);
    const chooser = page.waitForEvent("filechooser");
    await page.locator("[data-testid=controlled]").getByRole("button", { name: "Attach file" }).click();
    await (await chooser).setFiles({
      name: "pic.png",
      mimeType: "image/png",
      buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64"),
    });
    await expect(out(page)).toContainText("](/uploads/pic.png)", { timeout: 10_000 });
    await expect(surface(page).locator("img")).toHaveCount(1);
  });

  test("a denied extension is not uploaded", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "file chooser");
    await open(page);
    await clear(page);
    const chooser = page.waitForEvent("filechooser");
    await page.locator("[data-testid=controlled]").getByRole("button", { name: "Attach file" }).click();
    await (await chooser).setFiles({ name: "run.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ") });
    await expect(page.locator("[data-testid=controlled] .atm-toast")).toContainText("run.exe");
    await expect(out(page)).not.toContainText("run.exe");
  });
});

test.describe("modes", () => {
  test("switch to Markdown, edit the source, switch back; mode is reported by useEditorState", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "keyboard");
    await open(page);
    await clear(page);
    await page.keyboard.type("plain");
    const section = page.getByTestId("controlled");
    await section.getByRole("tab", { name: "Markdown" }).or(section.getByRole("button", { name: "Markdown" })).first().click();
    await expect(page.getByTestId("mode")).toHaveText("markdown");
    const area = section.locator("textarea");
    await expect(area).toBeVisible();
    await area.fill("# From source\n\n**bold**");
    await expect(out(page)).toHaveText("# From source\n\n**bold**");
    await section.getByRole("tab", { name: "Write" }).or(section.getByRole("button", { name: "Write" })).first().click();
    await expect(page.getByTestId("mode")).toHaveText("wysiwyg");
    await expect(surface(page).locator("h1")).toHaveText("From source");
    await expect(surface(page).locator("strong")).toHaveText("bold");
  });
});

test.describe("form", () => {
  test("name puts the Markdown into FormData; reset restores the initial value", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "keyboard");
    await open(page);
    const body = surface(page, "form-section");
    await body.click();
    await page.keyboard.press("ControlOrMeta+End");
    await page.keyboard.type(" and more");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByTestId("form-out")).toHaveText("title=T|body=initial **body and more**");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(body.locator("strong")).toHaveText("body");
    await expect(body).not.toContainText("and more");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByTestId("form-out")).toHaveText("title=T|body=initial **body**");
  });
});

test.describe("chat: bottom-bar with children in the actions slot", () => {
  test("the child button is inside the editor's actions slot; Mod-Enter submits", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "keyboard");
    await open(page);
    await expect(page.locator("[data-testid=chat] .atm-actions [data-testid=send]")).toBeVisible();
    const reply = surface(page, "chat");
    await reply.click();
    await page.keyboard.type("hello **team**");
    await page.keyboard.press("ControlOrMeta+Enter");
    await expect(page.getByTestId("msg")).toHaveCount(1);
    await expect(page.getByTestId("msg").locator("strong")).toHaveText("team");
  });

  test("the child button sends the current value and clears the editor through the ref", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "keyboard");
    await open(page);
    const reply = surface(page, "chat");
    await reply.click();
    await page.keyboard.type("via button");
    await page.getByTestId("send").click();
    await expect(page.getByTestId("msg")).toHaveCount(1);
    await expect(page.getByTestId("msg")).toHaveText("via button");
    await expect(reply).toHaveText("");
  });
});

test.describe("theme and read only", () => {
  test("dark theme reaches the editor root and changes its colours, without recreating it", async ({ page }) => {
    await open(page);
    const root = page.locator("[data-testid=controlled] .atm-root");
    await page.evaluate(() => ((window as unknown as { __root: Element }).__root = document.querySelector("[data-testid=controlled] .atm-root")!));
    const before = await surface(page).evaluate((e) => getComputedStyle(e).color);
    await page.getByRole("button", { name: "Dark" }).click();
    await expect(root).toHaveAttribute("data-atm-theme", "dark");
    const after = await surface(page).evaluate((e) => getComputedStyle(e).color);
    expect(after).not.toBe(before);
    await expect(page.getByTestId("view-section").locator(".atm-view")).toHaveAttribute("data-atm-theme", "dark");
    expect(await page.evaluate(() => (window as unknown as { __root: Element }).__root === document.querySelector("[data-testid=controlled] .atm-root"))).toBe(true);
    await page.getByRole("button", { name: "Light" }).click();
    await expect(root).toHaveAttribute("data-atm-theme", "light");
  });

  test("read only is live: the surface stops being editable and comes back", async ({ page }) => {
    await open(page);
    await expect(surface(page)).toHaveAttribute("contenteditable", "true");
    await page.getByRole("button", { name: "Read only" }).click();
    await expect(surface(page)).not.toHaveAttribute("contenteditable", "true");
    await page.getByRole("button", { name: "Read only" }).click();
    await expect(surface(page)).toHaveAttribute("contenteditable", "true");
  });
});

test.describe("headless hook", () => {
  test("mounts, reports ready, and tracks the value and the character count", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "keyboard");
    await open(page);
    await expect(page.getByTestId("headless-out")).toHaveText("ready: headless (8)");
    await page.locator("[data-testid=headless] [role=textbox]").click();
    await page.keyboard.press("ControlOrMeta+End");
    await page.keyboard.type("!");
    await expect(page.getByTestId("headless-out")).toHaveText("ready: headless! (9)");
  });
});

test.describe("server rendering and hydration", () => {
  test.use({ javaScriptEnabled: true });

  test("the SSR page has the document in the HTML before any script runs", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/ssr");
    await expect(page.locator("[data-testid=controlled] .atm-react-fallback h1")).toHaveText("Welcome");
    await expect(page.locator("[data-testid=view-section] h1")).toHaveText("Welcome");
    await expect(page.locator("[data-testid=form-section] input[type=hidden][name=body]")).toHaveValue("initial **body**");
    await ctx.close();
  });

  test("hydrates without warnings and the real editor replaces the static copy", async ({ page }) => {
    const errors = await open(page, "/ssr");
    await expect(page.locator(".atm-react-fallback")).toHaveCount(0);
    await expect(page.locator("[data-testid=controlled] .atm-root")).toHaveCount(1);
    await expect(surface(page).locator("h1")).toHaveText("Welcome");
    expect(errors.filter((e) => /hydrat|did not match|mismatch/i.test(e))).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("the SSR'd editor is usable after hydration", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "keyboard");
    await open(page, "/ssr");
    await clear(page);
    await page.keyboard.type("typed after hydration");
    await expect(out(page)).toHaveText("typed after hydration");
  });
});
