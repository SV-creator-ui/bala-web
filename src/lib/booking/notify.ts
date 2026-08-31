/**
 * Rezervacijos el. laiškų pranešimai. Idempotentiška: kiekvienai rezervacijai
 * laiškai siunčiami tik VIENĄ kartą (žymima `emails_sent_at`).
 * Visada saugu: jei nesukonfigūruota ar klaida — tyliai praleidžiama.
 */
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";
import { emailConfigured, sendBookingEmails } from "@/lib/email";

export async function notifyBookingPaid(bookingId: string): Promise<void> {
  if (!emailConfigured()) return;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
    const b = data as BookingRow | null;
    if (!b || b.status !== "paid" || b.emails_sent_at) return; // jau išsiųsta / dar neapmokėta
    await sendBookingEmails(b);
    await supabase.from("bookings").update({ emails_sent_at: new Date().toISOString() }).eq("id", b.id);
  } catch (e) {
    console.error("email notify error:", e);
  }
}

export async function notifyBookingPaidByRef(ref: string): Promise<void> {
  if (!emailConfigured()) return;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("bookings").select("id").eq("merchant_reference", ref).single();
    const row = data as { id: string } | null;
    if (row) await notifyBookingPaid(row.id);
  } catch (e) {
    console.error("email notify (ref) error:", e);
  }
}
