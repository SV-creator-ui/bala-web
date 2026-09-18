/**
 * OpenAI (ChatGPT Ads) Conversions API — server-side `order_created` eventų siuntimas.
 * ────────────────────────────────────────────────────────────────────────────────
 * Dedupe su browser Pixel'iu — server-side `id` sutampa su client'o `oaiq("measure", ...)`
 * eventu iš to paties merchant_reference. OpenAI atpažįsta ir sujungia į vieną konversiją.
 *
 * Konfigūracija (env vars Vercel):
 *  - OPENAI_ADS_API_KEY — Conversions API raktas iš ChatGPT Ads panelės
 */
import { OPENAI_PIXEL_ID } from "./analytics";

const OAI_ADS_API_KEY = process.env.OPENAI_ADS_API_KEY ?? "";
const OAI_ADS_ENDPOINT = "https://bzr.openai.com/v1/events";

export type OpenAiCapiOrderInput = {
  eventId: string; // merchant_reference (dedupe su browser Pixel'iu)
  eventSourceUrl?: string; // patvirtinimo puslapio URL
};

/**
 * Siunčia OpenAI Conversions API `order_created` eventą.
 * Best-effort — klaida logeriui, bet negrąžinama (nepersudaro booking srauto).
 * Jei `OPENAI_ADS_API_KEY` arba `OPENAI_PIXEL_ID` nenustatyti — praleidžia.
 */
export async function sendOpenAiCapiOrder(input: OpenAiCapiOrderInput): Promise<void> {
  if (!OAI_ADS_API_KEY) return;
  if (!OPENAI_PIXEL_ID) return;

  const payload = {
    validate_only: false,
    events: [
      {
        id: input.eventId,
        type: "order_created",
        timestamp_ms: Date.now(),
        source_url: input.eventSourceUrl ?? "https://bala.lt/",
        action_source: "web",
        data: { type: "contents" },
      },
    ],
  };

  try {
    const res = await fetch(`${OAI_ADS_ENDPOINT}?pid=${encodeURIComponent(OPENAI_PIXEL_ID)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OAI_ADS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("openai capi order_created failed:", res.status, text);
    }
  } catch (e) {
    console.error("openai capi order_created error:", e);
  }
}
