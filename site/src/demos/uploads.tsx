"use client";
import { useRef, useState } from "react";
import { MarkdownEditor, type EditorInstance } from "react-advanced-texteditor-md";

// A fake uploader that "stores" the file in memory and reports progress. Use createPutUploader (and friends) from
// "advanced-texteditor-md/uploaders" against a real endpoint.
function fakeUpload(file: File, { signal, onProgress }: { signal: AbortSignal; onProgress: (p: number) => void }) {
  return new Promise<{ url: string; name: string }>((resolve, reject) => {
    let p = 0;
    const timer = setInterval(() => {
      p = Math.min(1, p + 0.2);
      onProgress(p);
      if (p >= 1) {
        clearInterval(timer);
        resolve({ url: URL.createObjectURL(file), name: file.name });
      }
    }, 90);
    signal.addEventListener("abort", () => {
      clearInterval(timer);
      reject(new DOMException("Upload aborted", "AbortError"));
    });
  });
}

export function UploadsDemo() {
  const ref = useRef<EditorInstance>(null);
  const [log, setLog] = useState<string[]>([]);
  const png = () => new File([Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="), (c) => c.charCodeAt(0))], "photo.png", { type: "image/png" });
  return (
    <>
      <MarkdownEditor
        ref={ref}
        defaultValue="Drop a file here, or use the buttons below."
        layout="minimal"
        minHeight={90}
        maxHeight={180}
        aria-label="Uploads"
        upload={{
          handler: fakeUpload,
          allowExtensions: ["png", "jpg", "pdf"], // allow-list
          denyExtensions: ["exe", "svg"], // the deny list always wins
          maxFileSizeBytes: 1024 * 1024,
          urls: { allowedSchemes: ["http", "https", "blob"] },
        }}
        onUpload={(e) => setLog((l) => [`${e.type}: ${e.file.name}${e.type === "rejected" ? ` (${e.reason})` : ""}`, ...l].slice(0, 5))}
      />
      <div className="controls">
        <button type="button" className="btn btn--sm" onClick={() => ref.current?.uploadFiles([png()])}>
          Upload photo.png
        </button>
        <button type="button" className="btn btn--sm" onClick={() => ref.current?.uploadFiles([new File(["MZ"], "setup.exe")])}>
          Upload setup.exe
        </button>
        <button type="button" className="btn btn--sm" onClick={() => ref.current?.uploadFiles([new File([new Uint8Array(3 * 1024 * 1024)], "scan.pdf", { type: "application/pdf" })])}>
          Upload scan.pdf (3 MB)
        </button>
      </div>
      <ul className="log" aria-live="polite" aria-label="Upload events" data-testid="upload-log">
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </>
  );
}
