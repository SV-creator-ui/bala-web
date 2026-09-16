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

/**
 * Google Ads konversijų label'iai — pilnas `AW-XXXX/label` iš Ads konversijos
 * veiksmo „Event snippet" (`send_to` reikšmė). Tuščia = neaktyvi.
 */
export const ADS_CONVERSION_BOOKING = "AW-17951168306/t75tCOqtlvQcELKu5O9C";
export const ADS_CONVERSION_GIFT_CARD = "AW-17951168306/nQTqCLrtmvQcELKu5O9C";

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
