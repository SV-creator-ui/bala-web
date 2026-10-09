/**
 * ANALITIKOS KONFIGŪRACIJA — Google Ads + Meta Pixel + (ateityje) GA4.
 * ─────────────────────────────────────────────────────────────
 * Google Ads ir Meta Pixel skriptai nekraunami, kol vartotojas aiškiai
 * nesutinka slapukų juostelėje. Po sutikimo Google Consent Mode v2 gauna
 * `granted`, o Meta Pixel inicijuojamas ir siunčia `PageView`.
 * Privatumo politika (`/privatumo-politika`) tai atitinka.
 */

/** Google Tag ID (Google Ads / GA4 loader). Tuščia = analitika išjungta. */
export const GOOGLE_ADS_ID = "AW-17951168306";

/** GA4 Measurement ID (formatas: G-XXXXXXXXXX). Tuščia = neįjungta. */
export const GA4_ID = "";

/** Meta (Facebook) Pixel ID iš Meta Business Manager. Tuščia = išjungta. */
export const META_PIXEL_ID = "1260643318410268";

/** OpenAI (ChatGPT Ads) Pixel ID. Tuščia = išjungta. */
export const OPENAI_PIXEL_ID = "EJBqoM6MUdCK8ANcGqGafL";

/**
 * Google Ads konversijų label'iai — pilnas `AW-XXXX/label` iš Ads konversijos
 * veiksmo „Event snippet" (`send_to` reikšmė). Tuščia = neaktyvi.
 */
export const ADS_CONVERSION_BOOKING = "AW-17951168306/t75tCOqtlvQcELKu5O9C";
export const ADS_CONVERSION_GIFT_CARD = "AW-17951168306/nQTqCLrtmvQcELKu5O9C";
/** „Skambutis iš svetainės (tel. paspaudimas)" — kategorija Contact, Count: One. */
export const ADS_CONVERSION_PHONE = "AW-17951168306/EMTOCL25uZUdELKu5O9C";
/** Google Ads konversija „Užklausa (įmonės / mokyklos)" — /imonems, /mokykloms formos (Submit lead form, Count: One). */
export const ADS_CONVERSION_LEAD = "AW-17951168306/WVZbCJSy15YdELKu5O9C";

/** localStorage raktas su sutikimo būsena („granted"/„denied"). */
export const CONSENT_KEY = "bala-cookie-consent";

/** Praneša patvirtinimo puslapiams, kad reklamos skriptų eilės jau paruoštos. */
export const ANALYTICS_READY_EVENT = "bala-analytics-ready";

/** Naudojamas gtag.js loader'io URL — imame pirmą turimą ID. */
export const GTAG_LOADER_ID = GA4_ID || GOOGLE_ADS_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    oaiq?: (...args: unknown[]) => void;
  }
}

/**
 * Siunčia Google Ads konversiją.
 * @param sendTo         Pilnas 'AW-XXXX/label' iš ADS_CONVERSION_* konstantų
 * @param value          Realia sumą EUR (pvz. avansas 30 arba 50)
 * @param transactionId  Unikalus rezervacijos/kupono ID (išvengia dubliavimo)
 * @param email          (Nebūtina) Enhanced Conversions — hash'ins pats Google
 */
export function trackAdsConversion(
  sendTo: string,
  value: number,
  transactionId: string,
  email?: string,
): boolean {
  if (!sendTo) return false;
  if (typeof window === "undefined" || typeof window.gtag !== "function") return false;
  if (email) {
    window.gtag("set", "user_data", { email });
  }
  window.gtag("event", "conversion", {
    send_to: sendTo,
    value,
    currency: "EUR",
    transaction_id: transactionId,
  });
  return true;
}

/**
 * Siunčia OpenAI (ChatGPT Ads) `order_created` konversiją per Pixel.
 * ChatGPT Ads konversijos „create an order" formatas — kaip nurodyta panelėje.
 * Server-side CAPI atskirai siunčia tą patį eventą su `id = transactionId` dedupe'ui.
 */
export function trackOpenAiPurchase(
  _transactionId: string,
  _value: number,
  _contentName?: string,
): boolean {
  if (!OPENAI_PIXEL_ID) return false;
  if (typeof window === "undefined" || typeof window.oaiq !== "function") return false;
  window.oaiq("measure", "order_created", { type: "contents" });
  return true;
}

/**
 * Bet kurios `tel:` nuorodos paspaudimas svetainėje → Google Ads konversija
 * „Skambutis iš svetainės". Kviečiamas iš bendro klausytojo (Analytics.tsx).
 */
export function trackPhoneClick(): void {
  if (!ADS_CONVERSION_PHONE) return;
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", { send_to: ADS_CONVERSION_PHONE });
}

/**
 * Išsiųsta grupės užklausa (/imonems, /mokykloms).
 * - gtag: `generate_lead` + Google Ads konversija „Užklausa" (ADS_CONVERSION_LEAD).
 * - Meta: standartinis `Lead`.
 */
export function trackInquiryLead(kind: "imone" | "mokykla"): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", "generate_lead", { inquiry_type: kind });
  window.gtag?.("event", "conversion", { send_to: ADS_CONVERSION_LEAD, value: 1, currency: "EUR" });
  window.fbq?.("track", "Lead", { content_name: kind === "imone" ? "inquiry_company" : "inquiry_school" });
}

export type StickyBarButton = "call" | "party" | "room";

/**
 * Titulinio mobilios lipnios juostos paspaudimas.
 * - gtag: `sticky_bar_click` įvykis (matysis GA4, kai bus įjungtas; Google Ads
 *   jį gali naudoti tik sukūrus atskirą konversijos veiksmą).
 * - Meta: skambutis → standartinis `Contact`, rezervacijos mygtukai →
 *   custom `StickyBarClick` (Events Manager'yje galima kurti custom conversion).
 * Be sutikimo nei gtag, nei fbq neužkraunami — tada nieko nesiunčiama.
 */
export function trackStickyBarClick(button: StickyBarButton): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", "sticky_bar_click", {
    button,
    page_path: window.location.pathname,
  });
  if (!window.fbq) return;
  if (button === "call") {
    window.fbq("track", "Contact", { content_name: "sticky_bar_call" });
  } else {
    window.fbq("trackCustom", "StickyBarClick", { button });
  }
}

/**
 * Siunčia Meta Pixel Purchase konversiją.
 * `eventID` (transactionId) leidžia dedupe'ui su Conversions API (server-side).
 * @param transactionId  Unikalus rezervacijos/kupono ID
 * @param value          Realia sumą EUR
 * @param contentName    'booking' arba 'gift_card' — segmentavimui Meta Ads Manager'yje
 */
export function trackMetaPurchase(
  transactionId: string,
  value: number,
  contentName?: string,
): boolean {
  if (!META_PIXEL_ID) return false;
  if (typeof window === "undefined" || typeof window.fbq !== "function") return false;
  window.fbq(
    "track",
    "Purchase",
    {
      value,
      currency: "EUR",
      ...(contentName ? { content_name: contentName, content_category: contentName } : {}),
    },
    { eventID: transactionId },
  );
  return true;
}
