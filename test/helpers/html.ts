/** Normalise HTML so two serialisations of the same DOM compare equal: sorted attributes, no insignificant differences. */
export function normalize(html: string): string {
  const t = document.createElement("template");
  t.innerHTML = html;
  const walk = (n: Node): string => {
    if (n.nodeType === 3) return (n.textContent ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    if (n.nodeType !== 1) return "";
    const e = n as Element;
    const attrs = [...e.attributes]
      .filter((a) => !["readonly", "contenteditable"].includes(a.name))
      .map((a) => `${a.name}="${a.value}"`)
      .sort()
      .join(" ");
    const kids = [...e.childNodes].map(walk).join("");
    return `<${e.localName}${attrs ? " " + attrs : ""}>${kids}</${e.localName}>`;
  };
  return [...t.content.childNodes].map(walk).join("");
}
