/**
 * POST /api/paysera/callback
 * Paysera Checkout Modern webhook (JSON). Patikriname HMAC-SHA256 parašą
 * (antraštė X-Paysera-Signature, raktas — client_secret) ir, jei apmokėta,
 * pažymime rezervaciją „paid" ARBA aktyvuojame dovanų kuponą (pagal
 * merchant_reference prefiksą: "GIFT-" = kuponas).
 *
 * Grąžiname 200, kai apdorota; 401 esant blogam parašui (Paysera nekartos).
 */
import {
  verifyPayseraSignature,
  parsePayseraWebhook,
  getPayseraOrderStatus,
  isPaidStatus,
} from "@/lib/paysera";
import { markPaidByRef } from "@/lib/booking/settle";

export const dynamic = "force-dynamic";

function text(status: number, msg: string) {
  return new Response(msg, { status, headers: { "Content-Type": "text/plain" } });
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-paysera-signature") || "";

  if (!verifyPayseraSignature(raw, sig)) {
    console.error("paysera callback: blogas parašas");
    return text(401, "invalid signature"); // Paysera nekartos
  }

  const hook = parsePayseraWebhook(raw);
  if (!hook) return text(200, "OK"); // negalime nuskaityti — patvirtinam gavimą

  // Autoritetingas patikrinimas: „Checkout Modern" siunčia kelis webhook'us
  // skirtinguose mokėjimo etapuose (authorized/processing/paid). Kad
  // nepraleistume „paid" būsenos dėl neatpažinto body, papildomai užklausiam
  // Paysera API pagal order id. Jei API grąžina „paid" — laikom apmokėta.
  let paid = hook.paid;
  if (!paid && hook.orderId) {
    const st = await getPayseraOrderStatus(hook.orderId);
    if (isPaidStatus(st)) paid = true;
  }

  if (!paid) return text(200, "OK"); // tikrai dar neapmokėta

  try {
    await markPaidByRef(hook.merchantReference);
    return text(200, "OK");
  } catch (e) {
    console.error("paysera callback error:", e);
    return text(500, "server error"); // Paysera pakartos
  }
}
