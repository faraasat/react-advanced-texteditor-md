"use client";
import { MarkdownEditor, definePlugin, defineInlineSyntax } from "react-advanced-texteditor-md";
import { highlightMark, callout, kbd, subSup } from "advanced-texteditor-md/plugins";

// Define plugins and syntaxes at module scope. (Inline is fine too: options are compared by value.)
const insertToday = (ed: { insertText(text: string): void }) => ed.insertText(new Date().toISOString().slice(0, 10));

const today = definePlugin({
  name: "today",
  toolbar: [{ id: "today", label: "Insert today's date", icon: "📅", command: (ed) => (insertToday(ed), true) }],
  slash: [{ id: "today", label: "Today's date", keywords: ["date"], run: insertToday }],
});

// ||text|| becomes <span class="spoiler">; style .spoiler in your CSS.
const spoiler = defineInlineSyntax({ name: "spoiler", open: "||", tag: "span", className: "spoiler" });

export function PluginsDemo() {
  return (
    <MarkdownEditor
      defaultValue={"==Highlighted== text, H~2~O and x^2^, press [[Ctrl]] [[K]].\n\nA ||spoiler|| from custom syntax.\n\n::: tip\nA callout is a block syntax from a plugin.\n:::"}
      layout="minimal"
      minHeight={140}
      maxHeight={260}
      aria-label="Plugins"
      plugins={[highlightMark, callout, kbd, subSup, today]}
      syntax={{ inline: [spoiler] }}
    />
  );
}
