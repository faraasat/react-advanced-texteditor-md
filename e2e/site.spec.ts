import AxeBuilder from "@axe-core/playwright";
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

/** Collects console errors (hydration warnings are console errors), page errors and every response that is not a success. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !ANALYTICS.test(m.location().url) && !/ERR_FAILED/.test(m.text())) problems.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  // ERR_ABORTED is the browser cancelling a request itself (a navigation leaving the page), not a failure.
  page.on("requestfailed", (r) => !ANALYTICS.test(r.url()) && !/ERR_ABORTED/.test(r.failure()?.errorText ?? "") && problems.push(`failed: ${r.url()}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && !ANALYTICS.test(r.url())) problems.push(`${r.status()}: ${r.url()}`);
  });
  return problems;
}

/** The editor's editable surface inside a demo card (`#feature-<id>`) or the playground (`#editor-host`). */
const card = (page: Page, id: string) => page.locator(`#feature-${id}`);
const surface = (page: Page, id: string) => card(page, id).locator("[role=textbox]").first();
const pgSurface = (page: Page) => page.locator("#editor-host [role=textbox]").first();
const group = (page: Page, name: string) => page.getByRole("group", { name, exact: true });
const pick = (page: Page, legend: string, option: string) => group(page, legend).getByRole("radio", { name: option, exact: true }).check({ force: true });
/** Declines analytics before the page loads, so the banner does not sit over what a test is clicking. */
const declineConsent = (page: Page) => page.addInitScript(() => localStorage.setItem("ratm-site-consent", "denied"));

test("the page loads with no console errors, no hydration warnings and no failed requests", async ({ page }) => {
  const problems = watch(page);
  await page.goto(BASE);
  await expect(page.locator(".hero h1")).toContainText("stores Markdown");
  await expect(pgSurface(page)).toBeVisible();
  await expect(surface(page, "controlled")).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(problems).toEqual([]);
});

test("without JavaScript the page still shows its content, and the editors show a static copy", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await expect(page.locator(".hero h1")).toContainText("stores Markdown");
  await expect(page.locator("#editor-host .atm-react-fallback")).toContainText("A React editor");
  await expect(page.locator("#feature-controlled .atm-react-fallback")).toContainText("React state owns this string");
  await expect(page.getByRole("table", { name: "Size of each piece" })).toBeVisible();
  await ctx.close();
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
  const hrefs = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"], script[src], img[src]')].map((e) => (e as HTMLLinkElement & HTMLScriptElement).href || (e as HTMLScriptElement).src));
  expect(hrefs.length).toBeGreaterThan(2);
  for (const h of hrefs) expect((await request.get(h)).status(), h).toBe(200);
  const rules = await page.evaluate(() => [...document.styleSheets].reduce((n, s) => n + (s.cssRules?.length ?? 0), 0));
  expect(rules).toBeGreaterThan(50);
});

test("typing in the playground updates the Markdown, HTML, MarkdownView and JSX outputs", async ({ page }) => {
  await declineConsent(page);
  await page.goto(BASE);
  await pgSurface(page).click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type("\n\nZzz **typed** here");
  await expect(page.getByTestId("output")).toContainText("Zzz **typed** here");
  await page.getByRole("tab", { name: "HTML" }).click();
  await expect(page.getByTestId("output")).toContainText("<strong");
  await page.getByRole("tab", { name: "MarkdownView" }).click();
  await expect(page.getByTestId("output-render").locator("strong", { hasText: "typed" })).toBeVisible();
  await page.getByRole("tab", { name: "JSX" }).click();
  await expect(page.getByTestId("output")).toContainText('layout="classic"');
});

test("the playground output has a copy button that reports what it did", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are Chromium only");
  await declineConsent(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(BASE);
  await expect(pgSurface(page)).toBeVisible();
  await page.locator(".out-card").getByRole("button", { name: /Copy/ }).click();
  await expect(page.locator(".out-card").getByText("Copied")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("# A React editor");
});

test("the layout, theme and mode controls change the component", async ({ page }) => {
  await declineConsent(page);
  await page.goto(BASE);
  await expect(pgSurface(page)).toBeVisible();
  await pick(page, "Layout", "split");
  await expect(page.locator("#editor-host .atm-preview")).toBeVisible();
  await pick(page, "Layout", "classic");
  await pick(page, "Mode", "Markdown");
  await expect(page.locator("#editor-host textarea")).toBeVisible();
  await pick(page, "Mode", "Write");
  await pick(page, "Editor theme", "sepia");
  await expect(page.locator("#editor-host .atm-root")).toHaveAttribute("data-atm-theme", "sepia");
  await pick(page, "Layout", "bottom-bar");
  await expect(page.locator("#editor-host .atm-layout-bottom-bar")).toBeVisible();
  await page.getByRole("tab", { name: "JSX" }).click();
  await expect(page.getByTestId("output")).toContainText('theme="sepia"');
  await expect(page.getByTestId("output")).toContainText('layout="bottom-bar"');
  // The text survives a layout change.
  await page.getByRole("tablist", { name: "Output format" }).getByRole("tab", { name: "Markdown", exact: true }).click();
  await expect(page.getByTestId("output")).toContainText("# A React editor");
});

test("read-only and reset", async ({ page }) => {
  await declineConsent(page);
  await page.goto(BASE);
  await expect(pgSurface(page)).toBeVisible();
  await pgSurface(page).click();
  await page.keyboard.type("QQQ");
  await expect(page.getByTestId("output")).toContainText("QQQ");
  await page.getByRole("button", { name: "Reset sample" }).click();
  await expect(page.getByTestId("output")).not.toContainText("QQQ");
  await page.getByLabel("Read-only").check();
  await expect(pgSurface(page)).toHaveAttribute("contenteditable", "false");
});

test("controlled demo: typing updates the Markdown below, and state can set the editor", async ({ page }) => {
  await declineConsent(page);
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
  await declineConsent(page);
  await page.goto(BASE);
  await expect(surface(page, "uncontrolled")).toBeVisible();
  await page.getByRole("button", { name: "Read value" }).click();
  await expect(page.getByTestId("uncontrolled-out")).toContainText("Read it back through the **ref**.");
  await page.getByRole("button", { name: "Insert bold" }).click();
  await page.getByRole("button", { name: "Read value" }).click();
  await expect(page.getByTestId("uncontrolled-out")).toContainText("**bold**");
});

test("MarkdownView follows the editor", async ({ page }) => {
  await declineConsent(page);
  await page.goto(BASE);
  const s = surface(page, "view");
  await s.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type("\n\nLiveword");
  await expect(page.getByTestId("view-out")).toContainText("Liveword");
});

test("the Server Component demo was rendered at build time and ships a chip and highlighted code", async ({ page }) => {
  await declineConsent(page);
  await page.goto(BASE);
  const demo = card(page, "server");
  await expect(demo.getByRole("heading", { name: "Rendered on the server" })).toBeVisible();
  await expect(demo.locator(".atm-chip, [data-scheme=mention]").first()).toBeVisible();
  await expect(demo.locator("pre span[class*=atm-tok]").first()).toBeVisible();
  await expect(page.getByTestId("built-at")).toContainText("20");
});

test("mentions: @ opens the menu and picking one adds a chip", async ({ page }) => {
  await declineConsent(page);
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
  await declineConsent(page);
  await page.goto(BASE);
  const demo = card(page, "uploads");
  await expect(surface(page, "uploads")).toBeVisible();
  await demo.getByRole("button", { name: "Upload setup.exe" }).click();
  await expect(page.getByTestId("upload-log")).toContainText("rejected: setup.exe");
  await demo.getByRole("button", { name: "Upload photo.png" }).click();
  await expect(page.getByTestId("upload-log")).toContainText("done: photo.png");
});

test("headless hook: the mode buttons switch the editor", async ({ page }) => {
  await declineConsent(page);
  await page.goto(BASE);
  const demo = card(page, "headless");
  await expect(surface(page, "headless")).toBeVisible();
  await demo.getByRole("radio", { name: "markdown" }).check({ force: true });
  await expect(demo.locator("textarea")).toBeVisible();
  await expect(page.getByTestId("headless-footer")).toContainText("words");
});

test("plugins and theming demos work, and the Tailwind demo's utilities beat the editor's own CSS", async ({ page }) => {
  await declineConsent(page);
  await page.goto(BASE);
  await expect(surface(page, "plugins")).toContainText("spoiler");
  await expect(card(page, "plugins").locator("mark").first()).toBeVisible();
  const theming = card(page, "theming");
  await expect(theming.locator(".atm-root")).toBeVisible();
  await theming.getByLabel("Theme").selectOption("slate");
  await expect(theming.locator("[data-atm-theme]").first()).toHaveAttribute("data-atm-theme", "slate");
  await theming.getByLabel("Custom tokens").check();
  await expect(theming.locator(".atm-root")).toHaveAttribute("data-atm-theme-source", "tokens");
  const root = card(page, "tailwind").locator(".atm-root");
  await expect(root).toBeVisible();
  expect(await root.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("2px");
  expect(await root.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeGreaterThanOrEqual(16);
});

test("comment box: Send adds a rendered comment", async ({ page }) => {
  await declineConsent(page);
  await page.goto(BASE);
  const demo = card(page, "comments");
  await surface(page, "comments").click();
  await page.keyboard.type("Hello **world**");
  await demo.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("comments").locator("strong", { hasText: "world" })).toBeVisible();
});

test("the code beside each demo is the demo's own source, and copyable", async ({ page, context, browserName }) => {
  await declineConsent(page);
  if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(BASE);
  const c = card(page, "controlled");
  await c.getByRole("tab", { name: "Code" }).click();
  const panel = c.getByRole("tabpanel", { name: "Code" });
  await expect(panel.locator("pre[aria-label^='Code']")).toContainText("export function ControlledDemo");
  await panel.getByRole("button", { name: /Copy/ }).click();
  await expect(panel.getByText("Copied")).toBeVisible();
  // Opening the Code tab did not throw the live editor away.
  await c.getByRole("tab", { name: "Live demo" }).click();
  await expect(surface(page, "controlled")).toBeVisible();
  expect(await page.locator(".fcard").count()).toBe(11);
});

test("the theme toggle switches light and dark, reaches the editors, and is remembered", async ({ page }) => {
  await page.goto(BASE);
  const html = page.locator("html");
  await expect(surface(page, "controlled")).toBeVisible();
  const start = await html.getAttribute("data-theme");
  await page.getByRole("button", { name: /Switch to (dark|light) mode/ }).click();
  const next = start === "dark" ? "light" : "dark";
  await expect(html).toHaveAttribute("data-theme", next);
  await expect(html).toHaveAttribute("data-atm-theme", next);
  await expect(page.locator("#editor-host .atm-root")).toHaveAttribute("data-atm-theme", next);
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", next);
});

test("the theme follows prefers-color-scheme with no flash, and a stored choice wins", async ({ browser }) => {
  for (const [scheme, want] of [["dark", "dark"], ["light", "light"]] as const) {
    const ctx = await browser.newContext({ colorScheme: scheme });
    const page = await ctx.newPage();
    await page.route(ANALYTICS, (r) => r.abort());
    // The attribute must already be right when the DOM is parsed: before any script of the page's own runs.
    await page.addInitScript(() => document.addEventListener("DOMContentLoaded", () => ((window as unknown as { __t: string | null }).__t = document.documentElement.getAttribute("data-theme"))));
    await page.goto(BASE);
    expect(await page.evaluate(() => (window as unknown as { __t: string }).__t)).toBe(want);
    await ctx.close();
  }
  const ctx = await browser.newContext({ colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.route(ANALYTICS, (r) => r.abort());
  await page.addInitScript(() => localStorage.setItem("ratm-site-theme", "light"));
  await page.goto(BASE);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await ctx.close();
});

test("the install block switches package manager, and the page lists the sections readers look for", async ({ page }) => {
  await declineConsent(page);
  await page.goto(BASE);
  const hero = page.locator(".hero .install");
  await expect(hero.getByTestId("install-cmd")).toContainText("npm install react-advanced-texteditor-md");
  await hero.getByRole("tab", { name: "yarn" }).click();
  await expect(hero.getByTestId("install-cmd")).toContainText("yarn add react-advanced-texteditor-md");
  for (const id of ["playground", "why", "demos", "install", "shortcuts", "compare", "browsers", "roadmap", "faq"]) await expect(page.locator(`section#${id} h2 a.anchor`)).toHaveAttribute("href", `#${id}`);
  await page.getByText("Can the emoji button open the OS emoji panel?").click();
  await expect(page.locator(".faq details[open]").getByText("a web page cannot open it")).toBeVisible();
});

test("the docs are rendered by the package's own MarkdownView and every internal link resolves", async ({ page, request }) => {
  const problems = watch(page);
  await declineConsent(page);
  await page.goto(`${BASE}docs/`);
  await expect(page.getByRole("heading", { name: "Documentation" })).toBeVisible();
  const hrefs = await page.locator(".cards a").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).pathname));
  expect(hrefs.length).toBe(2);
  const seen = new Set<string>();
  for (const h of hrefs) {
    await page.goto(h);
    await expect(page.locator("article.prose h1, article.prose h2").first()).toBeVisible();
    const links = await page.locator("article.prose a[href], aside a[href]").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href).filter((u) => u.startsWith(location.origin)));
    for (const l of links) seen.add(l.split("#")[0]);
  }
  for (const u of seen) expect((await request.get(u)).status(), u).toBe(200);
  expect(problems).toEqual([]);
});

test("the guide has highlighted code, heading anchors that work, and a table of contents", async ({ page }) => {
  await declineConsent(page);
  await page.goto(`${BASE}docs/guide/`);
  await expect(page.locator("article.prose pre code span[class*=atm-tok]").first()).toBeVisible();
  const h = page.locator("article.prose h2[id]").first();
  await expect(h).toBeVisible();
  const id = await h.getAttribute("id");
  expect(await page.locator(".docs__toc a").count()).toBeGreaterThan(5);
  await page.goto(`${BASE}docs/guide/#${id}`);
  await expect(page.locator(`#${id}`)).toBeInViewport();
  // The README's own in-page links point at ids that exist.
  const broken = await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('article.prose a[href^="#"]')].filter((a) => !document.getElementById(decodeURIComponent(a.hash.slice(1)))).map((a) => a.hash));
  expect(broken).toEqual([]);
});

test("a missing page answers with the site's 404 page", async ({ page }) => {
  const res = await page.goto(`${BASE}nope/`);
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("nothing is served outside the base path (so a wrong base fails here)", async ({ request }) => {
  expect((await request.get("/favicon.svg")).status()).toBe(404);
});

test("no horizontal scroll at 360 px, and the menu opens on a phone", async ({ page }) => {
  await declineConsent(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(BASE);
  await expect(surface(page, "controlled")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Docs" })).toBeVisible();
});

test("prefers-reduced-motion switches the animations off", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.route(ANALYTICS, (r) => r.abort());
  await page.goto(BASE);
  const d = await page.evaluate(() => getComputedStyle(document.querySelector(".fx")!).transitionDuration);
  expect(parseFloat(d)).toBeLessThan(0.01);
  await ctx.close();
});

test.describe("accessibility (axe)", () => {
  for (const scheme of ["light", "dark"] as const) {
    for (const [name, path] of [["landing", ""], ["docs index", "docs/"], ["guide", "docs/guide/"], ["privacy", "privacy/"]] as const) {
      test(`${name} page has no axe violations in ${scheme} mode`, async ({ page }) => {
        await page.addInitScript((s) => {
          localStorage.setItem("ratm-site-theme", s);
          localStorage.setItem("ratm-site-consent", "denied");
        }, scheme);
        await page.goto(BASE + path);
        await page.waitForLoadState("networkidle");
        if (!path) {
          await expect(pgSurface(page)).toBeVisible();
          await expect(surface(page, "comments")).toBeVisible();
        }
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`)).toEqual([]);
      });
    }
  }
});

test.describe("analytics and privacy", () => {
  test("Aptabase may run by default, Google Analytics never before consent, and the banner is accessible", async ({ page }) => {
    await page.goto(BASE);
    const banner = page.getByRole("region", { name: "Analytics consent" });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole("button", { name: "Accept" })).toBeVisible();
    await expect(banner.getByRole("button", { name: "Decline" })).toBeVisible();
    await expect(banner.getByRole("link", { name: "Privacy" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(analyticsCalls.filter((u) => /google/.test(u))).toEqual([]);
    expect(analyticsCalls.length).toBeGreaterThan(0);
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
    await expect(page.getByRole("heading", { name: "Privacy", level: 1 })).toBeVisible();
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

  test("playground switches send a coarse event, and never the editor content", async ({ page }) => {
    const bodies: string[] = [];
    await page.route(/eu\.aptabase\.com/, (route) => {
      bodies.push(route.request().postData() ?? "");
      return route.abort();
    });
    await declineConsent(page);
    await page.goto(BASE);
    await pgSurface(page).click();
    await page.keyboard.type("SECRET-CONTENT-123");
    await pick(page, "Layout", "minimal");
    await expect.poll(() => bodies.some((b) => b.includes("playground_change"))).toBe(true);
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
      await pick(page, "Layout", "minimal");
      await page.getByRole("button", { name: /Switch to (dark|light) mode/ }).click();
      await page.waitForLoadState("networkidle");
      expect(analyticsCalls).toEqual([]);
      await expect(page.getByRole("region", { name: "Analytics consent" })).toHaveCount(0);
    });
  }

  test("the Privacy page says so when the browser asks not to be tracked", async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, "doNotTrack", { get: () => "1" }));
    await page.goto(`${BASE}privacy/`);
    await expect(page.locator("#consent-status")).toContainText("Do Not Track");
  });
});
