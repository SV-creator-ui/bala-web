/**
 * Rezervacijos el. laiškų pranešimai. Idempotentiška su ATOMIŠKU LEASE'U:
 * kiekvienai rezervacijai laiškai siunčiami tik VIENĄ kartą.
 *
 * DIZAINAS (žr. migration_010_email_send_claim.sql):
 *  • `email_send_claimed_at` — laikinas claim'as (lease); NULL = laisvas
 *  • `emails_sent_at`        — nustatomas TIK po sėkmingo `sendMail()`
 *
 * Kodėl atskirti: iki tol vienintelis `emails_sent_at` atliko IR claim'o, IR
 * „sent" žymos roles — jei procesas nustatė ir crash'ino prieš `sendMail`,
 * booking'as amžinai atrodė kaip „sent" (nors laiškas neišsiųstas).
 * Su lease'u: 10 min. stale claim'as perimamas sekančio retry (cron/puslapis).
 *
 * Race apsauga: PostgREST/PG UPDATE su WHERE atominis — tik vienas concurrent
 * kviesėjas gauna row'ą per `.select().length > 0`.
 */
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";
import { emailConfigured, sendBookingEmails } from "@/lib/email";

/** Kiek laiko lease'as galioja iki kito retry gali jį perimti (crash safety). */
const CLAIM_STALE_MS = 10 * 60 * 1000;

/**
 * Atominis „claim" (lease): grąžina true tik pirmam kviesėjui.
 * Kiti concurrent kviesėjai gauna false (arba laukia stale threshold'o).
 * Jei ankstesnis claim'as senesnis nei 10 min — perima jį (crash recovery).
 */
async function claimBookingEmailSend(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const staleThreshold = new Date(Date.now() - CLAIM_STALE_MS).toISOString();
  const { data } = await supabase
    .from("bookings")
    .update({ email_send_claimed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "paid")
    .is("emails_sent_at", null)
    // .or() → SQL "(email_send_claimed_at IS NULL OR email_send_claimed_at < staleThreshold)"
    .or(`email_send_claimed_at.is.null,email_send_claimed_at.lt.${staleThreshold}`)
    .select("id");
  return Array.isArray(data) && data.length > 0;
}

/** Atlaisvina claim'ą (po klaidos). Tyliai jei nepavyko — sekantis retry perims per stale. */
async function releaseBookingEmailClaim(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("bookings").update({ email_send_claimed_at: null }).eq("id", id);
}

/** Pažymi kaip išsiųstą + atlaisvina claim'ą (po sėkmės). */
async function markBookingEmailsSent(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("bookings")
    .update({ emails_sent_at: new Date().toISOString(), email_send_claimed_at: null })
    .eq("id", id);
}

export async function notifyBookingPaid(bookingId: string): Promise<void> {
  if (!emailConfigured()) return;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
    const b = data as BookingRow | null;
    if (!b || b.status !== "paid" || b.emails_sent_at) return; // dar neapmokėta arba jau išsiųsta

    if (!(await claimBookingEmailSend(bookingId))) return; // kitas kviesėjas jau paėmė

    try {
      await sendBookingEmails(b);
      await markBookingEmailsSent(b.id);
    } catch (e) {
      await releaseBookingEmailClaim(b.id).catch(() => {});
      throw e;
    }
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
