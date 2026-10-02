// Takes the README screenshots from the BUILT demo site with Playwright, into github-imgs/.
//
//   npm run build && npm run site:install && npm run site:build && npm run site:screenshots
//
// Every PNG must stay under 200 kB (they live in the repository and the npm README). No image tools are used: the
// clip and the viewport width are what keep them small, and a shot that is too big is retried a little narrower.
// Needs Chromium: `npx playwright install chromium`.
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "github-imgs");
const MAX = 200 * 1024;
const PORT = 4338;
const BASE = process.env.SITE_BASE ?? "/react-advanced-texteditor-md/";
const URL_ = `http://127.0.0.1:${PORT}${BASE}`;
mkdirSync(outDir, { recursive: true });

const server = spawn(process.execPath, [join(root, "scripts/serve-site.mjs"), "--port", String(PORT), "--base", BASE], { stdio: "ignore" });
const stop = () => server.kill();
process.on("exit", stop);
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(URL_)).ok) break;
  } catch {
    await new Promise((r) => setTimeout(r, 100));
  }
}

const browser = await chromium.launch();
let failed = false;

/** `run(page)` prepares the page and returns the clip rectangle. Retried at narrower widths until it fits the limit. */
async function shoot(name, { widths = [1180, 1060, 940, 820], height = 760, mobile = false, scheme = "light", run }) {
  for (const width of mobile ? [390] : widths) {
    const ctx = await browser.newContext({
      viewport: { width, height: mobile ? 844 : height },
      deviceScaleFactor: 1,
      colorScheme: scheme,
      reducedMotion: "reduce",
      isMobile: mobile,
      hasTouch: mobile,
    });
    await ctx.addInitScript((s) => {
      try {
        localStorage.setItem("ratm-site-theme", s);
        localStorage.setItem("ratm-site-consent", "denied"); // no consent banner in the pictures
      } catch {
        /* ignore */
      }
    }, scheme);
    const page = await ctx.newPage();
    await page.goto(URL_);
    await page.locator("[data-demo=controlled] [role=textbox]").waitFor();
    await page.addStyleTag({ content: "*{caret-color:transparent!important}html{scroll-behavior:auto!important}" });
    const clip = await run(page);
    const file = join(outDir, name + ".png");
    await page.screenshot({ path: file, clip, type: "png" });
    await ctx.close();
    const size = statSync(file).size;
    if (size <= MAX) {
      console.log(`ok   ${name}.png  ${(size / 1024).toFixed(0)} kB  ${width}px`);
      return;
    }
    console.log(`     ${name}.png ${(size / 1024).toFixed(0)} kB at ${width}px, retrying narrower`);
  }
  failed = true;
  console.log(`FAIL ${name}.png is over ${MAX / 1024} kB`);
}

/** Scrolls a demo section to just under the sticky header and returns its box (viewport coordinates), capped in height. */
async function section(page, id, { cap = 700 } = {}) {
  await page.evaluate((i) => document.getElementById(i).scrollIntoView({ block: "start" }), id);
  await page.evaluate(() => window.scrollBy(0, -64));
  await page.waitForTimeout(450);
  const b = await page.locator(`#${id}`).boundingBox();
  const vh = page.viewportSize().height;
  return { x: b.x, y: Math.max(0, b.y), width: b.width, height: Math.min(b.height, cap, vh - Math.max(0, b.y)) };
}

await shoot("hero", {
  height: 700,
  run: async (p) => {
    await p.evaluate(() => window.scrollTo(0, 0));
    return { x: 0, y: 0, width: p.viewportSize().width, height: 700 };
  },
});
await shoot("demo-controlled", { run: (p) => section(p, "controlled") });
await shoot("demo-server", { scheme: "dark", run: (p) => section(p, "server") });
await shoot("demo-theming", { run: (p) => section(p, "theming") });
await shoot("demo-tailwind", { run: (p) => section(p, "tailwind") });
await shoot("demo-comments", { scheme: "dark", run: (p) => section(p, "comments") });

await shoot("mentions-menu", {
  run: async (p) => {
    await section(p, "mentions");
    const s = p.locator("[data-demo=mentions] [role=textbox]");
    await s.click();
    await p.keyboard.press("End");
    await p.keyboard.type(" @a");
    await p.locator(".atm-mention-option").first().waitFor();
    await p.waitForTimeout(300);
    const c = await section(p, "mentions");
    const m = await p.locator(".atm-mention-menu").first().boundingBox();
    const bottom = Math.min(p.viewportSize().height, Math.max(c.y + c.height, m.y + m.height + 12));
    return { x: c.x, y: c.y, width: c.width, height: bottom - c.y };
  },
});

await shoot("uploads", {
  run: async (p) => {
    await section(p, "uploads");
    const d = p.locator("[data-demo=uploads]");
    await d.getByRole("button", { name: "Upload photo.png" }).click();
    await d.getByRole("button", { name: "Upload setup.exe" }).click();
    await d.getByRole("button", { name: "Upload scan.pdf (3 MB)" }).click();
    await p.waitForTimeout(1200);
    return section(p, "uploads");
  },
});

await shoot("dark-mode", {
  scheme: "dark",
  height: 720,
  run: async (p) => {
    await section(p, "plugins");
    return { x: 0, y: 0, width: p.viewportSize().width, height: 720 };
  },
});

await shoot("mobile", {
  mobile: true,
  run: async (p) => {
    await p.evaluate(() => window.scrollTo(0, 0));
    return { x: 0, y: 0, width: 390, height: 844 };
  },
});

await shoot("mobile-editor", {
  mobile: true,
  scheme: "dark",
  run: async (p) => {
    await p.evaluate(() => document.getElementById("mentions").scrollIntoView({ block: "start" }));
    await p.evaluate(() => window.scrollBy(0, -56));
    await p.waitForTimeout(300);
    return { x: 0, y: 0, width: 390, height: 844 };
  },
});

await browser.close();
stop();
process.exit(failed ? 1 : 0);
