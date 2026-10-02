import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // A hang must still fail, a busy machine must not.
    testTimeout: 30_000,
    // Playwright specs live in e2e/ and call Playwright's test(): vitest must not collect them.
    include: ["test/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", "dist/**", "example/**"],
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    coverage: { provider: "v8", reporter: ["text", "lcov"], include: ["src/**"] },
  },
});
