"use client";
import { useState } from "react";
import { MarkdownEditor } from "react-advanced-texteditor-md";

const THEMES = ["light", "dark", "sepia", "slate", "contrast"] as const;

export function ThemingDemo() {
  const [preset, setPreset] = useState<(typeof THEMES)[number]>("sepia");
  const [accent, setAccent] = useState("#0e7490");
  const [custom, setCustom] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1 font-semibold">
          Theme
          <select value={preset} onChange={(e) => setPreset(e.target.value as (typeof THEMES)[number])} className="rounded-md border border-line bg-panel px-2 py-1 font-normal">
            {THEMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} /> Custom tokens
        </label>
        <label className="flex flex-col gap-1 font-semibold">
          Accent
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-8 w-12 rounded border border-line" />
        </label>
      </div>
      {/* The extra themes are picked by data-atm-theme on any ancestor. With `theme` omitted the editor follows it. */}
      <div data-atm-theme={preset} className="rounded-xl">
        {/* `theme` takes "light" | "dark" | "auto" or tokens, and changes in place: the caret and undo history survive. */}
        <MarkdownEditor
          defaultValue={"## Theming\n\nPick a theme, or turn on **custom tokens** and change the accent. Mention [@Ada](mention:staff/u01) too."}
          layout="minimal"
          minHeight={120}
          maxHeight={220}
          aria-label="Theming"
          theme={custom ? { accent, radius: "14px", palette: ["#e11d48", "#0d9488", accent] } : undefined}
        />
      </div>
    </div>
  );
}
