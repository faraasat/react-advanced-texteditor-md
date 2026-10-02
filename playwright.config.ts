import { defineConfig, devices } from "@playwright/test";

/**
 * E2E against the example app (example/), bundled with esbuild from the BUILT package (dist/):
 *   npm run build && npm run example:build && npx playwright test --project=desktop
 * Real layout, real CSS, real contenteditable: what jsdom cannot show.
 */
export default defineConfig({
  testDir: "./e2e",
  // The demo site has its own config (playwright.site.config.ts): it needs a different server and base path.
  testIgnore: /site\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://127.0.0.1:4327", trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "node example/serve.mjs",
    url: "http://127.0.0.1:4327/",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
