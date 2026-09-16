/**
 * Bendra „apmokėta" logika pagal merchant_reference — naudojama ir Paysera
 * webhook'e (/api/paysera/callback), ir patvirtinimo puslapiuose (atsarginis
 * kelias, jei webhook'as vėluoja). Būsenos perėjimą atominiu būdu saugo DB.
 */
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";
import { syncBookingCalendarByRef } from "./calendar-sync";
import { notifyBookingPaidByRef } from "./notify";
import { BookingPaymentConflictError } from "./conflict";
import { settleBookingVoucher } from "@/lib/voucher/redeem";
import { fulfillVoucherByRef } from "@/lib/voucher/fulfill";
import { settlePromoForBooking } from "@/lib/promo/redeem";
import { sendCapiPurchase } from "@/lib/meta-capi";

/** Ištraukia promo kodą iš booking.note žymos „[PROMO:CODE:-XX.XX€]", jei ji yra. */
function extractPromoCode(note: string | null): string | null {
  if (!note) return null;
  const m = note.match(/\[PROMO:([^:\]]+):[^\]]+\]/);
  return m ? m[1] : null;
}

/** Grąžina rezervacijos patvirtinta puslapio URL pagal booking.type. */
function getConfirmUrl(type: BookingRow["type"]): string {
  switch (type) {
    case "party":
      return "https://bala.lt/gimtadieniai/rezervacija/patvirtinta";
    case "game":
      return "https://bala.lt/komandiniai-vr-zaidimai/rezervacija/patvirtinta";
    default:
      return "https://bala.lt/rezervacija/patvirtinta";
  }
}

export async function markPaidByRef(ref: string): Promise<void> {
  // Dovanų kuponas
  if (ref.startsWith("GIFT-")) {
    await fulfillVoucherByRef(ref); // aktyvuoja + siunčia PDF pirkėjui
    return;
  }
  // Rezervacija
  const supabase = getSupabaseAdmin();
  // The DB serializes callbacks for this booking and enforces overlap constraints
  // against BOTH paid bookings and unexpired pending holds, including late payments.
  const { data: outcome, error: settleError } = await supabase.rpc("settle_booking_guarded", { p_ref: ref });
  if (settleError) throw settleError;
  if (outcome === "conflict") throw new BookingPaymentConflictError();
  if (outcome !== "paid" && outcome !== "already_paid") {
    throw new Error(`Rezervacijos patvirtinimas atmestas: ${outcome}`);
  }
  const { data: current, error: readError } = await supabase
    .from("bookings")
    .select("*")
    .eq("merchant_reference", ref)
    .single();
  if (readError) throw readError;
  if (!current) throw new Error("Rezervacija nerasta po patvirtinimo");
  const row = current as BookingRow;

  // Pakartotinis callback nekeičia rezervacijos būsenos. Esamus kalendoriaus
  // ir laiškų pakartotinio vykdymo mechanizmus paliekame nepakeistus.
  if (outcome === "already_paid") {
    await syncBookingCalendarByRef(ref);
    await notifyBookingPaidByRef(ref);
    return;
  }

  await settleBookingVoucher(row); // nurašom panaudotą kuponą
  const promoCode = extractPromoCode(row.note);
  if (promoCode) await settlePromoForBooking(promoCode, { id: row.id, merchant_reference: row.merchant_reference });
  await syncBookingCalendarByRef(ref);
  await notifyBookingPaidByRef(ref);
  // Meta Conversions API — server-side Purchase (dedupe su browser Pixel per event_id=ref)
  await sendCapiPurchase({
    eventId: ref,
    value: Number(row.deposit_eur),
    contentName: "booking",
    email: row.customer_email,
    phone: row.customer_phone,
    eventSourceUrl: getConfirmUrl(row.type),
  });
}
