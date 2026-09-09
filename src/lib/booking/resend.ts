/**
 * Pakartotinis rezervacijos patvirtinimo laiško siuntimas (admin skydelis).
 * Skirtingai nuo `notifyBookingPaid`, čia NEPAISOM `emails_sent_at` — admin
 * gali persiųsti bet kada, pvz. jei klientas įrašė neteisingą pašto adresą.
 * Nekeičiam DB įrašo adreso; jei `overrideEmail` perduodamas, laiškas eina ten.
 */
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";
import { emailConfigured, sendBookingEmails } from "@/lib/email";

export async function resendBookingEmails(id: string, overrideEmail?: string): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("bookings").select("*").eq("id", id).single();
    const b = data as BookingRow | null;
    if (!b || b.status !== "paid") return false; // siunčiam tik apmokėtas
    await sendBookingEmails(b, overrideEmail);
    return true;
  } catch (e) {
    console.error("resend booking emails error:", e);
    return false;
  }
}
