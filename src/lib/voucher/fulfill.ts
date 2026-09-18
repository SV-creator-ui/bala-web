/**
 * Dovanų kupono „įvykdymas" apmokėjus: aktyvavimas (kodas + galiojimas),
 * PDF sugeneravimas ir išsiuntimas pirkėjui. Viskas idempotentiška ir saugu
 * kartoti (webhook + patvirtinimo puslapis gali kviesti abu).
 */
import type { VoucherRow } from "@/lib/supabase/server";
import { emailConfigured } from "@/lib/email";
import { payseraConfigured, getPayseraOrderStatus, isPaidStatus } from "@/lib/paysera";
import {
  getVoucherByRef,
  getVoucherById,
  issueVoucher,
  claimVoucherEmail,
  markVoucherEmailsSent,
  releaseVoucherEmailClaim,
} from "./store";
import { generateVoucherPdf } from "./pdf";
import { sendVoucherEmails } from "./email";
import { sendCapiPurchase } from "@/lib/meta-capi";
import { sendOpenAiCapiOrder } from "@/lib/openai-capi";

/**
 * Aktyvuoja kuponą (jei dar pending) ir vieną kartą išsiunčia PDF pirkėjui.
 * Grąžina aktyvų įrašą (arba dabartinį, jei nepavyko).
 */
export async function fulfillVoucherByRef(ref: string): Promise<VoucherRow | null> {
  try {
    const existing = await getVoucherByRef(ref);
    if (!existing) return null;

    const wasPending = existing.status === "pending";
    const v = wasPending ? (await issueVoucher(existing.id)) ?? existing : existing;
    if (v.status !== "active") return v; // atšauktas / jau panaudotas — nesiunčiam

    // Meta Conversions API — Purchase siunčiam TIK kai kuponas ką tik aktyvuotas
    // (kad nedubliuotum eventų iš atsarginio kelio patvirtinimo puslapyje).
    if (wasPending) {
      await sendCapiPurchase({
        eventId: v.merchant_reference,
        value: Number(v.amount_eur),
        contentName: "gift_card",
        email: v.buyer_email,
        eventSourceUrl: "https://bala.lt/pabegimo-kambariai/dovanu-kuponas/patvirtinta",
      });
      await sendOpenAiCapiOrder({
        eventId: v.merchant_reference,
        eventSourceUrl: "https://bala.lt/pabegimo-kambariai/dovanu-kuponas/patvirtinta",
      });
    }

    // Atominis lease — kad nesusidubliuotų laiškai. Tik pirmas kviesėjas siunčia.
    // Po sėkmės žymim `emails_sent_at` (nauja, permanentu) + atlaisvinam claim.
    // Po klaidos atlaisvinam claim, kad sekantis retry (cron / patvirtinimo
    // puslapis) galėtų iš naujo bandyti (o ne tyliai prarasti PDF).
    if (emailConfigured() && (await claimVoucherEmail(v.id))) {
      try {
        const pdf = await generateVoucherPdf(v);
        await sendVoucherEmails(v, pdf);
        await markVoucherEmailsSent(v.id);
      } catch (e) {
        console.error("voucher fulfill send error:", e);
        await releaseVoucherEmailClaim(v.id).catch(() => {});
      }
    }
    return v;
  } catch (e) {
    console.error("voucher fulfill error:", e);
    return null;
  }
}

/**
 * Pakartotinis kupono PDF siuntimas (admin skydelis).
 * `overrideEmail` — jei perduodamas, PDF eina į tą adresą, ne į v.buyer_email
 * (naudojama, kai klientas įrašė neteisingą adresą).
 */
export async function resendVoucherEmail(id: string, overrideEmail?: string): Promise<boolean> {
  const v = await getVoucherById(id);
  if (!v || v.status === "pending" || !v.code) return false;
  if (!emailConfigured()) return false;
  const pdf = await generateVoucherPdf(v);
  await sendVoucherEmails(v, pdf, overrideEmail);
  await markVoucherEmailsSent(v.id);
  return true;
}

/* ============ Patvirtinimo puslapio „resolve" ============ */

export type VoucherResolve = { status: "active" | "pending" | "error"; voucher?: VoucherRow };

/**
 * Palikta suderinamumui — Paysera nenaudoja „order-token" (puslapis kviečia
 * resolveVoucherByRef). Apmokėjimą autoritetingai patvirtina callback'as.
 */
export async function resolveVoucher(_token: string | undefined): Promise<VoucherResolve> {
  return { status: "error" };
}

/** Paieška pagal merchant_reference (patvirtinimo puslapiui). */
export async function resolveVoucherByRef(ref: string | undefined): Promise<VoucherResolve> {
  if (!ref) return { status: "error" };
  let v = await getVoucherByRef(ref);
  if (!v) return { status: "error" };

  // Atsarginis patvirtinimas: jei dar „pending", pasitikrinam Paysera būseną
  // (webhook'as gali vėluoti). montonio_uuid saugo Paysera order id.
  if (v.status === "pending" && v.montonio_uuid && payseraConfigured()) {
    const st = await getPayseraOrderStatus(v.montonio_uuid);
    if (isPaidStatus(st)) {
      await fulfillVoucherByRef(ref); // aktyvuoja + siunčia PDF
      v = (await getVoucherByRef(ref)) ?? v;
    }
  }

  return { status: v.status === "active" ? "active" : "pending", voucher: v };
}
