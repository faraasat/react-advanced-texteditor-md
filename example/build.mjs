// Bundles the example with esbuild (the one tsup already depends on) from the BUILT package in dist/.
//   client: example/dist/client.js (+ chunks), the page, the core's stylesheet
//   server: example/dist/server.cjs (react-dom/server render of the same App, used by /ssr)
import { build } from "esbuild";
import { copyFileSync, cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(here, "dist");
const require = createRequire(join(root, "package.json"));
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const alias = {
  "react-advanced-texteditor-md": join(root, "dist/index.mjs"),
};
const common = { bundle: true, jsx: "automatic", target: "es2020", logLevel: "error", define: { "process.env.NODE_ENV": '"development"' } };

await build({ ...common, entryPoints: [join(here, "src/client.tsx")], outdir: out, format: "esm", splitting: true, alias, sourcemap: false });
await build({
  ...common,
  entryPoints: [join(here, "src/server.tsx")],
  outfile: join(out, "server.cjs"),
  format: "cjs",
  platform: "node",
  alias: { "react-advanced-texteditor-md": join(root, "dist/index.js") },
  // React and the core stay external: the server loads the same copies it would in an app.
  external: ["react", "react-dom", "react-dom/server", "advanced-texteditor-md", "advanced-texteditor-md/*"],
  define: {},
});
copyFileSync(join(here, "index.html"), join(out, "index.html"));
copyFileSync(join(here, "example.css"), join(out, "example.css"));
copyFileSync(require.resolve("advanced-texteditor-md/style.css"), join(out, "style.css"));
void cpSync;
console.log("example built:", out);
