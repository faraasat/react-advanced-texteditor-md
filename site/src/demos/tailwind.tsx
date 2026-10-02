"use client";
import { MarkdownEditor } from "react-advanced-texteditor-md";

// app/globals.css:
//   @import "tailwindcss";
//   @import "advanced-texteditor-md/style.css";      <- add `layer(components)` if a utility below does not win
//   @import "advanced-texteditor-md/tailwind.css";   <- maps --atm-* onto bg-atm-surface, text-atm-fg, border-atm-border, ...
export function TailwindDemo() {
  return (
    <MarkdownEditor
      className="max-w-2xl"
      classNames={{
        root: "rounded-2xl border-2 border-atm-accent shadow-lg",
        toolbar: "bg-atm-surface",
        surface: "min-h-32 text-atm-fg",
        chip: "font-semibold",
      }}
      layout="classic"
      defaultValue={"## Utility classes\n\nEvery slot takes Tailwind classes through `classNames`, and `bg-atm-surface`, `text-atm-fg` and friends follow the editor's theme."}
      minHeight={140}
      maxHeight={240}
      aria-label="Tailwind"
    />
  );
}
