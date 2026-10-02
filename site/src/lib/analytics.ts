// Privacy-respecting analytics for THIS DEMO SITE ONLY. The library never loads or imports this file.
//
//  - Do Not Track or Global Privacy Control: nothing runs, no banner.
//  - Aptabase (cookieless, nothing stored) is sent with one fetch to its documented HTTP endpoint: no third-party script.
//  - Google Analytics loads ONLY after the visitor presses Accept (consent mode defaults to denied first).
//  - Only coarse events are sent. Never editor content. See docs/.research/site-analytics-2026-10-02.md.

/** The one place the identifiers live. They are public client-side identifiers, not secrets. */
export const ANALYTICS = {
  aptabaseKey: "A-EU-4289711788",
  aptabaseUrl: "https://eu.aptabase.com/api/v0/event", // the EU region of the App Key
  gaId: "G-CSHX6YP98W",
  consentKey: "ratm-site-consent",
};

const safe = <T,>(fn: () => T, fallback?: T): T | undefined => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

/** True when the browser asks not to be tracked (Do Not Track or Global Privacy Control). */
export function trackingBlocked() {
  return safe(
    () => navigator.doNotTrack === "1" || (window as Window & { doNotTrack?: string }).doNotTrack === "1" || (navigator as Navigator & { msDoNotTrack?: string }).msDoNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true,
    false,
  );
}

export const getConsent = (): string | null => safe(() => localStorage.getItem(ANALYTICS.consentKey), null) ?? null;
const setConsent = (v: string) => safe(() => localStorage.setItem(ANALYTICS.consentKey, v));

let session: string | null = null;
let last = 0;
/** In memory only, renewed after an hour of inactivity: the same scheme as the Aptabase SDK. Nothing is stored. */
function sessionId() {
  const now = Date.now();
  if (!session || now - last > 3600_000) session = String(Math.floor(now / 1000)) + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
  last = now;
  return session;
}

/** Sends one coarse event. `props` must be short strings or numbers, never editor content. */
export function track(name: string, props?: Record<string, string | number>) {
  if (trackingBlocked()) return;
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  safe(() =>
    fetch(ANALYTICS.aptabaseUrl, {
      method: "POST",
      credentials: "omit",
      keepalive: true,
      headers: { "Content-Type": "application/json", "App-Key": ANALYTICS.aptabaseKey },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        sessionId: sessionId(),
        eventName: name,
        systemProps: { locale: navigator.language, isDebug: local, appVersion: "", sdkVersion: "inline-http@1" },
        props,
      }),
    }).catch(() => undefined),
  );
}

let gaLoaded = false;
function loadGoogle() {
  if (gaLoaded || trackingBlocked()) return;
  gaLoaded = true;
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  // Consent mode: denied by default, set before any config command; then granted, because we only get here after Accept.
  w.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
  w.gtag("js", new Date());
  w.gtag("config", ANALYTICS.gaId, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
  w.gtag("consent", "update", { analytics_storage: "granted" });
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ANALYTICS.gaId);
  document.head.append(s);
}

function banner() {
  let el: HTMLElement | null = document.getElementById("consent-banner");
  if (el) return el;
  el = document.createElement("div");
  el.id = "consent-banner";
  el.setAttribute("role", "region");
  el.setAttribute("aria-label", "Analytics consent");
  el.innerHTML =
    '<p id="consent-text">This demo site counts visits with Aptabase, which is cookieless. May it also use Google Analytics, which sets cookies? ' +
    'The npm package itself collects nothing. <a data-privacy-link href="#">Privacy</a></p>' +
    '<div class="consent-actions"><button type="button" class="btn small" data-consent="granted">Accept</button>' +
    '<button type="button" class="btn small secondary" data-consent="denied">Decline</button></div>';
  el.querySelector("[data-privacy-link]")!.setAttribute("href", (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/privacy/");
  document.body.append(el);
  return el;
}

export function reflect() {
  const c = getConsent();
  const out = document.getElementById("consent-status");
  if (out) {
    out.textContent = trackingBlocked()
      ? "Your browser sends Do Not Track or Global Privacy Control, so no analytics run at all."
      : c === "granted"
        ? "Google Analytics is on (you accepted)."
        : c === "denied"
          ? "Google Analytics is off (you declined)."
          : "Google Analytics is off until you choose.";
  }
  for (const b of document.querySelectorAll("[data-consent]")) b.setAttribute("aria-pressed", String(b.getAttribute("data-consent") === c));
}

function choose(value: string) {
  setConsent(value);
  document.getElementById("consent-banner")?.remove();
  if (value === "granted") loadGoogle();
  reflect();
}

/** Call once per page. */
export function initAnalytics() {
  document.addEventListener("click", (e) => {
    const t = e.target instanceof Element ? e.target : null;
    const c = t?.closest("[data-consent]");
    if (c) return choose(String(c.getAttribute("data-consent")));
    const copy = t?.closest("[data-copy]");
    if (copy) track("copy_snippet", { target: String(copy.getAttribute("data-copy")).replace(/^#/, "").slice(0, 40) });
    const a = t?.closest("a[href]");
    if (a instanceof HTMLAnchorElement && a.host !== location.host && /(^|\.)(github\.com|npmjs\.com)$/.test(a.hostname)) track("outbound_click", { host: a.hostname });
  });
  reflect();
  if (trackingBlocked()) return;
  track("page_view", { path: location.pathname.replace(process.env.NEXT_PUBLIC_BASE_PATH ?? "", "") || "/" });
  const c = getConsent();
  if (c === "granted") loadGoogle();
  else if (c !== "denied") banner();
}
