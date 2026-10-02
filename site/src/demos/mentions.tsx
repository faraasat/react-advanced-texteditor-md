"use client";
import { useState } from "react";
import { MarkdownEditor } from "react-advanced-texteditor-md";
import { searchPeople } from "@/lib/people"; // a fake directory; yours would call your API

export function MentionsDemo() {
  const [ids, setIds] = useState<string[]>(["u01"]);
  return (
    <div className="space-y-3">
      <MarkdownEditor
        defaultValue="Ping [@Ada Lovelace](mention:staff/u01?legacy=100) and type @ for more."
        layout="minimal"
        minHeight={100}
        maxHeight={200}
        aria-label="Mentions"
        mentions={{ trigger: "@", search: searchPeople, groupBy: (p) => p.badge }}
        chips={[{ scheme: "mention", kinds: { staff: { color: 3, label: "Staff" }, guest: { color: 6, label: "Guest" } } }]}
        onMentionsChange={(chips) => setIds(chips.map((c) => c.id))}
      />
      <p className="text-sm text-muted" data-testid="mention-ids">
        Mentioned: {ids.length ? ids.join(", ") : "nobody yet"}
      </p>
    </div>
  );
}
