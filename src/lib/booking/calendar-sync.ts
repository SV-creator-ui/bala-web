/**
 * Rezervacijos ↔ Google Calendar sinchronizavimas (rašymas).
 * Centralizuota logika, kviečiama iš visų vietų, kur keičiasi rezervacija.
 * Visada saugu: jei Google nesukonfigūruotas ar įvyksta klaida — tyliai
 * praleidžiama (rezervacijos srautas nenutrūksta).
 */
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";
import { googleCalendarConfigured, syncBookingEvent, deleteBookingEvent } from "@/lib/google-calendar";

/**
 * Suderina kalendoriaus įvykį su dabartine rezervacijos būsena:
 *  - paid:      sukuria arba atnaujina įvykį (ir įsimena gcal_event_id)
 *  - cancelled/expired: ištrina įvykį
 *  - pending:   nieko (įvykis kuriamas tik apmokėjus)
 */
export async function syncBookingCalendar(bookingId: string): Promise<void> {
  if (!googleCalendarConfigured()) return;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
    const b = data as BookingRow | null;
    if (!b) return;

    if (b.status === "paid") {
      const eventId = await syncBookingEvent(b);
      if (eventId && eventId !== b.gcal_event_id) {
        await supabase.from("bookings").update({ gcal_event_id: eventId }).eq("id", b.id);
      }
    } else if ((b.status === "cancelled" || b.status === "expired") && b.gcal_event_id) {
      await deleteBookingEvent(b.gcal_event_id);
      await supabase.from("bookings").update({ gcal_event_id: null }).eq("id", b.id);
    }
  } catch (e) {
    console.error("calendar sync error:", e);
  }
}

/** Tas pats, bet pagal merchant_reference (naudinga mokėjimų webhook'e). */
export async function syncBookingCalendarByRef(ref: string): Promise<void> {
  if (!googleCalendarConfigured()) return;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("bookings").select("id").eq("merchant_reference", ref).single();
    const row = data as { id: string } | null;
    if (row) await syncBookingCalendar(row.id);
  } catch (e) {
    console.error("calendar sync (ref) error:", e);
  }
}
