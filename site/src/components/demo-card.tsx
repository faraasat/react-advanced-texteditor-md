import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { Code } from "./code";
import { FeatureCard } from "./feature-card";
import type { IconName } from "./icons";

/**
 * A demo beside its own source. The code panel is read from the demo's file at build time, so what you copy is exactly
 * what is running next to it and cannot drift. The Live demo / Code tabs keep the demo mounted while the code is shown.
 */
export function DemoCard({ id, title, icon, file, note, children }: { id: string; title: string; icon: IconName; file: string; note: ReactNode; children: ReactNode }) {
  const code = readFileSync(join(process.cwd(), "src/demos", file), "utf8").trim();
  return (
    <FeatureCard
      id={id}
      title={title}
      icon={icon}
      text={note}
      code={
        <Code language="tsx" label={`src/demos/${file}`} copyTarget={`demo-${id}`}>
          {code}
        </Code>
      }
    >
      {children}
    </FeatureCard>
  );
}
