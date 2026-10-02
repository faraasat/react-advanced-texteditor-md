import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { CodeBlock } from "./code-block";

/**
 * A demo beside its own source. The code panel is read from the demo's file at build time, so what you copy is exactly
 * what is running next to it and cannot drift.
 */
export function DemoCard({
  id,
  title,
  children,
  file,
  note,
  badge,
}: {
  id: string;
  title: string;
  children: ReactNode;
  file: string;
  note: ReactNode;
  badge?: string;
}) {
  const code = readFileSync(join(process.cwd(), "src/demos", file), "utf8").trim();
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20 py-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={`${id}-h`} className="text-xl font-bold tracking-tight">
          {title}
        </h2>
        {badge ? <span className="rounded-full bg-panel-2 px-2.5 py-0.5 text-xs font-semibold text-muted">{badge}</span> : null}
      </div>
      <p className="mb-4 max-w-3xl text-[0.95rem] text-muted">{note}</p>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-line bg-panel p-4 shadow-sm" data-demo={id}>
          {children}
        </div>
        <details open className="group min-w-0 lg:[&>summary]:hidden">
          <summary className="mb-2 cursor-pointer text-sm font-semibold text-link lg:hidden">Code</summary>
          <CodeBlock code={code} label={`src/demos/${file}`} />
        </details>
      </div>
    </section>
  );
}
