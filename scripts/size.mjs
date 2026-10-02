#!/usr/bin/env node
/**
 * Size budget: gzip of the wrapper ALONE, never the core (it is external).
 *   main entry (editor, hooks, client MarkdownView): <= 6 kB
 *   ./view (server-safe renderer):                    <= 5 kB
 * The main entry imports the renderer from ./view rather than bundling it twice, so
 * "main + view" is also printed: that is what an app using both ships once.
 */
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const gz = (f) => gzipSync(readFileSync(join(dist, f)), { level: 9 }).length;
const KB = 1024;
const budgets = { "index.mjs": 6 * KB, "index.js": 6 * KB, "view.mjs": 5 * KB, "view.js": 5 * KB };
let fail = 0;
for (const [f, max] of Object.entries(budgets)) {
  const n = gz(f);
  const bad = n > max;
  if (bad) fail++;
  console.log(`${bad ? "FAIL" : "ok  "} ${f.padEnd(10)} ${(n / KB).toFixed(2)} kB gzip (budget ${max / KB} kB)`);
}
console.log(`     main + view together (ESM): ${((gz("index.mjs") + gz("view.mjs")) / KB).toFixed(2)} kB gzip`);
process.exit(fail ? 1 : 0);
