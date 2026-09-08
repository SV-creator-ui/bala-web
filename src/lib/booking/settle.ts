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
import { settlePromoForBooking } from "@/lib/promo/redeem";

/** Ištraukia promo kodą iš booking.note žymos „[PROMO:CODE:-XX.XX€]", jei ji yra. */
function extractPromoCode(note: string | null): string | null {
  if (!note) return null;
  const m = note.match(/\[PROMO:([^:\]]+):[^\]]+\]/);
  return m ? m[1] : null;
}

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
  if (b) {
    const row = b as BookingRow;
    await settleBookingVoucher(row); // nurašom panaudotą kuponą
    const promoCode = extractPromoCode(row.note);
    if (promoCode) await settlePromoForBooking(promoCode, { id: row.id, merchant_reference: row.merchant_reference });
  }
  await syncBookingCalendarByRef(ref);
  await notifyBookingPaidByRef(ref);
}
