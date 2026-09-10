/**
 * POST /api/admin/resync-events
 * Perkelia visus dabartinius rezervacijų duomenis į Google Calendar įvykių
 * body'ius (summary + description + colorId ir kt.). Naudinga kai keičiasi
 * eventBody logika (pridėti nauji laukai — pvz. priedų sąrašas) ir norima,
 * kad seni įvykiai kalendoriuje atsinaujintų.
 *
 * DĖMESIO: PATCH perrašo visą įvykio body'į (summary, description, colorId).
 * Jei kas nors kalendoriuje BUVO PAKEISTA RANKOMIS — tie pakeitimai išnyks.
 */
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin/auth";
import { listBookings } from "@/lib/admin/data";
import { googleCalendarConfigured, syncBookingEvent } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  }
  if (!googleCalendarConfigured()) {
    return NextResponse.json({ error: "Google Calendar nesukonfigūruotas" }, { status: 400 });
  }

  const bookings = await listBookings({});
  const withEvent = bookings.filter((b) => b.gcal_event_id);

  let updated = 0;
  const errors: Array<{ id: string; ref: string; message: string }> = [];

  for (const b of withEvent) {
    try {
      await syncBookingEvent(b);
      updated += 1;
    } catch (e) {
      errors.push({
        id: b.id,
        ref: b.merchant_reference,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    totalBookings: bookings.length,
    withEventId: withEvent.length,
    updated,
    failed: errors.length,
    errors,
  });
}
