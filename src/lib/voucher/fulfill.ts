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
} from "./store";
import { generateVoucherPdf } from "./pdf";
import { sendVoucherEmails } from "./email";

/**
 * Aktyvuoja kuponą (jei dar pending) ir vieną kartą išsiunčia PDF pirkėjui.
 * Grąžina aktyvų įrašą (arba dabartinį, jei nepavyko).
 */
export async function fulfillVoucherByRef(ref: string): Promise<VoucherRow | null> {
  try {
    const existing = await getVoucherByRef(ref);
    if (!existing) return null;

    const v = existing.status === "pending" ? (await issueVoucher(existing.id)) ?? existing : existing;
    if (v.status !== "active") return v; // atšauktas / jau panaudotas — nesiunčiam

    // Atominis claim — kad nesusidubliuotų laiškai. Tik pirmas kviesėjas siunčia.
    if (emailConfigured() && (await claimVoucherEmail(v.id))) {
      try {
        const pdf = await generateVoucherPdf(v);
        await sendVoucherEmails(v, pdf);
      } catch (e) {
        console.error("voucher fulfill send error:", e);
        // Nepavyko — atlaisvinam, kad būtų galima pakartoti (webhook/patvirtinimas).
        await markVoucherEmailsSent(v.id).catch(() => {});
      }
    }
    return v;
  } catch (e) {
    console.error("voucher fulfill error:", e);
    return null;
  }
}

/** Pakartotinis kupono PDF siuntimas (admin skydelis). */
export async function resendVoucherEmail(id: string): Promise<boolean> {
  const v = await getVoucherById(id);
  if (!v || v.status === "pending" || !v.code) return false;
  if (!emailConfigured()) return false;
  const pdf = await generateVoucherPdf(v);
  await sendVoucherEmails(v, pdf);
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
