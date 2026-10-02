import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/config";
import { DOC_PAGES } from "@/lib/docs";

export const metadata: Metadata = { title: "Documentation", description: `The ${SITE.name} docs, rendered by the package itself.`, alternates: { canonical: `${SITE.url}docs/` } };

export default function DocsIndex() {
  return (
    <div className="wrap page">
      <h1>Documentation</h1>
      <p className="lead">
        These pages are the repository&apos;s README and changelog, rendered at build time by this package&apos;s own server-safe <code>MarkdownView</code> from{" "}
        <code>react-advanced-texteditor-md/view</code>. The editor&apos;s options are documented in the{" "}
        <a href="https://faraasat.github.io/advanced-texteditor-md/docs/reference/">core&apos;s docs</a>.
      </p>
      <div className="cards">
        {DOC_PAGES.map((p) => (
          <Link prefetch={false} key={p.slug} className="card" href={`/docs/${p.slug}/`}>
            <h2 className="card__title">{p.nav}</h2>
            <p>{p.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
