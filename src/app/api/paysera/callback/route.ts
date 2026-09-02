/**
 * GET/POST /api/paysera/callback
 * Paysera serverio-serveriui pranešimas apie mokėjimą. Patikriname parašą ir,
 * jei apmokėta, pažymime rezervaciją „paid" ARBA aktyvuojame dovanų kuponą
 * (pagal merchant_reference prefiksą: "GIFT-" = kuponas).
 *
 * SVARBU: Paysera laukia atsakymo su tekstu „OK" (kitaip kartos pranešimą).
 */
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";
import { parsePayseraResult } from "@/lib/paysera";
import { syncBookingCalendarByRef } from "@/lib/booking/calendar-sync";
import { notifyBookingPaidByRef } from "@/lib/booking/notify";
import { fulfillVoucherByRef } from "@/lib/voucher/fulfill";
import { settleBookingVoucher } from "@/lib/voucher/redeem";

export const dynamic = "force-dynamic";

function ok() {
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
function err(msg: string) {
  return new Response(msg, { status: 400, headers: { "Content-Type": "text/plain" } });
}

async function handle(data: string, ss1: string): Promise<Response> {
  const result = parsePayseraResult(data, ss1);
  if (!result) return err("bad sign"); // parašas neteisingas — nieko nedarom

  if (!result.paid) return ok(); // status != 1 (neapmokėta/atšaukta) — patvirtinam gavimą

  const ref = result.merchantReference;
  if (!ref) return err("no orderid");

  try {
    // --- Dovanų kuponas ---
    if (ref.startsWith("GIFT-")) {
      await fulfillVoucherByRef(ref); // aktyvuoja + siunčia PDF pirkėjui
      return ok();
    }

    // --- Rezervacija ---
    const supabase = getSupabaseAdmin();
    await supabase
      .from("bookings")
      .update({ status: "paid" })
      .eq("merchant_reference", ref)
      .eq("status", "pending"); // tik jei dar nebuvo apmokėta
    const { data: b } = await supabase.from("bookings").select("*").eq("merchant_reference", ref).single();
    if (b) await settleBookingVoucher(b as BookingRow); // nurašom kuponą (jei buvo)
    await syncBookingCalendarByRef(ref);
    await notifyBookingPaidByRef(ref);
    return ok();
  } catch (e) {
    console.error("paysera callback error:", e);
    return err("server error"); // 400 — Paysera pakartos
  }
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  return handle(sp.get("data") || "", sp.get("ss1") || "");
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (form) return handle(String(form.get("data") || ""), String(form.get("ss1") || ""));
  const sp = new URL(req.url).searchParams;
  return handle(sp.get("data") || "", sp.get("ss1") || "");
}
