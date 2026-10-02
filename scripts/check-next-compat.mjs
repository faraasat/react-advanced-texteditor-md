#!/usr/bin/env node
/**
 * Next.js / server compatibility smoke test, with no DOM.
 *
 * Imports the BUILT entries (ESM and CJS) in plain Node, where `window`, `document` and
 * `navigator` do not exist, and asserts:
 *   - importing neither entry touches a browser global at the top level (a bare `window.x` would
 *     throw a ReferenceError here; `typeof window` guards are fine and are what the code uses);
 *   - `./view` has no "use client" directive and imports no hook, `memo` or `forwardRef` from React,
 *     so a React Server Component can import it;
 *   - the main entry starts with the directive (Next.js treats it as a Client Component boundary);
 *   - both entries render on the server with react-dom/server, and the SSR markup of the editor
 *     is the static fallback.
 *
 * Run after `npm run build`:  node scripts/check-next-compat.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = (f) => join(root, "dist", f);
const require = createRequire(import.meta.url);
let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  ok   " + msg);
  else {
    failures++;
    console.error("  FAIL " + msg);
  }
};

for (const f of ["index.mjs", "index.js", "view.mjs", "view.js"]) {
  if (!existsSync(dist(f))) {
    console.error(`dist/${f} is missing: run \`npm run build\` first.`);
    process.exit(1);
  }
}

console.log("no DOM globals");
for (const g of ["window", "document", "self", "localStorage", "HTMLElement"]) ok(typeof globalThis[g] === "undefined", `${g} is undefined in this process`);

console.log("directives");
const first = (f) => readFileSync(dist(f), "utf8").trimStart();
ok(first("index.mjs").startsWith('"use client"'), 'dist/index.mjs starts with "use client"');
ok(first("index.js").startsWith('"use client"'), 'dist/index.js starts with "use client"');
ok(!/^\s*["']use client["']/.test(first("view.mjs")), "dist/view.mjs has no directive");
ok(!/^\s*["']use client["']/.test(first("view.js")), "dist/view.js has no directive");
ok(!/use client/.test(readFileSync(dist("view.mjs"), "utf8")), 'dist/view.mjs never mentions "use client"');

console.log("./view is server-component safe");
const viewSrc = readFileSync(dist("view.mjs"), "utf8");
const reactImports = [...viewSrc.matchAll(/import\s*\{([^}]*)\}\s*from\s*"react"/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]));
ok(reactImports.length > 0, `imports from react: ${reactImports.join(", ")}`);
ok(!reactImports.some((n) => /^use[A-Z]|^memo$|^forwardRef$|^createContext$|^Component$|^PureComponent$/.test(n)), "no hook, memo, forwardRef or context imported from react");
ok(!/\bimport\s*\(/.test(viewSrc), "no dynamic import in ./view");
ok(!/from"react-dom/.test(viewSrc), "no react-dom in ./view");
ok(!/\b(window|document|localStorage)\b/.test(viewSrc), "no browser global is mentioned in ./view");

console.log("import with no DOM");
let esmIndex, esmView;
try {
  esmIndex = await import(pathToFileURL(dist("index.mjs")).href);
  ok(true, "dist/index.mjs imports");
} catch (e) {
  ok(false, "dist/index.mjs imports: " + e.message);
}
try {
  esmView = await import(pathToFileURL(dist("view.mjs")).href);
  ok(true, "dist/view.mjs imports");
} catch (e) {
  ok(false, "dist/view.mjs imports: " + e.message);
}
let cjsIndex, cjsView;
try {
  cjsIndex = require(dist("index.js"));
  cjsView = require(dist("view.js"));
  ok(true, "dist/index.js and dist/view.js require()");
} catch (e) {
  ok(false, "CJS require: " + e.message);
}
ok(typeof globalThis.window === "undefined" && typeof globalThis.document === "undefined", "importing created no window or document");

console.log("exports");
for (const [label, mod] of [["index.mjs", esmIndex], ["index.js", cjsIndex]]) {
  for (const name of ["MarkdownEditor", "MarkdownView", "renderMarkdownToReact", "useMarkdownEditor", "useEditorState", "useEditorValue", "definePlugin"]) {
    ok(mod && mod[name] !== undefined, `${label} exports ${name}`);
  }
}
for (const [label, mod] of [["view.mjs", esmView], ["view.js", cjsView]]) {
  ok(mod && typeof mod.MarkdownView === "function" && typeof mod.renderMarkdownToReact === "function", `${label} exports MarkdownView and renderMarkdownToReact`);
  ok(mod && !("MarkdownEditor" in mod) && !("useMarkdownEditor" in mod), `${label} does not export the editor or hooks`);
}

console.log("server render");
const React = require("react");
const { renderToString } = require("react-dom/server");
if (esmIndex && esmView) {
  const md = "# Title\n\nA **bold** claim with $x^2$ and [@Jane](mention:person/1).";
  const editor = renderToString(React.createElement(esmIndex.MarkdownEditor, { defaultValue: md }));
  ok(editor.includes('<h1 class="atm-h1">Title</h1>') && editor.includes("atm-react-fallback"), "MarkdownEditor SSR is the static copy of the Markdown");
  const viewA = renderToString(React.createElement(esmView.MarkdownView, { markdown: md }));
  const viewB = renderToString(React.createElement(esmIndex.MarkdownView, { markdown: md }));
  ok(viewA.includes("<math") && viewA.includes("atm-chip"), "./view MarkdownView renders math and chips");
  ok(viewA.replace(/<!--.*?-->/g, "") === viewB.replace(/<!--.*?-->/g, ""), "client and server MarkdownView produce the same markup");
}
if (cjsIndex) {
  const html = renderToString(React.createElement(cjsIndex.MarkdownEditor, { defaultValue: "*x*" }));
  ok(html.includes('<em class="atm-em">x</em>'), "CJS build renders on the server too");
}
ok(typeof globalThis.window === "undefined", "still no window after rendering");

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nNext.js compatibility checks passed");
