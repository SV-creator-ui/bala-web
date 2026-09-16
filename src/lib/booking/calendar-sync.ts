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
 *
 * `opts.throwOnError` — default false (mokėjimo srautuose praleidžia klaidas
 * tyliai). Admin „Sinch. kalendorių" veiksmui perduodama true, kad admin
 * matytų realią klaidos priežastį, o ne netikrą „atnaujinta".
 * `opts.forceRecreate` — pirma nunulina gcal_event_id ir sukuria naują įvykį.
 * Naudinga kai senas įvykis „miręs" (ištrintas iš šiukšliadėžės ar orphan).
 */
export async function syncBookingCalendar(
  bookingId: string,
  opts: { throwOnError?: boolean; forceRecreate?: boolean } = {},
): Promise<void> {
  if (!googleCalendarConfigured()) return;
  const run = async () => {
    const supabase = getSupabaseAdmin();
    const { data, error: readError } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
    if (readError) throw readError;
    const b = data as BookingRow | null;
    if (!b) throw new Error("Rezervacija nerasta");

    if (b.status === "paid") {
      // Perkuriant pirmiausia sukuriame naują įvykį, o seną DB nuorodą
      // pakeičiame tik po sėkmės. Nesėkmės atveju senas ID neprarandamas.
      const working: BookingRow = opts.forceRecreate ? { ...b, gcal_event_id: null } : b;
      const eventId = await syncBookingEvent(working);
      if (eventId && eventId !== working.gcal_event_id) {
        const { error } = await supabase.from("bookings").update({ gcal_event_id: eventId }).eq("id", b.id);
        if (error) throw error;
      }
    } else if ((b.status === "cancelled" || b.status === "expired") && b.gcal_event_id) {
      await deleteBookingEvent(b.gcal_event_id);
      const { error } = await supabase.from("bookings").update({ gcal_event_id: null }).eq("id", b.id);
      if (error) throw error;
    }
  };
  if (opts.throwOnError) {
    await run();
    return;
  }
  try {
    await run();
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
