import { useRef, useState } from "react";
import { MarkdownEditor, MarkdownView, useEditorState, useMarkdownEditor } from "react-advanced-texteditor-md";
import type { EditorInstance, MentionItem } from "react-advanced-texteditor-md";
import { createPutUploader } from "advanced-texteditor-md/uploaders";

const DIRECTORY: MentionItem[] = [
  { id: "u1", label: "Jane Doe", kind: "person", description: "Design", badge: "Staff", color: 3, refs: { legacy: "123" } },
  { id: "u2", label: "Jack Frost", kind: "person", description: "Support", badge: "Staff", color: 3 },
  { id: "t1", label: "Platform", kind: "team", description: "Team", badge: "Team", color: "#0d9488" },
];

/** A fake directory: a short delay, like a real search. */
const search = (q: string, { signal }: { signal: AbortSignal }) =>
  new Promise<MentionItem[]>((resolve, reject) => {
    const t = setTimeout(() => resolve(DIRECTORY.filter((p) => p.label.toLowerCase().includes(q.toLowerCase()))), 60);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    });
  });

const INITIAL = "# Welcome\n\nType here. Mention someone with @ and drop an image.";
const SAMPLE = "# Loaded from state\n\n- one\n- two\n\n[@Jane Doe](mention:person/u1?legacy=123) wrote **this**.\n\n| a | b |\n|---|---|\n| 1 | 2 |";

function Words({ editor }: { editor: EditorInstance | null }) {
  const words = useEditorState(editor, (e) => e.getStats().words, { events: ["change"], fallback: 0 });
  const mode = useEditorState(editor, (e) => e.getMode(), { events: ["mode"], fallback: "wysiwyg" });
  return (
    <p data-testid="stats">
      <span data-testid="words">{words}</span> words, mode <span data-testid="mode">{mode}</span>
    </p>
  );
}

function Headless() {
  const { ref, value, stats, ready } = useMarkdownEditor({ defaultValue: "headless", layout: "minimal" });
  return (
    <section data-testid="headless">
      <h2>Headless hook</h2>
      <div ref={ref} />
      <p data-testid="headless-out">
        {ready ? "ready" : "mounting"}: {value} ({stats.characters})
      </p>
    </section>
  );
}

export function App() {
  const [md, setMd] = useState(INITIAL);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [readOnly, setReadOnly] = useState(false);
  const [editor, setEditor] = useState<EditorInstance | null>(null);
  const [saved, setSaved] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [renders, setRenders] = useState(0);
  const chat = useRef<EditorInstance>(null);
  const send = (markdown: string) => {
    if (!markdown.trim()) return;
    setMessages((p) => [...p, markdown]);
    chat.current?.setValue("");
  };

  return (
    <div className="app" data-theme={theme}>
      <header>
        <h1>react-advanced-texteditor-md</h1>
        <button onClick={() => setTheme("light")}>Light</button>
        <button onClick={() => setTheme("dark")}>Dark</button>
        <button onClick={() => setReadOnly((r) => !r)} aria-pressed={readOnly}>
          Read only
        </button>
        <button onClick={() => setMd(SAMPLE)}>Load sample</button>
        <button onClick={() => setRenders((n) => n + 1)}>Re-render ({renders})</button>
      </header>

      <section data-testid="controlled">
        <h2>Controlled</h2>
        {/* Every object below is a NEW object on every render, on purpose: the editor must not be recreated. */}
        <MarkdownEditor
          value={md}
          onChange={setMd}
          onReady={setEditor}
          theme={theme}
          readOnly={readOnly}
          placeholder="Write something..."
          aria-label="Controlled editor"
          minHeight={140}
          mentions={{ search, trigger: "@", groupBy: (p) => p.badge }}
          chips={[{ scheme: "mention", kinds: { person: { color: 3 }, team: { color: "#0d9488", label: "Team" } } }]}
          upload={{
            handler: createPutUploader({ endpoint: (f) => `/upload/${encodeURIComponent(f.name)}`, resolveUrl: (r) => r.headers.get("Location") ?? "" }),
            allowExtensions: ["png", "jpg", "pdf"],
          }}
          features={{ headings: [1, 2, 3] }}
          cards={{ getCard: (c) => ({ title: c.label, subtitle: "Profile card" }), delayMs: 100 }}
        />
        <Words editor={editor} />
        <pre data-testid="md-out">{md}</pre>
      </section>

      <section data-testid="view-section">
        <h2>MarkdownView of the same Markdown</h2>
        <MarkdownView markdown={md} theme={theme} chips={[{ scheme: "mention", kinds: { person: { color: 3 }, team: { color: "#0d9488", label: "Team" } } }]} onChipClick={(c) => setSaved(`clicked ${c.label}`)} cards={{ getCard: (c) => ({ title: c.label, subtitle: "Profile card" }), delayMs: 100 }} />
        <p data-testid="chip-out">{saved}</p>
      </section>

      <section data-testid="form-section">
        <h2>In a form</h2>
        <form
          data-testid="form"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            setSaved(`title=${String(data.get("title"))}|body=${String(data.get("body"))}`);
          }}
        >
          <input name="title" defaultValue="T" aria-label="Title" />
          <MarkdownEditor name="body" defaultValue="initial **body**" theme={theme} aria-label="Body" />
          <button type="submit">Save</button>
          <button type="reset">Reset</button>
        </form>
        <p data-testid="form-out">{saved}</p>
      </section>

      <section data-testid="chat">
        <h2>Chat (bottom-bar + children)</h2>
        {messages.map((m, i) => (
          <div key={i} className="msg" data-testid="msg">
            <MarkdownView markdown={m} />
          </div>
        ))}
        <MarkdownEditor ref={chat} layout="bottom-bar" theme={theme} placeholder="Reply..." aria-label="Reply" onSubmit={send}>
          <button type="button" data-testid="send" onClick={() => send(chat.current?.getValue() ?? "")}>
            Send
          </button>
        </MarkdownEditor>
      </section>

      <Headless />
    </div>
  );
}
