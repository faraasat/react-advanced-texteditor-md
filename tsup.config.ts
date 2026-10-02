import { defineConfig, type Options } from "tsup";
import type { Plugin } from "esbuild";

/**
 * The client entry renders Markdown with the very same code as `./view`, so it imports it from the
 * built `view` file instead of bundling a second copy (about 4 kB gzip). `./view-core` and
 * `./view-pure` are the source modules behind that entry; here they become an external, relative
 * import of the sibling file, in the format being built.
 */
const shareView: Plugin = {
  name: "share-view",
  setup(build) {
    const ext = build.initialOptions.format === "esm" ? "./view.mjs" : "./view.js";
    build.onResolve({ filter: /^\.\/view-(core|pure)$/ }, () => ({ path: ext, external: true }));
  },
};

const shared: Options = {
  format: ["cjs", "esm"],
  dts: true,
  // `clean` is deliberately off: the two configs below run in parallel, and one cleaning dist/ would
  // delete the other's output. `npm run build` is `tsup` after `rm -rf dist` (see scripts.build).
  clean: false,
  target: "es2020",
  // The core and React stay external. Both are real dependencies / peers of the published package.
  external: ["react", "react-dom", "react/jsx-runtime", "advanced-texteditor-md", /^advanced-texteditor-md\//],

  // Single-entry builds: code splitting produces shared chunks that a `banner` cannot reach, which
  // is how a "use client" directive gets lost (see react-consent-management-banner). Off.
  splitting: false,

  minify: true,
  sourcemap: false,
  shims: false,
  // NOTE: do not enable tsup's `treeshake`. It runs an extra rollup pass after esbuild that strips
  // the banner, silently shipping a client component without its directive. esbuild already
  // tree-shakes the bundle.
};

export default defineConfig([
  {
    ...shared,
    // Everything that uses hooks, effects or the browser: a Client Component boundary in Next.js.
    entry: { index: "src/index.ts" },
    banner: { js: '"use client";' },
    esbuildPlugins: [shareView],
  },
  {
    ...shared,
    // `./view`: the server-safe renderer. No hooks, no effects, no banner, so a React Server
    // Component can import it. `scripts/check-next-compat.mjs` and test/bundle-shape.test.ts guard it.
    entry: { view: "src/view.ts" },
  },
]);
