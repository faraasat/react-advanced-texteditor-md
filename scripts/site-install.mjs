// Installs the site's dependencies (npm install inside site/).
//
// The site depends on the PUBLISHED core (`advanced-texteditor-md`, a regular dependency like this package's own) and on this
// package as a copy of what `npm pack` would publish ("file:.."). Until the core is published, the registry answers 404 and a
// plain `npm install` fails. In that one case this falls back to installing the core from a tarball of the sibling checkout
// (../advanced-texteditor-md, built with `npm run build`), without saving it, so site/package.json never changes.
//
//   npm run site:install
//   CORE_DIR=/path/to/advanced-texteditor-md npm run site:install      (a checkout elsewhere)
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (args, opts = {}) => spawnSync(npm, args, { cwd: site, encoding: "utf8", ...opts });

const first = run(["install"], { stdio: ["inherit", "inherit", "pipe"] });
if (first.status === 0) process.exit(0);

const err = first.stderr ?? "";
if (!/E404|404 Not Found|ETARGET|No matching version/.test(err) || !/advanced-texteditor-md/.test(err)) {
  process.stderr.write(err);
  process.exit(first.status ?? 1);
}

const core = resolve(process.env.CORE_DIR ?? join(root, "..", "advanced-texteditor-md"));
if (!existsSync(join(core, "dist", "index.js"))) {
  process.stderr.write(
    `advanced-texteditor-md is not on npm yet, and no built checkout was found at ${core}.\n` +
      `Build the core there (npm run build), or set CORE_DIR, or publish the core first.\n`,
  );
  process.exit(1);
}
console.log(`advanced-texteditor-md is not on npm yet: installing it from ${core} (npm pack).`);
const out = mkdtempSync(join(tmpdir(), "atm-core-"));
const pack = spawnSync(npm, ["pack", "--pack-destination", out, "--silent"], { cwd: core, encoding: "utf8" });
if (pack.status !== 0) {
  process.stderr.write(pack.stderr ?? "");
  process.exit(pack.status ?? 1);
}
const tgz = readdirSync(out).find((f) => f.endsWith(".tgz"));
const second = run(["install", "--no-save", join(out, tgz)], { stdio: "inherit" });
process.exit(second.status ?? 1);
