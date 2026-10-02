"use client";
import { useState } from "react";
import { MarkdownEditor } from "react-advanced-texteditor-md";

const THEMES = ["light", "dark", "sepia", "slate", "contrast"] as const;

export function ThemingDemo() {
  const [preset, setPreset] = useState<(typeof THEMES)[number]>("sepia");
  const [accent, setAccent] = useState("#0e7490");
  const [custom, setCustom] = useState(false);
  return (
    <>
      <div className="controls">
        <div className="field">
          <label htmlFor="theming-preset">Theme</label>
          <select id="theming-preset" value={preset} onChange={(e) => setPreset(e.target.value as (typeof THEMES)[number])}>
            {THEMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <label className="check">
          <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} /> Custom tokens
        </label>
        <div className="field">
          <label htmlFor="theming-accent">Accent</label>
          <input id="theming-accent" type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
        </div>
      </div>
      {/* The extra themes are picked by data-atm-theme on any ancestor. With `theme` omitted the editor follows it. */}
      <div data-atm-theme={preset}>
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
    </>
  );
}
