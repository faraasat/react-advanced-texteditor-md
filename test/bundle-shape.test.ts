// @vitest-environment node
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const root = join(__dirname, "..");
const dist = (f: string) => join(root, "dist", f);
const read = (f: string) => readFileSync(dist(f), "utf8");

beforeAll(() => {
  // Always test what `npm run build` produces now, not a stale dist/.
  execSync("npm run build", { cwd: root, stdio: "pipe" });
}, 120_000);

describe("built bundle shape", () => {
  it('the main entry begins with "use client" (ESM and CJS)', () => {
    for (const f of ["index.mjs", "index.js"]) expect(read(f).trimStart().startsWith('"use client"'), f).toBe(true);
  });

  it("./view has no directive anywhere in its first statement or body", () => {
    for (const f of ["view.mjs", "view.js"]) {
      expect(read(f).trimStart().startsWith('"use client"'), f).toBe(false);
      expect(read(f)).not.toMatch(/use client/);
    }
  });

  it("./view imports no hook, memo, forwardRef, context or react-dom, and has no dynamic import", () => {
    const src = read("view.mjs");
    const names = [...src.matchAll(/import\s*\{([^}]*)\}\s*from\s*"react"/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]));
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) expect(n).not.toMatch(/^use[A-Z]|^memo$|^forwardRef$|^createContext$/);
    expect(src).not.toMatch(/react-dom/);
    expect(src).not.toMatch(/\bimport\s*\(/);
    // No `useXxx(` call of any kind either (a hook bundled from elsewhere would show up here).
    expect(src).not.toMatch(/\buse(State|Effect|LayoutEffect|Memo|Ref|Callback|Context|SyncExternalStore|ImperativeHandle|Id)\b/);
  });

  it("the main entry shares ./view instead of bundling a second copy", () => {
    expect(read("index.mjs")).toMatch(/from"\.\/view\.mjs"/);
    expect(read("index.js")).toMatch(/require\("\.\/view\.js"\)/);
    expect(read("index.mjs")).not.toMatch(/data-atm-standalone-link/); // lives in the renderer only
  });

  it("the core and React stay external (nothing of them is bundled)", () => {
    const src = read("index.mjs");
    expect(src).toMatch(/from"advanced-texteditor-md"/);
    expect(src).toMatch(/from"advanced-texteditor-md\/render"/);
    expect(src).toMatch(/from"react"/);
    expect(src).not.toMatch(/contenteditable/i); // the editor implementation is not inlined
    expect(read("view.mjs")).toMatch(/from"advanced-texteditor-md\/parser"/);
  });

  it("ships no CSS: the core's stylesheet is imported once by the app", () => {
    for (const f of ["index.mjs", "index.js", "view.mjs", "view.js"]) expect(read(f), f).not.toMatch(/\.css["']/);
    expect(existsSync(dist("index.css"))).toBe(false);
  });

  it("every file the exports map names exists, with types for both entries and both formats", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const files: string[] = [];
    for (const [k, v] of Object.entries(pkg.exports as Record<string, unknown>)) {
      if (k === "./package.json") continue;
      const e = v as { import: { types: string; default: string }; require: { types: string; default: string } };
      files.push(e.import.types, e.import.default, e.require.types, e.require.default);
    }
    expect(files).toHaveLength(8);
    for (const f of files) expect(existsSync(join(root, f)), f).toBe(true);
    expect(pkg.sideEffects).toBe(false);
    expect(pkg.publishConfig).toEqual({ access: "public", provenance: true });
    expect(pkg.dependencies["advanced-texteditor-md"]).toBe("^0.3.1");
    expect(pkg.peerDependencies).toEqual({ react: ">=17.0.0", "react-dom": ">=17.0.0" });
  });

  it("the type declarations of ./view do not pull the editor", () => {
    expect(read("view.d.ts")).not.toMatch(/useMarkdownEditor|MarkdownEditorProps/);
    expect(read("index.d.ts")).toMatch(/MarkdownEditorProps/);
  });

  it("scripts/check-next-compat.mjs passes against this build", () => {
    const out = execSync("node scripts/check-next-compat.mjs", { cwd: root, encoding: "utf8" });
    expect(out).toContain("Next.js compatibility checks passed");
  });

  it("scripts/size.mjs passes: main <= 6 kB gzip, view <= 5 kB gzip", () => {
    const out = execSync("node scripts/size.mjs", { cwd: root, encoding: "utf8" });
    expect(out).not.toContain("FAIL");
  });
});
