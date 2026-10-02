import { expect, test, type Page } from "@playwright/test";

// The built Next.js site, served under /react-advanced-texteditor-md/ exactly like GitHub Pages. Run with `npm run test:site`.
const BASE = "/react-advanced-texteditor-md/";

// Analytics hosts are blocked in every test (CI has no business reaching them) and every attempt is recorded.
const ANALYTICS = /(aptabase\.com|googletagmanager\.com|google-analytics\.com|analytics\.google\.com)/;
let analyticsCalls: string[] = [];
test.beforeEach(async ({ page }) => {
  analyticsCalls = [];
  await page.route(ANALYTICS, (route) => {
    analyticsCalls.push(route.request().url());
    return route.abort();
  });
});

/** Collects console errors, page errors and every response that is not a success. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !ANALYTICS.test(m.location().url)) problems.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => !ANALYTICS.test(r.url()) && problems.push(`failed: ${r.url()}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && !ANALYTICS.test(r.url())) problems.push(`${r.status()}: ${r.url()}`);
  });
  return problems;
}

const surface = (page: Page, id: string) => page.locator(`[data-demo=${id}] [role=textbox]`).first();

test("the page loads with no console errors, no hydration warnings and no failed requests", async ({ page }) => {
  const problems = watch(page);
  await page.goto(BASE);
  await expect(page.locator("#top h1")).toContainText("stores Markdown");
  await expect(surface(page, "controlled")).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(problems).toEqual([]);
});

test("every request stays under the base path and none leaves the origin", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));
  await page.goto(BASE);
  await expect(surface(page, "controlled")).toBeVisible();
  await page.waitForLoadState("networkidle");
  const origin = new URL(page.url()).origin;
  for (const u of urls.filter((u) => !ANALYTICS.test(u))) expect(u.startsWith(origin + BASE) || u.startsWith("data:") || u.startsWith("blob:"), u).toBe(true);
});

test("stylesheets and the _next assets load (not hidden by Jekyll, not 404)", async ({ page, request }) => {
  await page.goto(BASE);
  const hrefs = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"], script[src]')].map((e) => (e as HTMLLinkElement & HTMLScriptElement).href || (e as HTMLScriptElement).src));
  expect(hrefs.length).toBeGreaterThan(1);
  for (const h of hrefs) expect((await request.get(h)).status(), h).toBe(200);
  const sheet = await page.evaluate(() => [...document.styleSheets].reduce((n, s) => n + (s.cssRules?.length ?? 0), 0));
  expect(sheet).toBeGreaterThan(50);
});

test("controlled demo: typing updates the Markdown below", async ({ page }) => {
  await page.goto(BASE);
  const s = surface(page, "controlled");
  await s.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type("\n\nZzz **typed** here");
  await expect(page.getByTestId("controlled-out")).toContainText("Zzz **typed** here");
  await page.getByRole("button", { name: "Set from state" }).click();
  await expect(s).toContainText("Set from state");
});

test("uncontrolled demo: the ref reads and writes the editor", async ({ page }) => {
  await page.goto(BASE);
  await surface(page, "uncontrolled").waitFor();
  await page.getByRole("button", { name: "Read value" }).click();
  await expect(page.getByTestId("uncontrolled-out")).toContainText("Read it back through the **ref**.");
});

test("MarkdownView follows the editor", async ({ page }) => {
  await page.goto(BASE);
  const s = surface(page, "view");
  await s.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type("\n\nLiveword");
  await expect(page.getByTestId("view-out")).toContainText("Liveword");
});

test("the Server Component demo was rendered at build time and ships a chip and highlighted code", async ({ page }) => {
  await page.goto(BASE);
  const demo = page.locator("[data-demo=server]");
  await expect(demo.getByRole("heading", { name: "Rendered on the server" })).toBeVisible();
  await expect(demo.locator(".atm-chip, [data-scheme=mention]").first()).toBeVisible();
  await expect(demo.locator("pre span[class*=atm-tok]").first()).toBeVisible();
  await expect(page.getByTestId("built-at")).toContainText("20");
});

test("mentions: @ opens the menu and picking one adds a chip", async ({ page }) => {
  await page.goto(BASE);
  const s = surface(page, "mentions");
  await s.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type(" @gra");
  await page.locator(".atm-mention-option", { hasText: "Grace Hopper" }).waitFor();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("mention-ids")).toContainText("u03");
});

test("uploads: an executable is rejected, a png is accepted", async ({ page }) => {
  await page.goto(BASE);
  const demo = page.locator("[data-demo=uploads]");
  await surface(page, "uploads").waitFor();
  await demo.getByRole("button", { name: "Upload setup.exe" }).click();
  await expect(page.getByTestId("upload-log")).toContainText("rejected: setup.exe");
  await demo.getByRole("button", { name: "Upload photo.png" }).click();
  await expect(page.getByTestId("upload-log")).toContainText("done: photo.png");
});

test("headless hook: the mode buttons switch the editor", async ({ page }) => {
  await page.goto(BASE);
  const demo = page.locator("[data-demo=headless]");
  await surface(page, "headless").waitFor();
  await demo.getByRole("button", { name: "markdown" }).click();
  await expect(demo.locator("textarea")).toBeVisible();
  await expect(page.getByTestId("headless-footer")).toContainText("words");
});

test("comment box: Send adds a rendered comment", async ({ page }) => {
  await page.goto(BASE);
  const demo = page.locator("[data-demo=comments]");
  const s = surface(page, "comments");
  await s.click();
  await page.keyboard.type("Hello **world**");
  await demo.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("comments").locator("strong", { hasText: "world" })).toBeVisible();
});

test("the theme toggle switches light and dark, reaches the editors, and is remembered", async ({ page }) => {
  await page.goto(BASE);
  const html = page.locator("html");
  await surface(page, "controlled").waitFor();
  const start = await html.getAttribute("data-theme");
  await page.getByRole("button", { name: /Switch to (dark|light) mode/ }).click();
  const next = start === "dark" ? "light" : "dark";
  await expect(html).toHaveAttribute("data-theme", next);
  await expect(html).toHaveAttribute("data-atm-theme", next);
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", next);
});

test("the code beside each demo is the demo's own source, and copyable", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
  await page.goto(BASE);
  const card = page.locator("#controlled");
  await expect(card.locator("pre.font-mono[aria-label^='Code']")).toContainText("export function ControlledDemo");
  await card.getByRole("button", { name: "Copy" }).click();
  await expect(card.getByRole("button", { name: /Copied|Select and copy/ })).toBeVisible();
});

test("a missing page answers with the site's 404 page", async ({ page }) => {
  const res = await page.goto(`${BASE}nope/`);
  expect(res?.status()).toBe(404);
});

test("nothing is served outside the base path (so a wrong base fails here)", async ({ request }) => {
  expect((await request.get("/favicon.svg")).status()).toBe(404);
});

test("no horizontal scroll on a phone-width viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(BASE);
  await surface(page, "controlled").waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test.describe("analytics and privacy", () => {
  test("Aptabase may run by default, Google Analytics never before consent, and the banner is accessible", async ({ page }) => {
    await page.goto(BASE);
    const banner = page.getByRole("region", { name: "Analytics consent" });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole("button", { name: "Accept" })).toBeVisible();
    await expect(banner.getByRole("button", { name: "Decline" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(analyticsCalls.filter((u) => /google/.test(u))).toEqual([]);
    expect(analyticsCalls.every((u) => /eu\.aptabase\.com\/api\/v0\/event/.test(u))).toBe(true);
  });

  test("Accept loads Google Analytics, is remembered, and the footer Privacy page can change it", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: "Accept" }).click();
    await expect(page.getByRole("region", { name: "Analytics consent" })).toHaveCount(0);
    await expect.poll(() => analyticsCalls.some((u) => /googletagmanager\.com\/gtag\/js\?id=G-CSHX6YP98W/.test(u))).toBe(true);
    await page.reload();
    await expect(page.getByRole("region", { name: "Analytics consent" })).toHaveCount(0);
    await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
    await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
    await expect(page.locator("#consent-status")).toContainText("on");
    await page.getByRole("button", { name: "Decline" }).click();
    await expect(page.locator("#consent-status")).toContainText("off");
  });

  test("Decline never loads Google Analytics", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: "Decline" }).click();
    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(analyticsCalls.filter((u) => /google/.test(u))).toEqual([]);
    await expect(page.getByRole("region", { name: "Analytics consent" })).toHaveCount(0);
  });

  test("the theme toggle sends a coarse event, and never the editor content", async ({ page }) => {
    const bodies: string[] = [];
    await page.route(/eu\.aptabase\.com/, (route) => {
      bodies.push(route.request().postData() ?? "");
      return route.abort();
    });
    await page.goto(BASE);
    await surface(page, "controlled").click();
    await page.keyboard.type("SECRET-CONTENT-123");
    await page.getByRole("button", { name: /Switch to (dark|light) mode/ }).click();
    await expect.poll(() => bodies.some((b) => b.includes("theme_switch"))).toBe(true);
    expect(bodies.some((b) => b.includes("SECRET-CONTENT-123"))).toBe(false);
  });

  for (const [name, script] of [
    ["Do Not Track", () => Object.defineProperty(navigator, "doNotTrack", { get: () => "1" })],
    ["Global Privacy Control", () => Object.defineProperty(navigator, "globalPrivacyControl", { get: () => true })],
  ] as const) {
    test(`${name}: no analytics request at all, no banner, even after interaction`, async ({ page }) => {
      await page.addInitScript(script);
      await page.goto(BASE);
      await page.getByRole("button", { name: /Switch to (dark|light) mode/ }).click();
      await page.waitForLoadState("networkidle");
      expect(analyticsCalls).toEqual([]);
      await expect(page.getByRole("region", { name: "Analytics consent" })).toHaveCount(0);
    });
  }
});
