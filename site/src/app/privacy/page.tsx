import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy · react-advanced-texteditor-md", description: "How the demo site measures visits, and how to opt out." };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-bold [&_li]:mt-2 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      <h1 id="privacy" className="text-3xl font-extrabold tracking-tight">
        Privacy
      </h1>
      <p>
        The demo site uses privacy-respecting analytics: <a href="https://aptabase.com">Aptabase</a> (cookieless) and, only with your consent, Google Analytics. The npm package itself collects nothing.
      </p>
      <h2>What is measured</h2>
      <ul>
        <li>
          <strong>Aptabase</strong> receives a coarse event with no cookie and nothing stored on your device: page views, theme and mode switches, clicks on the copy buttons, and clicks on links to GitHub or npm (the host only). It starts when the page loads.
        </li>
        <li>
          <strong>Google Analytics</strong> loads only after you press Accept, with consent mode denied until then. Google states that GA4 does not log or store IP addresses.
        </li>
        <li>Nothing you type into an editor is ever sent. The editors run entirely in your browser.</li>
      </ul>
      <h2>Do Not Track</h2>
      <p>If your browser sends Do Not Track or Global Privacy Control, no analytics run at all and no banner is shown.</p>
      <h2>Your choice</h2>
      <p id="consent-status" role="status">
        Google Analytics is off until you choose.
      </p>
      <p className="flex gap-2">
        <button type="button" data-consent="granted" aria-pressed="false" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-ink">
          Accept Google Analytics
        </button>
        <button type="button" data-consent="denied" aria-pressed="false" className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm font-semibold">
          Decline
        </button>
      </p>
      <p className="text-sm text-muted">
        The choice is kept in this browser&apos;s local storage. <Link href="/">Back to the demos</Link>.
      </p>
    </main>
  );
}
