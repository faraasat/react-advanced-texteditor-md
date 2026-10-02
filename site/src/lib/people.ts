import type { MentionItem } from "react-advanced-texteditor-md";

// A fake directory. A real app would call its own API from `mentions.search`.
const NAMES = [
  "Ada Lovelace", "Alan Turing", "Grace Hopper", "Katherine Johnson", "Margaret Hamilton", "Dennis Ritchie",
  "Barbara Liskov", "Edsger Dijkstra", "Hedy Lamarr", "Linus Torvalds", "Radia Perlman", "Donald Knuth",
  "Frances Allen", "Tim Berners-Lee", "Annie Easley", "John McCarthy", "Joan Clarke", "Ken Thompson",
];

export const PEOPLE: MentionItem[] = NAMES.map((label, i) => {
  const n = String(i + 1).padStart(2, "0");
  const staff = i % 2 === 0;
  return {
    id: `u${n}`,
    label,
    kind: staff ? "staff" : "guest",
    badge: staff ? "Staff" : "Guest",
    color: staff ? 3 : 6,
    description: staff ? "Works here" : "Invited",
    refs: { legacy: `${100 + i}` },
  };
});

export function searchPeople(query: string, { signal }: { signal: AbortSignal }): Promise<MentionItem[]> {
  const q = query.trim().toLowerCase();
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(PEOPLE.filter((p) => !q || p.label.toLowerCase().includes(q)).slice(0, 8)), 80);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
}
