/**
 * Bendra „apmokėta" logika pagal merchant_reference — naudojama ir Paysera
 * webhook'e (/api/paysera/callback), ir patvirtinimo puslapiuose (atsarginis
 * kelias, jei webhook'as vėluoja). Idempotentiška, saugu kartoti.
 */
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";
import { syncBookingCalendarByRef } from "./calendar-sync";
import { notifyBookingPaidByRef } from "./notify";
import { settleBookingVoucher } from "@/lib/voucher/redeem";
import { fulfillVoucherByRef } from "@/lib/voucher/fulfill";

export async function markPaidByRef(ref: string): Promise<void> {
  // Dovanų kuponas
  if (ref.startsWith("GIFT-")) {
    await fulfillVoucherByRef(ref); // aktyvuoja + siunčia PDF pirkėjui
    return;
  }
  // Rezervacija
  const supabase = getSupabaseAdmin();
  await supabase
    .from("bookings")
    .update({ status: "paid" })
    .eq("merchant_reference", ref)
    .eq("status", "pending"); // tik jei dar nebuvo apmokėta
  const { data: b } = await supabase.from("bookings").select("*").eq("merchant_reference", ref).single();
  if (b) await settleBookingVoucher(b as BookingRow); // nurašom panaudotą kuponą
  await syncBookingCalendarByRef(ref);
  await notifyBookingPaidByRef(ref);
}
