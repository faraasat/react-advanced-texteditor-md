import type { Metadata } from "next";
import "./globals.css";
import { BASE_PATH } from "@/lib/base";
import { Analytics } from "@/components/analytics";

const SITE = "https://faraasat.github.io/react-advanced-texteditor-md/";
const DESCRIPTION =
  "React bindings for advanced-texteditor-md: a controlled or uncontrolled MarkdownEditor, a server-component friendly MarkdownView, and hooks. A WYSIWYG editor that stores Markdown.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "react-advanced-texteditor-md: live demo",
  description: DESCRIPTION,
  alternates: { canonical: SITE },
  icons: { icon: `${BASE_PATH}/favicon.svg` },
  openGraph: { title: "react-advanced-texteditor-md", description: DESCRIPTION, type: "website", url: SITE },
};

// Set the theme before first paint so there is no flash: the stored choice, else the OS.
const THEME_INIT = `(function(){var t;try{t=localStorage.getItem("ratm-site-theme")}catch(e){}if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var r=document.documentElement;r.setAttribute("data-theme",t);r.setAttribute("data-atm-theme",t)})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The attributes are set by the script before hydration, so React must not warn about them.
    <html lang="en" data-theme="light" data-atm-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-screen bg-page text-ink antialiased">{children}
        <Analytics />
      </body>
    </html>
  );
}
