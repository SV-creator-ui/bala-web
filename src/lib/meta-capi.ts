/**
 * Meta Conversions API (CAPI) — server-side Purchase eventų siuntimas.
 * ─────────────────────────────────────────────────────────────────
 * Kodėl svarbu: nuo iOS 14.5+ Safari blokuoja daug browser cookie signalų.
 * CAPI eventai keliauja server-side (iš Vercel į Meta) ir nepriklauso nuo
 * naršyklės apribojimų — Meta pixel'ninka gauna ~30% tikslesnius conversion
 * duomenis, ypač iOS vartotojams.
 *
 * Dedupe: kartu su browser'io Pixel Purchase eventu — abu naudoja tą patį
 * `event_id` (merchant_reference). Meta atpažįsta ir sujungia į vieną.
 *
 * Konfigūracija (env vars Vercel):
 *  - META_CAPI_ACCESS_TOKEN — Access Token iš Meta Events Manager > Settings
 *  - META_CAPI_TEST_EVENT_CODE — (nebūtinas) testiniam siuntimui
 */
import { createHash } from "node:crypto";
import { META_PIXEL_ID } from "./analytics";

const CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? "";
const CAPI_TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE ?? "";
const CAPI_ENDPOINT = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`;

/** SHA-256 hex hash — Meta reikalauja PII (email/phone) sha256 formatu. */
function sha256(v: string): string {
  return createHash("sha256").update(v.trim().toLowerCase()).digest("hex");
}

/** Normalizuoja LT telefono numerį į „370XXXXXXXX" formatą. */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("370")) return digits;
  if (digits.startsWith("8") && digits.length === 9) return "370" + digits.slice(1);
  return digits;
}

export type CapiPurchaseInput = {
  eventId: string; // merchant_reference (dedupe su browser'io Pixel'iu)
  value: number; // EUR (avansas booking'ui, pilna kaina kuponui)
  contentName: "booking" | "gift_card";
  email?: string;
  phone?: string;
  eventSourceUrl?: string; // pvz. https://bala.lt/rezervacija/patvirtinta
};

/**
 * Siunčia Meta Conversions API `Purchase` eventą.
 * Best-effort — klaida logeriui, bet negrąžinama (nepersudaro booking srauto).
 * Jei `META_CAPI_ACCESS_TOKEN` nenustatytas — praleidžia (išjungta).
 */
export async function sendCapiPurchase(input: CapiPurchaseInput): Promise<void> {
  if (!CAPI_ACCESS_TOKEN) return; // CAPI disabled kol env nenustatytas
  if (!META_PIXEL_ID) return;

  const user_data: Record<string, string[]> = {};
  if (input.email) user_data.em = [sha256(input.email)];
  if (input.phone) {
    const p = normalizePhone(input.phone);
    if (p) user_data.ph = [sha256(p)];
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl ?? "https://bala.lt/",
        action_source: "website",
        user_data,
        custom_data: {
          value: Math.round(input.value * 100) / 100,
          currency: "EUR",
          content_name: input.contentName,
          content_category: input.contentName,
        },
      },
    ],
    ...(CAPI_TEST_EVENT_CODE ? { test_event_code: CAPI_TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(`${CAPI_ENDPOINT}?access_token=${encodeURIComponent(CAPI_ACCESS_TOKEN)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("meta capi purchase failed:", res.status, text);
    }
  } catch (e) {
    console.error("meta capi purchase error:", e);
  }
}
