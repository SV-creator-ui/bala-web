"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ANALYTICS_READY_EVENT,
  CONSENT_KEY,
  GA4_ID,
  GOOGLE_ADS_ID,
  GTAG_LOADER_ID,
  META_PIXEL_ID,
  OPENAI_PIXEL_ID,
} from "@/lib/analytics";
import { captureAttribution, onAdConsentGranted } from "@/lib/attribution";

/* Inline consent init — ES5 sintakse, kad veiktų senesnėse naršyklėse.
   Consent Mode v2: kol nesutikta, ad_storage/analytics_storage denied. */
const consentInit = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});
try {
  if (localStorage.getItem('${CONSENT_KEY}') === 'granted') {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
  }
} catch (e) {}
gtag('js', new Date());
${GA4_ID ? `gtag('config', '${GA4_ID}');` : ""}
${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
window.dispatchEvent(new Event('${ANALYTICS_READY_EVENT}'));
`;

/* Meta Pixel bazė įterpiama tik po aiškaus vartotojo sutikimo. */
const metaPixelInit = META_PIXEL_ID
  ? `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('consent', 'grant');
fbq('track', 'PageView');
window.dispatchEvent(new Event('${ANALYTICS_READY_EVENT}'));
`
  : "";

/* OpenAI (ChatGPT Ads) Pixel — kraunama tik po sutikimo. */
const openAiPixelInit = OPENAI_PIXEL_ID
  ? `
!function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");
oaiq("init",{pixelId:"${OPENAI_PIXEL_ID}",debug:true});
`
  : "";

function CookieBanner({ onChoose }: { onChoose: (granted: boolean) => void }) {

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Slapukų sutikimas"
      className="fixed inset-x-4 bottom-4 z-[500] mx-auto max-w-[560px] rounded-2xl border border-line bg-ink-card p-5 text-white shadow-2xl sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-volt/15 text-xl"
        >
          🍪
        </div>
        <div className="flex-1">
          <div className="font-display text-base uppercase tracking-wide">
            Vertiname tavo privatumą
          </div>
          <p className="mt-1 text-sm text-smoke">
            Naudojame slapukus statistikai ir aktualesnei reklamai. Tai padeda
            mums tobulinti svetainę. Daugiau —{" "}
            <Link
              href="/privatumo-politika"
              className="underline hover:text-volt"
            >
              privatumo politika
            </Link>
            .
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => onChoose(false)}
          className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold hover:border-volt hover:text-volt"
        >
          Tik būtinieji
        </button>
        <button
          type="button"
          onClick={() => onChoose(true)}
          className="rounded-full bg-volt px-5 py-2 text-sm font-bold text-volt-ink hover:opacity-90"
        >
          Sutinku
        </button>
      </div>
    </div>
  );
}

/**
 * Google Tag (gtag.js) + Meta Pixel + Consent Mode v2 + slapukų juostelė.
 * Nieko nedaro, kol nei GTAG_LOADER_ID nei META_PIXEL_ID neturi reikšmės.
 */
export default function Analytics() {
  const [consent, setConsent] = useState<"loading" | "unset" | "granted" | "denied">("loading");

  useEffect(() => {
    captureAttribution(); // UTM / reklamos paspaudimas — žr. lib/attribution.ts
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(CONSENT_KEY);
        setConsent(saved === "granted" || saved === "denied" ? saved : "unset");
      } catch {
        setConsent("unset");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const choose = (granted: boolean) => {
    const next = granted ? "granted" : "denied";
    try {
      localStorage.setItem(CONSENT_KEY, next);
    } catch {}
    if (granted) onAdConsentGranted();
    setConsent(next);
  };

  if (!GTAG_LOADER_ID && !META_PIXEL_ID && !OPENAI_PIXEL_ID) return null;
  const granted = consent === "granted";
  return (
    <>
      {granted && GTAG_LOADER_ID && (
        <>
          <Script id="gtag-init" strategy="afterInteractive">
            {consentInit}
          </Script>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_LOADER_ID}`}
            strategy="afterInteractive"
          />
        </>
      )}
      {granted && META_PIXEL_ID && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {metaPixelInit}
        </Script>
      )}
      {granted && OPENAI_PIXEL_ID && (
        <Script id="openai-pixel-init" strategy="afterInteractive">
          {openAiPixelInit}
        </Script>
      )}
      {consent === "unset" && <CookieBanner onChoose={choose} />}
    </>
  );
}
