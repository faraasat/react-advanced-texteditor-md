// Build-time facts about the package, read on the server while the static export is generated. Nothing here ships to the browser.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

/** The repository root: the site always builds from site/, one level below it. */
export const ROOT = join(process.cwd(), "..");

export function readVersion(): string {
  return (JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { version: string }).version;
}

/** gzip size of a built file of the wrapper, measured now. null when it cannot be read. */
export function gzipKb(file: string): string | null {
  try {
    return (gzipSync(readFileSync(join(ROOT, "dist", file)), { level: 9 }).length / 1024).toFixed(1);
  } catch {
    return null;
  }
}
